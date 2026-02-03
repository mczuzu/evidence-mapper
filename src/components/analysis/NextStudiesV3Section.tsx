import { ArrowRight, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NctIdList } from './NctIdChip';
import { MarkdownText } from './MarkdownText';
import type { NextStudies, StudyProposal, QuickWin } from '@/types/analysis';

interface NextStudiesV3SectionProps {
  nextStudies: NextStudies | undefined;
}

function ProposalCard({ proposal, index }: { proposal: StudyProposal; index: number }) {
  return (
    <div className="bg-muted/30 rounded-lg p-4 border border-border">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0 space-y-3">
          {/* PICO details */}
          <div className="grid gap-2 text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground shrink-0 font-medium">Population:</span>
              <span className="text-foreground">{proposal.population}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground shrink-0 font-medium">Intervention:</span>
              <span className="text-foreground">{proposal.intervention}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground shrink-0 font-medium">Comparator:</span>
              <span className="text-foreground">{proposal.comparator}</span>
            </div>
            {proposal.follow_up_horizon && (
              <div className="flex gap-2">
                <span className="text-muted-foreground shrink-0 font-medium">Follow-up:</span>
                <span className="text-foreground">{proposal.follow_up_horizon}</span>
              </div>
            )}
          </div>

          {/* Primary outcomes */}
          {proposal.primary_outcomes && proposal.primary_outcomes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {proposal.primary_outcomes.map((outcome, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {outcome}
                </Badge>
              ))}
            </div>
          )}

          {/* Why it resolves a gap */}
          {proposal.why_it_resolves_a_gap && (
            <div className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">
              <MarkdownText>{proposal.why_it_resolves_a_gap}</MarkdownText>
            </div>
          )}

          {/* Supporting NCT IDs */}
          <NctIdList nctIds={proposal.supporting_nct_ids || []} />
        </div>
      </div>
    </div>
  );
}

function QuickWinCard({ quickWin, index }: { quickWin: QuickWin; index: number }) {
  return (
    <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
      <div className="flex items-start gap-3">
        <Zap className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <MarkdownText className="text-foreground mb-2">{quickWin.description}</MarkdownText>
          <NctIdList nctIds={quickWin.supporting_nct_ids || []} />
        </div>
      </div>
    </div>
  );
}

export function NextStudiesV3Section({ nextStudies }: NextStudiesV3SectionProps) {
  if (!nextStudies) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Next Studies / Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            No specific follow-up studies can be proposed based on the current evidence.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasProposals = nextStudies.proposals && nextStudies.proposals.length > 0;
  const hasQuickWins = nextStudies.quick_wins && nextStudies.quick_wins.length > 0;

  if (!hasProposals && !hasQuickWins) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Next Studies / Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            No specific follow-up studies can be proposed based on the current evidence.
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
          Next Studies / Opportunities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Proposed Studies */}
        {hasProposals && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Proposed Studies</h4>
            <div className="space-y-4">
              {nextStudies.proposals.map((proposal, idx) => (
                <ProposalCard key={idx} proposal={proposal} index={idx} />
              ))}
            </div>
          </div>
        )}

        {/* Quick Wins */}
        {hasQuickWins && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-600" />
              Quick Wins
            </h4>
            <div className="space-y-3">
              {nextStudies.quick_wins.map((quickWin, idx) => (
                <QuickWinCard key={idx} quickWin={quickWin} index={idx} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
