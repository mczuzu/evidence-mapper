import { useQuery } from '@tanstack/react-query';
import { supabaseExternal } from '@/lib/supabase-external';
import { supabase } from '@/integrations/supabase/client';

export interface StudyBasicInfo {
  nct_id: string;
  brief_title: string;
  official_title: string | null;
  semantic_labels: string[] | null;
  param_type_set: string[] | null;
  n_result_rows: number | null;
  n_unique_outcomes: number | null;
  total_n_reported: number | null;
  max_n_reported: number | null;
  has_placebo_or_control_label: boolean | null;
}

export interface PrimaryOutcome {
  title: string;
  time_frame: string;
}

export interface StudyRichInfo {
  primary_outcomes: PrimaryOutcome[] | null;
  eligibility_preview: string | null;
  detailed_description_preview: string | null;
}

// Hook for basic study info from the list view
export function useStudyBasicInfo(nctId: string | undefined) {
  return useQuery({
    queryKey: ['study-basic', nctId],
    queryFn: async () => {
      if (!nctId) throw new Error('No NCT ID provided');

      const { data, error } = await supabaseExternal
        .from('v_ui_study_list')
        .select('*')
        .eq('nct_id', nctId)
        .single();

      if (error) {
        console.error('Error fetching study basic info:', error);
        throw error;
      }

      return data as StudyBasicInfo;
    },
    enabled: !!nctId,
  });
}

// Hook for rich study info from the edge function
export function useStudyRichInfo(nctId: string | undefined) {
  return useQuery({
    queryKey: ['study-rich', nctId],
    queryFn: async () => {
      if (!nctId) throw new Error('No NCT ID provided');

      const { data, error } = await supabase.functions.invoke('get-rich', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: undefined,
      });

      // The invoke method doesn't support query params directly, so we use fetch
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-rich?nct_id=${encodeURIComponent(nctId)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch rich data');
      }

      return (await response.json()) as StudyRichInfo;
    },
    enabled: !!nctId,
    retry: false, // Don't retry on failure - it's expected that rich data may not exist
  });
}
