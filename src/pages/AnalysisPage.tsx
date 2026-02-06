import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Header } from "@/components/Header";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabaseExternalPublic } from "@/lib/supabase-external";
import { AnalysisStatusBanner } from "@/components/analysis/AnalysisStatusBanner";
import { MarkdownText } from "@/components/analysis/MarkdownText";
import { V3AnalysisContent } from "@/components/analysis/V3AnalysisContent";
import { LegacyAnalysisContent } from "@/components/analysis/LegacyAnalysisContent";
import type { AnalysisV3 } from "@/types/analysis";

/* =========================
   Types
========================= */

type AnalysisRunRow = {
  id: string;
  created_at: string;
  nct_ids: string[];
  analysis: any;
  dataset_query?: string | null;
  prompt_version?: string | null;
  schema_version?: string | null;
};

type DirectionAnalysis = {
  confidence?: "low" | "medium" | "high" | string;
  direction_text?: string;
  next_steps_text?: string;

  // Optional (if you include later)
  missing?: string[];
  n_requested?: number;
  n_found?: number;
};

/* =========================
   Data
========================= */

function useAnalysisRun(analysisId: string | undefined) {
  return useQuery({
    queryKey: ["analysis-run", analysisId],
    enabled: !!analysisId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!analysisId) throw new Error("No analysis ID provided");

      const { data, error } = await supabaseExternalPublic
        .from("analysis_runs")
        .select("id, created_at, nct_ids, dataset_query, prompt_version, schema_version, analysis")
        .eq("id", analysisId)
        .single();

      if (error) throw error;
      return data as AnalysisRunRow;
    },
  });
}

function safeParseJSON(input: any): any {
  if (!input) return null;
  if (typeof input === "string") {
    try {
      return JSON.parse(input);
    } catch {
      return null;
    }
  }
  return input;
}

function toMarkdownTitleBlock(title?: string, description?: string) {
  const t = (title ?? "").trim();
  const d = (description ?? "").trim();
  if (t && d) return `**${t}**\n\n${d}`;
  if (t) return `**${t}**`;
  return d;
}

// Coerce the "direction_summary" V3 payload (produced by the analyze-direction backend)
// into the UI's current AnalysisV3 shape (direction.summary + supporting_nct_ids, etc.)
function coerceToAnalysisV3(raw: any): AnalysisV3 | null {
  if (!raw || typeof raw !== "object") return null;

  // If it already matches the UI's V3 shape, keep it.
  if (raw.direction && typeof raw.direction === "object" && "summary" in raw.direction) {
    return raw as AnalysisV3;
  }

  // Detect the backend V3 shape (direction_summary + what_is_promising/uncertain)
  const looksLikeBackendV3 =
    typeof raw.direction_summary === "string" ||
    Array.isArray(raw.what_is_promising) ||
    Array.isArray(raw.what_is_uncertain) ||
    (raw.cluster_map && typeof raw.cluster_map === "object") ||
    (raw.next_studies && typeof raw.next_studies === "object") ||
    (raw.gaps && typeof raw.gaps === "object");

  if (!looksLikeBackendV3) return null;

  const directionSummary = typeof raw.direction_summary === "string" ? raw.direction_summary : "";

  const mapPromising = (items: any[]) =>
    (Array.isArray(items) ? items : []).map((it: any) => ({
      rationale: toMarkdownTitleBlock(it?.title, it?.description),
      supporting_nct_ids: Array.isArray(it?.study_ids) ? it.study_ids : [],
    }));

  const mapCluster = (items: any[]) =>
    (Array.isArray(items) ? items : []).map((it: any) => ({
      label: String(it?.label ?? "").trim(),
      description: typeof it?.description === "string" ? it.description : "",
      supporting_nct_ids: Array.isArray(it?.study_ids)
        ? it.study_ids
        : Array.isArray(it?.supporting_nct_ids)
          ? it.supporting_nct_ids
          : [],
    }));

  const mapGaps = (items: any[]) =>
    (Array.isArray(items) ? items : []).map((it: any) => ({
      gap: toMarkdownTitleBlock(it?.title, it?.description),
      supporting_nct_ids: Array.isArray(it?.study_ids) ? it.study_ids : [],
    }));

  const mapProposals = (items: any[]) =>
    (Array.isArray(items) ? items : []).map((it: any) => ({
      population: String(it?.population ?? "").trim(),
      intervention: String(it?.intervention ?? "").trim(),
      comparator: String(it?.comparator ?? "").trim(),
      primary_outcomes: Array.isArray(it?.primary_outcomes) ? it.primary_outcomes : [],
      follow_up_horizon: String(it?.follow_up_horizon ?? it?.follow_up ?? "").trim(),
      why_it_resolves_a_gap: String(it?.why_it_resolves_a_gap ?? it?.rationale ?? "").trim(),
      supporting_nct_ids: Array.isArray(it?.supporting_nct_ids)
        ? it.supporting_nct_ids
        : Array.isArray(it?.study_ids)
          ? it.study_ids
          : [],
    }));

  const mapQuickWins = (items: any[]) =>
    (Array.isArray(items) ? items : []).map((it: any) => ({
      description: toMarkdownTitleBlock(it?.title, it?.description),
      supporting_nct_ids: Array.isArray(it?.supporting_nct_ids)
        ? it.supporting_nct_ids
        : Array.isArray(it?.study_ids)
          ? it.study_ids
          : [],
    }));

  const clusterMap = raw.cluster_map ?? {};
  const gaps = raw.gaps ?? {};
  const nextStudies = raw.next_studies ?? {};

  return {
    direction: {
      summary: directionSummary,
      what_is_promising: mapPromising(raw.what_is_promising),
      what_is_uncertain: mapPromising(raw.what_is_uncertain),
    },
    cluster_map: {
      interventions: mapCluster(clusterMap.interventions),
      populations: mapCluster(clusterMap.populations),
      outcomes: mapCluster(clusterMap.outcomes),
      mechanisms_or_rationale: mapCluster(clusterMap.mechanisms ?? clusterMap.mechanisms_or_rationale),
    },
    gaps: {
      evidence_gaps: mapGaps(gaps.evidence),
      design_gaps: mapGaps(gaps.design),
      missing_subgroups: mapGaps(gaps.missing_subgroups),
    },
    next_studies: {
      proposals: mapProposals(nextStudies.proposals),
      quick_wins: mapQuickWins(nextStudies.quick_wins),
    },
    decision_assessment: raw.decision_assessment
      ? {
          markdown_report: typeof raw.decision_assessment.markdown_report === "string"
            ? raw.decision_assessment.markdown_report
            : "",
        }
      : undefined,
  };
}

