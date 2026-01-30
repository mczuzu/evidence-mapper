import { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SnippetCard } from './SnippetCard';
import type { NextStudy } from '@/types/analysis';

interface NextStudiesSectionProps {
  studies: NextStudy[];
}

function NextStudyCard({ study, index }: { study: NextStudy; index: number }) {
  const [showEvidence, setShowEvidence] = useState(false);
  const hasEvidence = study.evidence_basis_snippets && study.evidence_basis_snippets.length > 0;

  return (
    <div className="bg-muted/30 rounded-lg p-4 border border-border">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground mb-2">{study.title}</h4>

          <div className="grid gap-2 text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground shrink-0">Población:</span>
              <span className="text-foreground">{study.population}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground shrink-0">Intervención:</span>
              <span className="text-foreground">{study.intervention}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground shrink-0">Comparador:</span>
              <span className="text-foreground">{study.comparator}</span>
            </div>
            {study.follow_up && (
              <div className="flex gap-2">
                <span className="text-muted-foreground shrink-0">Seguimiento:</span>
                <span className="text-foreground">{study.follow_up}</span>
              </div>
            )}
          </div>

          {study.primary_outcomes && study.primary_outcomes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {study.primary_outcomes.map((outcome, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {outcome}
                </Badge>
              ))}
            </div>
          )}

          {study.why_this_design && (
            <p className="text-sm text-muted-foreground mt-3 italic">
              {study.why_this_design}
            </p>
          )}

          {hasEvidence && (
            <Collapsible open={showEvidence} onOpenChange={setShowEvidence} className="mt-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground p-0 h-auto">
                  {showEvidence ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  Base de evidencia ({study.evidence_basis_snippets!.length})
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {study.evidence_basis_snippets!.slice(0, 3).map((snippet, idx) => (
                  <SnippetCard key={idx} snippet={snippet} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  );
}

export function NextStudiesSection({ studies }: NextStudiesSectionProps) {
  if (!studies || studies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Próximos Pasos Sugeridos
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
          <ArrowRight className="h-5 w-5 text-primary" />
          Próximos Pasos Sugeridos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {studies.map((study, index) => (
          <NextStudyCard key={index} study={study} index={index} />
        ))}
      </CardContent>
    </Card>
  );
}
