import { useNavigate } from 'react-router-dom';
import { StudyListItem } from '@/types/database';
import { StudyCard } from './StudyCard';
import { FileSearch, Loader2, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchInput, searchToParams } from '@/types/search';

interface StudyListProps {
  studies: StudyListItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  search?: UnifiedSearchInput;
  selectedLabels?: string[];
  selectedParamTypes?: string[];
  selectedMeshConditions?: string[];
}

export function StudyList({
  studies,
  totalCount,
  currentPage,
  totalPages,
  isLoading,
  onPageChange,
  search,
  selectedLabels = [],
  selectedParamTypes = [],
  selectedMeshConditions = [],
}: StudyListProps) {
  const navigate = useNavigate();

  const handleViewDataset = () => {
    const params = search ? searchToParams(search, selectedMeshConditions) : new URLSearchParams();
    if (selectedLabels.length > 0) params.set('labels', selectedLabels.join(','));
    if (selectedParamTypes.length > 0) params.set('paramTypes', selectedParamTypes.join(','));
    
    const queryString = params.toString();
    navigate(queryString ? `/dataset?${queryString}` : '/dataset');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Loading studies...</p>
      </div>
    );
  }

  if (studies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileSearch className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-serif text-lg font-semibold text-foreground mb-2">
          No studies found
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Try adjusting your search terms or clearing some filters to see more results.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {totalCount === 500 && (
        <div className="rounded-md border border-border bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
          Showing top 500 results. Refine your search to narrow down.
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing{' '}
          <span className="font-medium text-foreground">
            {currentPage * 20 + 1}–{Math.min((currentPage + 1) * 20, totalCount)}
          </span>{' '}
          of <span className="font-medium text-foreground">{totalCount.toLocaleString()}</span> studies
        </p>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewDataset}
          className="gap-2"
        >
          <Database className="h-4 w-4" />
          View dataset ({totalCount.toLocaleString()})
        </Button>
      </div>

      <div className="grid gap-4">
        {studies.map((study) => (
          <StudyCard key={study.nct_id} study={study} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
