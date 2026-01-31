import { AlertCircle, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AnalysisStatusBannerProps {
  type: 'loading' | 'partial' | 'empty' | 'error';
  studyCount?: number;
  message?: string;
}

export function AnalysisStatusBanner({ type, studyCount, message }: AnalysisStatusBannerProps) {
  if (type === 'loading') {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
            <p className="text-sm text-foreground">
              Analyzing {studyCount ?? 'selected'} studies…
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'partial') {
    return (
      <Card className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
            <Info className="h-5 w-5" />
            <p className="text-sm">
              Some analytical dimensions could not be inferred from the available study data.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'empty') {
    return (
      <Card className="border-muted bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Info className="h-5 w-5" />
            <p className="text-sm">
              The selected studies do not provide enough structured information for directional analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{message || 'An error occurred while loading the analysis.'}</p>
        </div>
      </CardContent>
    </Card>
  );
}
