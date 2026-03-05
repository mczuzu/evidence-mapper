import { useState, useRef, useEffect } from "react";
import { Search, X, Loader2, ChevronDown } from "lucide-react";
import { useMeshConditions } from "@/hooks/useMeshConditions";
import { Badge } from "@/components/ui/badge";

interface MeshConditionSearchProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function MeshConditionSearch({ value, onChange }: MeshConditionSearchProps) {
  const [inputText, setInputText] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const { results, isLoading } = useMeshConditions(open ? inputText : "__CLOSED__");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset highlight when results change
  useEffect(() => {
    setHighlightIndex(0);
  }, [results]);

  // Filter out already-selected terms from dropdown
  const selectedSet = new Set(value);
  const filteredResults = results.filter((r) => !selectedSet.has(r.mesh_term));

  const handleSelect = (term: string) => {
    if (!selectedSet.has(term)) {
      onChange([...value, term]);
    }
    setInputText("");
    setOpen(false);
  };

  const handleRemove = (term: string) => {
    onChange(value.filter((v) => v !== term));
  };

  const handleClearAll = () => {
    onChange([]);
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filteredResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filteredResults.length > 0) {
      e.preventDefault();
      handleSelect(filteredResults[highlightIndex].mesh_term);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && inputText === "" && value.length > 0) {
      handleRemove(value[value.length - 1]);
    }
  };

  return (
    <div className="space-y-1" ref={containerRef}>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Condition (MeSH)
      </label>
      <div className="relative">
        <div
          className="flex flex-wrap items-center gap-1.5 min-h-[2.5rem] rounded-md border border-input bg-background px-3 py-1.5 cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          {value.map((term) => (
            <Badge
              key={term}
              variant="secondary"
              className="gap-1 text-xs font-normal bg-primary/15 text-primary shrink-0"
            >
              {term}
              <button onClick={() => handleRemove(term)} className="ml-0.5 hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <div className="flex-1 flex items-center gap-1 min-w-[120px]">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (!open) setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={value.length === 0 ? "Search MeSH conditions…" : "Add another…"}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          {value.length > 0 && (
            <button onClick={handleClearAll} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="h-4 w-4" />
            </button>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground pointer-events-none shrink-0" />
        </div>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-[260px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No results
              </div>
            ) : (
              <ul className="py-1">
                {filteredResults.map((r, i) => (
                  <li
                    key={r.mesh_term}
                    className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                      i === highlightIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted"
                    }`}
                    onMouseEnter={() => setHighlightIndex(i)}
                    onClick={() => handleSelect(r.mesh_term)}
                  >
                    {r.mesh_term}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
