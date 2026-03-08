import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { PipelineTracker } from "@/components/PipelineTracker";
import {
  ArrowLeft,
  Loader2,
  FlaskConical,
  Eye,
  FileSearch,
  Filter,
  CheckSquare,
  BarChart3,
  GitCompare,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  ChevronRight as ArrowRight,
} from "lucide-react";
import { useEnrichedStudies } from "@/hooks/useEnrichedStudies";
import { HighlightText } from "@/components/HighlightText";
import { TruncatedCell } from "@/components/TruncatedCell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStudies, useAllStudyIds } from "@/hooks/useStudies";
import { useDatasetStudiesByIds } from "@/hooks/useDatasetStudies";
import { paramsToSearch, searchToParams } from "@/types/search";
import { supabaseExternalPublic, EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY } from "@/lib/supabase-external";
import { toast } from "sonner";
import { AnalysisModal, AnalysisContext } from "@/components/analysis/AnalysisModal";
import { RankingModal } from "@/components/ranking/RankingModal";
import { MilestoneToast, type MilestoneToastData } from "@/components/MilestoneToast";

// ── Types ─────────────────────────────────────────────────────────────────────
type DatasetTier = "bronze" | "silver" | "gold";

type RankedStudy = {
  nct_id: string;
  score: number;
  reason: string;
};

type FilterMethod = "ai" | "manual" | null;

