import { useQuery } from "@tanstack/react-query";
import { supabaseExternal } from "@/lib/supabase-external";
import { UnifiedSearchInput, isSearchActive } from "@/types/search";

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

async function callRpcWithMesh(
  q: string,
  meshNctIds: string[],
  limit = 5000
): Promise<RpcSearchResult[]> {
  const { data, error } = await supabaseExternal.rpc("search_studies_with_mesh", {
    q: q.trim(),
    mesh_nct_ids: meshNctIds,
    limit_n: limit,
  });
  if (!error) return (data as RpcSearchResult[]) || [];
  if (error.message?.toLowerCase().includes("search_studies_with_mesh")) {
    const fallback = await callRpc(q, limit);
    const meshSet = new Set(meshNctIds);
    return fallback.filter((r) => meshSet.has(r.nct_id));
  }
  throw error;
}

async function fetchNctIdsForMesh(meshTerm: string): Promise<string[]> {
  const { data, error } = await supabaseExternal
    .from("mesh_condition")
    .select("nct_id")
    .eq("mesh_term", meshTerm)
    .limit(5000);
  if (error) throw error;
  return (data || []).map((r) => r.nct_id);
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

export interface SearchCounts {
  meshTotal: number | null;
  baseTotal: number | null;
  groupATotal: number | null;
  groupBTotal: number | null;
  intersectionTotal: number;
  finalNctIds: string[];
}

export function useSearchCounts({
  search,
  selectedMeshCondition,
}: {
  search: UnifiedSearchInput;
  selectedMeshCondition: string | null;
}) {
  return useQuery({
    queryKey: [
      "search-counts",
      search.baseQuery,
      search.groupA,
      search.groupB,
      search.operatorBetweenGroups,
      selectedMeshCondition,
    ],
    queryFn: async (): Promise<SearchCounts> => {
      const active = isSearchActive(search);

      // 1. MeSH nct_ids
      let meshNctIds: string[] | null = null;
      if (selectedMeshCondition) {
        meshNctIds = await fetchNctIdsForMesh(selectedMeshCondition);
      }

      if (!active && !meshNctIds) {
        return { meshTotal: null, baseTotal: null, groupATotal: null, groupBTotal: null, intersectionTotal: 0, finalNctIds: [] };
      }

      // 2. Keyword searches (parallel)
      const useMesh = !!meshNctIds;
      const rpcCall = useMesh
        ? (q: string) => callRpcWithMesh(q, meshNctIds!)
        : (q: string) => callRpc(q);

      const promises: { key: string; promise: Promise<RpcSearchResult[]> }[] = [];
      if (search.baseQuery.trim()) {
        promises.push({ key: "base", promise: rpcCall(search.baseQuery.trim()) });
      }
      for (const term of search.groupA) {
        if (term.trim()) promises.push({ key: `ga:${term}`, promise: rpcCall(term) });
      }
      for (const term of search.groupB) {
        if (term.trim()) promises.push({ key: `gb:${term}`, promise: rpcCall(term) });
      }

      const results = await Promise.all(
        promises.map(async (p) => ({ key: p.key, data: await p.promise }))
      );

      // Build intermediate sets
      const baseResult = results.find((r) => r.key === "base");
      const baseSet = baseResult ? new Set(baseResult.data.map((r) => r.nct_id)) : null;

      const gaResults = results.filter((r) => r.key.startsWith("ga:"));
      const gaSet = gaResults.length > 0
        ? unionSets(...gaResults.map((r) => new Set(r.data.map((d) => d.nct_id))))
        : null;

      const gbResults = results.filter((r) => r.key.startsWith("gb:"));
      const gbSet = gbResults.length > 0
        ? unionSets(...gbResults.map((r) => new Set(r.data.map((d) => d.nct_id))))
        : null;

      // Combine groups
      let groupsCombined: Set<string> | null = null;
      if (gaSet && gbSet) {
        groupsCombined = search.operatorBetweenGroups === "AND"
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
      } else if (meshNctIds) {
        finalSet = new Set(meshNctIds);
      } else {
        finalSet = new Set();
      }

      // If mesh active but no keyword search, finalSet = meshNctIds
      // If mesh active + keyword search, finalSet is already the intersection from rpcWithMesh

      return {
        meshTotal: meshNctIds ? meshNctIds.length : null,
        baseTotal: baseSet ? baseSet.size : null,
        groupATotal: gaSet ? gaSet.size : null,
        groupBTotal: gbSet ? gbSet.size : null,
        intersectionTotal: finalSet.size,
        finalNctIds: [...finalSet],
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
