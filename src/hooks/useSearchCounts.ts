import { useQuery } from "@tanstack/react-query";
import { supabaseExternal } from "@/lib/supabase-external";
import { SearchInput, SearchRow, isSearchActive } from "@/types/search";

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

// Each row = one set of results (OR within terms, operator between rows)
async function executeSearch(rows: SearchRow[]): Promise<{ nctIds: string[] }> {
  const activeRows = rows.filter((r) => r.terms.length > 0);
  if (activeRows.length === 0) return { nctIds: [] };

  // For each row: fetch each term in parallel, union results within row
  const rowSets = await Promise.all(
    activeRows.map(async (row) => {
      if (row.type === "phase") {
        const { data, error } = await supabaseExternal.rpc("search_studies_advanced_prefix", {
          q: row.terms[0] || "",
          limit_n: 1,
        });
        // For phase, query the view directly
        const { data: phaseData, error: phaseError } = await supabaseExternal
          .from("v_ui_study_list_v2")
          .select("nct_id")
          .in("phase", row.terms);
        if (phaseError) throw phaseError;
        return new Set((phaseData || []).map((r) => r.nct_id));
      }
      const termResults = await Promise.all(row.terms.map((t) => callRpc(t)));
      return unionSets(...termResults.map((res) => new Set(res.map((r) => r.nct_id))));
    }),
  );

  // Combine rows using their operators
  let finalSet = rowSets[0];
  for (let i = 1; i < activeRows.length; i++) {
    const op = activeRows[i].operator;
    finalSet = op === "AND" ? intersectSets(finalSet, rowSets[i]) : unionSets(finalSet, rowSets[i]);
  }

  return { nctIds: [...finalSet] };
}

export interface SearchCounts {
  intersectionTotal: number;
  finalNctIds: string[];
  rowCounts: { type: string; terms: string[]; count: number }[];
}

export function useSearchCounts({ search }: { search: SearchInput }) {
  return useQuery({
    queryKey: ["search-counts", search.rows.map((r) => `${r.type}:${r.terms.join(",")}:${r.operator}`)],
    queryFn: async (): Promise<SearchCounts> => {
      if (!isSearchActive(search)) {
        return { intersectionTotal: 0, finalNctIds: [], rowCounts: [] };
      }

      const { nctIds } = await executeSearch(search.rows);

      // Row-level counts for display
      const rowCounts = await Promise.all(
        search.rows
          .filter((r) => r.terms.length > 0)
          .map(async (row) => {
            if (row.type === "phase") {
              const { data, error } = await supabaseExternal
                .from("v_ui_study_list_v2")
                .select("nct_id")
                .in("phase", row.terms);
              if (error) throw error;
              return { type: row.type, terms: row.terms, count: (data || []).length };
            }
            const termResults = await Promise.all(row.terms.map((t) => callRpc(t)));
            const rowSet = unionSets(...termResults.map((res) => new Set(res.map((r) => r.nct_id))));
            return { type: row.type, terms: row.terms, count: rowSet.size };
          }),
      );

      return {
        intersectionTotal: nctIds.length,
        finalNctIds: nctIds,
        rowCounts,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
