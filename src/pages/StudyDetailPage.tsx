import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { ArrowLeft, Loader2, AlertCircle, Clock, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStudyBasicInfo } from "@/hooks/useStudyDetail";
import { EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY } from "@/lib/supabase-external";

type PrimaryOutcome = {
  title: string;
  time_frame?: string | null;
  description?: string | null;
};

type RichInfo = {
  primary_outcomes?: PrimaryOutcome[] | null;
  eligibility_preview?: string | null;
  detailed_description_preview?: string | null;
};

async function fetchRichInfo(nctId: string): Promise<RichInfo> {
  const url = `${EXTERNAL_SUPABASE_URL}/functions/v1/get-rich?nct_id=${encodeURIComponent(nctId)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      apikey: EXTERNAL_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${EXTERNAL_SUPABASE_ANON_KEY}`,
    },
  });

  const text = await res.text();

  if (!res.ok) {
    // keep body to help debugging
    throw new Error(`get-rich failed (${res.status}): ${text}`);
  }

  return text ? (JSON.parse(text) as RichInfo) : {};
}

const StudyDetailPage = () => {
  const { nctId } = useParams<{ nctId: string }>();
  const navigate = useNavigate();

  const { data: basicInfo, isLoading: basicLoading, error: basicError } = useStudyBasicInfo(nctId);

  const {
    data: richInfo,
    isLoading: richLoading,
    error: richError,
  } = useQuery({
    queryKey: ["study-rich", nctId],
    enabled: !!nctId,
    queryFn: async () => {
      if (!nctId) throw new Error("Missing nctId");
      return fetchRichInfo(nctId);
    },
    retry: 0,
    refetchOnWindowFocus: false,
  });

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-1 rounded">{nctId}</span>
          </div>

          {basicLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Loading study details...</p>
            </div>
          )}

          {basicError && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">Error loading study: {basicError.message}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {basicInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl">{basicInfo.brief_title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {basicInfo.official_title && basicInfo.official_title !== basicInfo.brief_title && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Official Title</h4>
                    <p className="text-sm text-foreground">{basicInfo.official_title}</p>
                  </div>
                )}

                {basicInfo.semantic_labels && basicInfo.semantic_labels.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Labels</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {basicInfo.semantic_labels.map((label: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {basicInfo.param_type_set && basicInfo.param_type_set.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Parameter Types</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {basicInfo.param_type_set.map((param: string, index: number) => (
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

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t">
                  <MetricBox label="Results" value={basicInfo.n_result_rows} />
                  <MetricBox label="Outcomes" value={basicInfo.n_unique_outcomes} />
                  <MetricBox label="Total N" value={basicInfo.total_n_reported} />
                  <MetricBox label="Max N" value={basicInfo.max_n_reported} />
                </div>
              </CardContent>
            </Card>
          )}

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
                    <p className="text-sm text-muted-foreground">No hay datos ricos para este estudio todavía.</p>
                    <p className="text-xs text-muted-foreground mt-2">{richError.message}</p>
                  </div>
                )}

                {richInfo && !richLoading && !richError && (
                  <div className="space-y-6">
                    {richInfo.primary_outcomes && richInfo.primary_outcomes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Primary Outcomes
                        </h4>
                        <ul className="space-y-3">
                          {richInfo.primary_outcomes.map((outcome, index) => (
                            <li key={index} className="bg-muted/30 rounded-lg p-3 border border-border">
                              <p className="text-sm font-medium text-foreground">{outcome.title}</p>
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

                    {richInfo.detailed_description_preview && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Detailed Description</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {richInfo.detailed_description_preview}
                        </p>
                      </div>
                    )}

                    {!richInfo.primary_outcomes?.length &&
                      !richInfo.eligibility_preview &&
                      !richInfo.detailed_description_preview && (
                        <p className="text-sm text-muted-foreground">No additional details available for this study.</p>
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
      <p className="text-lg font-semibold text-foreground">{value != null ? value.toLocaleString() : "—"}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default StudyDetailPage;
