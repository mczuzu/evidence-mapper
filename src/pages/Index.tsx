import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { FilterSidebar } from '@/components/FilterSidebar';
import { UnifiedSearch } from '@/components/UnifiedSearch';
import { MeshConditionSearch } from '@/components/MeshConditionSearch';
import { SearchSummary } from '@/components/SearchSummary';
import { useSearchCounts } from '@/hooks/useSearchCounts';
import { UnifiedSearchInput, paramsToSearch, parseMeshFromParams } from '@/types/search';

const Index = () => {
  const [searchParams] = useSearchParams();

  const initialSearch = paramsToSearch(searchParams);
  const [search, setSearch] = useState<UnifiedSearchInput>(initialSearch);
  const [selectedLabels, setSelectedLabels] = useState<string[]>(
    searchParams.get('labels')?.split(',').filter(Boolean) || []
  );
  const [selectedParamTypes, setSelectedParamTypes] = useState<string[]>(
    searchParams.get('paramTypes')?.split(',').filter(Boolean) || []
  );
  const [selectedMeshCondition, setSelectedMeshCondition] = useState<string | null>(
    parseMeshFromParams(searchParams)
  );

  const { data: counts, isLoading, error } = useSearchCounts({
    search,
    selectedMeshCondition,
  });

  const handleSearchChange = (value: UnifiedSearchInput) => {
    setSearch(value);
  };

  const handleLabelsChange = (labels: string[]) => {
    setSelectedLabels(labels);
  };

  const handleParamTypesChange = (types: string[]) => {
    setSelectedParamTypes(types);
  };

  const handleMeshChange = (mesh: string | null) => {
    setSelectedMeshCondition(mesh);
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
            <MeshConditionSearch value={selectedMeshCondition} onChange={handleMeshChange} />
            <UnifiedSearch value={search} onChange={handleSearchChange} />

            {error ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-destructive">
                  Error loading studies: {error.message}
                </p>
              </div>
            ) : (
              <SearchSummary
                counts={counts}
                isLoading={isLoading}
                search={search}
                selectedMeshCondition={selectedMeshCondition}
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
