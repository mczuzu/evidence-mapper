import { Study } from '@/types/study';

export const mockStudies: Study[] = [
  {
    id: '1',
    title: 'Efficacy of Novel GLP-1 Agonist in Type 2 Diabetes Management',
    description: 'A randomized, double-blind, placebo-controlled trial evaluating glycemic control outcomes in adults with inadequately controlled T2DM.',
    semanticLabels: [
      { type: 'drug', value: 'GLP-1 Agonist' },
      { type: 'placebo', value: 'Placebo Control' },
      { type: 'dose', value: '10mg Daily' },
      { type: 'cohort', value: 'Adults 40-65' },
    ],
    metrics: { outcomes: 12, results: 847, participants: 1250 },
    parameterTypes: ['HbA1c', 'Fasting Glucose', 'Body Weight'],
    publicationDate: '2024-03-15',
  },
  {
    id: '2',
    title: 'Comparative Analysis of SSRI Combinations in Treatment-Resistant Depression',
    description: 'Multi-center study examining augmentation strategies for patients who have failed first-line antidepressant therapy.',
    semanticLabels: [
      { type: 'drug', value: 'SSRI Combination' },
      { type: 'cohort', value: 'Treatment-Resistant' },
      { type: 'outcome', value: 'Remission Rate' },
    ],
    metrics: { outcomes: 8, results: 512, participants: 680 },
    parameterTypes: ['HAM-D Score', 'Remission Rate', 'Response Rate'],
    publicationDate: '2024-02-28',
  },
  {
    id: '3',
    title: 'Long-term Safety Profile of Biologic Therapy in Rheumatoid Arthritis',
    description: 'Five-year observational cohort study tracking adverse events and disease progression markers.',
    semanticLabels: [
      { type: 'drug', value: 'TNF-α Inhibitor' },
      { type: 'cohort', value: 'RA Patients' },
      { type: 'dose', value: 'Variable Dosing' },
      { type: 'outcome', value: 'Safety Profile' },
    ],
    metrics: { outcomes: 24, results: 2340, participants: 3200 },
    parameterTypes: ['DAS28-CRP', 'Adverse Events', 'Infection Rate'],
    publicationDate: '2024-01-10',
  },
  {
    id: '4',
    title: 'Pediatric Vaccine Response in Immunocompromised Populations',
    description: 'Assessment of immunogenicity and safety of routine childhood vaccines in children receiving immunosuppressive therapy.',
    semanticLabels: [
      { type: 'cohort', value: 'Pediatric' },
      { type: 'cohort', value: 'Immunocompromised' },
      { type: 'outcome', value: 'Antibody Response' },
    ],
    metrics: { outcomes: 6, results: 298, participants: 450 },
    parameterTypes: ['Antibody Titer', 'Seroconversion', 'Adverse Reactions'],
    publicationDate: '2023-12-05',
  },
  {
    id: '5',
    title: 'Dose-Escalation Study of Novel Checkpoint Inhibitor in Solid Tumors',
    description: 'Phase I/II trial establishing maximum tolerated dose and preliminary efficacy signals across multiple tumor types.',
    semanticLabels: [
      { type: 'drug', value: 'PD-L1 Inhibitor' },
      { type: 'dose', value: 'Escalation Protocol' },
      { type: 'cohort', value: 'Advanced Solid Tumors' },
      { type: 'outcome', value: 'MTD Determination' },
    ],
    metrics: { outcomes: 15, results: 623, participants: 180 },
    parameterTypes: ['ORR', 'DLT', 'PFS', 'OS'],
    publicationDate: '2024-04-22',
  },
  {
    id: '6',
    title: 'Cardiovascular Outcomes with SGLT2 Inhibitors in Heart Failure',
    description: 'Large-scale outcomes trial examining hospitalization rates and mortality in patients with reduced ejection fraction.',
    semanticLabels: [
      { type: 'drug', value: 'SGLT2 Inhibitor' },
      { type: 'placebo', value: 'Placebo Control' },
      { type: 'cohort', value: 'HFrEF Patients' },
      { type: 'outcome', value: 'CV Death' },
    ],
    metrics: { outcomes: 10, results: 4521, participants: 6200 },
    parameterTypes: ['Hospitalization Rate', 'CV Mortality', 'eGFR Change'],
    publicationDate: '2024-05-01',
  },
  {
    id: '7',
    title: 'Real-World Effectiveness of CAR-T Therapy in Relapsed Lymphoma',
    description: 'Registry-based analysis of outcomes in patients receiving commercial CAR-T products outside of clinical trials.',
    semanticLabels: [
      { type: 'drug', value: 'CAR-T Cell Therapy' },
      { type: 'cohort', value: 'Relapsed/Refractory' },
      { type: 'outcome', value: 'Complete Response' },
    ],
    metrics: { outcomes: 9, results: 1834, participants: 890 },
    parameterTypes: ['CR Rate', 'CRS Incidence', 'Neurotoxicity'],
    publicationDate: '2024-03-08',
  },
  {
    id: '8',
    title: 'Subcutaneous vs Intravenous Administration of Monoclonal Antibodies',
    description: 'Non-inferiority comparison of pharmacokinetics and patient preference between administration routes.',
    semanticLabels: [
      { type: 'drug', value: 'Monoclonal Antibody' },
      { type: 'dose', value: 'SC vs IV' },
      { type: 'outcome', value: 'Bioequivalence' },
    ],
    metrics: { outcomes: 7, results: 445, participants: 320 },
    parameterTypes: ['AUC', 'Cmax', 'Patient Preference'],
    publicationDate: '2024-02-14',
  },
];

export const allSemanticLabels = Array.from(
  new Set(mockStudies.flatMap(s => s.semanticLabels.map(l => l.value)))
);

export const allParameterTypes = Array.from(
  new Set(mockStudies.flatMap(s => s.parameterTypes))
);

export const labelTypeColors: Record<string, { type: string }> = {
  placebo: { type: 'placebo' },
  drug: { type: 'drug' },
  cohort: { type: 'cohort' },
  dose: { type: 'dose' },
  outcome: { type: 'outcome' },
};
