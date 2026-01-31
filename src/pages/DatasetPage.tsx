import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ArrowLeft, Loader2, FlaskConical, Eye, FileSearch, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDatasetStudies, useDatasetStudiesByIds } from '@/hooks/useDatasetStudies';
import { parseFiltersFromQueryParams, buildQueryParamsFromFilters } from '@/lib/filter-utils';
import { supabaseExternal, supabaseExternalPublic } from '@/lib/supabase-external';
import { toast } from 'sonner';

const DatasetPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Check if we're in "ids" mode (specific studies) or filter mode
  const idsParam = searchParams.get('ids');
  const specificIds = useMemo(() => 
    idsParam?.split(',').filter(Boolean) || [],
    [idsParam]
  );
  const isIdsMode = specificIds.length > 0;

  // Parse filters from query params (for filter mode)
  const { searchQuery, labels, paramTypes } = useMemo(
    () => parseFiltersFromQueryParams(searchParams),
    [searchParams]
  );

  // Use appropriate hook based on mode
  const filterQuery = useDatasetStudies({
    searchQuery,
    selectedLabels: labels,
    selectedParamTypes: paramTypes,
    page,
  });

  const idsQuery = useDatasetStudiesByIds(specificIds);

  const { data, isLoading, error } = isIdsMode ? idsQuery : filterQuery;

  const studies = data?.studies || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 0;

  // Handle navigation back with preserved query params
  const handleBack = () => {
    if (isIdsMode) {
      navigate(-1);
    } else {
      const queryString = buildQueryParamsFromFilters(searchQuery, labels, paramTypes);
      navigate(queryString ? `/?${queryString}` : '/');
    }
  };

  // Toggle single study selection
  const toggleSelection = (nctId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nctId)) {
        next.delete(nctId);
      } else {
        next.add(nctId);
      }
      return next;
    });
  };

  // Toggle all visible studies
  const toggleSelectAll = () => {
    const allVisibleIds = studies.map((s) => s.nct_id);
    const allSelected = allVisibleIds.every((id) => selectedIds.has(id));
    
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allVisibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allVisibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const allVisibleSelected = studies.length > 0 && studies.every((s) => selectedIds.has(s.nct_id));
  const someVisibleSelected = studies.some((s) => selectedIds.has(s.nct_id));

  // Navigate to study detail
  const handleViewStudy = (nctId: string) => {
    navigate(`/study/${nctId}`);
  };

  // Analyze selected studies
  const handleAnalyze = async () => {
    const nctIds = Array.from(selectedIds);
    if (nctIds.length === 0) return;

    setIsAnalyzing(true);

    try {
      // Call the analyze-direction edge function using the Supabase client
      const { data: result, error: fnError } = await supabaseExternal.functions.invoke('analyze-direction', {
        body: { nct_ids: nctIds },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Analysis failed');
      }

      if (!result) {
        throw new Error('No data returned from analysis');
      }

      // Generate a NEW analysisId per run (no reuse)
      const analysisId = crypto.randomUUID();

      // Persist the FULL response payload to the external project
      const { error: insertError } = await supabaseExternalPublic
        .from('analysis_runs')
        .insert({
          id: analysisId,
          nct_ids: nctIds,
          result,
        });

      if (insertError) {
        console.error('Error saving analysis:', insertError);
        throw new Error('Failed to save analysis results');
      }

      // Navigate to the analysis page using the NEW analysisId
      navigate(`/analysis/${analysisId}`, {
        state: {
          run: {
            id: analysisId,
            nct_ids: nctIds,
            result,
          },
        },
      });
    } catch (err) {
      console.error('Analysis error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to analyze studies');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header bar */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {isIdsMode ? 'Volver' : 'Volver a filtros'}
              </Button>
              <h1 className="font-serif text-xl font-bold text-foreground">
                {isIdsMode 
                  ? `Estudios seleccionados: ${specificIds.length}` 
                  : `Dataset: ${totalCount.toLocaleString()} estudios`
                }
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Seleccionados: <span className="font-medium text-foreground">{selectedIds.size}</span>
              </span>
              <Button
                onClick={handleAnalyze}
                disabled={selectedIds.size === 0 || isAnalyzing}
                className="gap-2"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FlaskConical className="h-4 w-4" />
                )}
                {isAnalyzing ? 'Analizando...' : 'Analizar seleccionados'}
              </Button>
            </div>
          </div>

          {/* Banner for IDs mode */}
          {isIdsMode && (
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-primary">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Vista filtrada por estudios relacionados
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
                className="gap-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver al dataset anterior
              </Button>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive">
                Error loading dataset: {error.message}
              </p>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Loading studies...</p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && studies.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileSearch className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">
                No studies found
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Try adjusting your filters to see more results.
              </p>
            </div>
          )}

          {/* Table */}
          {!isLoading && !error && studies.length > 0 && (
            <>
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={allVisibleSelected}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all"
                          className={someVisibleSelected && !allVisibleSelected ? 'opacity-50' : ''}
                        />
                      </TableHead>
                      <TableHead className="w-32">NCT ID</TableHead>
                      <TableHead>Brief Title</TableHead>
                      <TableHead className="w-48">Labels</TableHead>
                      <TableHead className="w-24 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studies.map((study) => (
                      <TableRow 
                        key={study.nct_id}
                        className={selectedIds.has(study.nct_id) ? 'bg-primary/5' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(study.nct_id)}
                            onCheckedChange={() => toggleSelection(study.nct_id)}
                            aria-label={`Select ${study.nct_id}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {study.nct_id}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-foreground line-clamp-2">
                            {study.brief_title}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {study.semantic_labels?.join(', ') || '—'}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewStudy(study.nct_id)}
                            className="gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination - only show in filter mode */}
              {!isIdsMode && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DatasetPage;
