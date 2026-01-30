import { Quote } from 'lucide-react';
import type { Snippet } from '@/types/analysis';

interface SnippetCardProps {
  snippet: Snippet;
}

export function SnippetCard({ snippet }: SnippetCardProps) {
  return (
    <div className="bg-muted/50 rounded-md p-3 border border-border/50">
      <div className="flex items-start gap-2">
        <Quote className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground italic leading-relaxed">
            "{snippet.quote}"
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span className="font-mono">{snippet.nct_id}</span>
            <span>•</span>
            <span>{snippet.source_field}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