/* =========================
   UI helpers
========================= */

// Keep this list small and pragmatic. We can tune later based on real outputs.
const KEYWORDS = [
  "pattern",
  "patterns",
  "trend",
  "trends",
  "signal",
  "signals",
  "evidence",
  "supporting evidence",
  "gap",
  "gaps",
  "opportunity",
  "opportunities",
  "next steps",
  "hypothesis",
  "hypotheses",
  "mechanism",
  "mechanisms",
  "biomarker",
  "biomarkers",
  "endpoint",
  "endpoints",
  "primary outcome",
  "secondary outcome",
  "randomized",
  "placebo",
  "phase",
  "dose",
  "safety",
  "efficacy",
  "menopause",
  "vasomotor",
  "sleep",
  "anxiety",
  "depression",
];

// Bold keywords inside text (case-insensitive), but do it safely as React nodes.
function boldKeywords(text: string): React.ReactNode[] {
  if (!text) return [text];

  const escaped = KEYWORDS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(re)) {
    const index = match.index ?? 0;
    const matched = match[0];

    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }
    parts.push(
      <strong key={`${index}-${matched}`} className="font-semibold text-foreground">
        {matched}
      </strong>,
    );
    lastIndex = index + matched.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

// Render text as readable structure:
// - paragraphs split by blank lines
// - detects bullets (-, *, •) and numbered lists (1., 2., ...)
// - bolds keywords
function StructuredText({ text }: { text?: string | null }) {
  if (!text) return null;

  const cleaned = String(text).replace(/\r\n/g, "\n").trim();
  if (!cleaned) return null;

  const blocks = cleaned
    .split(/\n{2,}/g)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        const lines = block
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);

        const isBullets = lines.every((l) => /^[-*•]\s+/.test(l));
        const isNumbered = lines.every((l) => /^\d+\.\s+/.test(l));

        if (isBullets) {
          return (
            <ul key={i} className="list-disc pl-5 space-y-2">
              {lines.map((l, j) => {
                const item = l.replace(/^[-*•]\s+/, "");
                return (
                  <li key={j} className="text-sm leading-6 text-foreground">
                    {boldKeywords(item)}
                  </li>
                );
              })}
            </ul>
          );
        }

        if (isNumbered) {
          return (
            <ol key={i} className="list-decimal pl-5 space-y-2">
              {lines.map((l, j) => {
                const item = l.replace(/^\d+\.\s+/, "");
                return (
                  <li key={j} className="text-sm leading-6 text-foreground">
                    {boldKeywords(item)}
                  </li>
                );
              })}
            </ol>
          );
        }

        // default paragraph
        return (
          <p key={i} className="text-sm leading-6 text-foreground">
            {boldKeywords(block)}
          </p>
        );
      })}
    </div>
  );
}

function ConfidencePill({ value }: { value?: string }) {
  const v = (value ?? "").toLowerCase();
  const label = v ? `Confidence: ${v}` : "Confidence: —";
  return (
    <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
      {label}
    </span>
  );
}

/* =========================
   Page
========================= */

