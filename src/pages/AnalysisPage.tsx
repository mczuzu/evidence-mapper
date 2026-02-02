import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabaseExternalPublic } from "@/lib/supabase-external";

import { V3AnalysisContent } from "@/components/analysis/V3AnalysisContent";
import { HypothesisSection } from "@/components/analysis/HypothesisSection";
import { PatternsSection } from "@/components/analysis/PatternsSection";
import { GapsSection } from "@/components/analysis/GapsSection";
import { NextStudiesSection } from "@/components/analysis/NextStudiesSection";
import { LegacyAnalysisContent } from "@/components/analysis/LegacyAnalysisContent";
import { AnalysisStatusBanner } from "@/components/analysis/AnalysisStatusBanner";

import type { AnalysisResult, SchemaVersion } from "@/types/analysis";
import { detectSchemaVersion } from "@/types/analysis";

type AnalysisRunRow = {
  id: string;
  created_at: string;
  nct_ids: string[];
  analysis: any;
  dataset_query?: string | null;
  prompt_version?: string | null;
  schema_version?: string | null;
};

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

function parseAnalysisResult(input: any): AnalysisResult | null {
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

const AnalysisPage = () => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

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

  const parsedAnalysis = parseAnalysisResult(analysisRun?.analysis);
  const analysis = parsedAnalysis;

  const schemaVersion: SchemaVersion = analysis ? detectSchemaVersion(analysis) : "v1";

  const nFound = analysisRun?.nct_ids?.length ?? 0;
  const firstThree = analysisRun?.nct_ids?.slice(0, 3) ?? [];

  const errorMessage = !analysisId
    ? "No analysis ID provided."
    : error
      ? `Error loading analysis: ${error.message}`
      : !isLoading && !analysisRun
        ? "Este análisis no está disponible. Genera uno nuevo desde el dataset."
        : null;

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
            {nFound > 0 && <span className="text-sm text-muted-foreground">{nFound} studies analyzed</span>}
          </div>

          {/* DEBUG – imprescindible ahora */}
          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Analysis ID:</span>{" "}
                <span className="font-mono text-xs">{analysisId}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Schema detected:</span>{" "}
                <strong>{schemaVersion.toUpperCase()}</strong>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">First NCT IDs:</span>{" "}
                <span className="font-mono text-xs">{firstThree.join(", ") || "—"}</span>
              </div>
              <div className="text-xs text-muted-foreground break-all">
                <strong>analysis_runs.analysis (raw):</strong>
                <pre className="mt-1 whitespace-pre-wrap">
                  {analysisRun?.analysis ? JSON.stringify(analysisRun.analysis, null, 2) : "—"}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Loading */}
          {isLoading && <AnalysisStatusBanner type="loading" studyCount={analysisRun?.nct_ids?.length} />}

          {/* Error */}
          {errorMessage && <AnalysisStatusBanner type="error" message={errorMessage} />}

          {/* Analysis Content */}
          {analysis && !isLoading && (
            <>
              {schemaVersion === "v3" && <V3AnalysisContent analysis={analysis} />}

              {schemaVersion === "v2" && (
                <div className="space-y-6">
                  <HypothesisSection hypotheses={analysis.direction_hypotheses || []} />
                  <PatternsSection patterns={analysis.patterns || []} />
                  <GapsSection gaps={analysis.opportunity_gaps || []} />
                  <NextStudiesSection studies={analysis.next_studies || []} />
                </div>
              )}

{schemaVersion === "v1" && (
  <LegacyAnalysisContent
    analysis={{
      direction:
        Array.isArray((analysis as any)?.research_directions) && (analysis as any).research_directions.length > 0
          ? (analysis as any).research_directions
              .map(
                (d: any, i: number) =>
                  `${i + 1}. ${d.condition}\n${d.direction}\n${d.rationale ?? ""}`
              )
              .join("\n\n")
          : undefined,
      themes: undefined,
      gaps: undefined,
      suggested_next_steps: undefined,
    }}
  />
)}

export default AnalysisPage;
