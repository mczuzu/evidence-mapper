import { useQuery } from "@tanstack/react-query";
import { supabaseExternal } from "@/lib/supabase-external";
import { StudyListItem, FacetSemanticLabel, FacetParamType } from "@/types/database";
import { UnifiedSearchInput, isSearchActive } from "@/types/search";

const PAGE_SIZE = 20;

interface RpcSearchResult {
  nct_id: string;
  brief_title: string;
  official_title: string | null;
  rank: number;
}

// ─── RPC helper ───────────────────────────────────────────────
/** Call the existing search_studies_advanced RPC with a single query term. */
async function callRpc(q: string, limit = 500): Promise<RpcSearchResult[]> {
  const { data, error } = await supabaseExternal.rpc("search_studies_advanced_prefix", {
    q: q.trim(),
    limit_n: limit,
  });
  if (error) throw error;
  return (data as RpcSearchResult[]) || [];
}

// ─── Set operations ───────────────────────────────────────────
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

// ─── Unified search executor ──────────────────────────────────
/**
 * Execute the unified search using the existing RPC.
 *
 * Strategy:
 * - base query → single RPC call (AND between tokens, handled by RPC)
 * - group terms → parallel RPC calls per term, union within group (OR)
 * - combine groups with AND (intersect) or OR (union)
 * - if base query + groups, intersect base results with group results
 *
 * Returns the ordered list of nct_ids and a rank map.
 */
async function executeUnifiedSearch(
  search: UnifiedSearchInput
): Promise<{ nctIds: string[]; rankMap: Map<string, number> }> {
  const promises: { key: string; promise: Promise<RpcSearchResult[]> }[] = [];

  // Base query
  if (search.baseQuery.trim()) {
    promises.push({ key: "base", promise: callRpc(search.baseQuery.trim()) });
  }

  // Group A terms (each gets its own RPC call)
  for (const term of search.groupA) {
    promises.push({ key: `ga:${term}`, promise: callRpc(term) });
  }

  // Group B terms
  for (const term of search.groupB) {
    promises.push({ key: `gb:${term}`, promise: callRpc(term) });
  }

  // Execute all in parallel
  const results = await Promise.all(
    promises.map(async (p) => ({
      key: p.key,
      data: await p.promise,
    }))
  );

  // Build rank map (best rank wins across all calls)
  const globalRankMap = new Map<string, number>();
  for (const { data } of results) {
    for (const r of data) {
      const existing = globalRankMap.get(r.nct_id);
      if (existing === undefined || r.rank > existing) {
        globalRankMap.set(r.nct_id, r.rank);
      }
    }
  }

  // Build sets
  const baseResult = results.find((r) => r.key === "base");
  const baseSet = baseResult
    ? new Set(baseResult.data.map((r) => r.nct_id))
    : null;

  // Group A: union of all ga: results
  const gaResults = results.filter((r) => r.key.startsWith("ga:"));
  const gaSet =
    gaResults.length > 0
      ? unionSets(...gaResults.map((r) => new Set(r.data.map((d) => d.nct_id))))
      : null;

  // Group B: union of all gb: results
  const gbResults = results.filter((r) => r.key.startsWith("gb:"));
  const gbSet =
    gbResults.length > 0
      ? unionSets(...gbResults.map((r) => new Set(r.data.map((d) => d.nct_id))))
      : null;

  // Combine groups
  let groupsCombined: Set<string> | null = null;
  if (gaSet && gbSet) {
    groupsCombined =
      search.operatorBetweenGroups === "AND"
        ? intersectSets(gaSet, gbSet)
        : unionSets(gaSet, gbSet);
  } else if (gaSet) {
    groupsCombined = gaSet;
  } else if (gbSet) {
    groupsCombined = gbSet;
  }

  // Combine base + groups
  let finalSet: Set<string>;
  if (baseSet && groupsCombined) {
    finalSet = intersectSets(baseSet, groupsCombined);
  } else if (baseSet) {
    finalSet = baseSet;
  } else if (groupsCombined) {
    finalSet = groupsCombined;
  } else {
    finalSet = new Set();
  }

  // Sort by rank descending
  const nctIds = [...finalSet].sort(
    (a, b) => (globalRankMap.get(b) ?? 0) - (globalRankMap.get(a) ?? 0)
  );

  return { nctIds, rankMap: globalRankMap };
}

// ─── MeSH condition helper ────────────────────────────────────
/** Get nct_ids matching a MeSH condition from browse_conditions table */
async function fetchNctIdsForMesh(meshTerm: string): Promise<string[]> {
  const { data, error } = await supabaseExternal
    .from("browse_conditions")
    .select("nct_id")
    .eq("mesh_term", meshTerm)
    .limit(5000);
  if (error) throw error;
  return (data || []).map((r) => r.nct_id);
}

// ─── Hook params ──────────────────────────────────────────────
interface UseStudiesParams {
  search: UnifiedSearchInput;
  selectedLabels: string[];
  selectedParamTypes: string[];
  selectedMeshCondition?: string | null;
  page: number;
  onlyAnalyzable?: boolean;
  onlyComparable?: boolean;
  measurementClusters?: string[];
}

