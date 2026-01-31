import { DirectionSection } from './DirectionSection';
import { ClusterMapSection } from './ClusterMapSection';
import { GapsV3Section } from './GapsV3Section';
import { NextStudiesV3Section } from './NextStudiesV3Section';
import { AnalysisStatusBanner } from './AnalysisStatusBanner';
import type { AnalysisV3 } from '@/types/analysis';

interface V3AnalysisContentProps {
  analysis: AnalysisV3;
}

export function V3AnalysisContent({ analysis }: V3AnalysisContentProps) {
  // Check if analysis is essentially empty
  const hasDirection = analysis.direction && analysis.direction.summary;
  const hasClusterMap = analysis.cluster_map && (
    (analysis.cluster_map.interventions?.length ?? 0) > 0 ||
    (analysis.cluster_map.populations?.length ?? 0) > 0 ||
    (analysis.cluster_map.outcomes?.length ?? 0) > 0 ||
    (analysis.cluster_map.mechanisms_or_rationale?.length ?? 0) > 0
  );
  const hasGaps = analysis.gaps && (
    (analysis.gaps.evidence_gaps?.length ?? 0) > 0 ||
    (analysis.gaps.design_gaps?.length ?? 0) > 0 ||
    (analysis.gaps.missing_subgroups?.length ?? 0) > 0
  );
  const hasNextStudies = analysis.next_studies && (
    (analysis.next_studies.proposals?.length ?? 0) > 0 ||
    (analysis.next_studies.quick_wins?.length ?? 0) > 0
  );

  // Completely empty analysis
  if (!hasDirection && !hasClusterMap && !hasGaps && !hasNextStudies) {
    return <AnalysisStatusBanner type="empty" />;
  }

  // Partial analysis (has direction but missing other sections)
  const isPartial = hasDirection && (!hasClusterMap || !hasGaps || !hasNextStudies);

  return (
    <div className="space-y-6">
      {isPartial && <AnalysisStatusBanner type="partial" />}
      
      {/* 1. Direction (always shown - has its own empty state) */}
      <DirectionSection direction={analysis.direction} />

      {/* 2. Cluster Map (semi-obligatory) */}
      <ClusterMapSection clusterMap={analysis.cluster_map} />

      {/* 3. Gaps (critical) */}
      <GapsV3Section gaps={analysis.gaps} />

      {/* 4. Next Studies (optional) */}
      <NextStudiesV3Section nextStudies={analysis.next_studies} />
    </div>
  );
}
