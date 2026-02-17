import { useState, useRef, useEffect } from "react";
import { Search, X, Loader2, ChevronDown } from "lucide-react";
import { useMeshConditions } from "@/hooks/useMeshConditions";
import { Badge } from "@/components/ui/badge";

interface MeshConditionSearchProps {
  value: string | null;
  onChange: (value: string | null) => void;
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

  const handleSelect = (term: string) => {
    onChange(term);
    setInputText("");
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
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
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results.length > 0) {
      e.preventDefault();
      handleSelect(results[highlightIndex].mesh_term);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // When selected, show badge; when not, show input
  if (value) {
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Condition (MeSH)
        </label>
        <div className="flex items-center gap-2 min-h-[2.5rem] rounded-md border border-input bg-background px-3 py-1.5">
          <Badge variant="secondary" className="gap-1 text-xs font-normal bg-primary/15 text-primary">
            {value}
            <button onClick={handleClear} className="ml-0.5 hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1" ref={containerRef}>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Condition (MeSH)
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
          placeholder="Search MeSH conditions…"
          className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-8 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-[260px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </div>
            ) : results.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No results
              </div>
            ) : (
              <ul className="py-1">
                {results.map((r, i) => (
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