const AnalysisPage = () => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Analysis-${analysisId ?? "report"}`,
    pageStyle: `
      @page { margin: 20mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .no-print { display: none !important; }
      }
    `,
  });

  // optimistic navigation state (optional)
  const stateRun = (location.state as any)?.run as { id: string; nct_ids: string[]; analysis: any } | undefined;

  const stateRunMatches = !!analysisId && stateRun?.id === analysisId;

  const { data, isLoading, error } = useAnalysisRun(analysisId);

  const analysisRun: AnalysisRunRow | undefined =
    data ??
    (stateRunMatches
      ? {
          id: stateRun.id,
          created_at: new Date().toISOString(),
          nct_ids: stateRun.nct_ids,
          analysis: stateRun.analysis,
        }
      : undefined);

  const parsedRaw = safeParseJSON(analysisRun?.analysis) as any;
  const parsedLegacyText = parsedRaw as DirectionAnalysis | null;
  const parsedV3 = coerceToAnalysisV3(parsedRaw);

  // Where we expect the 2 MVP fields
  const directionText = parsedLegacyText?.direction_text ?? "";
  const nextStepsText = parsedLegacyText?.next_steps_text ?? "";

  // Meta (defensive defaults)
  // For V3, nct_ids in the DB already represents the "available" studies (stored after edge fn filter)
  // parsedRaw might also have metadata with study_count
  const storedIds = analysisRun?.nct_ids ?? [];
  const metadataCount = parsedRaw?.metadata?.study_count;
  const nFound = metadataCount ?? parsedLegacyText?.n_found ?? storedIds.length ?? 0;
  const nRequested = parsedLegacyText?.n_requested ?? nFound;
  const missing = Array.isArray(parsedLegacyText?.missing) ? parsedLegacyText!.missing! : [];

  const errorMessage = !analysisId
    ? "No analysis ID provided."
    : error
      ? `Error loading analysis: ${error.message}`
      : !isLoading && !analysisRun
        ? "This analysis is not available. Generate a new one from the dataset."
        : null;

  const hasLegacyTextContent = !!directionText || !!nextStepsText;
  const hasV3Content = !!parsedV3;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="font-serif text-xl font-bold text-foreground">Direction Analysis</h1>
            </div>

            <div className="flex items-center gap-3 no-print">
              {nFound > 0 && (
                <span className="text-sm text-muted-foreground">
                  {nFound} studies analyzed{missing.length ? ` (${missing.length} missing)` : ""}
                </span>
              )}
              <ConfidencePill value={parsedLegacyText?.confidence} />
              {(hasLegacyTextContent || hasV3Content) && !isLoading && !errorMessage && (
                <Button variant="outline" size="sm" onClick={() => handlePrint()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir PDF
                </Button>
              )}
            </div>
          </div>

          {/* Loading */}
          {isLoading && <AnalysisStatusBanner type="loading" studyCount={analysisRun?.nct_ids?.length} />}

          {/* Error */}
          {errorMessage && <AnalysisStatusBanner type="error" message={errorMessage} />}

          {/* Missing list (only if present) */}
          {!isLoading && missing.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">Missing studies</div>
                  <div className="text-sm text-muted-foreground">
                    These NCT IDs had no usable data in the current payload:
                  </div>
                  <div className="font-mono text-xs text-foreground break-all">{missing.join(", ")}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main content */}
          {!isLoading && !errorMessage && (
            <>
              {!hasLegacyTextContent && !hasV3Content ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">
                      No analysis content available yet. Try running the analysis again with fewer studies or ensure
                      rich JSON exists for the selected NCT IDs.
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      Analysis ID: <span className="font-mono">{analysisId}</span>
                      {nRequested ? ` - Requested: ${nRequested}` : ""}
                      {nFound ? ` - Found: ${nFound}` : ""}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div ref={printRef} className="space-y-6 print:p-0">
                  {/* Print header (only visible when printing) */}
                  <div className="hidden print:block print:mb-6">
                    <h1 className="text-2xl font-bold text-foreground">Direction Analysis Report</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {nFound} studies analyzed • Generated {analysisRun?.created_at ? new Date(analysisRun.created_at).toLocaleDateString() : ""}
                    </p>
                  </div>
                  
                  {hasV3Content ? (
                    <V3AnalysisContent analysis={parsedV3!} />
                  ) : (
                    <>
                      {/* Direction */}
                      <Card>
                        <CardContent className="pt-6 space-y-3">
                          <div className="text-base font-semibold text-foreground">Direction</div>
                          <MarkdownText>{directionText}</MarkdownText>
                        </CardContent>
                      </Card>

                      {/* Next steps */}
                      <Card>
                        <CardContent className="pt-6 space-y-3">
                          <div className="text-base font-semibold text-foreground">Opportunities & next steps</div>
                          <MarkdownText>{nextStepsText}</MarkdownText>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AnalysisPage;
