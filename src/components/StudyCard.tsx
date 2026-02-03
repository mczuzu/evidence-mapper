import { StudyListItem } from '@/types/database';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Tag } from 'lucide-react';
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
              {study.n_semantic_labels != null && study.n_semantic_labels > 0 && (
                <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                  <Tag className="h-3 w-3 mr-1" />
                  {study.n_semantic_labels} labels
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
      </CardContent>
    </Card>
  );
}
