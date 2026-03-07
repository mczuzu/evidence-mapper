import { useQuery } from "@tanstack/react-query";
import { supabaseExternal } from "@/lib/supabase-external";
import { StudyListItem } from "@/types/database";
import { SearchInput, SearchRow, isSearchActive } from "@/types/search";

const PAGE_SIZE = 20;

interface RpcSearchResult {
  nct_id: string;
  rank: number;
}

async function callRpc(q: string, limit = 5000): Promise<RpcSearchResult[]> {
  const { data, error } = await supabaseExternal.rpc("search_studies_advanced_prefix", {
    q: q.trim(),
    limit_n: limit,
  });
  if (error) throw error;
  return (data as RpcSearchResult[]) || [];
}

function unionSets(...sets: Set<string>[]): Set<string> {
  const result = new Set<string>();
  for (const s of sets) for (const v of s) result.add(v);
  return result;
}

function intersectSets(a: Set<string>, b: Set<string>): Set<string> {
  const result = new Set<string>();
  for (const v of a) if (b.has(v)) result.add(v);
  return result;
}

async function executeSearch(rows: SearchRow[]): Promise<{ nctIds: string[]; rankMap: Map<string, number> }> {
  const activeRows = rows.filter((r) => r.terms.length > 0);
  if (activeRows.length === 0) return { nctIds: [], rankMap: new Map() };

  const globalRankMap = new Map<string, number>();

  const rowSets = await Promise.all(
    activeRows.map(async (row) => {
      let ids: string[] = [];

      if (row.type === "condition") {
        const results = await Promise.all(
          row.terms.map(async (t) => {
            const { data, error } = await supabaseExternal
              .from("mesh_condition")
              .select("nct_id")
              .ilike("mesh_term", t);
            if (error) throw error;
            return (data || []).map((r) => r.nct_id);
          }),
        );
        ids = [...new Set(results.flat())];
      } else if (row.type === "intervention") {
        const results = await Promise.all(
          row.terms.map(async (t) => {
            const { data, error } = await supabaseExternal
              .from("intervention")
              .select("nct_id")
              .ilike("intervention_name", `%${t}%`);
            if (error) throw error;
            return (data || []).map((r) => r.nct_id);
          }),
        );
        ids = [...new Set(results.flat())];
      } else {
        // freetext
        const termResults = await Promise.all(row.terms.map((t) => callRpc(t)));
        for (const results of termResults) {
          for (const r of results) {
            const existing = globalRankMap.get(r.nct_id);
            if (existing === undefined || r.rank > existing) globalRankMap.set(r.nct_id, r.rank);
          }
        }
        ids = [...new Set(termResults.flat().map((r) => r.nct_id))];
      }

      return new Set(ids);
    }),
  );

  let finalSet = rowSets[0];
  for (let i = 1; i < activeRows.length; i++) {
    finalSet = activeRows[i].operator === "AND" ? intersectSets(finalSet, rowSets[i]) : unionSets(finalSet, rowSets[i]);
  }

  const nctIds = [...finalSet].sort((a, b) => (globalRankMap.get(b) ?? 0) - (globalRankMap.get(a) ?? 0));
  return { nctIds, rankMap: globalRankMap };
}

// ── Main hook ──────────────────────────────────────────────────
interface UseStudiesParams {
  search: SearchInput;
  selectedLabels?: string[];
  selectedParamTypes?: string[];
  selectedMeshConditions?: string[];
  page: number;
  onlyAnalyzable?: boolean;
  onlyComparable?: boolean;
}

export function useStudies({
  search,
  selectedLabels = [],
  selectedParamTypes = [],
  selectedMeshConditions = [],
  page,
  onlyAnalyzable = false,
  onlyComparable = false,
}: UseStudiesParams) {
  return useQuery({
    queryKey: [
      "studies",
      search.rows.map((r) => `${r.type}:${r.terms.join(",")}:${r.operator}`),
      selectedLabels,
      selectedParamTypes,
      page,
      onlyAnalyzable,
      onlyComparable,
    ],
    queryFn: async () => {
      const searchActive = isSearchActive(search);

      if (searchActive) {
        const { nctIds, rankMap } = await executeSearch(search.rows);

        if (nctIds.length === 0) {
          return { studies: [], totalCount: 0, pageSize: PAGE_SIZE, currentPage: page, totalPages: 0 };
        }

        let query = supabaseExternal.from("v_ui_study_list_v2").select("*").in("nct_id", nctIds);

        if (onlyAnalyzable) query = query.eq("has_numeric_results", true);
        if (onlyComparable) query = query.eq("has_group_comparison", true);

        const { data, error } = await query;
        if (error) throw error;

        const rankIndex = new Map(nctIds.map((id, i) => [id, i]));
        const studies = ((data as StudyListItem[]) || []).sort(
          (a, b) => (rankIndex.get(a.nct_id) ?? 999) - (rankIndex.get(b.nct_id) ?? 999),
        );

        const from = page * PAGE_SIZE;
        return {
          studies: studies.slice(from, from + PAGE_SIZE),
          totalCount: studies.length,
          pageSize: PAGE_SIZE,
          currentPage: page,
          totalPages: Math.ceil(studies.length / PAGE_SIZE),
        };
      }

      // No search — direct query
      let query = supabaseExternal
        .from("v_ui_study_list_v2")
        .select("*", { count: "exact" })
        .order("nct_id", { ascending: false });

      if (onlyAnalyzable) query = query.eq("has_numeric_results", true);
      if (onlyComparable) query = query.eq("has_group_comparison", true);

      const from = page * PAGE_SIZE;
      query = query.range(from, from + PAGE_SIZE - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        studies: (data as StudyListItem[]) || [],
        totalCount: count || 0,
        pageSize: PAGE_SIZE,
        currentPage: page,
        totalPages: Math.ceil((count || 0) / PAGE_SIZE),
      };
    },
  });
}

// ── All study IDs (for Select All) ────────────────────────────
export function useAllStudyIds({
  search,
  selectedLabels = [],
  selectedMeshConditions = [],
  enabled = false,
}: {
  search: SearchInput;
  selectedLabels?: string[];
  selectedMeshConditions?: string[];
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["all-study-ids", search.rows, selectedLabels],
    queryFn: async (): Promise<string[]> => {
      if (isSearchActive(search)) {
        const { nctIds } = await executeSearch(search.rows);
        return nctIds;
      }
      const { data, error } = await supabaseExternal
        .from("v_ui_study_list_v2")
        .select("nct_id")
        .order("nct_id", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data || []).map((r) => r.nct_id);
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Facet hooks ────────────────────────────────────────────────
export function useSemanticLabelsFacet() {
  return useQuery({
    queryKey: ["facet-semantic-labels"],
    queryFn: async () => {
      const { data, error } = await supabaseExternal
        .from("v_ui_facet_semantic_labels")
        .select("*")
        .order("n_studies", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useParamTypeFacet() {
  return useQuery({
    queryKey: ["facet-param-type"],
    queryFn: async () => {
      const { data, error } = await supabaseExternal
        .from("v_ui_facet_param_type")
        .select("*")
        .order("n_studies", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
