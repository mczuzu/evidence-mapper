import { AlertTriangle, FileSearch, Wrench, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NctIdList } from './NctIdChip';
import type { Gaps, GapItem } from '@/types/analysis';

interface GapsV3SectionProps {
  gaps: Gaps | undefined;
}

interface GapSubsectionProps {
  title: string;
  icon: React.ReactNode;
  items: GapItem[];
  colorClass: string;
}

function GapSubsection({ title, icon, items, colorClass }: GapSubsectionProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        {icon}
        {title}
      </h4>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className={`rounded-lg p-4 border ${colorClass}`}>
            <p className="text-foreground mb-2">{item.gap}</p>
            <NctIdList nctIds={item.supporting_nct_ids || []} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GapsV3Section({ gaps }: GapsV3SectionProps) {
  if (!gaps) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Gaps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            No concrete evidence gaps could be identified from the current dataset.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasEvidenceGaps = gaps.evidence_gaps && gaps.evidence_gaps.length > 0;
  const hasDesignGaps = gaps.design_gaps && gaps.design_gaps.length > 0;
  const hasMissingSubgroups = gaps.missing_subgroups && gaps.missing_subgroups.length > 0;

  const hasAny = hasEvidenceGaps || hasDesignGaps || hasMissingSubgroups;

  if (!hasAny) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Gaps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            No concrete evidence gaps could be identified from the current dataset.
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
          Gaps
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <GapSubsection
          title="Evidence Gaps"
          icon={<FileSearch className="h-4 w-4" />}
          items={gaps.evidence_gaps || []}
          colorClass="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
        />
        <GapSubsection
          title="Design Gaps"
          icon={<Wrench className="h-4 w-4" />}
          items={gaps.design_gaps || []}
          colorClass="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
        />
        <GapSubsection
          title="Missing Subgroups"
          icon={<Users className="h-4 w-4" />}
          items={gaps.missing_subgroups || []}
          colorClass="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
        />
      </CardContent>
    </Card>
  );
}
