import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

import { HypothesisSection } from '@/components/analysis/HypothesisSection';
import { PatternsSection } from '@/components/analysis/PatternsSection';
import { GapsSection } from '@/components/analysis/GapsSection';
import { NextStudiesSection } from '@/components/analysis/NextStudiesSection';
import { LegacyAnalysisContent } from '@/components/analysis/LegacyAnalysisContent';
import type { AnalysisResult } from '@/types/analysis';

type AnalysisRunRow = {
  id: string;
  created_at: string;
  nct_ids: string[];
  result: any;
};

function useAnalysisRun(analysisId: string | undefined) {
  return useQuery({
    queryKey: ['analysis-run', analysisId],
    enabled: !!analysisId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!analysisId) throw new Error('No analysis ID provided');

      const { data, error } = await supabase
        .from('analysis_runs')
        .select('id, created_at, nct_ids, result')
        .eq('id', analysisId)
        .single();

      if (error) throw error;
      return data as unknown as AnalysisRunRow;
    },
  });
}

// Helper to safely parse analysis result (handles string or object)
function parseAnalysisResult(result: any): AnalysisResult | null {
  if (!result) return null;

  // If result is a string, try to parse it
  if (typeof result === 'string') {
    try {
      return JSON.parse(result) as AnalysisResult;
    } catch {
      return null;
    }
  }

  return result as AnalysisResult;
}

// Check if the analysis uses the new schema
function isNewSchema(analysis: any): boolean {
  return !!(
    analysis?.direction_hypotheses ||
    analysis?.patterns ||
    analysis?.opportunity_gaps ||
    analysis?.next_studies
  );
}

const AnalysisPage = () => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const stateRun = (location.state as any)?.run as
    | { id: string; nct_ids: string[]; result: any }
    | undefined;
  const stateRunMatches = !!analysisId && stateRun?.id === analysisId;

  const { data, isLoading, error } = useAnalysisRun(analysisId);

  // Source of truth: DB row filtered strictly by analysisId.
  // While loading, we can optimistically render the payload passed via navigation state (also bound to analysisId).
  const analysisRun: AnalysisRunRow | undefined =
    data ??
    (stateRunMatches
      ? {
          id: stateRun.id,
          created_at: new Date().toISOString(),
          nct_ids: stateRun.nct_ids,
          result: stateRun.result,
        }
      : undefined);

  const errorMessage = !analysisId
    ? 'No analysis ID provided.'
    : error
      ? `Error loading analysis: ${error.message}`
      : !isLoading && !analysisRun
        ? 'Este análisis no está disponible. Genera un análisis nuevo desde el dataset.'
        : null;

  const handleBack = () => {
    navigate(-1);
  };

  // Parse and extract data
  const parsedResult = parseAnalysisResult(analysisRun?.result);
  const analysis = parsedResult?.analysis;
  const studyIndex = parsedResult?.study_index;
  const metadata = parsedResult?.metadata;

  const nFound =
    metadata?.n_found ??
    metadata?.study_count ??
    (analysisRun?.nct_ids?.length ?? 0);
  const firstThree = (analysisRun?.nct_ids ?? []).slice(0, 3);
  const useNewSchema = analysis ? isNewSchema(analysis) : false;

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
                Volver
              </Button>
              <h1 className="font-serif text-xl font-bold text-foreground">
                Análisis de Dirección
              </h1>
            </div>
            {nFound > 0 && (
              <span className="text-sm text-muted-foreground">
                {nFound} estudios analizados
              </span>
            )}
          </div>

          {/* Debug (temporal, obligatorio) */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Analysis ID:</span>{' '}
                  <span className="font-mono text-xs text-foreground">{analysisId || '—'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">n_found:</span>{' '}
                  <span className="font-medium text-foreground">{isLoading ? '…' : nFound}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Primeros 3 NCT IDs:</span>{' '}
                  <span className="font-mono text-xs text-foreground">
                    {firstThree.length ? firstThree.join(', ') : '—'}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Schema:</span>{' '}
                  <span className="font-medium text-foreground">
                    {isLoading ? '…' : useNewSchema ? 'Nuevo (v2)' : 'Legacy (v1)'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Loader2 className="h-6 w-6 text-primary animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Cargando análisis…</p>
            </div>
          )}

          {/* Error */}
          {errorMessage && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">{errorMessage}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Content */}
          {analysis && !isLoading && (
            <>
              {useNewSchema ? (
                <div className="space-y-6">
                  <HypothesisSection hypotheses={analysis.direction_hypotheses || []} />
                  <PatternsSection patterns={analysis.patterns || []} />
                  <GapsSection gaps={analysis.opportunity_gaps || []} />
                  <NextStudiesSection studies={analysis.next_studies || []} />
                </div>
              ) : (
                <LegacyAnalysisContent analysis={analysis} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AnalysisPage;
