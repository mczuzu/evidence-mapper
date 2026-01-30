import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SnippetCard } from './SnippetCard';
import type { OpportunityGap } from '@/types/analysis';
import { extractNctIdsFromSnippets } from '@/types/analysis';

interface GapsSectionProps {
  gaps: OpportunityGap[];
}

function GapCard({ gap }: { gap: OpportunityGap }) {
  const navigate = useNavigate();
  const [showSnippets, setShowSnippets] = useState(false);
  const nctIds = extractNctIdsFromSnippets(gap.snippets);

  const handleViewStudies = () => {
    if (nctIds.length > 0) {
      navigate(`/dataset?ids=${nctIds.join(',')}`);
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-medium text-foreground mb-1">{gap.gap}</h4>
          <p className="text-sm text-muted-foreground">{gap.impact_if_filled}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {gap.snippets && gap.snippets.length > 0 && (
            <Collapsible open={showSnippets} onOpenChange={setShowSnippets}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  {showSnippets ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  Ver citas
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          )}
          {nctIds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewStudies}
              className="gap-1"
            >
              <Eye className="h-3.5 w-3.5" />
              Ver estudios ({nctIds.length})
            </Button>
          )}
        </div>
      </div>

      {gap.snippets && gap.snippets.length > 0 && (
        <Collapsible open={showSnippets} onOpenChange={setShowSnippets}>
          <CollapsibleContent className="space-y-2 mt-3">
            {gap.snippets.map((snippet, idx) => (
              <SnippetCard key={idx} snippet={snippet} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

export function GapsSection({ gaps }: GapsSectionProps) {
  if (!gaps || gaps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Brechas Identificadas
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
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Brechas Identificadas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {gaps.map((gap, index) => (
          <GapCard key={index} gap={gap} />
        ))}
      </CardContent>
    </Card>
  );
}
