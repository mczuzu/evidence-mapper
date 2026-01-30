import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ArrowLeft, Loader2, AlertCircle, Clock, CheckCircle2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudyBasicInfo, useStudyRichInfo } from '@/hooks/useStudyDetail';

const StudyDetailPage = () => {
  const { nctId } = useParams<{ nctId: string }>();
  const navigate = useNavigate();

  const { 
    data: basicInfo, 
    isLoading: basicLoading, 
    error: basicError 
  } = useStudyBasicInfo(nctId);

  const { 
    data: richInfo, 
    isLoading: richLoading, 
    error: richError 
  } = useStudyRichInfo(nctId);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
              {nctId}
            </span>
          </div>

          {/* Basic Info Loading */}
          {basicLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Loading study details...</p>
            </div>
          )}

          {/* Basic Info Error */}
          {basicError && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">
                    Error loading study: {basicError.message}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Block 1: Basic Info */}
          {basicInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl">
                  {basicInfo.brief_title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Official Title */}
                {basicInfo.official_title && basicInfo.official_title !== basicInfo.brief_title && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Official Title
                    </h4>
                    <p className="text-sm text-foreground">
                      {basicInfo.official_title}
                    </p>
                  </div>
                )}

                {/* Semantic Labels */}
                {basicInfo.semantic_labels && basicInfo.semantic_labels.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Labels
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {basicInfo.semantic_labels.map((label, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Param Types */}
                {basicInfo.param_type_set && basicInfo.param_type_set.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Parameter Types
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {basicInfo.param_type_set.map((param, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground"
                        >
                          {param}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t">
                  <MetricBox label="Results" value={basicInfo.n_result_rows} />
                  <MetricBox label="Outcomes" value={basicInfo.n_unique_outcomes} />
                  <MetricBox label="Total N" value={basicInfo.total_n_reported} />
                  <MetricBox label="Max N" value={basicInfo.max_n_reported} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Block 2: Rich Info */}
          {basicInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Additional Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {richLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading rich data...</span>
                  </div>
                )}

                {richError && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      No hay datos ricos para este estudio todavía.
                    </p>
                  </div>
                )}

                {richInfo && (
                  <div className="space-y-6">
                    {/* Primary Outcomes */}
                    {richInfo.primary_outcomes && richInfo.primary_outcomes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Primary Outcomes
                        </h4>
                        <ul className="space-y-3">
                          {richInfo.primary_outcomes.map((outcome, index) => (
                            <li
                              key={index}
                              className="bg-muted/30 rounded-lg p-3 border border-border"
                            >
                              <p className="text-sm font-medium text-foreground">
                                {outcome.title}
                              </p>
                              {outcome.time_frame && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {outcome.time_frame}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Eligibility Preview */}
                    {richInfo.eligibility_preview && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          Eligibility
                        </h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {richInfo.eligibility_preview}
                        </p>
                      </div>
                    )}

                    {/* Detailed Description Preview */}
                    {richInfo.detailed_description_preview && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">
                          Detailed Description
                        </h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {richInfo.detailed_description_preview}
                        </p>
                      </div>
                    )}

                    {/* No rich data available */}
                    {!richInfo.primary_outcomes?.length && 
                     !richInfo.eligibility_preview && 
                     !richInfo.detailed_description_preview && (
                      <p className="text-sm text-muted-foreground">
                        No additional details available for this study.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

function MetricBox({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="text-center p-3 bg-muted/50 rounded-lg">
      <p className="text-lg font-semibold text-foreground">
        {value != null ? value.toLocaleString() : '—'}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default StudyDetailPage;
