import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ArrowLeft, AlertCircle, Compass, Lightbulb, AlertTriangle, ArrowRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalysisStore, type StoredAnalysisRun } from '@/state/analysis-store';

const AnalysisPage = () => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();

  const { getRun } = useAnalysisStore();
  const analysisRun: StoredAnalysisRun | undefined = analysisId ? getRun(analysisId) : undefined;

  const errorMessage = !analysisId
    ? 'No analysis ID provided.'
    : !analysisRun
      ? 'Este análisis no está disponible (probablemente se perdió al recargar). Genera un análisis nuevo desde el dataset.'
      : null;

  const handleBack = () => {
    navigate(-1);
  };

  const handleViewStudies = (studyIds: string[]) => {
    navigate(`/dataset?ids=${studyIds.join(',')}`);
  };

  const result = analysisRun?.result;
  const analysis = result?.analysis;

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
            {result?.metadata && (
              <span className="text-sm text-muted-foreground">
                {result.metadata.study_count} estudios analizados
              </span>
            )}
          </div>

          {/* Error */}
          {errorMessage && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">
                    {errorMessage}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Content */}
          {analysis && (
            <div className="space-y-6">
              {/* Direction */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <Compass className="h-5 w-5 text-primary" />
                    Dirección del Análisis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed">
                    {analysis.direction}
                  </p>
                </CardContent>
              </Card>

              {/* Themes */}
              {analysis.themes && analysis.themes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif text-lg flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      Temas Identificados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysis.themes.map((theme, index) => (
                      <div
                        key={index}
                        className="bg-muted/30 rounded-lg p-4 border border-border"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground mb-1">
                              {theme.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {theme.description}
                            </p>
                          </div>
                          {theme.study_ids && theme.study_ids.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewStudies(theme.study_ids)}
                              className="shrink-0 gap-1"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Ver estudios ({theme.study_ids.length})
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Gaps */}
              {analysis.gaps && analysis.gaps.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Brechas Identificadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysis.gaps.map((gap, index) => (
                      <div
                        key={index}
                        className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground mb-1">
                              {gap.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {gap.description}
                            </p>
                          </div>
                          {gap.study_ids && gap.study_ids.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewStudies(gap.study_ids)}
                              className="shrink-0 gap-1"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Ver estudios ({gap.study_ids.length})
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Suggested Next Steps */}
              {analysis.suggested_next_steps && analysis.suggested_next_steps.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif text-lg flex items-center gap-2">
                      <ArrowRight className="h-5 w-5 text-primary" />
                      Próximos Pasos Sugeridos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {analysis.suggested_next_steps.map((step, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-sm"
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="text-foreground">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AnalysisPage;
