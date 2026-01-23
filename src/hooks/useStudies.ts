import { useQuery } from '@tanstack/react-query';
import { supabaseExternal } from '@/lib/supabase-external';
import { StudyListItem, FacetSemanticLabel, FacetParamType } from '@/types/database';

const PAGE_SIZE = 20;

interface UseStudiesParams {
  searchQuery: string;
  selectedLabels: string[];
  selectedParamTypes: string[];
  page: number;
}

export function useStudies({ searchQuery, selectedLabels, selectedParamTypes, page }: UseStudiesParams) {
  return useQuery({
    queryKey: ['studies', searchQuery, selectedLabels, selectedParamTypes, page],
    queryFn: async () => {
      let query = supabaseExternal
        .from('v_ui_study_list')
        .select('*', { count: 'exact' })
        .order('updated_at', { ascending: false, nullsFirst: false });

      // Text search on brief_title and official_title
      if (searchQuery.trim()) {
        const searchTerm = `%${searchQuery.trim()}%`;
        query = query.or(`brief_title.ilike.${searchTerm},official_title.ilike.${searchTerm}`);
      }

      // Filter by semantic labels (contains any of the selected)
      if (selectedLabels.length > 0) {
        query = query.overlaps('semantic_labels', selectedLabels);
      }

      // Filter by param types (contains any of the selected)
      if (selectedParamTypes.length > 0) {
        query = query.overlaps('param_type_set', selectedParamTypes);
      }

      // Pagination
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching studies:', error);
        throw error;
      }

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

export function useSemanticLabelsFacet() {
  return useQuery({
    queryKey: ['facet-semantic-labels'],
    queryFn: async () => {
      const { data, error } = await supabaseExternal
        .from('v_ui_facet_semantic_labels')
        .select('*')
        .order('n_studies', { ascending: false });

      if (error) {
        console.error('Error fetching semantic labels facet:', error);
        throw error;
      }

      return (data as FacetSemanticLabel[]) || [];
    },
  });
}

export function useParamTypeFacet() {
  return useQuery({
    queryKey: ['facet-param-type'],
    queryFn: async () => {
      const { data, error } = await supabaseExternal
        .from('v_ui_facet_param_type')
        .select('*')
        .order('n_studies', { ascending: false });

      if (error) {
        console.error('Error fetching param type facet:', error);
        throw error;
      }

      return (data as FacetParamType[]) || [];
    },
  });
}
