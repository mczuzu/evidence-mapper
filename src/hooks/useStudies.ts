import { useQuery } from "@tanstack/react-query";
import { supabaseExternal } from "@/lib/supabase-external";
import { StudyListItem } from "@/types/database";
import { SearchInput, SearchRow, isSearchActive } from "@/types/search";

const PAGE_SIZE = 20;

// ── Helper: extract terms by row type ─────────────────────────
function extractTermsByType(rows: SearchRow[]): {
  conditionTerms: string[];
  interventionTerms: string[];
  freetextTerms: string[];
  phaseTerms: string[];
} {
  const conditionTerms: string[] = [];
  const interventionTerms: string[] = [];
  const freetextTerms: string[] = [];
  const phaseTerms: string[] = [];

  for (const row of rows) {
    if (row.terms.length === 0) continue;
    switch (row.type) {
      case "condition":
        conditionTerms.push(...row.terms);
        break;
      case "intervention":
        interventionTerms.push(...row.terms);
        break;
      case "freetext":
        freetextTerms.push(...row.terms);
        break;
      case "phase":
        phaseTerms.push(...row.terms);
        break;
    }
  }

  return { conditionTerms, interventionTerms, freetextTerms, phaseTerms };
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
        const { conditionTerms, interventionTerms, freetextTerms, phaseTerms } =
          extractTermsByType(search.rows);

        const { data, error } = await supabaseExternal.rpc("search_studies_paged", {
          p_condition_terms: conditionTerms.length > 0 ? conditionTerms : null,
          p_intervention_terms: interventionTerms.length > 0 ? interventionTerms : null,
          p_freetext_terms: freetextTerms.length > 0 ? freetextTerms : null,
          p_phases: phaseTerms.length > 0 ? phaseTerms : null,
          p_only_analyzable: onlyAnalyzable,
          p_only_comparable: onlyComparable,
          p_page: page,
          p_page_size: PAGE_SIZE,
        });

        if (error) throw error;

        const rows = (data as any[]) || [];
        const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0;

        // Map RPC results to StudyListItem shape
        const studies = (rows as StudyListItem[]);

        return {
          studies,
          totalCount,
          pageSize: PAGE_SIZE,
          currentPage: page,
          totalPages: Math.ceil(totalCount / PAGE_SIZE),
        };



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
        const { conditionTerms, interventionTerms, freetextTerms, phaseTerms } =
          extractTermsByType(search.rows);
        // Use a large page to get all IDs
        const { data, error } = await supabaseExternal.rpc("search_studies_paged", {
          p_condition_terms: conditionTerms.length > 0 ? conditionTerms : null,
          p_intervention_terms: interventionTerms.length > 0 ? interventionTerms : null,
          p_freetext_terms: freetextTerms.length > 0 ? freetextTerms : null,
          p_phases: phaseTerms.length > 0 ? phaseTerms : null,
          p_only_analyzable: false,
          p_only_comparable: false,
          p_page: 0,
          p_page_size: 10000,
        });
        if (error) throw error;
        return ((data as any[]) || []).map((r) => r.nct_id);
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
