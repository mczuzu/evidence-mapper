import { SearchInput, searchToParams } from "@/types/search";

export const EXAMPLE_OBJECTIVE =
  "What does the evidence say about empagliflozin for cardiovascular outcomes in heart failure patients?";

export const EXAMPLE_SEARCH: SearchInput = {
  rows: [
    { id: 1, type: "condition", terms: ["Heart Failure"], operator: "AND" },
    { id: 2, type: "intervention", terms: ["Empagliflozin"], operator: "AND" },
  ],
};

export function exampleSearchUrl(): string {
  const params = searchToParams(EXAMPLE_SEARCH);
  params.set("objective", EXAMPLE_OBJECTIVE);
  return `/search?${params.toString()}`;
}
