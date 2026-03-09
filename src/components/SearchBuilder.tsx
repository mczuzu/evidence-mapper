import { useState, useRef, useEffect } from "react";
import { Search, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { SearchInput, SearchRow, emptySearch } from "@/types/search";
import { supabaseExternal } from "@/lib/supabase-external";

// ── Field config ───────────────────────────────────────────────
const FIELD_TYPES = {
  condition: {
    label: "Condition",
    placeholder: "Search or browse conditions…",
    badgeClass: "bg-blue-50 text-blue-700 border border-blue-200",
    dotClass: "bg-blue-500",
    hint: "MeSH-indexed conditions",
  },
  intervention: {
    label: "Intervention",
    placeholder: "Type a keyword and press Enter...",
    badgeClass: "bg-violet-50 text-violet-700 border border-violet-200",
    dotClass: "bg-violet-500",
    hint: "Search by intervention keyword · press Enter to add",
  },
  freetext: {
    label: "Free text",
    placeholder: "Any term, mechanism, concept…",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
    dotClass: "bg-slate-400",
    hint: "Searches title and abstract",
  },
  phase: {
    label: "Phase",
    placeholder: "Select study phases…",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dotClass: "bg-emerald-500",
    hint: "Filter by clinical trial phase",
  },
  daterange: {
    label: "Results published",
    placeholder: "Year range for results posting…",
    badgeClass: "bg-orange-50 text-orange-700 border border-orange-200",
    dotClass: "bg-orange-500",
    hint: "Filter by results_first_posted_date year",
  },
} as const;

const PHASE_OPTIONS = ["PHASE1", "PHASE2", "PHASE3", "PHASE4", "EARLY_PHASE1", "NA"] as const;

// ── Chip ───────────────────────────────────────────────────────
function Chip({ label, badgeClass, onRemove }: { label: string; badgeClass: string; onRemove: () => void }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium shrink-0 ${badgeClass}`}
    >
      {label}
      <button onClick={onRemove} className="ml-0.5 opacity-40 hover:opacity-80 transition-opacity">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

// ── Operator toggle ────────────────────────────────────────────
function OperatorToggle({
  value,
  onChange,
  isFirst,
}: {
  value: "AND" | "OR";
  onChange: (v: "AND" | "OR") => void;
  isFirst: boolean;
}) {
  if (isFirst)
    return (
      <span className="text-[11px] font-bold text-muted-foreground w-14 text-right shrink-0 pr-1 select-none">
        WHERE
      </span>
    );
  return (
    <div className="flex rounded-lg border border-border overflow-hidden shrink-0 text-[11px] font-bold">
      {(["AND", "OR"] as const).map((op) => (
        <button
          key={op}
          onClick={() => onChange(op)}
          className={`px-2.5 py-1.5 transition-colors ${
            value === op
              ? "bg-indigo text-indigo-foreground"
              : "bg-background text-muted-foreground hover:text-foreground"
          }`}
        >
          {op}
        </button>
      ))}
    </div>
  );
}

// ── Type selector ──────────────────────────────────────────────
function TypeSelector({ value, onChange }: { value: SearchRow["type"]; onChange: (v: SearchRow["type"]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = FIELD_TYPES[value];

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground hover:border-border/80 transition-colors whitespace-nowrap"
      >
        <span className={`w-2 h-2 rounded-full ${cfg.dotClass}`} />
        {cfg.label}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-52 rounded-xl border border-border bg-background shadow-xl overflow-hidden">
          {(Object.entries(FIELD_TYPES) as [SearchRow["type"], (typeof FIELD_TYPES)[keyof typeof FIELD_TYPES]][]).map(
            ([key, fc]) => (
              <button
                key={key}
                onMouseDown={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className={`w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors ${value === key ? "bg-muted" : ""}`}
              >
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${fc.dotClass}`} />
                <div>
                  <p className="text-xs font-semibold text-foreground">{fc.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{fc.hint}</p>
                </div>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

// ── Guided field (condition / intervention) ────────────────────
function GuidedField({
  fieldType,
  terms,
  onAdd,
  onRemove,
}: {
  fieldType: "condition" | "intervention";
  terms: string[];
  onAdd: (t: string) => void;
  onRemove: (i: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{ name: string; n?: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const cfg = FIELD_TYPES[fieldType];

  const fetchSuggestions = async (q: string) => {
    setLoading(true);
    try {
      if (fieldType === "condition") {
        const { data } = await supabaseExternal.rpc("search_mesh_conditions", { q, limit_n: 12 });
        setSuggestions((data || []).map((r: any) => ({ name: r.mesh_term, n: r.n_studies })));
      } else {
        const { data } = await supabaseExternal.rpc("search_interventions", { q, limit_n: 12 });
        setSuggestions((data || []).map((r: any) => ({ name: r.intervention_name, n: r.n_studies })));
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch on open (empty query = top 12)
  useEffect(() => {
    if (open) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fetchSuggestions(query), query ? 220 : 0);
    }
  }, [open, query]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const addTerm = (name: string) => {
    if (name && !terms.map((t) => t.toLowerCase()).includes(name.toLowerCase())) onAdd(name);
    // No reseteamos query — la lista se queda donde está
    inputRef.current?.focus();
  };

  const filtered = suggestions.filter((s) => !terms.map((t) => t.toLowerCase()).includes(s.name.toLowerCase()));

  return (
    <div className="relative flex-1" ref={containerRef}>
      <div
        onClick={() => {
          inputRef.current?.focus();
          setOpen(true);
        }}
        className={`flex flex-wrap items-center gap-1.5 min-h-[2.5rem] rounded-xl border bg-background px-3 py-1.5 cursor-text transition-all ${open ? "border-foreground/30 ring-2 ring-foreground/10" : "border-border hover:border-border/80"}`}
      >
        {terms.map((t, i) => (
          <Chip key={i} label={t} badgeClass={cfg.badgeClass} onRemove={() => onRemove(i)} />
        ))}
        <div className="flex items-center flex-1 min-w-[120px]">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !query && terms.length > 0) onRemove(terms.length - 1);
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter" && filtered.length === 1) {
                e.preventDefault();
                addTerm(filtered[0].name);
              }
            }}
            placeholder={terms.length === 0 ? cfg.placeholder : "Add more…"}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setOpen((o) => !o);
            }}
            className="ml-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 pl-1">{cfg.hint} · click to browse or type to filter</p>

      {open && (
        <div className="absolute top-[calc(100%-4px)] left-0 right-0 z-50 rounded-xl border border-border bg-background shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {loading ? "Loading…" : query ? `${filtered.length} results` : `Top ${filtered.length} · type to filter`}
            </span>
            {query && (
              <button onClick={() => setQuery("")} className="text-[10px] text-muted-foreground hover:text-foreground">
                Clear
              </button>
            )}
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 && !loading ? (
              <p className="px-3 py-3 text-xs text-muted-foreground italic">No matches found</p>
            ) : (
              filtered.map((item, i) => (
                <button
                  key={i}
                  onMouseDown={() => addTerm(item.name)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted transition-colors text-left"
                >
                  <span className="text-sm text-foreground">{item.name}</span>
                  {item.n != null && (
                    <span className="text-[10px] text-muted-foreground font-mono ml-2 shrink-0">
                      {item.n.toLocaleString()} studies
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Free text field ────────────────────────────────────────────
function FreeTextField({
  terms,
  onAdd,
  onRemove,
}: {
  terms: string[];
  onAdd: (t: string) => void;
  onRemove: (i: number) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cfg = FIELD_TYPES.freetext;

  const addTerm = (term: string) => {
    const t = term.trim();
    if (t && !terms.map((x) => x.toLowerCase()).includes(t.toLowerCase())) onAdd(t);
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex-1">
      <div
        onClick={() => inputRef.current?.focus()}
        className="flex flex-wrap items-center gap-1.5 min-h-[2.5rem] rounded-xl border border-border bg-background px-3 py-1.5 cursor-text hover:border-border/80 focus-within:border-foreground/30 focus-within:ring-2 focus-within:ring-foreground/10 transition-all"
      >
        {terms.map((t, i) => (
          <Chip key={i} label={t} badgeClass={cfg.badgeClass} onRemove={() => onRemove(i)} />
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === ",") && query.trim()) {
              e.preventDefault();
              addTerm(query);
            }
            if (e.key === "Backspace" && !query && terms.length > 0) onRemove(terms.length - 1);
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (/[,;\n]/.test(text)) {
              e.preventDefault();
              text
                .split(/[,;\n]/)
                .map((t) => t.trim())
                .filter(Boolean)
                .forEach(addTerm);
            }
          }}
          onBlur={() => query.trim() && addTerm(query)}
          placeholder={terms.length === 0 ? cfg.placeholder : "Add more…"}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 pl-1">
        {cfg.hint} · press Enter or , to add · paste comma-separated lists
      </p>
    </div>
  );
}

// ── Phase field (chip selector) ────────────────────────────────
function PhaseField({
  terms,
  onToggle,
  onRemove,
}: {
  terms: string[];
  onToggle: (t: string) => void;
  onRemove: (i: number) => void;
}) {
  const cfg = FIELD_TYPES.phase;
  return (
    <div className="flex-1">
      <div className="flex flex-wrap items-center gap-1.5 min-h-[2.5rem] rounded-xl border border-border bg-background px-3 py-1.5 transition-all">
        {PHASE_OPTIONS.map((phase) => {
          const active = terms.includes(phase);
          return (
            <button
              key={phase}
              onClick={() => onToggle(phase)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                active
                  ? cfg.badgeClass
                  : "bg-muted/50 text-muted-foreground border border-transparent hover:bg-muted"
              }`}
            >
              {phase.replace("_", " ")}
              {active && (
                <X className="h-3 w-3 opacity-40 hover:opacity-80" />
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 pl-1">{cfg.hint} · click to toggle</p>
    </div>
  );
}

// ── Date range field ───────────────────────────────────────────
const YEAR_OPTIONS = Array.from({ length: 15 }, (_, i) => 2012 + i); // 2012–2026

function DateRangeField({
  terms,
  onChange,
}: {
  terms: string[];
  onChange: (terms: string[]) => void;
}) {
  const fromYear = terms[0] ? parseInt(terms[0]) : 2018;
  const toYear = terms[1] ? parseInt(terms[1]) : 2026;
  const cfg = FIELD_TYPES.daterange;

  const update = (from: number, to: number) => {
    onChange([from.toString(), to.toString()]);
  };

  return (
    <div className="flex-1">
      <div className="flex items-center gap-3 min-h-[2.5rem] rounded-xl border border-border bg-background px-3 py-1.5 transition-all">
        <span className="text-xs text-muted-foreground shrink-0">From</span>
        <select
          value={fromYear}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            update(v, Math.max(v, toYear));
          }}
          className="bg-transparent text-sm text-foreground border border-border rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-foreground/10"
        >
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground shrink-0">To</span>
        <select
          value={toYear}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            update(Math.min(fromYear, v), v);
          }}
          className="bg-transparent text-sm text-foreground border border-border rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-foreground/10"
        >
          {YEAR_OPTIONS.filter((y) => y >= fromYear).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 pl-1">{cfg.hint}</p>
    </div>
  );
}

// ── Search row ─────────────────────────────────────────────────
function SearchRowComponent({
  row,
  index,
  isOnly,
  onUpdate,
  onRemove,
}: {
  row: SearchRow;
  index: number;
  isOnly: boolean;
  onUpdate: (r: SearchRow) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start gap-2 group">
      <div className="pt-2.5 shrink-0 w-14 flex justify-end">
        <OperatorToggle
          value={row.operator}
          onChange={(op) => onUpdate({ ...row, operator: op })}
          isFirst={index === 0}
        />
      </div>
      <div className="pt-1.5 shrink-0">
        <TypeSelector value={row.type} onChange={(type) => onUpdate({ ...row, type, terms: type === "daterange" ? ["2018", "2026"] : [] })} />
      </div>
      {row.type === "daterange" ? (
        <DateRangeField
          terms={row.terms}
          onChange={(terms) => onUpdate({ ...row, terms })}
        />
      ) : row.type === "phase" ? (
        <PhaseField
          terms={row.terms}
          onToggle={(t) => {
            const newTerms = row.terms.includes(t) ? row.terms.filter((x) => x !== t) : [...row.terms, t];
            onUpdate({ ...row, terms: newTerms });
          }}
          onRemove={(i) => onUpdate({ ...row, terms: row.terms.filter((_, idx) => idx !== i) })}
        />
      ) : row.type === "freetext" ? (
        <FreeTextField
          terms={row.terms}
          onAdd={(t) => onUpdate({ ...row, terms: [...row.terms, t] })}
          onRemove={(i) => onUpdate({ ...row, terms: row.terms.filter((_, idx) => idx !== i) })}
        />
      ) : (
        <GuidedField
          fieldType={row.type as "condition" | "intervention"}
          terms={row.terms}
          onAdd={(t) => onUpdate({ ...row, terms: [...row.terms, t] })}
          onRemove={(i) => onUpdate({ ...row, terms: row.terms.filter((_, idx) => idx !== i) })}
        />
      )}
      {!isOnly && (
        <button
          onClick={onRemove}
          className="mt-2.5 p-1.5 rounded-lg text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted transition-all opacity-0 group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
let rowId = 10;

interface SearchBuilderProps {
  value: SearchInput;
  onChange: (v: SearchInput) => void;
  objective?: string;
}

export function SearchBuilder({ value, onChange, objective }: SearchBuilderProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiApplied, setAiApplied] = useState(false);

  const rows = value.rows;
  const setRows = (rows: SearchRow[]) => onChange({ rows });

  const addRow = () => setRows([...rows, { id: ++rowId, type: "freetext", terms: [], operator: "AND" }]);
  const updateRow = (id: number, u: SearchRow) => setRows(rows.map((r) => (r.id === id ? u : r)));
  const removeRow = (id: number) => setRows(rows.filter((r) => r.id !== id));

  const handleGenerate = async () => {
    if (!objective?.trim()) return;
    setIsGenerating(true);
    try {
      // TODO: replace with real Claude API call
      await new Promise((r) => setTimeout(r, 1400));
      // Placeholder strategy — real implementation calls Claude API
      setRows([
        { id: ++rowId, type: "condition", terms: [], operator: "AND" },
        { id: ++rowId, type: "intervention", terms: [], operator: "AND" },
        { id: ++rowId, type: "freetext", terms: [], operator: "AND" },
      ]);
      setAiApplied(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const hasTerms = rows.some((r) => r.terms.length > 0);
  const queryPreview = rows
    .filter((r) => r.terms.length > 0)
    .map((r, i) => {
      const terms = r.terms.length > 1 ? `(${r.terms.join(" OR ")})` : r.terms[0];
      const type = r.type === "freetext" ? "TEXT" : r.type.slice(0, 4).toUpperCase();
      return `${i > 0 ? ` ${r.operator} ` : ""}[${type}] ${terms}`;
    })
    .join("");

  return (
    <div className="space-y-4">
      {/* Header legend */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        {Object.entries(FIELD_TYPES).map(([k, fc]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${fc.dotClass}`} />
            {fc.label}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-4">
        {rows.map((row, i) => (
          <SearchRowComponent
            key={row.id}
            row={row}
            index={i}
            isOnly={rows.length === 1}
            onUpdate={(u) => updateRow(row.id, u)}
            onRemove={() => removeRow(row.id)}
          />
        ))}
      </div>

      {/* Add field */}
      <button
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pl-[4.5rem]"
      >
        <Plus className="h-3.5 w-3.5" /> Add search field
      </button>

      {/* Query preview */}
      {queryPreview && (
        <div className="px-3 py-2.5 rounded-xl bg-muted/30 border border-border">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Query preview</p>
          <code className="text-xs text-muted-foreground break-all leading-relaxed">{queryPreview}</code>
        </div>
      )}
    </div>
  );
}
