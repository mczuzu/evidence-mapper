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
  analysis: any; // jsonb
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
      return data as unknown as AnalysisRunRow;
    },
  });
}

// Helper to safely parse analysis result (handles string or object)
function parseAnalysisResult(input: any): AnalysisResult | null {
  if (!input) return null;

  if (typeof input === "string") {
    try {
      return JSON.parse(input) as AnalysisResult;
    } catch {
      return null;
    }
  }

  return input as AnalysisResult;
}

const AnalysisPage = () => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation state (optimistic render)
  const stateRun = (location.state as any)?.run as
    | {
        id: string;
        nct_ids: string[];
        analysis: any;
        prompt_version?: string;
        schema_version?: string;
        status?: string;
      }
    | undefined;

  const stateRunMatches = !!analysisId && stateRun?.id === analysisId;

  const { data, isLoading, error } = useAnalysisRun(analysisId);

  // Source of truth: DB row.
  // While loading, allow optimistic render from navigation state.
  const analysisRun: AnalysisRunRow | undefined =
    data ??
    (stateRunMatches
      ? {
          id: stateRun.id,
          created_at: new Date().toISOString(),
          nct_ids: stateRun.nct_ids,
          analysis: stateRun.analysis,
          prompt_version: stateRun.prompt_version ?? null,
          schema_version: stateRun.schema_version ?? null,
          dataset_query: null,
        }
      : undefined);

  const errorMessage = !analysisId
    ? "No analysis ID provided."
    : error
      ? `Error loading analysis: ${error.message}`
      : !isLoading && !analysisRun
        ? "Este análisis no está disponible. Genera un análisis nuevo desde el dataset."
        : null;

  const handleBack = () => {
    navigate(-1);
  };

  // Parse analysis payload (DB column = analysis)
  const parsedResult = parseAnalysisResult(analysisRun?.analysis);

  // In V3 we store the analysis object directly.
  // Keep backward compatibility if payload is wrapped.
  const analysis = (parsedResult as any)?.analysis ?? parsedResult;
  const metadata = (parsedResult as any)?.metadata;

  const nFound = metadata?.n_found ?? metadata?.study_count ?? analysisRun?.nct_ids?.length ?? 0;
  const firstThree = (analysisRun?.nct_ids ?? []).slice(0, 3);

  // Detect schema version
  const schemaVersion: SchemaVersion = analysis ? detectSchemaVersion(analysis) : "v1";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="font-serif text-xl font-bold text-foreground">Direction Analysis</h1>
            </div>
            {nFound > 0 && <span className="text-sm text-muted-foreground">{nFound} studies analyzed</span>}
          </div>

          {/* Debug (temporal, obligatorio) */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Analysis ID:</span>{" "}
                  <span className="font-mono text-xs text-foreground">{analysisId || "—"}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">n_found:</span>{" "}
                  <span className="font-medium text-foreground">{isLoading ? "…" : nFound}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">First 3 NCT IDs:</span>{" "}
                  <span className="font-mono text-xs text-foreground">
                    {firstThree.length ? firstThree.join(", ") : "—"}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Schema:</span>{" "}
                  <span className="font-medium text-foreground">{isLoading ? "…" : schemaVersion.toUpperCase()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading */}
          {isLoading && <AnalysisStatusBanner type="loading" studyCount={analysisRun?.nct_ids?.length} />}

          {/* Error */}
          {errorMessage && <AnalysisStatusBanner type="error" message={errorMessage} />}

          {/* Analysis Content - routed by schema version */}
          {analysis && !isLoading && (
            <>
              {schemaVersion === "v3" && <V3AnalysisContent analysis={analysis} />}

              {schemaVersion === "v2" && (
                <div className="space-y-6">
                  <HypothesisSection hypotheses={(analysis as any).direction_hypotheses || []} />
                  <PatternsSection patterns={(analysis as any).patterns || []} />
                  <GapsSection gaps={(analysis as any).opportunity_gaps || []} />
                  <NextStudiesSection studies={(analysis as any).next_studies || []} />
                </div>
              )}

              {schemaVersion === "v1" && (
                <LegacyAnalysisContent
                  analysis={{
                    direction:
                      typeof (analysis as any).direction === "string" ? (analysis as any).direction : undefined,
                    themes: (analysis as any).themes,
                    gaps: Array.isArray((analysis as any).gaps) ? (analysis as any).gaps : undefined,
                    suggested_next_steps: (analysis as any).suggested_next_steps,
                  }}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AnalysisPage;
