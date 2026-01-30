import { useSearchParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DatasetPage = () => {
  const [searchParams] = useSearchParams();
  
  // Read filters from query params
  const searchQuery = searchParams.get('q') || '';
  const labels = searchParams.get('labels')?.split(',').filter(Boolean) || [];
  const paramTypes = searchParams.get('paramTypes')?.split(',').filter(Boolean) || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to list
              </Link>
            </Button>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <h1 className="font-serif text-2xl font-bold text-foreground mb-4">
              Dataset View
            </h1>
            <p className="text-muted-foreground mb-6">
              This page will display the full dataset based on current filters.
            </p>
            
            <div className="bg-muted/50 rounded-md p-4 space-y-2">
              <p className="text-sm font-medium">Active filters:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Search: {searchQuery || '(none)'}</li>
                <li>Labels: {labels.length > 0 ? labels.join(', ') : '(none)'}</li>
                <li>Param types: {paramTypes.length > 0 ? paramTypes.join(', ') : '(none)'}</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DatasetPage;
