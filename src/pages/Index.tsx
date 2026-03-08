import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { SearchSummary } from "@/components/SearchSummary";
import { SearchBuilder } from "@/components/SearchBuilder";
import { useSearchCounts } from "@/hooks/useSearchCounts";
import { SearchInput, emptySearch, paramsToSearch, searchToParams } from "@/types/search";
import { Textarea } from "@/components/ui/textarea";
import { Target, Lightbulb } from "lucide-react";
import { EXAMPLE_OBJECTIVE, EXAMPLE_SEARCH } from "@/lib/example-search";

const Index = () => {
  const [searchParams] = useSearchParams();
  const initObjective = searchParams.get("objective") || "";
  const [search, setSearch] = useState<SearchInput>(paramsToSearch(searchParams));
  const [objective, setObjective] = useState<string>(initObjective);

  const { data: counts, isLoading, error } = useSearchCounts({ search });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Step 1 — Objective */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Define your objective</h2>
            </div>
            <p className="text-sm text-muted-foreground pl-8">
              Before exploring the evidence, define what you want to investigate. Your objective will guide intelligent filtering and the final analysis.
            </p>
            <div className="pl-8">
              <Textarea
                placeholder="E.g.: Evaluate the efficacy of nutritional interventions to improve muscle mass in elderly patients with sarcopenia..."
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
              {objective.trim().length > 0 && (
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Target className="h-3 w-3 text-primary" />
                  Objective defined · {objective.trim().length} characters
                </p>
              )}
              {objective.trim().length === 0 && (
                <p className="text-xs text-amber-600 mt-1.5">
                  An objective is required to access the dataset and analysis.
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Step 2 — Search strategy */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Filter the evidence</h2>
            </div>
            <p className="text-sm text-muted-foreground pl-8">
              Build your search strategy using conditions, interventions, or free text. This will be your{" "}
              <span className="font-medium text-foreground">Bronze dataset</span> — the starting point.
            </p>
            <div className="pl-8">
              <SearchBuilder value={search} onChange={setSearch} objective={objective} />
              {!search.rows.some((r) => r.terms.length > 0) && (
                <button
                  onClick={() => {
                    setObjective(EXAMPLE_OBJECTIVE);
                    setSearch(EXAMPLE_SEARCH);
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  Try an example
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Step 3 — Results */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Dataset Bronze</h2>
            </div>
            <p className="text-sm text-muted-foreground pl-8">
              Studies matching your search criteria. Access the dataset to filter and validate them before analysis.
            </p>
            <div className="pl-8">
              {error ? (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm text-destructive">Error loading studies: {error.message}</p>
                </div>
              ) : (
                <SearchSummary
                  counts={counts}
                  isLoading={isLoading}
                  search={search}
                  selectedMeshConditions={[]}
                  selectedLabels={[]}
                  selectedParamTypes={[]}
                  objective={objective}
                />
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Index;
