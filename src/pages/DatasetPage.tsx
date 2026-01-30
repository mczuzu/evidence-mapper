import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ArrowLeft, Loader2, FlaskConical, Eye, FileSearch } from 'lucide-react';
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
import { useDatasetStudies } from '@/hooks/useDatasetStudies';
import { parseFiltersFromQueryParams, buildQueryParamsFromFilters, truncateText } from '@/lib/filter-utils';

const DatasetPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);

  // Parse filters from query params
  const { searchQuery, labels, paramTypes } = useMemo(
    () => parseFiltersFromQueryParams(searchParams),
    [searchParams]
  );

  const { data, isLoading, error } = useDatasetStudies({
    searchQuery,
    selectedLabels: labels,
    selectedParamTypes: paramTypes,
    page,
  });

  const studies = data?.studies || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 0;

  // Handle navigation back with preserved query params
  const handleBack = () => {
    const queryString = buildQueryParamsFromFilters(searchQuery, labels, paramTypes);
    navigate(queryString ? `/?${queryString}` : '/');
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
      // Deselect all visible
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allVisibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      // Select all visible
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

  // Analyze selected (placeholder for now)
  const handleAnalyze = () => {
    // TODO: Navigate to analysis with selected IDs
    console.log('Analyze:', Array.from(selectedIds));
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
                Volver a filtros
              </Button>
              <h1 className="font-serif text-xl font-bold text-foreground">
                Dataset: {totalCount.toLocaleString()} estudios
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Seleccionados: <span className="font-medium text-foreground">{selectedIds.size}</span>
              </span>
              <Button
                onClick={handleAnalyze}
                disabled={selectedIds.size === 0}
                className="gap-2"
              >
                <FlaskConical className="h-4 w-4" />
                Analizar seleccionados
              </Button>
            </div>
          </div>

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

              {/* Pagination */}
              {totalPages > 1 && (
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
