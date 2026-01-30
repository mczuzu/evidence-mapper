import { StudyListItem } from '@/types/database';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, FlaskConical, Users, FileText, BarChart3 } from 'lucide-react';
import { useState } from 'react';

interface StudyCardProps {
  study: StudyListItem;
}

export function StudyCard({ study }: StudyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {study.nct_id}
              </span>
              {study.has_placebo_or_control_label && (
                <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                  <FlaskConical className="h-3 w-3 mr-1" />
                  Placebo/Control
                </Badge>
              )}
            </div>
            <h3 className="font-serif text-base font-semibold leading-snug text-foreground">
              {study.brief_title}
            </h3>
          </div>
        </div>

        {study.official_title && study.official_title !== study.brief_title && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Hide official title
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Show official title
              </>
            )}
          </button>
        )}

        {isExpanded && study.official_title && (
          <p className="text-sm text-muted-foreground mt-2 pl-3 border-l-2 border-muted">
            {study.official_title}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metrics */}
        <div className="grid grid-cols-4 gap-3">
          <MetricItem
            icon={<BarChart3 className="h-4 w-4" />}
            label="Results"
            value={study.n_result_rows}
          />
          <MetricItem
            icon={<FileText className="h-4 w-4" />}
            label="Outcomes"
            value={study.n_unique_outcomes}
          />
          <MetricItem
            icon={<Users className="h-4 w-4" />}
            label="Total N"
            value={study.total_n_reported}
          />
          <MetricItem
            icon={<Users className="h-4 w-4" />}
            label="Max N"
            value={study.max_n_reported}
          />
        </div>

        {/* Semantic Labels */}
        {study.semantic_labels && study.semantic_labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {study.semantic_labels.map((label, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {label}
              </Badge>
            ))}
          </div>
        )}

        {/* Param Types */}
        {study.param_type_set && study.param_type_set.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
            {study.param_type_set.map((param, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground"
              >
                {param}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
}) {
  return (
    <div className="flex flex-col items-center text-center p-2 rounded-md bg-muted/50">
      <div className="text-muted-foreground mb-1">{icon}</div>
      <span className="text-sm font-semibold text-foreground">
        {value != null ? value.toLocaleString() : '—'}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
