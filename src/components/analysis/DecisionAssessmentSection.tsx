import { FileCheck2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarkdownText } from './MarkdownText';
import type { DecisionAssessment } from '@/types/analysis';

interface DecisionAssessmentSectionProps {
  decisionAssessment: DecisionAssessment | undefined;
}

export function DecisionAssessmentSection({ decisionAssessment }: DecisionAssessmentSectionProps) {
  if (!decisionAssessment || !decisionAssessment.markdown_report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-primary" />
            Decision-Oriented Evidence Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            No decision assessment could be generated from the current evidence base.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <FileCheck2 className="h-5 w-5 text-primary" />
          Decision-Oriented Evidence Assessment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MarkdownText className="text-foreground">
          {decisionAssessment.markdown_report}
        </MarkdownText>
      </CardContent>
    </Card>
  );
}
