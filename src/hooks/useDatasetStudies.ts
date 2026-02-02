import { useQuery } from "@tanstack/react-query";
import { supabaseExternal } from "@/lib/supabase-external";
import { StudyListItem } from "@/types/database";

const DATASET_PAGE_SIZE = 50;

interface UseDatasetStudiesParams {
  searchQuery: string;
  selectedLabels: string[];
  selectedParamTypes: string[];
  page: number;
}

export function useDatasetStudies({ searchQuery, selectedLabels, selectedParamTypes, page }: UseDatasetStudiesParams) {
  return useQuery({
    queryKey: ["dataset-studies", searchQuery, selectedLabels, selectedParamTypes, page],
    queryFn: async () => {
      let query = supabaseExternal
        .from("v_ui_study_list")
        .select("*", { count: "exact" })
        .order("nct_id", { ascending: false });

      // Text search on brief_title and official_title
      if (searchQuery.trim()) {
        const searchTerm = `%${searchQuery.trim()}%`;
        query = query.or(`brief_title.ilike.${searchTerm},official_title.ilike.${searchTerm}`);
      }

      // Filter by semantic labels (overlaps any of the selected)
      if (selectedLabels.length > 0) {
        query = query.overlaps("semantic_labels", selectedLabels);
      }

      // Filter by param types (overlaps any of the selected)
      if (selectedParamTypes.length > 0) {
        query = query.overlaps("param_type_set", selectedParamTypes);
      }

      // Pagination with limit 50
      const from = page * DATASET_PAGE_SIZE;
      const to = from + DATASET_PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching dataset studies:", error);
        throw error;
      }

      return {
        studies: (data as StudyListItem[]) || [],
        totalCount: count || 0,
        pageSize: DATASET_PAGE_SIZE,
        currentPage: page,
        totalPages: Math.ceil((count || 0) / DATASET_PAGE_SIZE),
      };
    },
  });
}

// Hook for fetching specific studies by IDs
export function useDatasetStudiesByIds(nctIds: string[]) {
  return useQuery({
    queryKey: ["dataset-studies-by-ids", nctIds],
    queryFn: async () => {
      if (nctIds.length === 0) {
        return {
          studies: [],
          totalCount: 0,
          pageSize: 0,
          currentPage: 0,
          totalPages: 0,
        };
      }

      const { data, error } = await supabaseExternal
        .from("v_ui_study_list")
        .select("*")
        .in("nct_id", nctIds)
        .order("nct_id", { ascending: false });

      if (error) {
        console.error("Error fetching studies by IDs:", error);
        throw error;
      }

      return {
        studies: (data as StudyListItem[]) || [],
        totalCount: data?.length || 0,
        pageSize: data?.length || 0,
        currentPage: 0,
        totalPages: 1,
      };
    },
    enabled: nctIds.length > 0,
  });
}
