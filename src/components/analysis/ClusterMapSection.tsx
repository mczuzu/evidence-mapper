import { Layers, Users, Target, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NctIdList } from './NctIdChip';
import type { ClusterMap, ClusterItem } from '@/types/analysis';

interface ClusterMapSectionProps {
  clusterMap: ClusterMap | undefined;
}

interface ClusterSubsectionProps {
  title: string;
  icon: React.ReactNode;
  items: ClusterItem[];
}

function ClusterSubsection({ title, icon, items }: ClusterSubsectionProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        {icon}
        {title}
      </h4>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="bg-muted/30 rounded-lg p-4 border border-border">
            <h5 className="font-medium text-foreground mb-1">{item.label}</h5>
            <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
            <NctIdList nctIds={item.supporting_nct_ids || []} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClusterMapSection({ clusterMap }: ClusterMapSectionProps) {
  if (!clusterMap) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Cluster Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            No clear clustering patterns emerged from the selected studies.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasInterventions = clusterMap.interventions && clusterMap.interventions.length > 0;
  const hasPopulations = clusterMap.populations && clusterMap.populations.length > 0;
  const hasOutcomes = clusterMap.outcomes && clusterMap.outcomes.length > 0;
  const hasMechanisms = clusterMap.mechanisms_or_rationale && clusterMap.mechanisms_or_rationale.length > 0;

  const hasAny = hasInterventions || hasPopulations || hasOutcomes || hasMechanisms;

  if (!hasAny) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Cluster Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            No clear clustering patterns emerged from the selected studies.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Cluster Map
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ClusterSubsection
          title="Interventions"
          icon={<Target className="h-4 w-4" />}
          items={clusterMap.interventions || []}
        />
        <ClusterSubsection
          title="Populations"
          icon={<Users className="h-4 w-4" />}
          items={clusterMap.populations || []}
        />
        <ClusterSubsection
          title="Outcomes"
          icon={<Target className="h-4 w-4" />}
          items={clusterMap.outcomes || []}
        />
        <ClusterSubsection
          title="Mechanisms or Rationale"
          icon={<Brain className="h-4 w-4" />}
          items={clusterMap.mechanisms_or_rationale || []}
        />
      </CardContent>
    </Card>
  );
}
