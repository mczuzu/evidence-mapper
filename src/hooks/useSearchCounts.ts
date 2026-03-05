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
  selectedMeshConditions,
}: {
  search: UnifiedSearchInput;
  selectedMeshConditions: string[];
}) {
  return useQuery({
    queryKey: [
      "search-counts",
      search.baseQuery,
      search.groupA,
      search.groupB,
      search.operatorBetweenGroups,
      selectedMeshConditions,
    ],
    queryFn: async (): Promise<SearchCounts> => {
      const active = isSearchActive(search);

      // 1. MeSH nct_ids — union of all selected MeSH conditions
      let meshSet: Set<string> | null = null;
      if (selectedMeshConditions.length > 0) {
        const allMeshIds = await Promise.all(
          selectedMeshConditions.map((term) => fetchNctIdsForMesh(term))
        );
        // Union all MeSH results
        meshSet = new Set<string>();
        for (const ids of allMeshIds) {
          for (const id of ids) meshSet.add(id);
        }
      }

      if (!active && !meshSet) {
        return { meshTotal: null, baseTotal: null, groupATotal: null, groupBTotal: null, intersectionTotal: 0, finalNctIds: [] };
      }

      // 2. Keyword searches — ALWAYS independent (no mesh filter) for counts
      const promises: { key: string; promise: Promise<RpcSearchResult[]> }[] = [];
      if (search.baseQuery.trim()) {
        promises.push({ key: "base", promise: callRpc(search.baseQuery.trim()) });
      }
      for (const term of search.groupA) {
        if (term.trim()) promises.push({ key: `ga:${term}`, promise: callRpc(term) });
      }
      for (const term of search.groupB) {
        if (term.trim()) promises.push({ key: `gb:${term}`, promise: callRpc(term) });
      }

      const results = await Promise.all(
        promises.map(async (p) => ({ key: p.key, data: await p.promise }))
      );

      // Build independent sets (without mesh filtering)
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

      // 3. Combine keyword groups
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

      // 4. Combine base + groups
      let keywordSet: Set<string> | null = null;
      if (baseSet && groupsCombined) {
        keywordSet = intersectSets(baseSet, groupsCombined);
      } else if (baseSet) {
        keywordSet = baseSet;
      } else if (groupsCombined) {
        keywordSet = groupsCombined;
      }

      // 5. Final intersection with MeSH (if active)
      let finalSet: Set<string>;
      if (meshSet && keywordSet) {
        finalSet = intersectSets(meshSet, keywordSet);
      } else if (meshSet) {
        finalSet = meshSet;
      } else if (keywordSet) {
        finalSet = keywordSet;
      } else {
        finalSet = new Set();
      }

      return {
        meshTotal: meshSet ? meshSet.size : null,
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
