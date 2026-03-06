import { useNavigate } from 'react-router-dom';
import { Compass, Lightbulb, AlertTriangle, ArrowRight, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LegacyTheme {
  title: string;
  description: string;
  study_ids: string[];
}

interface LegacyGap {
  title: string;
  description: string;
  study_ids: string[];
}

interface LegacyAnalysis {
  direction?: string;
  themes?: LegacyTheme[];
  gaps?: LegacyGap[];
  suggested_next_steps?: string[];
}

interface LegacyAnalysisContentProps {
  analysis: LegacyAnalysis;
}

export function LegacyAnalysisContent({ analysis }: LegacyAnalysisContentProps) {
  const navigate = useNavigate();

  const handleViewStudies = (studyIds: string[]) => {
    navigate(`/dataset?ids=${studyIds.join(',')}`);
  };

  return (
    <div className="space-y-6">
      {/* Direction */}
      {analysis.direction && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary" />
              Analysis Direction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">{analysis.direction}</p>
          </CardContent>
        </Card>
      )}

      {/* Themes */}
      {analysis.themes && analysis.themes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Identified Themes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.themes.map((theme, index) => (
              <div key={index} className="bg-muted/30 rounded-lg p-4 border border-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-1">{theme.title}</h4>
                    <p className="text-sm text-muted-foreground">{theme.description}</p>
                  </div>
                  {theme.study_ids && theme.study_ids.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewStudies(theme.study_ids)}
                      className="shrink-0 gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View studies ({theme.study_ids.length})
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
              Identified Gaps
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
                    <h4 className="font-medium text-foreground mb-1">{gap.title}</h4>
                    <p className="text-sm text-muted-foreground">{gap.description}</p>
                  </div>
                  {gap.study_ids && gap.study_ids.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewStudies(gap.study_ids)}
                      className="shrink-0 gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View studies ({gap.study_ids.length})
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
              Suggested Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.suggested_next_steps.map((step, index) => (
                <li key={index} className="flex items-start gap-3 text-sm">
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
  );
}
