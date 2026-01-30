import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AnalysisPage = () => {
  const { analysisId } = useParams<{ analysisId: string }>();

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
              Analysis Details
            </h1>
            <p className="text-muted-foreground mb-6">
              This page will display details for analysis ID: <code className="bg-muted px-2 py-1 rounded">{analysisId}</code>
            </p>
            
            <div className="bg-muted/50 rounded-md p-4">
              <p className="text-sm text-muted-foreground">
                Analysis content will be loaded here.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnalysisPage;
