import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { FilterSidebar } from '@/components/FilterSidebar';
import { UnifiedSearch } from '@/components/UnifiedSearch';
import { StudyList } from '@/components/StudyList';
import { useStudies } from '@/hooks/useStudies';
import { UnifiedSearchInput, paramsToSearch } from '@/types/search';

const Index = () => {
  const [searchParams] = useSearchParams();

  // Initialize from URL
  const initialSearch = paramsToSearch(searchParams);
  const [search, setSearch] = useState<UnifiedSearchInput>(initialSearch);
  const [selectedLabels, setSelectedLabels] = useState<string[]>(
    searchParams.get('labels')?.split(',').filter(Boolean) || []
  );
  const [selectedParamTypes, setSelectedParamTypes] = useState<string[]>(
    searchParams.get('paramTypes')?.split(',').filter(Boolean) || []
  );
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useStudies({
    search,
    selectedLabels,
    selectedParamTypes,
    page,
  });

  const handleSearchChange = (value: UnifiedSearchInput) => {
    setSearch(value);
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
            <UnifiedSearch value={search} onChange={handleSearchChange} />

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
                search={search}
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
