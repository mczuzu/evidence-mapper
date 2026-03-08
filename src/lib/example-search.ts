import { SearchInput, searchToParams } from "@/types/search";

export const EXAMPLE_OBJECTIVE =
  "Identify pharmacological interventions that improve glycemic control in Type 2 Diabetes patients, focusing on recent trials with measurable outcomes.";

export const EXAMPLE_SEARCH: SearchInput = {
  rows: [
    { id: 1, type: "condition", terms: ["Diabetes Mellitus, Type 2"], operator: "AND" },
    { id: 2, type: "intervention", terms: ["metformin"], operator: "AND" },
    { id: 3, type: "phase", terms: ["PHASE3"], operator: "AND" },
    { id: 4, type: "daterange", terms: ["2018", "2026"], operator: "AND" },
  ],
};

export function exampleSearchUrl(): string {
  const params = searchToParams(EXAMPLE_SEARCH);
  params.set("objective", EXAMPLE_OBJECTIVE);
  return `/search?${params.toString()}`;
}
