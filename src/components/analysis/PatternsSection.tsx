import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SnippetCard } from './SnippetCard';
import type { Pattern } from '@/types/analysis';
import { extractNctIdsFromSnippets } from '@/types/analysis';

interface PatternsSectionProps {
  patterns: Pattern[];
}

function PatternCard({ pattern }: { pattern: Pattern }) {
  const navigate = useNavigate();
  const [showSnippets, setShowSnippets] = useState(false);
  const nctIds = extractNctIdsFromSnippets(pattern.snippets);

  const handleViewStudies = () => {
    if (nctIds.length > 0) {
      navigate(`/dataset?ids=${nctIds.join(',')}`);
    }
  };

  return (
    <div className="bg-muted/30 rounded-lg p-4 border border-border">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-medium text-foreground mb-1">{pattern.pattern}</h4>
          <p className="text-sm text-muted-foreground">{pattern.interpretation}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {pattern.snippets && pattern.snippets.length > 0 && (
            <Collapsible open={showSnippets} onOpenChange={setShowSnippets}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  {showSnippets ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  View citations
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          )}
          {nctIds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewStudies}
              className="gap-1"
            >
              <Eye className="h-3.5 w-3.5" />
              View studies ({nctIds.length})
            </Button>
          )}
        </div>
      </div>

      {pattern.snippets && pattern.snippets.length > 0 && (
        <Collapsible open={showSnippets} onOpenChange={setShowSnippets}>
          <CollapsibleContent className="space-y-2 mt-3">
            {pattern.snippets.map((snippet, idx) => (
              <SnippetCard key={idx} snippet={snippet} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

export function PatternsSection({ patterns }: PatternsSectionProps) {
  if (!patterns || patterns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Identified Themes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Not enough evidence in the payload for this section.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
            Identified Themes
          </CardTitle>
        </CardHeader>
      <CardContent className="space-y-4">
        {patterns.map((pattern, index) => (
          <PatternCard key={index} pattern={pattern} />
        ))}
      </CardContent>
    </Card>
  );
}
