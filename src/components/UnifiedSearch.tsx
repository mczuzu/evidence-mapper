import { useState, useRef, KeyboardEvent } from "react";
import { Search, X, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UnifiedSearchInput } from "@/types/search";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface UnifiedSearchProps {
  value: UnifiedSearchInput;
  onChange: (value: UnifiedSearchInput) => void;
}

function ChipInput({
  chips,
  onAdd,
  onAddMany,
  onRemove,
  placeholder,
  colorClass,
}: {
  chips: string[];
  onAdd: (term: string) => void;
  onAddMany: (terms: string[]) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  colorClass: string;
}) {
  const [input, setInput] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      onAdd(input.trim().toLowerCase());
      setInput("");
    }
    if (e.key === "Backspace" && !input && chips.length > 0) {
      onRemove(chips.length - 1);
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 min-h-[2.5rem] rounded-md border border-input bg-background px-3 py-1.5 cursor-text"
      onClick={() => ref.current?.focus()}
    >
      {chips.map((chip, i) => (
        <Badge
          key={i}
          variant="secondary"
          className={`gap-1 text-xs font-normal ${colorClass}`}
        >
          {chip}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(i);
            }}
            className="ml-0.5 hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <input
        ref={ref}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData("text");
          if (/[,;\n]/.test(pasted)) {
            e.preventDefault();
            const terms = pasted
              .split(/[,;\n]/)
              .map((t) => t.trim())
            .filter((t) => t.length > 0 && !chips.includes(t));
            if (terms.length > 0) onAddMany(terms);
          }
        }}
        placeholder={chips.length === 0 ? placeholder : "Add term…"}
        className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

export function UnifiedSearch({ value, onChange }: UnifiedSearchProps) {
  const [builderOpen, setBuilderOpen] = useState(
    value.groupA.length > 0 || value.groupB.length > 0
  );

  const hasGroups = value.groupA.length > 0 || value.groupB.length > 0;

  const update = (partial: Partial<UnifiedSearchInput>) => {
    onChange({ ...value, ...partial });
  };

  // Build human-readable logic string
  const logicPreview = (() => {
    const parts: string[] = [];
    if (value.baseQuery.trim()) {
      const tokens = value.baseQuery.trim().split(/\s+/);
      parts.push(tokens.length > 1 ? `(${tokens.join(" AND ")})` : tokens[0]);
    }
    const groupParts: string[] = [];
    if (value.groupA.length > 0) {
      groupParts.push(
        value.groupA.length > 1
          ? `(${value.groupA.join(" OR ")})`
          : value.groupA[0]
      );
    }
    if (value.groupB.length > 0) {
      groupParts.push(
        value.groupB.length > 1
          ? `(${value.groupB.join(" OR ")})`
          : value.groupB[0]
      );
    }
    if (groupParts.length > 0) {
      parts.push(groupParts.join(` ${value.operatorBetweenGroups} `));
    }
    return parts.length > 1 ? parts.join(" AND ") : parts[0] || "";
  })();

  return (
    <div className="space-y-2">
      {/* Main search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={value.baseQuery}
          onChange={(e) => update({ baseQuery: e.target.value })}
          placeholder="Search studies (AND between words)…"
          className="pl-10 pr-10 h-11 bg-card"
        />
        {value.baseQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => update({ baseQuery: "" })}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Guided builder toggle */}
      <Collapsible open={builderOpen} onOpenChange={setBuilderOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            {builderOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            {hasGroups ? "Edit boolean groups" : "Add boolean groups (OR / AND)"}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-2">
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            {/* Group A */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Group A <span className="normal-case font-normal">(OR between terms)</span>
              </label>
              <ChipInput
                chips={value.groupA}
                onAdd={(term) =>
                  update({ groupA: [...value.groupA, term] })
                }
                onAddMany={(terms) =>
                  update({ groupA: [...value.groupA, ...terms] })
                }
                onRemove={(i) =>
                  update({
                    groupA: value.groupA.filter((_, idx) => idx !== i),
                  })
                }
                placeholder="e.g. dialysis, hemodialysis"
                colorClass="bg-primary/10 text-primary"
              />
              <p className="text-[11px] text-muted-foreground/70 leading-snug">
                Tip: If results look narrow, try synonyms/variants (e.g., US/UK spelling). You can generate synonyms with an external LLM and paste them here separated by commas.
              </p>
            </div>

            {/* Operator between groups */}
            {(value.groupA.length > 0 || value.groupB.length > 0) && (
              <div className="flex items-center gap-2 pl-1">
                <div className="flex rounded-md border border-input overflow-hidden">
                  <button
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      value.operatorBetweenGroups === "AND"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => update({ operatorBetweenGroups: "AND" })}
                  >
                    AND
                  </button>
                  <button
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      value.operatorBetweenGroups === "OR"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => update({ operatorBetweenGroups: "OR" })}
                  >
                    OR
                  </button>
                </div>
                <span className="text-xs text-muted-foreground">between groups</span>
              </div>
            )}

            {/* Group B */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Group B <span className="normal-case font-normal">(OR between terms)</span>
              </label>
              <ChipInput
                chips={value.groupB}
                onAdd={(term) =>
                  update({ groupB: [...value.groupB, term] })
                }
                onAddMany={(terms) =>
                  update({ groupB: [...value.groupB, ...terms] })
                }
                onRemove={(i) =>
                  update({
                    groupB: value.groupB.filter((_, idx) => idx !== i),
                  })
                }
                placeholder="e.g. muscle, sarcopenia"
                colorClass="bg-accent text-accent-foreground"
              />
              <p className="text-[11px] text-muted-foreground/70 leading-snug">
                Tip: If results look narrow, try synonyms/variants (e.g., US/UK spelling). You can generate synonyms with an external LLM and paste them here separated by commas.
              </p>
            </div>

            {/* Logic preview */}
            {logicPreview && (
              <div className="pt-1 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Query logic:</span>{" "}
                  <code className="bg-background px-1.5 py-0.5 rounded text-xs">
                    {logicPreview}
                  </code>
                </p>
              </div>
            )}

            {/* Clear groups */}
            {hasGroups && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() =>
                  update({
                    groupA: [],
                    groupB: [],
                    operatorBetweenGroups: "AND",
                  })
                }
              >
                Clear groups
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Logic preview when builder is collapsed but has groups */}
      {!builderOpen && hasGroups && logicPreview && (
        <p className="text-xs text-muted-foreground pl-1">
          <span className="font-medium">Active query:</span>{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
            {logicPreview}
          </code>
        </p>
      )}
    </div>
  );
}
