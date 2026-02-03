import { Compass, TrendingUp, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NctIdList } from './NctIdChip';
import { MarkdownText } from './MarkdownText';
import type { Direction } from '@/types/analysis';

interface DirectionSectionProps {
  direction: Direction | undefined;
}

export function DirectionSection({ direction }: DirectionSectionProps) {
  // No direction at all
  if (!direction || !direction.summary) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Compass className="h-5 w-5 text-destructive" />
            Direction · Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            No directional signal could be extracted from the selected studies.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasPromising = direction.what_is_promising && direction.what_is_promising.length > 0;
  const hasUncertain = direction.what_is_uncertain && direction.what_is_uncertain.length > 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            Direction · Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MarkdownText className="text-foreground leading-relaxed">{direction.summary}</MarkdownText>
        </CardContent>
      </Card>

      {/* What is promising */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-500" />
            What is promising
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasPromising ? (
            <ul className="space-y-4">
              {direction.what_is_promising.map((item, idx) => (
                <li key={idx} className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <MarkdownText className="text-foreground mb-2">{item.rationale}</MarkdownText>
                  <NctIdList nctIds={item.supporting_nct_ids || []} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No consistent promising signals detected across the selected studies.
            </p>
          )}
        </CardContent>
      </Card>

      {/* What is uncertain */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            What is uncertain
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasUncertain ? (
            <ul className="space-y-4">
              {direction.what_is_uncertain.map((item, idx) => (
                <li key={idx} className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                  <MarkdownText className="text-foreground mb-2">{item.rationale}</MarkdownText>
                  <NctIdList nctIds={item.supporting_nct_ids || []} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Key uncertainties could not be clearly identified from the available evidence.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
