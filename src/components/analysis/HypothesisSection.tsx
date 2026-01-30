import { useState } from 'react';
import { Compass, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SnippetCard } from './SnippetCard';
import type { DirectionHypothesis } from '@/types/analysis';

interface HypothesisSectionProps {
  hypotheses: DirectionHypothesis[];
}

const confidenceColors: Record<string, string> = {
  high: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

function HypothesisCard({ hypothesis }: { hypothesis: DirectionHypothesis }) {
  const [showContrast, setShowContrast] = useState(false);
  const hasCounterSnippets = hypothesis.counter_snippets && hypothesis.counter_snippets.length > 0;
  const supportingToShow = hypothesis.supporting_snippets?.slice(0, 3) || [];

  return (
    <div className="bg-muted/30 rounded-lg p-4 border border-border">
      <div className="flex items-start justify-between gap-4 mb-3">
        <p className="text-foreground leading-relaxed flex-1">
          {hypothesis.hypothesis}
        </p>
        <Badge
          className={`shrink-0 ${confidenceColors[hypothesis.confidence] || confidenceColors.medium}`}
          variant="outline"
        >
          {hypothesis.confidence}
        </Badge>
      </div>

      {supportingToShow.length > 0 && (
        <div className="space-y-2 mt-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Evidencia de soporte
          </p>
          {supportingToShow.map((snippet, idx) => (
            <SnippetCard key={idx} snippet={snippet} />
          ))}
        </div>
      )}

      {hasCounterSnippets && (
        <Collapsible open={showContrast} onOpenChange={setShowContrast} className="mt-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              {showContrast ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              Contraste ({hypothesis.counter_snippets!.length})
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {hypothesis.counter_snippets!.slice(0, 2).map((snippet, idx) => (
              <SnippetCard key={idx} snippet={snippet} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

export function HypothesisSection({ hypotheses }: HypothesisSectionProps) {
  const toShow = hypotheses.slice(0, 4);

  if (toShow.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            Dirección del Análisis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay suficiente evidencia en el payload para esta sección.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary" />
          Dirección del Análisis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {toShow.map((hyp, index) => (
          <HypothesisCard key={index} hypothesis={hyp} />
        ))}
      </CardContent>
    </Card>
  );
}
