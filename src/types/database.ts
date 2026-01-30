// Types based on the external Supabase views

export interface StudyListItem {
  nct_id: string;
  brief_title: string;
  official_title: string | null;
  n_result_rows: number | null;
  n_unique_outcomes: number | null;
  total_n_reported: number | null;
  max_n_reported: number | null;
  has_placebo_or_control_label: boolean | null;
  semantic_labels: string[] | null;
  param_type_set: string[] | null;
}

export interface FacetSemanticLabel {
  label: string;
  n_studies: number;
}

export interface FacetParamType {
  param_type: string;
  n_studies: number;
}
