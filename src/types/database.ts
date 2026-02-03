// Types based on the external Supabase views

export interface StudyListItem {
  nct_id: string;
  brief_title: string;
  official_title: string | null;
  semantic_labels: string[] | null;
  n_semantic_labels: number | null;
  n_total_mentions: number | null;
}

export interface FacetSemanticLabel {
  label: string;
  n_studies: number;
}

export interface FacetParamType {
  param_type: string;
  n_studies: number;
}
