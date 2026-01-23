import { Header } from '@/components/Header';
import { FilterSidebar } from '@/components/FilterSidebar';
import { SearchInput } from '@/components/SearchInput';
import { StudyList } from '@/components/StudyList';
import { useStudyFilters } from '@/hooks/useStudyFilters';

const Index = () => {
  const {
    searchQuery,
    setSearchQuery,
    selectedLabels,
    setSelectedLabels,
    selectedParams,
    setSelectedParams,
    filteredStudies,
    totalStudies,
  } = useStudyFilters();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <FilterSidebar
          selectedLabels={selectedLabels}
          setSelectedLabels={setSelectedLabels}
          selectedParams={selectedParams}
          setSelectedParams={setSelectedParams}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by title, description, labels, or parameters..."
            />
            
            <StudyList studies={filteredStudies} totalCount={totalStudies} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
