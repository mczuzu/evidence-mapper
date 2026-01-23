import { FilterSection } from './FilterSection';
import { Button } from '@/components/ui/button';
import { Filter, RotateCcw } from 'lucide-react';
import { allSemanticLabels, allParameterTypes } from '@/data/mockStudies';

interface FilterSidebarProps {
  selectedLabels: string[];
  setSelectedLabels: (labels: string[]) => void;
  selectedParams: string[];
  setSelectedParams: (params: string[]) => void;
}

export function FilterSidebar({
  selectedLabels,
  setSelectedLabels,
  selectedParams,
  setSelectedParams,
}: FilterSidebarProps) {
  const hasFilters = selectedLabels.length > 0 || selectedParams.length > 0;

  const clearFilters = () => {
    setSelectedLabels([]);
    setSelectedParams([]);
  };

  return (
    <aside className="w-72 flex-shrink-0 bg-card border-r border-border p-5 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h2 className="font-serif text-lg font-semibold">Filters</h2>
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-6">
        <FilterSection
          title="Semantic Labels"
          options={allSemanticLabels}
          selected={selectedLabels}
          onChange={setSelectedLabels}
        />
        
        <FilterSection
          title="Parameter Types"
          options={allParameterTypes}
          selected={selectedParams}
          onChange={setSelectedParams}
        />
      </div>
    </aside>
  );
}
