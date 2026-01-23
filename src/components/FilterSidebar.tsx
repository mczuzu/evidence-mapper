import { FilterSection } from './FilterSection';
import { Button } from '@/components/ui/button';
import { Filter, RotateCcw, Loader2 } from 'lucide-react';
import { useSemanticLabelsFacet, useParamTypeFacet } from '@/hooks/useStudies';

interface FilterSidebarProps {
  selectedLabels: string[];
  setSelectedLabels: (labels: string[]) => void;
  selectedParamTypes: string[];
  setSelectedParamTypes: (types: string[]) => void;
}

export function FilterSidebar({
  selectedLabels,
  setSelectedLabels,
  selectedParamTypes,
  setSelectedParamTypes,
}: FilterSidebarProps) {
  const { data: semanticLabels, isLoading: labelsLoading } = useSemanticLabelsFacet();
  const { data: paramTypes, isLoading: paramTypesLoading } = useParamTypeFacet();

  const hasFilters = selectedLabels.length > 0 || selectedParamTypes.length > 0;

  const clearFilters = () => {
    setSelectedLabels([]);
    setSelectedParamTypes([]);
  };

  const labelOptions = semanticLabels?.map((l) => ({
    value: l.label,
    count: l.n_studies,
  })) || [];

  const paramTypeOptions = paramTypes?.map((p) => ({
    value: p.param_type,
    count: p.n_studies,
  })) || [];

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
        {labelsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading labels...
          </div>
        ) : (
          <FilterSection
            title="Semantic Labels"
            options={labelOptions}
            selected={selectedLabels}
            onChange={setSelectedLabels}
          />
        )}

        {paramTypesLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading param types...
          </div>
        ) : (
          <FilterSection
            title="Parameter Types"
            options={paramTypeOptions}
            selected={selectedParamTypes}
            onChange={setSelectedParamTypes}
          />
        )}
      </div>
    </aside>
  );
}
