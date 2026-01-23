import { Study } from '@/types/study';
import { SemanticBadge } from './SemanticBadge';
import { MetricDisplay } from './MetricDisplay';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface StudyCardProps {
  study: Study;
}

export function StudyCard({ study }: StudyCardProps) {
  const formattedDate = new Date(study.publicationDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card className="group transition-all duration-200 hover:shadow-card-hover animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-serif text-lg font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">
            {study.title}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formattedDate}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {study.description}
        </p>
        
        <div className="flex flex-wrap gap-1.5">
          {study.semanticLabels.map((label, index) => (
            <SemanticBadge key={index} type={label.type} value={label.value} />
          ))}
        </div>
        
        <div className="pt-3 border-t border-border">
          <div className="flex justify-around">
            <MetricDisplay label="Outcomes" value={study.metrics.outcomes} />
            <MetricDisplay label="Results" value={study.metrics.results} />
            <MetricDisplay label="Participants" value={study.metrics.participants} />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1.5 pt-2">
          {study.parameterTypes.map((param, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground"
            >
              {param}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
