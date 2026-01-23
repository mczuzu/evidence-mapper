import { cn } from '@/lib/utils';
import { SemanticLabelType } from '@/types/study';

interface SemanticBadgeProps {
  type: SemanticLabelType;
  value: string;
  className?: string;
}

const badgeStyles: Record<SemanticLabelType, string> = {
  placebo: 'bg-label-placebo text-label-placebo-foreground',
  drug: 'bg-label-drug text-label-drug-foreground',
  cohort: 'bg-label-cohort text-label-cohort-foreground',
  dose: 'bg-label-dose text-label-dose-foreground',
  outcome: 'bg-label-outcome text-label-outcome-foreground',
};

export function SemanticBadge({ type, value, className }: SemanticBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        badgeStyles[type],
        className
      )}
    >
      {value}
    </span>
  );
}
