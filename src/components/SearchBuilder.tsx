import { useState, useRef, useEffect } from "react";
import { Search, Plus, X, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
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
    placeholder: "Search or browse interventions…",
    badgeClass: "bg-violet-50 text-violet-700 border border-violet-200",
    dotClass: "bg-violet-500",
    hint: "Interventions in the database",
  },
  freetext: {
    label: "Free text",
    placeholder: "Any term, mechanism, concept…",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
    dotClass: "bg-slate-400",
    hint: "Searches title and abstract",
  },
} as const;

// ── Chip ───────────────────────────────────────────────────────
function Chip({ label, badgeClass, onRemove }: { label: string; badgeClass: string; onRemove: () => void }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium shrink-0 ${badgeClass}`}>
      {label}
      <button onClick={onRemove} className="ml-0.5 opacity-40 hover:opacity-80 transition-opacity">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

// ── Operator toggle ────────────────────────────────────────────
function OperatorToggle({ value, onChange, isFirst }: { value: "AND" | "OR"; onChange: (v: "AND" | "OR") => void; isFirst: boolean }) {
  if (isFirst) return <span className="text-[11px] font-bold text-muted-foreground w-14 text-right shrink-0 pr-1 select-none">WHERE</span>;
  return (
    <div className="flex rounded-lg border border-border overflow-hidden shrink-0 text-[11px] font-bold">
      {(["AND", "OR"] as const).map(op => (
        <button key={op} onClick={() => onChange(op)}
          className={`px-2.5 py-1.5 transition-colors ${value === op
            ? op === "AND" ? "bg-foreground text-background" : "bg-amber-500 text-white"
            : "bg-background text-muted-foreground hover:text-foreground"}`}>
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
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground hover:border-border/80 transition-colors whitespace-nowrap">
        <span className={`w-2 h-2 rounded-full ${cfg.dotClass}`} />
        {cfg.label}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-52 rounded-xl border border-border bg-background shadow-xl overflow-hidden">
          {(Object.entries(FIELD_TYPES) as [SearchRow["type"], typeof FIELD_TYPES[keyof typeof FIELD_TYPES]][]).map(([key, fc]) => (
            <button key={key} onMouseDown={() => { onChange(key); setOpen(false); }}
              className={`w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors ${value === key ? "bg-muted" : ""}`}>
              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${fc.dotClass}`} />
              <div>
                <p className="text-xs font-semibold text-foreground">{fc.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{fc.hint}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Guided field (condition / intervention) ────────────────────
function GuidedField({ fieldType, terms, onAdd, onRemove }: {
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
    const h = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const addTerm = (name: string) => {
    if (name && !terms.map(t => t.toLowerCase()).includes(name.toLowerCase())) onAdd(name);
    setQuery("");
    inputRef.current?.focus();
  };

  const filtered = suggestions.filter(s => !terms.map(t => t.toLowerCase()).includes(s.name.toLowerCase()));

  return (
    <div className="relative flex-1" ref={containerRef}>
      <div onClick={() => { inputRef.current?.focus(); setOpen(true); }}
        className={`flex flex-wrap items-center gap-1.5 min-h-[2.5rem] rounded-xl border bg-background px-3 py-1.5 cursor-text transition-all ${open ? "border-foreground/30 ring-2 ring-foreground/10" : "border-border hover:border-border/80"}`}>
        {terms.map((t, i) => <Chip key={i} label={t} badgeClass={cfg.badgeClass} onRemove={() => onRemove(i)} />)}
        <div className="flex items-center flex-1 min-w-[120px]">
          <input ref={inputRef} value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={e => {
              if (e.key === "Backspace" && !query && terms.length > 0) onRemove(terms.length - 1);
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter" && filtered.length === 1) { e.preventDefault(); addTerm(filtered[0].name); }
            }}
            placeholder={terms.length === 0 ? cfg.placeholder : "Add more…"}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          <button onMouseDown={e => { e.preventDefault(); setOpen(o => !o); }}
            className="ml-1 text-muted-foreground hover:text-foreground transition-colors shrink-0">
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
            {query && <button onClick={() => setQuery("")} className="text-[10px] text-muted-foreground hover:text-foreground">Clear</button>}
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 && !loading
              ? <p className="px-3 py-3 text-xs text-muted-foreground italic">No matches found</p>
              : filtered.map((item, i) => (
                <button key={i} onMouseDown={() => addTerm(item.name)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted transition-colors text-left">
                  <span className="text-sm text-foreground">{item.name}</span>
                  {item.n != null && <span className="text-[10px] text-muted-foreground font-mono ml-2 shrink-0">{item.n.toLocaleString()} studies</span>}
                </button>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ── Free text field ────────────────────────────────────────────
function FreeTextField({ terms, onAdd, onRemove }: { terms: string[]; onAdd: (t: string) => void; onRemove: (i: number) => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cfg = FIELD_TYPES.freetext;

  const addTerm = (term: string) => {
    const t = term.trim();
    if (t && !terms.map(x => x.toLowerCase()).includes(t.toLowerCase())) onAdd(t);
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex-1">
      <div onClick={() => inputRef.current?.focus()}
        className="flex flex-wrap items-center gap-1.5 min-h-[2.5rem] rounded-xl border border-border bg-background px-3 py-1.5 cursor-text hover:border-border/80 focus-within:border-foreground/30 focus-within:ring-2 focus-within:ring-foreground/10 transition-all">
        {terms.map((t, i) => <Chip key={i} label={t} badgeClass={cfg.badgeClass} onRemove={() => onRemove(i)} />)}
        <input ref={inputRef} value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if ((e.key === "Enter" || e.key === ",") && query.trim()) { e.preventDefault(); addTerm(query); }
            if (e.key === "Backspace" && !query && terms.length > 0) onRemove(terms.length - 1);
          }}
          onPaste={e => {
            const text = e.clipboardData.getData("text");
            if (/[,;\n]/.test(text)) { e.preventDefault(); text.split(/[,;\n]/).map(t => t.trim()).filter(Boolean).forEach(addTerm); }
          }}
          onBlur={() => query.trim() && addTerm(query)}
          placeholder={terms.length === 0 ? cfg.placeholder : "Add more…"}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 pl-1">
        {cfg.hint} · press Enter or , to add · paste comma-separated lists
      </p>
    </div>
  );
}

// ── Search row ─────────────────────────────────────────────────
function SearchRowComponent({ row, index, isOnly, onUpdate, onRemove }: {
  row: SearchRow; index: number; isOnly: boolean;
  onUpdate: (r: SearchRow) => void; onRemove: () => void;
}) {
  return (
    <div className="flex items-start gap-2 group">
      <div className="pt-2.5 shrink-0 w-14 flex justify-end">
        <OperatorToggle value={row.operator} onChange={op => onUpdate({ ...row, operator: op })} isFirst={index === 0} />
      </div>
      <div className="pt-1.5 shrink-0">
        <TypeSelector value={row.type} onChange={type => onUpdate({ ...row, type, terms: [] })} />
      </div>
      {row.type ==
