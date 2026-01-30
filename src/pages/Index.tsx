import { useState } from 'react';
import { Header } from '@/components/Header';
import { FilterSidebar } from '@/components/FilterSidebar';
import { SearchInput } from '@/components/SearchInput';
import { StudyList } from '@/components/StudyList';
import { useStudies } from '@/hooks/useStudies';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedParamTypes, setSelectedParamTypes] = useState<string[]>([]);
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useStudies({
    searchQuery,
    selectedLabels,
    selectedParamTypes,
    page,
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
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by title (brief or official)..."
            />

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
