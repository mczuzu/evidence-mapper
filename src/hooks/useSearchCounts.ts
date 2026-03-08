import { useQuery } from "@tanstack/react-query";
import { supabaseExternal } from "@/lib/supabase-external";
import { SearchInput, SearchRow, isSearchActive } from "@/types/search";

export interface SearchCounts {
  intersectionTotal: number;
  finalNctIds: string[];
  rowCounts: { type: string; terms: string[]; count: number }[];
}

function termsByType(rows: SearchRow[]) {
  const dateRow = rows.find((r) => r.type === "daterange" && r.terms.length >= 2);
  return {
    conditionTerms: rows.filter((r) => r.type === "condition").flatMap((r) => r.terms).filter(Boolean),
    interventionTerms: rows.filter((r) => r.type === "intervention").flatMap((r) => r.terms).filter(Boolean),
    phaseTerms: rows.filter((r) => r.type === "phase").flatMap((r) => r.terms).filter(Boolean),
    yearFrom: dateRow ? parseInt(dateRow.terms[0]) : null,
    yearTo: dateRow ? parseInt(dateRow.terms[1]) : null,
  };
}

async function fetchTotalCount(params: {
  conditionTerms: string[];
  interventionTerms: string[];
  phaseTerms: string[];
}): Promise<number> {
  const { data, error } = await supabaseExternal.rpc("search_studies_paged", {
    p_condition_terms: params.conditionTerms.length > 0 ? params.conditionTerms : null,
    p_intervention_terms: params.interventionTerms.length > 0 ? params.interventionTerms : null,
    p_phases: params.phaseTerms.length > 0 ? params.phaseTerms : null,
    p_only_analyzable: false,
    p_only_comparable: false,
    p_page: 0,
    p_page_size: 1,
  });

  if (error) throw error;
  return Number((data as any[])?.[0]?.total_count ?? 0);
}

export function useSearchCounts({ search }: { search: SearchInput }) {
  return useQuery({
    queryKey: ["search-counts", search.rows.map((r) => `${r.type}:${r.terms.join(",")}:${r.operator}`)],
    queryFn: async (): Promise<SearchCounts> => {
      if (!isSearchActive(search)) {
        return { intersectionTotal: 0, finalNctIds: [], rowCounts: [] };
      }

      const allTerms = termsByType(search.rows);
      const intersectionTotal = await fetchTotalCount(allTerms);

      const rowCounts = await Promise.all(
        search.rows
          .filter((r) => r.terms.length > 0)
          .map(async (row) => {
            const singleRowTerms = termsByType([row]);
            const count = await fetchTotalCount(singleRowTerms);
            return { type: row.type, terms: row.terms, count };
          }),
      );

      return {
        intersectionTotal,
        finalNctIds: [],
        rowCounts,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

