import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { SearchSummary } from "@/components/SearchSummary";
import { SearchBuilder } from "@/components/SearchBuilder";
import { useSearchCounts } from "@/hooks/useSearchCounts";
import { SearchInput, emptySearch, paramsToSearch, searchToParams, isSearchActive } from "@/types/search";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ArrowLeft, Check, Pencil, Sparkles } from "lucide-react";
import { EXAMPLE_OBJECTIVE, EXAMPLE_SEARCH } from "@/lib/example-search";

type Step = 1 | 2 | 3;

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

function CompletedBar({
  stepNum,
  summary,
  onEdit,
}: {
  stepNum: number;
  summary: string;
  onEdit: () => void;
}) {
  return (
    <div
      className="w-full flex items-center gap-3 px-5 py-2.5"
      style={{ backgroundColor: "#f5f5f5", minHeight: 40 }}
    >
      <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "#888" }}>
        <Check className="h-3.5 w-3.5" />
        Step {stepNum}
      </span>
      <span className="text-xs truncate flex-1" style={{ color: "#555" }}>
        {summary}
      </span>
      <button
        onClick={onEdit}
        className="inline-flex items-center gap-1 text-xs hover:underline"
        style={{ color: "#888" }}
      >
        <Pencil className="h-3 w-3" />
        Edit
      </button>
    </div>
  );
}

function buildQueryPreview(search: SearchInput): string {
  const parts = search.rows
    .filter((r) => r.terms.length > 0)
    .map((r) => {
      const label = r.type === "daterange" ? "date" : r.type;
      return `${label}: ${r.terms.join(", ")}`;
    });
  return parts.join(" · ") || "No filters";
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

  const queryPreview = useMemo(() => buildQueryPreview(search), [search]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Completed step bars */}
      {step >= 2 && (
        <CompletedBar
          stepNum={1}
          summary={truncate(objective, 60)}
          onEdit={() => setStep(1)}
        />
      )}
      {step >= 3 && (
        <CompletedBar
          stepNum={2}
          summary={truncate(queryPreview, 60)}
          onEdit={() => setStep(2)}
        />
      )}

      {/* ══════════════════════════════════════════════════════════
          STEP 1 — DEFINE YOUR OBJECTIVE
          ══════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-[680px] space-y-8">
            <span className="text-xs" style={{ color: "#999" }}>
              Step 1 of 3
            </span>

            <div className="space-y-3">
              <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground leading-tight">
                What do you want to investigate?
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "#888" }}>
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

            {/* Try an example */}
            <div className="space-y-2">
              <p className="text-xs" style={{ color: "#999" }}>
                Not sure where to start?
              </p>
              <button
                onClick={handleTryExample}
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-colors hover:bg-amber-50"
                style={{
                  borderColor: "rgb(180 83 9 / 0.4)",
                  color: "rgb(180 83 9)",
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Try: Diabetes Type 2 · Metformin · Phase 3
              </button>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!objective.trim()}
              className="w-full max-w-[400px] mx-auto flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: objective.trim() ? "#0a0a0a" : "#0a0a0a",
                color: "#fff",
              }}
            >
              Continue to search
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </main>
      )}

      {/* ══════════════════════════════════════════════════════════
          STEP 2 — BUILD YOUR SEARCH STRATEGY
          ══════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <main className="flex-1 flex flex-col px-6 py-10">
          <div className="w-full max-w-[800px] mx-auto flex-1 space-y-6">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1 text-xs hover:underline"
              style={{ color: "#888" }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to objective
            </button>

            <span className="block text-xs" style={{ color: "#999" }}>
              Step 2 of 3
            </span>

            <div className="space-y-2">
              <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground">
                Build your search strategy
              </h1>
              <p className="text-sm" style={{ color: "#888" }}>
                Filter by condition, intervention, phase and date range. This creates your Bronze dataset — the starting point.
              </p>
            </div>

            <SearchBuilder value={search} onChange={setSearch} objective={objective} />

            {/* Count preview */}
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
              className="w-full max-w-[400px] mx-auto flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#0a0a0a", color: "#fff" }}
            >
              {hasSearch && !isLoading && totalCount > 0
                ? `View ${totalCount.toLocaleString()} matching studies`
                : "View matching studies"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </main>
      )}

      {/* ══════════════════════════════════════════════════════════
          STEP 3 — DATASET BRONZE
          ══════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <main className="flex-1 flex flex-col px-6 py-10">
          <div className="w-full max-w-[900px] mx-auto flex-1 space-y-6">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1 text-xs hover:underline"
              style={{ color: "#888" }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to filters
            </button>

            <span className="block text-xs" style={{ color: "#999" }}>
              Step 3 of 3
            </span>

            <div className="space-y-2">
              <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground">
                Your Bronze dataset
              </h1>
              <p className="text-sm" style={{ color: "#888" }}>
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

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleViewDataset}
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
                  style={{ backgroundColor: "#0a0a0a", color: "#fff" }}
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

            {/* Existing SearchSummary for the detailed per-row counts */}
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
        </main>
      )}
    </div>
  );
};

export default Index;
