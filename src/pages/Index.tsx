import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { SearchSummary } from "@/components/SearchSummary";
import { SearchBuilder } from "@/components/SearchBuilder";
import { useSearchCounts } from "@/hooks/useSearchCounts";
import { SearchInput, emptySearch, paramsToSearch, searchToParams, isSearchActive } from "@/types/search";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowRight, ArrowLeft, Check, Pencil, Sparkles } from "lucide-react";
import { EXAMPLE_OBJECTIVE, EXAMPLE_SEARCH } from "@/lib/example-search";

type Step = 1 | 2 | 3;

const PIPELINE_STEPS = [
  { num: 1, label: "Objective" },
  { num: 2, label: "Filters" },
  { num: 3, label: "Bronze" },
  { num: 4, label: "Silver" },
  { num: 5, label: "Gold" },
  { num: 6, label: "Report" },
];

function PipelineTracker({ currentStep }: { currentStep: Step }) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="sticky top-0 z-30 w-full bg-background border-b border-border">
        <div className="max-w-[700px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between relative">
            {/* Connecting line */}
            <div
              className="absolute top-4 left-4 right-4 h-px"
              style={{ backgroundColor: "hsl(var(--border))" }}
            />
            {PIPELINE_STEPS.map((s) => {
              const isComplete = s.num < currentStep;
              const isCurrent = s.num === currentStep;
              const isFuture = s.num > currentStep && s.num > 3;
              const isReachable = s.num <= 3 && s.num > currentStep;

              const circle = (
                <div className="relative flex flex-col items-center gap-1.5 z-10">
                  <div
                    className="flex items-center justify-center rounded-full text-xs font-semibold transition-all"
                    style={{
                      width: 32,
                      height: 32,
                      backgroundColor:
                        isComplete || isCurrent
                          ? "hsl(var(--foreground))"
                          : "hsl(var(--background))",
                      color:
                        isComplete || isCurrent
                          ? "hsl(var(--background))"
                          : "hsl(var(--muted-foreground))",
                      border:
                        isComplete || isCurrent
                          ? "none"
                          : "1.5px solid hsl(var(--border))",
                      boxShadow: isCurrent
                        ? "0 0 0 3px hsl(var(--background)), 0 0 0 5px hsl(var(--foreground) / 0.3)"
                        : "none",
                    }}
                  >
                    {isComplete ? <Check className="h-3.5 w-3.5" /> : s.num}
                  </div>
                  <span
                    className="text-[10px] font-medium leading-none"
                    style={{
                      color:
                        isComplete || isCurrent
                          ? "hsl(var(--foreground))"
                          : "hsl(var(--muted-foreground))",
                      fontWeight: isComplete || isCurrent ? 600 : 400,
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              );

              if (isFuture) {
                return (
                  <Tooltip key={s.num}>
                    <TooltipTrigger asChild>{circle}</TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Available after completing this step
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={s.num}>{circle}</div>;
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function CompletedBar({
  label,
  summary,
  onEdit,
}: {
  label: string;
  summary: string;
  onEdit: () => void;
}) {
  return (
    <div className="w-full flex items-center gap-3 px-5 py-2.5 bg-muted" style={{ minHeight: 40 }}>
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Check className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="text-xs truncate flex-1" style={{ color: "hsl(var(--foreground) / 0.65)" }}>
        {summary}
      </span>
      <button
        onClick={onEdit}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
      >
        <Pencil className="h-3 w-3" />
        Edit
      </button>
    </div>
  );
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

const Index = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initObjective = searchParams.get("objective") || "";
  const [search, setSearch] = useState<SearchInput>(paramsToSearch(searchParams));
  const [objective, setObjective] = useState<string>(initObjective);
  const [step, setStep] = useState<Step>(
    initObjective && isSearchActive(paramsToSearch(searchParams)) ? 2 : 1
  );

  const { data: counts, isLoading, error } = useSearchCounts({ search });

  const hasSearch = isSearchActive(search);
  const totalCount = counts?.intersectionTotal ?? 0;

  const activeFilterCount = search.rows.filter((r) => r.terms.length > 0).length;

  const handleTryExample = () => {
    setObjective(EXAMPLE_OBJECTIVE);
    setSearch(EXAMPLE_SEARCH);
    setStep(2);
  };

  const handleViewDataset = () => {
    const params = searchToParams(search);
    params.set("objective", objective.trim());
    navigate(`/dataset?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <PipelineTracker currentStep={step} />

      {/* Completed step bars */}
      {step >= 2 && (
        <CompletedBar
          label="Objective defined"
          summary={truncate(objective, 55)}
          onEdit={() => setStep(1)}
        />
      )}
      {step >= 3 && (
        <CompletedBar
          label={`${activeFilterCount} filters active · ${isLoading ? "…" : totalCount.toLocaleString()} studies found`}
          summary=""
          onEdit={() => setStep(2)}
        />
      )}

      {/* STEP 1 — DEFINE YOUR OBJECTIVE */}
      {step === 1 && (
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-[680px] space-y-8">
            <div className="space-y-3">
              <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground leading-tight">
                What do you want to investigate?
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Your objective guides AI filtering and the final evidence report. Be specific about the condition, intervention, and what you want to know.
              </p>
            </div>

            <Textarea
              placeholder="E.g.: Evaluate the efficacy of nutritional interventions to improve muscle mass in elderly patients with sarcopenia..."
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={4}
              className="resize-none text-sm"
            />

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Not sure where to start?</p>
              <button
                onClick={handleTryExample}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-700/40 text-amber-700 px-4 py-2 text-xs font-medium transition-colors hover:bg-amber-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Try: Diabetes Type 2 · Metformin · Phase 3
              </button>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!objective.trim()}
              className="w-full max-w-[400px] mx-auto flex items-center justify-center gap-2 rounded-lg bg-foreground text-background px-6 py-3.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue to search
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </main>
      )}

      {/* STEP 2 — BUILD YOUR SEARCH STRATEGY */}
      {step === 2 && (
        <main className="flex-1 flex flex-col px-6 py-10">
          <div className="w-full max-w-[800px] mx-auto flex-1 space-y-6">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to objective
            </button>

            <div className="space-y-2">
              <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground">
                Build your search strategy
              </h1>
              <p className="text-sm text-muted-foreground">
                Filter by condition, intervention, phase and date range. This creates your Bronze dataset — the starting point.
              </p>
            </div>

            <SearchBuilder value={search} onChange={setSearch} objective={objective} />

            {hasSearch && (
              <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                <div className="flex-1">
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">Counting studies…</p>
                  ) : error ? (
                    <p className="text-sm text-destructive">Error: {error.message}</p>
                  ) : (
                    <p className="text-sm text-foreground">
                      <span className="text-2xl font-bold tabular-nums">{totalCount.toLocaleString()}</span>
                      <span className="ml-2 text-muted-foreground">studies match your criteria</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(3)}
              disabled={!hasSearch || totalCount === 0}
              className="w-full max-w-[400px] mx-auto flex items-center justify-center gap-2 rounded-lg bg-foreground text-background px-6 py-3.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {hasSearch && !isLoading && totalCount > 0
                ? `View ${totalCount.toLocaleString()} matching studies`
                : "View matching studies"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </main>
      )}

      {/* STEP 3 — DATASET BRONZE */}
      {step === 3 && (
        <main className="flex-1 flex flex-col px-6 py-10">
          <div className="w-full max-w-[900px] mx-auto flex-1 space-y-6">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to filters
            </button>

            <div className="space-y-2">
              <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground">
                Your Bronze dataset
              </h1>
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? "Counting studies…"
                  : `${totalCount.toLocaleString()} studies match your search criteria`}
              </p>
            </div>

            {/* Bronze info panel */}
            <div className="rounded-xl border border-border bg-muted/20 px-6 py-5 space-y-4">
              <div className="rounded-lg border border-border bg-background/50 p-4 text-sm text-muted-foreground">
                <p>
                  This is your raw dataset. These studies match your search criteria but may include noise — studies that mention your terms without actually addressing your question.
                </p>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Clicking 'Remove noise with AI' starts Process 2: AI will read each abstract and keep only the studies that actually answer your objective.
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleViewDataset}
                  className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-medium transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  Remove noise with AI →
                </button>
                <button
                  onClick={handleViewDataset}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  I'll select manually
                </button>
              </div>
            </div>

            {error ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-destructive">Error loading studies: {error.message}</p>
              </div>
            ) : null}
          </div>
        </main>
      )}
    </div>
  );
};

export default Index;
