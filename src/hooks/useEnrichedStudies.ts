import { useQuery } from "@tanstack/react-query";
import { supabaseExternal } from "@/lib/supabase-external";

export interface EnrichedStudy {
  nct_id: string;
  brief_title: string | null;
  official_title: string | null;
  brief_summary: string | null;
  study_type: string | null;
  phase: string | null;
  enrollment: number | null;
  start_date: string | null;
  primary_completion_date: string | null;
  completion_date: string | null;
  results_first_posted_date: string | null;
  conditions: string | null;
  interventions: string | null;
  outcome_measures: string | null;
  design_groups: string | null;
}

/**
 * Fetch enriched study data from em.study_index for a list of nct_ids.
 * Use this as a secondary query after useStudies provides the visible page IDs.
 */
export function useEnrichedStudies(nctIds: string[]) {
  return useQuery({
    queryKey: ["enriched-studies", nctIds],
    queryFn: async () => {
      if (nctIds.length === 0) return new Map<string, EnrichedStudy>();

      const { data, error } = await supabaseExternal
        .from("study_index")
        .select("*")
        .in("nct_id", nctIds);

      if (error) throw error;

      const map = new Map<string, EnrichedStudy>();
      for (const row of (data || []) as EnrichedStudy[]) {
        map.set(row.nct_id, row);
      }
      return map;
    },
    enabled: nctIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