export function useStudies({
  search,
  selectedLabels,
  selectedParamTypes,
  selectedMeshCondition,
  page,
  onlyAnalyzable = false,
  onlyComparable = false,
  measurementClusters = [],
}: UseStudiesParams) {
  return useQuery({
    queryKey: [
      "studies",
      search.baseQuery,
      search.groupA,
      search.groupB,
      search.operatorBetweenGroups,
      selectedLabels,
      selectedParamTypes,
      selectedMeshCondition,
      page,
      onlyAnalyzable,
      onlyComparable,
      measurementClusters,
    ],
    queryFn: async () => {
      const searchActive = isSearchActive(search);

      // ── Path A: search active → use RPC then fetch full data ──
      if (searchActive) {
        // Run search + optional mesh filter in parallel
        const [searchResult, meshNctIds] = await Promise.all([
          executeUnifiedSearch(search),
          selectedMeshCondition ? fetchNctIdsForMesh(selectedMeshCondition) : Promise.resolve(null),
        ]);

        let nctIds = searchResult.nctIds;

        // Intersect with mesh filter if active
        if (meshNctIds !== null) {
          const meshSet = new Set(meshNctIds);
          nctIds = nctIds.filter((id) => meshSet.has(id));
        }

        if (nctIds.length === 0) {
          return { studies: [], totalCount: 0, pageSize: PAGE_SIZE, currentPage: page, totalPages: 0 };
        }

        // Fetch full study data for matched IDs
        let query = supabaseExternal
          .from("v_ui_study_list_v2")
          .select("*")
          .in("nct_id", nctIds);

        // Apply post-filters
        if (onlyAnalyzable) query = query.eq("has_numeric_results", true);
        if (onlyComparable) query = query.eq("has_group_comparison", true);
        if (measurementClusters.length > 0) query = query.overlaps("measurement_clusters", measurementClusters);
        if (selectedLabels.length > 0) query = query.overlaps("semantic_labels", selectedLabels);

        const { data: v2Data, error: v2Error } = await query;
        if (v2Error) throw v2Error;

        // Re-order by rank from RPC
        const rankIndex = new Map(nctIds.map((id, i) => [id, i]));
        const studies = ((v2Data as StudyListItem[]) || []).sort(
          (a, b) => (rankIndex.get(a.nct_id) ?? 999) - (rankIndex.get(b.nct_id) ?? 999)
        );

        // Client-side pagination
        const from = page * PAGE_SIZE;
        const paginatedStudies = studies.slice(from, from + PAGE_SIZE);

        return {
          studies: paginatedStudies,
          totalCount: studies.length,
          pageSize: PAGE_SIZE,
          currentPage: page,
          totalPages: Math.ceil(studies.length / PAGE_SIZE),
        };
      }

      // ── Path B: no search → direct query on view ──
      // If mesh condition is selected, first get matching nct_ids
      if (selectedMeshCondition) {
        const meshNctIds = await fetchNctIdsForMesh(selectedMeshCondition);
        if (meshNctIds.length === 0) {
          return { studies: [], totalCount: 0, pageSize: PAGE_SIZE, currentPage: page, totalPages: 0 };
        }

        let query = supabaseExternal
          .from("v_ui_study_list_v2")
          .select("*")
          .in("nct_id", meshNctIds);

        if (onlyAnalyzable) query = query.eq("has_numeric_results", true);
        if (onlyComparable) query = query.eq("has_group_comparison", true);
        if (measurementClusters.length > 0) query = query.overlaps("measurement_clusters", measurementClusters);
        if (selectedLabels.length > 0) query = query.overlaps("semantic_labels", selectedLabels);

        const { data, error } = await query;
        if (error) throw error;

        const studies = ((data as StudyListItem[]) || []).sort(
          (a, b) => b.nct_id.localeCompare(a.nct_id)
        );

        const from = page * PAGE_SIZE;
        const paginatedStudies = studies.slice(from, from + PAGE_SIZE);

        return {
          studies: paginatedStudies,
          totalCount: studies.length,
          pageSize: PAGE_SIZE,
          currentPage: page,
          totalPages: Math.ceil(studies.length / PAGE_SIZE),
        };
      }

      let query = supabaseExternal
        .from("v_ui_study_list_v2")
        .select("*", { count: "exact" })
        .order("nct_id", { ascending: false });

      if (onlyAnalyzable) query = query.eq("has_numeric_results", true);
      if (onlyComparable) query = query.eq("has_group_comparison", true);
      if (measurementClusters.length > 0) query = query.overlaps("measurement_clusters", measurementClusters);
      if (selectedLabels.length > 0) query = query.overlaps("semantic_labels", selectedLabels);

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

// ─── All study IDs (for "Select All") ──────────────────────────
export function useAllStudyIds({
  search,
  selectedLabels,
  enabled = false,
}: {
  search: UnifiedSearchInput;
  selectedLabels: string[];
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["all-study-ids", search.baseQuery, search.groupA, search.groupB, search.operatorBetweenGroups, selectedLabels],
    queryFn: async (): Promise<string[]> => {
      const searchActive = isSearchActive(search);

      if (searchActive) {
        const { nctIds } = await executeUnifiedSearch(search);
        return nctIds;
      }

      // No search → fetch all IDs from view
      let query = supabaseExternal
        .from("v_ui_study_list_v2")
        .select("nct_id")
        .order("nct_id", { ascending: false })
        .limit(1000);

      if (selectedLabels.length > 0) {
        query = query.overlaps("semantic_labels", selectedLabels);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((r) => r.nct_id);
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Facet hooks (unchanged) ──────────────────────────────────
export function useSemanticLabelsFacet() {
  return useQuery({
    queryKey: ["facet-semantic-labels"],
    queryFn: async () => {
      const { data, error } = await supabaseExternal
        .from("v_ui_facet_semantic_labels")
        .select("*")
        .order("n_studies", { ascending: false });
      if (error) throw error;
      return (data as FacetSemanticLabel[]) || [];
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
      return (data as FacetParamType[]) || [];
    },
  });
}
