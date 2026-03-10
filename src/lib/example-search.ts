import { SearchInput, searchToParams } from "@/types/search";

export const EXAMPLE_OBJECTIVE =
  "What does the evidence say about SGLT2 inhibitors for cardiovascular outcomes in heart failure patients?";

export const EXAMPLE_SEARCH: SearchInput = {
  rows: [
    { id: 1, type: "condition", terms: ["Heart Failure"], operator: "AND" },
    { id: 2, type: "intervention", terms: ["SGLT2 inhibitors"], operator: "AND" },
    { id: 3, type: "daterange", terms: ["2018", "2026"], operator: "AND" },
  ],
};

export function exampleSearchUrl(): string {
  const params = searchToParams(EXAMPLE_SEARCH);
  params.set("objective", EXAMPLE_OBJECTIVE);
  return `/search?${params.toString()}`;
}
