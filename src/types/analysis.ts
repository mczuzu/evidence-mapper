// Types for the new analysis schema

export interface Snippet {
  quote: string;
  nct_id: string;
  source_field: string;
}

export interface DirectionHypothesis {
  hypothesis: string;
  confidence: 'high' | 'medium' | 'low';
  supporting_snippets: Snippet[];
  counter_snippets?: Snippet[];
}

export interface Pattern {
  pattern: string;
  interpretation: string;
  snippets: Snippet[];
}

export interface OpportunityGap {
  gap: string;
  impact_if_filled: string;
  snippets: Snippet[];
}

export interface NextStudy {
  title: string;
  population: string;
  intervention: string;
  comparator: string;
  primary_outcomes: string[];
  follow_up: string;
  why_this_design: string;
  evidence_basis_snippets: Snippet[];
}

export interface StudyIndexItem {
  nct_id: string;
  brief_title: string;
}

export interface AnalysisResult {
  analysis: {
    direction_hypotheses?: DirectionHypothesis[];
    patterns?: Pattern[];
    opportunity_gaps?: OpportunityGap[];
    next_studies?: NextStudy[];
    snippets_index?: Snippet[];
    // Legacy fields for backward compatibility
    direction?: string;
    themes?: { title: string; description: string; study_ids: string[] }[];
    gaps?: { title: string; description: string; study_ids: string[] }[];
    suggested_next_steps?: string[];
  };
  study_index?: StudyIndexItem[];
  metadata?: {
    n_found?: number;
    study_count?: number;
    missing?: string[];
    generated_at?: string;
  };
}

// Helper to extract unique NCT IDs from snippets
export function extractNctIdsFromSnippets(snippets: Snippet[] | undefined): string[] {
  if (!snippets || snippets.length === 0) return [];
  const ids = snippets.map((s) => s.nct_id).filter(Boolean);
  return [...new Set(ids)];
}
