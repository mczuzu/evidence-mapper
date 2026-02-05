// Types for the new analysis schema (v3)

// Shared snippet type (legacy, kept for backward compatibility)
export interface Snippet {
  quote: string;
  nct_id: string;
  source_field: string;
}

// ─────────────────────────────────────────────────────────────────
// New schema types (v3)
// ─────────────────────────────────────────────────────────────────

export interface PromisingOrUncertainItem {
  rationale: string;
  supporting_nct_ids: string[];
}

export interface Direction {
  summary: string;
  what_is_promising: PromisingOrUncertainItem[];
  what_is_uncertain: PromisingOrUncertainItem[];
}

export interface ClusterItem {
  label: string;
  description: string;
  supporting_nct_ids: string[];
}

export interface ClusterMap {
  interventions: ClusterItem[];
  populations: ClusterItem[];
  outcomes: ClusterItem[];
  mechanisms_or_rationale: ClusterItem[];
}

export interface GapItem {
  gap: string;
  supporting_nct_ids: string[];
}

export interface Gaps {
  evidence_gaps: GapItem[];
  design_gaps: GapItem[];
  missing_subgroups: GapItem[];
}

export interface StudyProposal {
  population: string;
  intervention: string;
  comparator: string;
  primary_outcomes: string[];
  follow_up_horizon: string;
  why_it_resolves_a_gap: string;
  supporting_nct_ids: string[];
}

export interface QuickWin {
  description: string;
  supporting_nct_ids: string[];
}

export interface NextStudies {
  proposals: StudyProposal[];
  quick_wins: QuickWin[];
}

export interface DecisionAssessment {
  markdown_report: string;
}

export interface AnalysisV3 {
  direction?: Direction;
  cluster_map?: ClusterMap;
  gaps?: Gaps;
  next_studies?: NextStudies;
  decision_assessment?: DecisionAssessment;
}

// ─────────────────────────────────────────────────────────────────
// Legacy schema types (v2) - kept for backward compatibility
// ─────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────
// Unified result type (supports v1, v2, v3)
// ─────────────────────────────────────────────────────────────────

export interface AnalysisResult {
  analysis: AnalysisV3 & {
    // Legacy v2 fields
    direction_hypotheses?: DirectionHypothesis[];
    patterns?: Pattern[];
    opportunity_gaps?: OpportunityGap[];
    next_studies?: NextStudy[];
    snippets_index?: Snippet[];
    // Legacy v1 fields
    direction?: Direction | string; // v3 is object, v1 was string
    themes?: { title: string; description: string; study_ids: string[] }[];
    gaps?: Gaps | { title: string; description: string; study_ids: string[] }[]; // v3 is object, v1 was array
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

// ─────────────────────────────────────────────────────────────────
// Schema detection helpers
// ─────────────────────────────────────────────────────────────────

export type SchemaVersion = 'v1' | 'v2' | 'v3';

export function detectSchemaVersion(analysis: any): SchemaVersion {
  if (!analysis) return 'v1';
  
  // V3: has direction.summary (direction is an object with summary)
  if (analysis.direction && typeof analysis.direction === 'object' && 'summary' in analysis.direction) {
    return 'v3';
  }
  
  // V2: has direction_hypotheses or patterns or opportunity_gaps
  if (analysis.direction_hypotheses || analysis.patterns || analysis.opportunity_gaps) {
    return 'v2';
  }
  
  // V1: legacy
  return 'v1';
}

// Helper to extract unique NCT IDs from snippets (legacy)
export function extractNctIdsFromSnippets(snippets: Snippet[] | undefined): string[] {
  if (!snippets || snippets.length === 0) return [];
  const ids = snippets.map((s) => s.nct_id).filter(Boolean);
  return [...new Set(ids)];
}

// Helper to extract unique NCT IDs from supporting_nct_ids arrays
export function extractNctIds(nctIds: string[] | undefined): string[] {
  if (!nctIds || nctIds.length === 0) return [];
  return [...new Set(nctIds.filter(Boolean))];
}
