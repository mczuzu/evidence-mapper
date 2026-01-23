export type SemanticLabelType = 'placebo' | 'drug' | 'cohort' | 'dose' | 'outcome';

export interface SemanticLabel {
  type: SemanticLabelType;
  value: string;
}

export interface StudyMetrics {
  outcomes: number;
  results: number;
  participants: number;
}

export interface Study {
  id: string;
  title: string;
  description: string;
  semanticLabels: SemanticLabel[];
  metrics: StudyMetrics;
  parameterTypes: string[];
  publicationDate: string;
}
