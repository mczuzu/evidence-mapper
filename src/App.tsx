import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnalysisStoreProvider } from "@/state/analysis-store";
import Index from "./pages/Index";
import DatasetPage from "./pages/DatasetPage";
import AnalysisPage from "./pages/AnalysisPage";
import StudyDetailPage from "./pages/StudyDetailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AnalysisStoreProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dataset" element={<DatasetPage />} />
            <Route path="/analysis/:analysisId" element={<AnalysisPage />} />
            <Route path="/study/:nctId" element={<StudyDetailPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AnalysisStoreProvider>
  </QueryClientProvider>
);

export default App;
