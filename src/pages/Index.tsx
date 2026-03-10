import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { SearchBuilder } from "@/components/SearchBuilder";
import { useSearchCounts } from "@/hooks/useSearchCounts";
import { SearchInput, emptySearch, paramsToSearch, searchToParams, isSearchActive } from "@/types/search";
import { Textarea } from "@/components/ui/textarea";
import { PipelineTracker } from "@/components/PipelineTracker";
import { ArrowRight, ArrowLeft, Check, Pencil, Sparkles, Loader2, X, CheckSquare } from "lucide-react";
import { EXAMPLE_OBJECTIVE, EXAMPLE_SEARCH } from "@/lib/example-search";

type Step = 1 | 2 | 3;

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

// ── Example filter animation banner ────────────────────────────
function ExampleBanner({
  phase,
  onDismiss,
}: {
  phase: "loading" | "done";
  onDismiss: () => void;
}) {
  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-light px-5 py-4 space-y-3 relative">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-indigo/40 hover:text-indigo transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-indigo shrink-0" />
        <span className="text-sm font-medium text-indigo-dark">
          {phase === "loading"
            ? "Building your search strategy from the objective..."
            : "✓ Search strategy built from your objective. Feel free to edit any filter."}
        </span>
      </div>
      {/* Animated loading bar */}
      <div className="h-1 w-full rounded-full bg-indigo/20 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ease-linear ${
            phase === "loading"
              ? "bg-indigo animate-[example-bar_2.8s_ease-in-out_forwards]"
              : "bg-indigo w-full"
          }`}
          style={phase === "done" ? { width: "100%" } : undefined}
        />
      </div>
    </div>
  );
}

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initObjective = searchParams.get("objective") || "";
  const tryExampleParam = searchParams.get("tryExample") === "1";
  const [search, setSearch] = useState<SearchInput>(paramsToSearch(searchParams));
  const [objective, setObjective] = useState<string>(initObjective);
  const [step, setStep] = useState<Step>(
    initObjective && isSearchActive(paramsToSearch(searchParams)) ? 2 : 1
  );
  const [isTyping, setIsTyping] = useState(false);
  const [cameFromExample, setCameFromExample] = useState(false);

  // Example filter animation state
  const [exampleAnimating, setExampleAnimating] = useState(false);
  const [visibleExampleRows, setVisibleExampleRows] = useState(0);
  const [exampleBannerPhase, setExampleBannerPhase] = useState<"loading" | "done" | null>(null);
  const animTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const { data: counts, isLoading, error } = useSearchCounts({ search });

  const hasSearch = isSearchActive(search);
  const totalCount = counts?.intersectionTotal ?? 0;

  const activeFilterCount = search.rows.filter((r) => r && r.terms.length > 0).length;

  const handleTryExample = useCallback(() => {
    if (isTyping) return;
    setIsTyping(true);
    setCameFromExample(true);

    let i = 0;
    const text = EXAMPLE_OBJECTIVE;
    setObjective("");
    const interval = setInterval(() => {
      i++;
      setObjective(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 18);
  }, [isTyping]);

  // Auto-trigger example when arriving from WelcomePage with ?tryExample=1
  useEffect(() => {
    if (tryExampleParam && !objective) {
      setSearchParams({}, { replace: true });
      handleTryExample();
    }
  }, [tryExampleParam, handleTryExample]);

  // Clean up animation timers
  useEffect(() => {
    return () => animTimers.current.forEach(clearTimeout);
  }, []);

  const startExampleAnimation = useCallback(() => {
    // Start with empty search
    setSearch(emptySearch());
    setExampleAnimating(true);
    setVisibleExampleRows(0);
    setExampleBannerPhase("loading");

    const exampleRows = EXAMPLE_SEARCH.rows;

    // Animate each row in sequence
    const delays = [600, 1200, 1800];
    delays.forEach((delay, idx) => {
      const t = setTimeout(() => {
        setSearch((prev) => {
          const newRows = idx === 0
            ? [exampleRows[0]]
            : [...prev.rows.filter(r => r.terms.length > 0), exampleRows[idx]];
          // Also keep any empty rows needed
          return { rows: newRows };
        });
        setVisibleExampleRows(idx + 1);
      }, delay);
      animTimers.current.push(t);
    });

    // Complete animation
    const doneTimer = setTimeout(() => {
      setExampleBannerPhase("done");
      setExampleAnimating(false);
    }, 2800);
    animTimers.current.push(doneTimer);
  }, []);

  const handleContinueToSearch = () => {
    if (cameFromExample) {
      setStep(2);
      // Start the filter animation after step transition
      setTimeout(() => startExampleAnimation(), 50);
    } else {
      setStep(2);
    }
  };

  const handleViewDataset = () => {
    const params = searchToParams(search);
    params.set("objective", objective.trim());
    navigate(`/dataset?${params.toString()}`);
  };

  const handleDismissBanner = () => {
    setExampleBannerPhase(null);
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
          onEdit={() => {
            setStep(1);
            setExampleBannerPhase(null);
            setExampleAnimating(false);
            animTimers.current.forEach(clearTimeout);
          }}
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
              placeholder="E.g.: What does the evidence say about SGLT2 inhibitors for cardiovascular outcomes in heart failure patients?"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={4}
              className="resize-none text-sm"
            />

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Not sure where to start?</p>
              <button
                onClick={handleTryExample}
                disabled={isTyping}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo text-indigo px-4 py-2 text-xs font-medium transition-colors hover:bg-indigo-light disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTyping ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Try: Heart failure · SGLT2 inhibitors · Cardiovascular outcomes
              </button>
            </div>

            <button
              onClick={handleContinueToSearch}
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
              onClick={() => {
                setStep(1);
                setExampleBannerPhase(null);
                setExampleAnimating(false);
                animTimers.current.forEach(clearTimeout);
              }}
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

            {/* Example animation banner */}
            {exampleBannerPhase && (
              <ExampleBanner phase={exampleBannerPhase} onDismiss={handleDismissBanner} />
            )}

            <SearchBuilder value={search} onChange={(s) => {
              setSearch(s);
              // If user edits, dismiss the banner
              if (exampleBannerPhase === "done") {
                setExampleBannerPhase(null);
                setCameFromExample(false);
              }
            }} objective={objective} />

            {hasSearch && (
              <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                <div className="flex-1">
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Counting studies…
                    </p>
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

            {hasSearch && !isLoading && totalCount > 0 && (
              <div className="space-y-3 w-full max-w-[520px] mx-auto">
                <p className="text-center text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground tabular-nums">{totalCount.toLocaleString()}</span> studies found · How do you want to proceed?
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const params = searchToParams(search);
                      params.set("objective", objective.trim());
                      params.set("autoStartAI", "1");
                      navigate(`/dataset?${params.toString()}`);
                    }}
                    disabled={exampleAnimating}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-foreground text-background px-5 py-3 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="h-4 w-4" />
                    Remove noise with AI →
                  </button>
                  <button
                    onClick={() => {
                      const params = searchToParams(search);
                      params.set("objective", objective.trim());
                      params.set("autoStartManual", "1");
                      navigate(`/dataset?${params.toString()}`);
                    }}
                    disabled={exampleAnimating}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CheckSquare className="h-4 w-4" />
                    Select studies manually
                  </button>
                </div>
              </div>
            )}
            {(!hasSearch || isLoading || totalCount === 0) && (
              <button
                disabled
                className="w-full max-w-[400px] mx-auto flex items-center justify-center gap-2 rounded-lg bg-foreground text-background px-6 py-3.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                View matching studies
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
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

      {/* Keyframe for example loading bar */}
      <style>{`
        @keyframes example-bar {
          0% { width: 0%; }
          25% { width: 22%; }
          50% { width: 48%; }
          75% { width: 75%; }
          100% { width: 95%; }
        }
      `}</style>
    </div>
  );
};

export default Index;
