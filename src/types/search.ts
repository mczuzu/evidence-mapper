// ── Row-based search model ─────────────────────────────────────
export interface SearchRow {
  id: number;
  type: "condition" | "intervention" | "freetext" | "phase" | "daterange";
  terms: string[];
  operator: "AND" | "OR";
}

export interface SearchInput {
  rows: SearchRow[];
}

export function isSearchActive(input: SearchInput): boolean {
  return input.rows.some((r) => r && r.terms.length > 0);
}

export function emptySearch(): SearchInput {
  return {
    rows: [{ id: 1, type: "condition", terms: [], operator: "AND" }],
  };
}

// ── URL serialization ──────────────────────────────────────────
export function searchToParams(input: SearchInput): URLSearchParams {
  const params = new URLSearchParams();
      const active = input.rows.filter((r) => r && r.terms.length > 0);
  if (active.length > 0) {
    params.set(
      "rows",
      JSON.stringify(
        active.map((r) => ({
          t: r.type === "phase" ? "p" : r.type === "daterange" ? "d" : r.type[0], // c/i/f/p/d
          terms: r.terms,
          op: r.operator,
        })),
      ),
    );
  }
  return params;
}

export function paramsToSearch(params: URLSearchParams): SearchInput {
  const raw = params.get("rows");
  if (!raw) return emptySearch();
  try {
    const parsed = JSON.parse(raw);
    const typeMap: Record<string, SearchRow["type"]> = {
      c: "condition",
      i: "intervention",
      f: "freetext",
      p: "phase",
      d: "daterange",
    };
    const rows: SearchRow[] = parsed.map((r: any, i: number) => ({
      id: i + 1,
      type: typeMap[r.t] ?? "freetext",
      terms: r.terms ?? [],
      operator: r.op ?? "AND",
    }));
    return { rows };
  } catch {
    return emptySearch();
  }
}

// ── Legacy compat ──────────────────────────────────────────────
// Kept to avoid breaking DatasetPage until full migration
export function parseMeshFromParams(_params: URLSearchParams): string[] {
  return [];
}
