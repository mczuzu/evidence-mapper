import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { FilterSidebar } from '@/components/FilterSidebar';
import { SearchInput } from '@/components/SearchInput';
import { StudyList } from '@/components/StudyList';
import { useStudies } from '@/hooks/useStudies';
import { parseFiltersFromQueryParams } from '@/lib/filter-utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const Index = () => {
  const [searchParams] = useSearchParams();
  
  // Initialize state from query params
  const initialFilters = parseFiltersFromQueryParams(searchParams);
  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery);
  const [selectedLabels, setSelectedLabels] = useState<string[]>(initialFilters.labels);
  const [selectedParamTypes, setSelectedParamTypes] = useState<string[]>(initialFilters.paramTypes);
  const [page, setPage] = useState(0);
  const [advancedSearch, setAdvancedSearch] = useState(false);

  const { data, isLoading, error } = useStudies({
    searchQuery,
    selectedLabels,
    selectedParamTypes,
    page,
    advancedSearch,
  });

  // Reset page when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(0);
  };

  const handleLabelsChange = (labels: string[]) => {
    setSelectedLabels(labels);
    setPage(0);
  };

  const handleParamTypesChange = (types: string[]) => {
    setSelectedParamTypes(types);
    setPage(0);
  };

  const handleAdvancedSearchChange = (checked: boolean) => {
    setAdvancedSearch(checked);
    setPage(0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <FilterSidebar
          selectedLabels={selectedLabels}
          setSelectedLabels={handleLabelsChange}
          selectedParamTypes={selectedParamTypes}
          setSelectedParamTypes={handleParamTypesChange}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="space-y-3">
              <SearchInput
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by title (brief or official)..."
              />
              
              <div className="flex items-center gap-3">
                <Switch
                  id="advanced-search"
                  checked={advancedSearch}
                  onCheckedChange={handleAdvancedSearchChange}
                />
                <Label 
                  htmlFor="advanced-search" 
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Expanded content search (title + summary + conditions)
                </Label>
              </div>
            </div>

            {error ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-destructive">
                  Error loading studies: {error.message}
                </p>
              </div>
            ) : (
              <StudyList
                studies={data?.studies || []}
                totalCount={data?.totalCount || 0}
                currentPage={data?.currentPage || 0}
                totalPages={data?.totalPages || 0}
                isLoading={isLoading}
                onPageChange={setPage}
                searchQuery={searchQuery}
                selectedLabels={selectedLabels}
                selectedParamTypes={selectedParamTypes}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
