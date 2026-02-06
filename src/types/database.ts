// Types based on the external Supabase views

export interface StudyListItem {
  nct_id: string;
  brief_title: string;
  official_title: string | null;
  semantic_labels: string[] | null;
  n_semantic_labels: number | null;
  n_total_mentions: number | null;
  // Study Profile V2 fields
  brief_summary: string | null;
  has_numeric_results: boolean | null;
  has_group_comparison: boolean | null;
  measurement_clusters: string[] | null;
  n_numeric_outcomes: number | null;
  n_groups: number | null;
  n_comparisons: number | null;
  conditions_top: string[] | null;
  outcomes_top: string[] | null;
}

export interface FacetSemanticLabel {
  label: string;
  n_studies: number;
}

export interface FacetParamType {
  param_type: string;
  n_studies: number;
}

// Filter state for Study Profile V2
export interface StudyFilters {
  onlyAnalyzable: boolean;
  onlyComparable: boolean;
  measurementClusters: string[];
}
