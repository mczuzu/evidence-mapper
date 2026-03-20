import { SearchInput, searchToParams } from "@/types/search";

export const EXAMPLE_OBJECTIVE =
  "Is there enough evidence on mindfulness-based interventions for anxiety to build a digital mental health app?";

export const EXAMPLE_SEARCH: SearchInput = {
  rows: [
    { id: 1, type: "condition", terms: ["Anxiety Disorders", "Generalized Anxiety Disorder", "Anxiety, Separation", "Mental Disorders"], operator: "AND" },
    { id: 2, type: "intervention", terms: ["Mindfulness"], operator: "AND" },
  ],
};

export function exampleSearchUrl(): string {
  const params = searchToParams(EXAMPLE_SEARCH);
  params.set("objective", EXAMPLE_OBJECTIVE);
  return `/search?${params.toString()}`;
}