// ── Tier badge ────────────────────────────────────────────────────────────────
const TIER_CONFIG = {
  bronze: { label: "Bronze", color: "bg-amber-700/20 text-amber-700 border-amber-700/30" },
  silver: { label: "Silver", color: "bg-slate-400/20 text-slate-500 border-slate-400/30" },
  gold: { label: "Gold", color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30" },
};

function TierBadge({ tier }: { tier: DatasetTier }) {
  const cfg = TIER_CONFIG[tier];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${cfg.color}`}>
      ◆ {cfg.label}
    </span>
  );
}

// ── Step panel ────────────────────────────────────────────────────────────────
function StepPanel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-muted/20 px-6 py-5 space-y-4">{children}</div>;
}

// ── AI filtering loading state ────────────────────────────────────────────
const AI_PROGRESS_MESSAGES = [
  "Analysing study titles...",
  "Reading abstracts...",
  "Checking relevance against your objective...",
  "Filtering noise...",
];

function AIFilteringLoadingState() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % AI_PROGRESS_MESSAGES.length);
        setFade(true);
      }, 200);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Loader2
        className="animate-spin text-indigo"
        style={{ width: 40, height: 40 }}
      />
      <p className="text-lg font-semibold text-foreground">Reading abstracts...</p>
      <p className="text-sm text-muted-foreground">
        AI is filtering studies that don't address your objective
      </p>
      <p
        className="text-sm text-muted-foreground transition-opacity duration-200"
        style={{ opacity: fade ? 1 : 0 }}
      >
        {AI_PROGRESS_MESSAGES[msgIndex]}
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const DatasetPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Objective from URL
  const objective = searchParams.get("objective") || "";
  const autoStartAI = searchParams.get("autoStartAI") === "1";
  const autoStartManual = searchParams.get("autoStartManual") === "1";

  // Dataset tier state
  const [tier, setTier] = useState<DatasetTier>("bronze");
  const [filterMethod, setFilterMethod] = useState<FilterMethod>(autoStartManual ? "manual" : null);

  // Silver: filtered by keywords (AI) or manual selection
  const [silverIds, setSilverIds] = useState<string[] | null>(null);
  const [silverKeywords, setSilverKeywords] = useState<string[]>([]);

  // Gold: ranked/validated by AI
  const [goldResults, setGoldResults] = useState<RankedStudy[] | null>(null);

  // Manual selection (for silver manual path)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Loading states
  const [isFilteringAI, setIsFilteringAI] = useState(false);
  const [isRanking, setIsRanking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Modals
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisError, setAnalysisError] = useState<{ message: string; details?: string } | null>(null);
  const [milestoneToast, setMilestoneToast] = useState<MilestoneToastData | null>(null);

  // Pagination
  const [page, setPage] = useState(0);

  // Column filters
  const [filterAnalyzable, setFilterAnalyzable] = useState<string>("all");
  const [filterComparable, setFilterComparable] = useState<string>("all");

  // URL ids mode
  const idsParam = searchParams.get("ids");
  const specificIds = useMemo(() => idsParam?.split(",").filter(Boolean) || [], [idsParam]);
  const isUrlIdsMode = specificIds.length > 0;

  const search = useMemo(() => paramsToSearch(searchParams), [searchParams]);
  const labels = useMemo(() => searchParams.get("labels")?.split(",").filter(Boolean) || [], [searchParams]);
  const paramTypes = useMemo(() => searchParams.get("paramTypes")?.split(",").filter(Boolean) || [], [searchParams]);
  const meshConditions = useMemo(() => searchParams.get("mesh")?.split(",").filter(Boolean) || [], [searchParams]);

  const onlyAnalyzable = filterAnalyzable === "yes";
  const onlyComparable = filterComparable === "yes";

  const studiesQuery = useStudies({
    search,
    selectedLabels: labels,
    selectedParamTypes: paramTypes,
    selectedMeshConditions: meshConditions,
    page,
    onlyAnalyzable,
    onlyComparable,
  });

  const idsQuery = useDatasetStudiesByIds(isUrlIdsMode ? specificIds : []);

  const [selectAllRequested, setSelectAllRequested] = useState(false);
  const allIdsQuery = useAllStudyIds({
    search,
    selectedLabels: labels,
    selectedMeshConditions: meshConditions,
    enabled: selectAllRequested && !isUrlIdsMode,
  });

  const activeQuery = isUrlIdsMode ? idsQuery : studiesQuery;
  const { data, isLoading, error } = activeQuery;

  const bronzeStudies = data?.studies ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const pageSize = data?.pageSize ?? 20;

  // Derive visible studies based on tier
  const studies = useMemo(() => {
    if (tier === "bronze") return bronzeStudies;

    if (tier === "silver") {
      if (silverIds === null) return bronzeStudies;
      const idSet = new Set(silverIds);
      return bronzeStudies.filter((s) => idSet.has(s.nct_id));
    }

    if (tier === "gold" && goldResults) {
      const scoreMap = new Map(goldResults.map((r) => [r.nct_id, r]));
      return bronzeStudies
        .filter((s) => scoreMap.has(s.nct_id))
        .sort((a, b) => (scoreMap.get(b.nct_id)?.score ?? 0) - (scoreMap.get(a.nct_id)?.score ?? 0));
    }

    return bronzeStudies;
  }, [tier, bronzeStudies, silverIds, goldResults]);

  const visibleNctIds = useMemo(() => studies.map((s) => s.nct_id), [studies]);
  const enrichedQuery = useEnrichedStudies(visibleNctIds);
  const enrichedMap = enrichedQuery.data;

  const highlightTerms = useMemo(() => {
    const terms: string[] = [];
    for (const row of search.rows) {
      for (const t of row.terms) {
        if (t.trim()) {
          terms.push(t.trim());
          if (row.type === "condition") {
            const words = t
              .trim()
              .split(/\s+/)
              .filter((w) => w.length > 2);
            terms.push(...words);
          }
        }
      }
    }
    const seen = new Set<string>();
    return terms.filter((t) => {
      const key = t.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [search]);

  const startIndex = page * pageSize + 1;
  const endIndex = Math.min((page + 1) * pageSize, totalCount);

  useEffect(() => {
    setPage(0);
  }, [filterAnalyzable, filterComparable, search.rows, labels.join(",")]);

  useEffect(() => {
    if (selectAllRequested && allIdsQuery.data && allIdsQuery.data.length > 0) {
      setSelectedIds(new Set(allIdsQuery.data));
      setSelectAllRequested(false);
      toast.success(`${allIdsQuery.data.length} studies selected`);
    }
  }, [selectAllRequested, allIdsQuery.data]);

  // Auto-start AI filtering or manual mode from URL flags
  const [autoStartTriggered, setAutoStartTriggered] = useState(false);
  useEffect(() => {
    if (autoStartTriggered || isLoading || totalCount === 0) return;
    if (autoStartAI && objective && bronzeStudies.length > 0) {
      setAutoStartTriggered(true);
      runAIFilter();
    } else if (autoStartManual) {
      setAutoStartTriggered(true);
    }
  }, [autoStartAI, autoStartManual, isLoading, totalCount, bronzeStudies.length, autoStartTriggered]);


    const params = searchToParams(search);
    if (labels.length > 0) params.set("labels", labels.join(","));
    if (paramTypes.length > 0) params.set("paramTypes", paramTypes.join(","));
    if (objective) params.set("objective", objective);
    const qs = params.toString();
    navigate(qs ? `/search?${qs}` : "/search");
  };

  const handleBack = () => {
    if (isUrlIdsMode) {
      navigate(-1);
    } else if (tier === "gold") {
      setTier("silver");
      setGoldResults(null);
    } else if (tier === "silver") {
      setTier("bronze");
      setSilverIds(null);
      setFilterMethod(null);
      setSelectedIds(new Set());
    } else {
      handleBackToSearch();
    }
  };

  const toggleSelection = (nctId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nctId)) next.delete(nctId);
      else next.add(nctId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allVisibleIds = studies.map((s) => s.nct_id);
    const allSelected = allVisibleIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allVisibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allVisibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const allVisibleSelected = studies.length > 0 && studies.every((s) => selectedIds.has(s.nct_id));
  const someVisibleSelected = studies.some((s) => selectedIds.has(s.nct_id));

  const handleViewStudy = (nctId: string) => navigate(`/study/${nctId}`);

  // ── Filter to Silver with AI ───────────────────────────────────────────────
  const runAIFilter = async () => {
    const nctIds = bronzeStudies.map((s) => s.nct_id);
    if (nctIds.length === 0) return;

    setIsFilteringAI(true);
    setFilterMethod("ai");

    try {
      const url = `${EXTERNAL_SUPABASE_URL}/functions/v1/ia-keywords`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          apikey: EXTERNAL_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${EXTERNAL_SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ objective, nct_ids: nctIds }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "AI filter failed");

      setSilverKeywords(result.keywords ?? []);
      setSilverIds(result.nct_ids_filtered ?? []);
      setTier("silver");

      const filtered = result.total_filtered ?? result.nct_ids_filtered?.length ?? 0;
      const removed = (result.total_input ?? nctIds.length) - filtered;
      setMilestoneToast({
        type: "silver",
        title: "Silver dataset ready",
        subtitle: `${filtered} studies focused on your question`,
        detail: `AI removed ${removed} studies that didn't address your objective`,
        actionLabel: "Score with AI →",
        onAction: () => runGoldValidation(),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error filtering with AI");
      setFilterMethod(null);
    } finally {
      setIsFilteringAI(false);
    }
  };

  // ── Confirm manual Silver ─────────────────────────────────────────────────
  const confirmManualSilver = () => {
    setSilverIds(Array.from(selectedIds));
    setTier("silver");
    setFilterMethod("manual");
    setMilestoneToast({
      type: "silver",
      title: "Silver dataset ready",
      subtitle: `${selectedIds.size} studies selected manually`,
      detail: `You selected ${selectedIds.size} studies from the Bronze dataset`,
      actionLabel: "Score with AI →",
      onAction: () => runGoldValidation(),
    });
  };

  // ── Validate to Gold with AI (ia-ranking) ─────────────────────────────────
  const runGoldValidation = async () => {
    const nctIds = silverIds ?? bronzeStudies.map((s) => s.nct_id);
    if (nctIds.length === 0) return;

    setIsRanking(true);

    try {
      const url = `${EXTERNAL_SUPABASE_URL}/functions/v1/ranking-api`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          apikey: EXTERNAL_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${EXTERNAL_SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nct_ids: nctIds, objective }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "Gold validation failed");
      if (!Array.isArray(result?.ranked)) throw new Error("Invalid response from ranking API");

      if (result.ranked.length === 0) {
        toast.warning("AI found no sufficiently relevant studies. Try a different objective.");
        return;
      }

      setGoldResults(result.ranked);
      setSelectedIds(new Set(result.ranked.map((r: RankedStudy) => r.nct_id)));
      setTier("gold");
      const avgScore = result.ranked.length > 0
        ? (result.ranked.reduce((sum: number, r: RankedStudy) => sum + r.score, 0) / result.ranked.length).toFixed(1)
        : "0";
      setMilestoneToast({
        type: "gold",
        title: "Gold dataset ready",
        subtitle: `${result.ranked.length} studies scored against your objective`,
        detail: `${nctIds.length} studies scored · average score ${avgScore}/10`,
        actionLabel: "Generate report →",
        onAction: () => runAnalysis(),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error validating with AI");
    } finally {
      setIsRanking(false);
    }
  };

  // ── Analysis ──────────────────────────────────────────────────────────────
  const runAnalysis = async (context?: AnalysisContext) => {
    const nctIds = Array.from(selectedIds);
    if (nctIds.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const activeKeywords = search.rows
        .flatMap((r) => r.terms)
        .filter(Boolean);

      const searchMeta = { mesh_terms: meshConditions, keywords: activeKeywords };
      const requestBody: {
        nct_ids: string[];
        objective?: string;
        context?: AnalysisContext;
        search_meta?: typeof searchMeta;
      } = {
        nct_ids: nctIds,
        search_meta: searchMeta,
        ...(objective ? { objective } : {}),
      };

      if (context?.product_idea && context.product_idea.trim().length > 0) {
        requestBody.context = context;
      }

      const url = `${EXTERNAL_SUPABASE_URL}/functions/v1/analyze-direction`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          apikey: EXTERNAL_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${EXTERNAL_SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) throw { message: "Analysis failed", details: result?.error || `HTTP ${response.status}` };
      if (!result) throw { message: "No data returned from analysis" };
      if (typeof result.db_error === "string" && result.db_error)
        throw { message: "Database error", details: result.db_error };
      if (result.error) throw { message: result.error, details: result.details };

      const missing: string[] = Array.isArray(result.missing)
        ? result.missing
            .map((m: any) => (typeof m === "string" ? m : m?.nct_id))
            .filter((x: any) => typeof x === "string")
        : [];

      const isS3 = result.schema_version === "S3";
      const isV3 = result.schema === "v3";
      const available: string[] = isV3
        ? Array.isArray(result.available)
          ? result.available
          : []
        : isS3
          ? Array.isArray(result.study_index)
            ? result.study_index.map((s: any) => s.nct_id)
            : nctIds
          : Object.keys(result.found_paths && typeof result.found_paths === "object" ? result.found_paths : {});

      if (available.length === 0) {
        toast.warning(`No data found for the selected studies.`);
        setShowAnalysisModal(false);
        return;
      }

      if (missing.length > 0) toast.info(`${missing.length} study(ies) with no available data.`);

      const analysisPayload = result.analysis;
      if (!analysisPayload) throw { message: "Missing analysis in response payload" };

      const analysisId = crypto.randomUUID();
      const { error: insertError } = await supabaseExternalPublic.from("analysis_runs").insert({
        id: analysisId,
        nct_ids: available,
        dataset_query: isUrlIdsMode ? null : searchParams.toString(),
        prompt_version: result.prompt_version ?? "v3",
        schema_version: result.schema_version ?? "V3",
        analysis: analysisPayload,
      });

      if (insertError) throw { message: "Failed to save analysis results", details: insertError.message };

      setShowAnalysisModal(false);
      navigate(`/analysis/${analysisId}`, {
        state: {
          run: {
            id: analysisId,
            nct_ids: available,
            analysis: analysisPayload,
            prompt_version: result.prompt_version ?? "v3",
            schema_version: result.schema_version ?? "V3",
          },
        },
      });
    } catch (err) {
      const errorObj = err as { message?: string; details?: string };
      setAnalysisError({
        message: errorObj.message || (err instanceof Error ? err.message : "Failed to analyze studies"),
        details: errorObj.details,
      });
      toast.error(errorObj.message || "Failed to analyze studies");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Pipeline step mapping ───────────────────────────────────────────────
  const pipelineStep: 1 | 2 | 3 | 4 | 5 | 6 = tier === "gold" ? 5 : tier === "silver" ? 4 : 3;

  // ── Render step panel ─────────────────────────────────────────────────────
  const renderStepPanel = () => {

    // BRONZE — choose filter method (or full-screen AI loading)
    if (tier === "bronze") {
      if (isFilteringAI) {
        return (
          <StepPanel>
            <AIFilteringLoadingState />
          </StepPanel>
        );
      }

      return (
        <StepPanel>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TierBadge tier="bronze" />
              <span className="text-sm font-semibold text-foreground">All studies matching your search</span>
              <span className="text-xs text-muted-foreground">({totalCount.toLocaleString()})</span>
            </div>
            {objective && (
              <p className="text-xs text-muted-foreground">
                Objective: <span className="text-foreground italic">"{objective}"</span>
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-background/50 p-4 space-y-3 text-sm text-muted-foreground">
            <p>
              This is your raw dataset. These studies match your search criteria but may include noise — studies that mention your terms without actually addressing your question.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={runAIFilter}
              disabled={!objective || totalCount === 0 || isLoading}
              variant="default"
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" /> Remove noise with AI →
            </Button>
             <Button
               onClick={() => setFilterMethod("manual")}
               variant="outline"
               className="gap-2"
               disabled={totalCount === 0 || isLoading}
             >
               <CheckSquare className="h-4 w-4" />
               I'll select manually
             </Button>
          </div>
          {filterMethod === "manual" && (
            <div className="flex items-center gap-3 pt-2 border-t border-border">
               <p className="text-sm text-muted-foreground flex-1">
                 Select the relevant studies in the table below.{" "}
                 <span className="font-medium text-foreground">{selectedIds.size}</span> selected
                 <span className="text-xs ml-2">(Max: 200 for processing)</span>
               </p>
              <Button onClick={confirmManualSilver} disabled={selectedIds.size === 0} className="gap-2">
                <ArrowRight className="h-4 w-4" />
                Confirm selection →
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setFilterMethod(null); setSelectedIds(new Set()); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </StepPanel>
      );
    }

    // SILVER — filtered, ready for gold validation
    if (tier === "silver") {
      return (
        <StepPanel>
          <div className="space-y-1">
             <div className="flex items-center gap-2">
               <TierBadge tier="silver" />
               <span className="text-sm font-semibold text-foreground">Studies focused on your question</span>
               <span className="text-xs text-muted-foreground">({studies.length})</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-6 px-2"
                onClick={() => {
                  setTier("bronze");
                  setSilverIds(null);
                  setFilterMethod(null);
                  setSelectedIds(new Set());
                }}
              >
                ← Back to Bronze
              </Button>
            </div>
            {/* pipeline info removed — using top-level tracker */}
          </div>

          {filterMethod === "ai" && silverKeywords.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Keywords inferred by AI from your objective</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                 {silverKeywords.map((kw) => (
                   <span key={kw} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-light text-indigo-dark select-none">
                     {kw}
                   </span>
                 ))}
              </div>
            </div>
          )}
          {filterMethod === "manual" && <p className="text-xs text-muted-foreground">Manually selected.</p>}

           <div className="rounded-lg border border-border bg-background/50 p-4 space-y-3 text-sm text-muted-foreground">
             <p>
               AI read every title and abstract and kept only the studies that directly address your objective. Review the inferred keywords below.
             </p>
           </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={runGoldValidation} disabled={isRanking || studies.length === 0} className="gap-2 bg-[#0a0a0a] text-white hover:bg-[#1a1a1a]">
               {isRanking ? (
                 <>
                   <Loader2 className="h-4 w-4 animate-spin" /> Validating relevance...
                 </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Score each study against my objective →
                  </>
                )}
             </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedIds(new Set(silverIds ?? []));
                  setGoldResults(null);
                  setTier("gold");
                }}
                className="gap-2 text-indigo hover:text-indigo-dark"
              >
                <ArrowRight className="h-4 w-4" />
                Skip scoring
              </Button>
          </div>
        </StepPanel>
      );
    }

    // GOLD — ready to analyze
    if (tier === "gold") {
      return (
        <StepPanel>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2">
               <div className="flex items-center gap-2">
                 <TierBadge tier="gold" />
                 <span className="text-sm font-semibold text-foreground">Studies scored against your objective</span>
                 <span className="text-xs text-muted-foreground">({studies.length})</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-6 px-2"
                  onClick={() => {
                    setTier("silver");
                    setGoldResults(null);
                  }}
                >
                  ← Back to Silver
                </Button>
              </div>
              {/* pipeline info removed — using top-level tracker */}

              <p className="text-xs text-muted-foreground">
                AI has scored all studies 0–10 against your objective. Studies are ranked by score.
              </p>
              {goldResults && (
                <p className="text-xs text-muted-foreground flex items-center gap-3">
                  <span>
                    <span className="inline-block w-2 h-2 rounded-full bg-primary mr-1" />
                    ≥8 High relevance
                  </span>
                  <span>
                    <span className="inline-block w-2 h-2 rounded-full bg-secondary mr-1" />
                    ≥6 Medium
                  </span>
                  <span>
                    <span className="inline-block w-2 h-2 rounded-full border border-border mr-1" />
                    &lt;6 Low
                  </span>
                </p>
              )}
            </div>
            <Button
              onClick={() => runAnalysis()}
              disabled={selectedIds.size === 0 || isAnalyzing}
              size="lg"
              className="gap-2 shrink-0"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing...
                </>
               ) : (
                 <>
                   <FlaskConical className="h-4 w-4" /> Generate evidence report
                 </>
               )}
              {selectedIds.size > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {selectedIds.size}
                </Badge>
              )}
            </Button>
          </div>

           <div className="rounded-lg border border-border bg-background/50 p-4 space-y-2 text-sm text-muted-foreground">
             <p>
               Each study has been scored 0–10 based on how well it answers your specific objective. Review the scores and generate the evidence report when ready.
             </p>
           </div>
        </StepPanel>
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      {!isUrlIdsMode && <PipelineTracker currentStep={pipelineStep} />}
      <MilestoneToast data={milestoneToast} onDismiss={() => setMilestoneToast(null)} />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top bar */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isUrlIdsMode ? "Back" : tier === "gold" ? "Back to Silver" : tier === "silver" ? "Back to Bronze" : "Back to search"}
            </Button>
          </div>

          {/* Step panel */}
          {!isUrlIdsMode && renderStepPanel()}

          {/* IDs mode banner */}
          {isUrlIdsMode && (
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-primary">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filtered view by related studies</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            </div>
          )}

          {/* Column filters — hidden in bronze until user picks a method */}
          {!(tier === "bronze" && (filterMethod === null || isFilteringAI)) && <div className="flex items-center justify-between bg-muted/30 border border-border rounded-lg px-4 py-3">
            <div className="flex items-center gap-6">
              <span className="text-sm font-medium text-muted-foreground">Filter by:</span>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <Select value={filterAnalyzable} onValueChange={setFilterAnalyzable}>
                  <SelectTrigger className="w-36 h-8 text-sm">
                    <SelectValue placeholder="Analyzable" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">With numeric data</SelectItem>
                    <SelectItem value="no">Without numeric data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-muted-foreground" />
                <Select value={filterComparable} onValueChange={setFilterComparable}>
                  <SelectTrigger className="w-36 h-8 text-sm">
                    <SelectValue placeholder="Comparable" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">With A vs B comparison</SelectItem>
                    <SelectItem value="no">Without comparison</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(filterAnalyzable !== "all" || filterComparable !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterAnalyzable("all");
                    setFilterComparable("all");
                  }}
                  className="text-xs"
                >
                  Clear filters
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {tier === "bronze" && filterMethod === "manual" && (
                <Button variant="outline" size="sm" onClick={toggleSelectAll} className="gap-1.5 text-xs">
                  <CheckSquare className="h-3.5 w-3.5" />
                  {allVisibleSelected ? "Deselect page" : "Select page"}
                </Button>
              )}
            </div>
          </div>}

          {/* Error */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive">Error loading dataset: {error.message}</p>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Loading studies...</p>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && studies.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileSearch className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">No studies found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {tier !== "bronze"
                  ? "The filter found no relevant studies. Go back to Bronze and try a different objective."
                  : "Adjust search filters to see results."}
              </p>
            </div>
          )}

          {/* Table — hidden in bronze until user picks a method */}
          {!isLoading && !error && studies.length > 0 && !(tier === "bronze" && (filterMethod === null || isFilteringAI)) && (
            <>
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {tier !== "gold" && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={allVisibleSelected}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Select all"
                            className={someVisibleSelected && !allVisibleSelected ? "opacity-50" : ""}
                          />
                        </TableHead>
                      )}
                      <TableHead className="w-28">NCT ID</TableHead>
                      <TableHead className="min-w-[200px]">Title</TableHead>
                      <TableHead className="w-16 text-right">Action</TableHead>
                      {tier === "gold" && goldResults && (
                        <TableHead className="w-28 min-w-[7rem] text-center">Score IA</TableHead>
                      )}
                      <TableHead className="w-40">Conditions</TableHead>
                      <TableHead className="w-40">Interventions</TableHead>
                      <TableHead className="w-28">Study Type</TableHead>
                      <TableHead className="w-24">Phase</TableHead>
                      <TableHead className="w-20 text-right">Enrollment</TableHead>
                      <TableHead className="w-24">Start</TableHead>
                      <TableHead className="w-24">Completion</TableHead>
                      <TableHead className="w-24">Results Posted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studies.map((study) => {
                      const enriched = enrichedMap?.get(study.nct_id);
                      const ranked = goldResults?.find((r) => r.nct_id === study.nct_id);
                      return (
                        <TableRow
                          key={study.nct_id}
                          className={selectedIds.has(study.nct_id) ? "bg-primary/5" : ""}
                          title={ranked ? `Relevancia: ${ranked.reason}` : undefined}
                        >
                          {tier !== "gold" && (
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.has(study.nct_id)}
                                onCheckedChange={() => toggleSelection(study.nct_id)}
                                aria-label={`Select ${study.nct_id}`}
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-mono text-xs">
                            <HighlightText text={study.nct_id} terms={highlightTerms} />
                          </TableCell>
                          <TruncatedCell
                            fullText={enriched?.brief_title || study.brief_title || undefined}
                            highlightTerms={highlightTerms}
                          >
                            <HighlightText
                              text={enriched?.brief_title || study.brief_title}
                              terms={highlightTerms}
                              className="text-sm font-medium text-foreground line-clamp-2"
                            />
                          </TruncatedCell>
                          <TableCell className="text-right">
                            <a
                              href={`https://clinicaltrials.gov/study/${study.nct_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 text-xs h-7 px-2 text-indigo border-indigo/30 hover:bg-indigo-light"
                              >
                                View ↗
                              </Button>
                            </a>
                          </TableCell>
                          {tier === "gold" && goldResults && (
                            <TableCell className="text-center">
                              {ranked ? (
                                <Badge
                                  variant={ranked.score >= 8 ? "default" : ranked.score >= 6 ? "secondary" : "outline"}
                                  className="text-xs font-mono"
                                  title={ranked.reason}
                                >
                                  {ranked.score}/10
                                </Badge>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                          )}
                          <TruncatedCell fullText={enriched?.conditions || undefined} highlightTerms={highlightTerms}>
                            <HighlightText
                              text={enriched?.conditions || "—"}
                              terms={highlightTerms}
                              className="text-xs text-muted-foreground line-clamp-2"
                            />
                          </TruncatedCell>
                          <TruncatedCell
                            fullText={enriched?.interventions || undefined}
                            highlightTerms={highlightTerms}
                          >
                            <HighlightText
                              text={enriched?.interventions || "—"}
                              terms={highlightTerms}
                              className="text-xs text-muted-foreground line-clamp-2"
                            />
                          </TruncatedCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <HighlightText text={enriched?.study_type || "—"} terms={highlightTerms} />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <HighlightText text={enriched?.phase || "—"} terms={highlightTerms} />
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {enriched?.enrollment != null ? enriched.enrollment.toLocaleString() : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {enriched?.start_date || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {enriched?.primary_completion_date || enriched?.completion_date || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {enriched?.results_first_posted_date || "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Score legend — only in Gold */}
              {tier === "gold" && goldResults && (
                <p className="text-xs text-muted-foreground pt-2 px-1">
                  AI relevance score:{" "}
                  <span className="inline-block w-2 h-2 rounded-full bg-primary mr-0.5 align-middle" /> ≥8 High ·{" "}
                  <span className="inline-block w-2 h-2 rounded-full bg-secondary mr-0.5 align-middle" /> ≥6 Medium ·{" "}
                  <span className="inline-block w-2 h-2 rounded-full border border-border mr-0.5 align-middle" /> &lt;6
                  Low
                </p>
              )}

              {/* Pagination — only in bronze */}
              {tier === "bronze" && totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{startIndex}</span>–
                    <span className="font-medium text-foreground">{endIndex}</span> of{" "}
                    <span className="font-medium text-foreground">{totalCount.toLocaleString()}</span> studies
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page === 0}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-4">
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= totalPages - 1}
                      className="gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <AnalysisModal
        open={showAnalysisModal}
        onOpenChange={setShowAnalysisModal}
        selectedCount={selectedIds.size}
        onConfirm={runAnalysis}
        isLoading={isAnalyzing}
        error={analysisError}
      />
    </div>
  );
};

export default DatasetPage;
