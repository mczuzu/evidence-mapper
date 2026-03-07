import { Loader2, Database, GitMerge, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchCounts } from "@/hooks/useSearchCounts";
import { SearchInput, searchToParams } from "@/types/search";

interface SearchSummaryProps {
  counts: SearchCounts | undefined;
  isLoading: boolean;
  search: SearchInput;
  selectedMeshConditions?: string[];
  selectedLabels?: string[];
  selectedParamTypes?: string[];
  objective: string;
}

export function SearchSummary({
  counts,
  isLoading,
  search,
  selectedLabels = [],
  selectedParamTypes = [],
  objective = "",
}: SearchSummaryProps) {
  const navigate = useNavigate();

  const canViewDataset = objective.trim().length > 0 && (counts?.intersectionTotal ?? 0) > 0;

  const handleViewDataset = () => {
    const params = searchToParams(search);
    if (selectedLabels.length > 0) params.set("labels", selectedLabels.join(","));
    if (selectedParamTypes.length > 0) params.set("paramTypes", selectedParamTypes.join(","));
    params.set("objective", objective.trim());
    navigate(`/dataset?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <span className="ml-3 text-sm text-muted-foreground">Calculating results...</span>
      </div>
    );
  }

  const hasResults = counts && counts.intersectionTotal > 0;
  const hasSearch = search.rows.some((r) => r.terms.length > 0);

  if (!hasSearch) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Add at least one search term to see results.
      </div>
    );
  }

  if (!counts) return null;

  return (
    <div className="space-y-4">
      {/* Per-row counts */}
      {counts.rowCounts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {counts.rowCounts.map((row, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 rounded-lg border p-4 ${
                row.type === "condition"
                  ? "border-blue-500/30 bg-blue-500/5"
                  : row.type === "intervention"
                    ? "border-violet-500/30 bg-violet-500/5"
                    : "border-slate-500/30 bg-slate-500/5"
              }`}
            >
              <Database className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate capitalize">
                  {row.type}: {row.terms.join(" | ")}
                </p>
                <p className="text-2xl font-bold text-foreground tabular-nums">{row.count.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Final intersection + CTA */}
      <div className="flex items-center gap-4 rounded-lg border-2 border-primary/40 bg-primary/5 p-5">
        <div className="text-primary">
          <GitMerge className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Dataset Bronze</p>
          <p className="text-3xl font-bold text-foreground tabular-nums">{counts.intersectionTotal.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">studies matching all active criteria</p>
        </div>

        {hasResults && (
          <div className="flex flex-col items-end gap-2">
            <Button
              onClick={handleViewDataset}
              disabled={!canViewDataset}
              className="gap-2"
              title={!objective.trim() ? "Define your objective first" : undefined}
            >
              View Bronze dataset
              <Badge variant="secondary" className="ml-1 text-xs">
                {counts.intersectionTotal.toLocaleString()}
              </Badge>
            </Button>
            {!objective.trim() && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Define your objective to continue
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
