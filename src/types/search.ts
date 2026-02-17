export interface UnifiedSearchInput {
  baseQuery: string;
  groupA: string[];
  groupB: string[];
  operatorBetweenGroups: "AND" | "OR";
}

export function isSearchActive(search: UnifiedSearchInput): boolean {
  return (
    search.baseQuery.trim().length > 0 ||
    search.groupA.length > 0 ||
    search.groupB.length > 0
  );
}

/** Encode search state to URL params */
export function searchToParams(search: UnifiedSearchInput): URLSearchParams {
  const params = new URLSearchParams();
  if (search.baseQuery.trim()) params.set("q", search.baseQuery.trim());
  if (search.groupA.length > 0) params.set("ga", search.groupA.join(","));
  if (search.groupB.length > 0) params.set("gb", search.groupB.join(","));
  if (search.operatorBetweenGroups !== "AND") params.set("op", search.operatorBetweenGroups);
  return params;
}

/** Parse search state from URL params */
export function paramsToSearch(params: URLSearchParams): UnifiedSearchInput {
  return {
    baseQuery: params.get("q") || "",
    groupA: params.get("ga")?.split(",").filter(Boolean) || [],
    groupB: params.get("gb")?.split(",").filter(Boolean) || [],
    operatorBetweenGroups: (params.get("op") as "AND" | "OR") || "AND",
  };
}
