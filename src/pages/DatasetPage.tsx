import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { ArrowLeft, Loader2, FlaskConical, Eye, FileSearch, Filter, CheckSquare, BarChart3, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStudies, useAllStudyIds } from "@/hooks/useStudies";
import { useDatasetStudiesByIds } from "@/hooks/useDatasetStudies";
import { parseFiltersFromQueryParams, buildQueryParamsFromFilters } from "@/lib/filter-utils";
import { supabase } from "@/integrations/supabase/client";
import { supabaseExternalPublic } from "@/lib/supabase-external";
import { toast } from "sonner";

const DatasetPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Study Profile V2 filters
  const [onlyAnalyzable, setOnlyAnalyzable] = useState(false);
  const [onlyComparable, setOnlyComparable] = useState(false);

  // Check if we're in "ids" mode (specific studies from related studies link)
  const idsParam = searchParams.get("ids");
  const specificIds = useMemo(() => idsParam?.split(",").filter(Boolean) || [], [idsParam]);
  const isUrlIdsMode = specificIds.length > 0;

  // Check if we're in advanced search mode
  const isAdvanced = searchParams.get("advanced") === "1";

  // Parse filters from query params
  const { searchQuery, labels, paramTypes } = useMemo(() => parseFiltersFromQueryParams(searchParams), [searchParams]);

  // Use the unified useStudies hook for both normal and advanced modes
  const studiesQuery = useStudies({
    searchQuery,
    selectedLabels: labels,
    selectedParamTypes: paramTypes,
    page,
    advancedSearch: isAdvanced,
    onlyAnalyzable,
    onlyComparable,
  });

  // Only use IDs query when explicitly in URL IDs mode (from related studies link)
  const idsQuery = useDatasetStudiesByIds(isUrlIdsMode ? specificIds : []);

  // Hook to fetch ALL study IDs for "Select All" functionality
  const [selectAllRequested, setSelectAllRequested] = useState(false);
  const allIdsQuery = useAllStudyIds({
    searchQuery,
    selectedLabels: labels,
    advancedSearch: isAdvanced,
    enabled: selectAllRequested && !isUrlIdsMode,
  });

  // Determine which query result to use
  const activeQuery = isUrlIdsMode ? idsQuery : studiesQuery;
  const { data, isLoading, error } = activeQuery;

  const studies = data?.studies ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 0;

  // Handle navigation back with preserved query params
  const handleBack = () => {
    if (isUrlIdsMode) {
      navigate(-1);
    } else {
      let queryString = buildQueryParamsFromFilters(searchQuery, labels, paramTypes);
      if (isAdvanced && queryString) {
        queryString += '&advanced=1';
      } else if (isAdvanced) {
        queryString = 'advanced=1';
      }
      navigate(queryString ? `/?${queryString}` : "/");
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

  // Select ALL studies in the result set
  const handleSelectAll = async () => {
    if (isUrlIdsMode) {
      // In IDs mode, select all specific IDs
      setSelectedIds(new Set(specificIds));
    } else {
      // Trigger the query to fetch all IDs
      setSelectAllRequested(true);
    }
  };

  // Effect to update selection when all IDs are fetched
  useMemo(() => {
    if (selectAllRequested && allIdsQuery.data && allIdsQuery.data.length > 0) {
      setSelectedIds(new Set(allIdsQuery.data));
      setSelectAllRequested(false);
      toast.success(`${allIdsQuery.data.length} estudios seleccionados`);
    }
  }, [selectAllRequested, allIdsQuery.data]);

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedIds(new Set());
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
      // Call analyze-direction (Lovable Cloud backend function)
      const { data: result, error: fnError } = await supabase.functions.invoke("analyze-direction", {
        body: { nct_ids: nctIds },
      });

      if (fnError) {
        throw new Error(fnError.message || "Analysis failed");
      }

      if (!result) {
        throw new Error("No data returned from analysis");
      }

      // If backend explicitly reports a DB issue, surface it clearly.
      if (typeof result.db_error === "string" && result.db_error) {
        throw new Error(result.db_error);
      }

      // Normalize response across formats:
      // - Legacy: { missing: (string|{nct_id})[], found_paths: Record<nct_id,string>, analysis, ... }
      // - V3: { schema: 'v3', available: string[], missing: string[], analysis, metadata, ... }
      const missing: string[] = Array.isArray(result.missing)
        ? result.missing
            .map((m: any) => (typeof m === "string" ? m : m?.nct_id))
            .filter((x: any) => typeof x === "string" && x.length > 0)
        : [];

      const isV3 = result.schema === "v3";
      const available: string[] = isV3
        ? (Array.isArray(result.available) ? result.available : [])
        : Object.keys(result.found_paths && typeof result.found_paths === "object" ? result.found_paths : {});

      if (available.length === 0) {
        toast.warning(`No se encontraron datos para los ${missing.length || nctIds.length} estudios seleccionados.`);
        return;
      }

      if (missing.length > 0) {
        toast.info(`Análisis completado. ${missing.length} estudio(s) sin datos disponibles.`);
      }

      // The Edge Function should return { analysis: ... }
      const analysisPayload = result.analysis;
      if (!analysisPayload) {
        throw new Error("Missing analysis in response payload");
      }

      // Generate a NEW analysisId per run (no reuse)
      const analysisId = crypto.randomUUID();

      // Persist to analysis_runs (matches your table columns)
      const { error: insertError } = await supabaseExternalPublic.from("analysis_runs").insert({
        id: analysisId,
        nct_ids: available, // text[]
        dataset_query: isUrlIdsMode ? null : searchParams.toString(), // optional
        prompt_version: result.prompt_version ?? result?.metadata?.model ?? "v3",
        schema_version: result.schema_version ?? (typeof result.schema === "string" ? result.schema.toUpperCase() : "V3"),
        analysis: analysisPayload, // jsonb
      });

      if (insertError) {
        console.error("Error saving analysis:", insertError);
        throw new Error(insertError.message || "Failed to save analysis results");
      }

      // Navigate to the analysis page using the NEW analysisId
      navigate(`/analysis/${analysisId}`, {
        state: {
          run: {
            id: analysisId,
            nct_ids: available,
            analysis: analysisPayload,
            prompt_version: result.prompt_version ?? result?.metadata?.model ?? "v3",
            schema_version: result.schema_version ?? (typeof result.schema === "string" ? result.schema.toUpperCase() : "V3"),
          },
        },
      });
    } catch (err) {
      console.error("Analysis error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to analyze studies");
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
                {isUrlIdsMode ? "Volver" : "Volver a filtros"}
              </Button>
              <h1 className="font-serif text-xl font-bold text-foreground">
                {isUrlIdsMode
                  ? `Estudios seleccionados: ${specificIds.length}`
                  : isAdvanced
                    ? `Búsqueda expandida: ${totalCount.toLocaleString()} estudios`
                    : `Dataset: ${totalCount.toLocaleString()} estudios`}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Select All / Clear Selection buttons */}
              {totalCount > 0 && (
                <div className="flex items-center gap-2">
                  {selectedIds.size < totalCount ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      disabled={allIdsQuery.isLoading}
                      className="gap-1.5"
                    >
                      {allIdsQuery.isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckSquare className="h-3.5 w-3.5" />
                      )}
                      Seleccionar todos ({totalCount})
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearSelection}
                      className="gap-1.5"
                    >
                      Limpiar selección
                    </Button>
                  )}
                </div>
              )}
              
              <span className="text-sm text-muted-foreground">
                Seleccionados: <span className="font-medium text-foreground">{selectedIds.size}</span>
              </span>
              <Button onClick={handleAnalyze} disabled={selectedIds.size === 0 || isAnalyzing} className="gap-2">
                {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                {isAnalyzing ? "Analizando..." : "Analizar seleccionados"}
              </Button>
            </div>
          </div>

          {/* Study Profile V2 Filters */}
          <div className="flex items-center gap-6 bg-muted/30 border border-border rounded-lg px-4 py-3">
            <span className="text-sm font-medium text-muted-foreground">Filtros de datos:</span>
            <div className="flex items-center gap-2">
              <Switch
                id="only-analyzable"
                checked={onlyAnalyzable}
                onCheckedChange={setOnlyAnalyzable}
              />
              <label htmlFor="only-analyzable" className="text-sm flex items-center gap-1.5 cursor-pointer">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                Solo analizables
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="only-comparable"
                checked={onlyComparable}
                onCheckedChange={setOnlyComparable}
              />
              <label htmlFor="only-comparable" className="text-sm flex items-center gap-1.5 cursor-pointer">
                <GitCompare className="h-3.5 w-3.5 text-primary" />
                Solo comparables (A vs B)
              </label>
            </div>
          </div>

          {/* Banner for IDs mode or Advanced mode */}
          {(isUrlIdsMode || isAdvanced) && (
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-primary">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {isUrlIdsMode 
                    ? "Vista filtrada por estudios relacionados" 
                    : "Búsqueda expandida (título + resumen + condiciones)"}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2">
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver
              </Button>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive">Error loading dataset: {error.message}</p>
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
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">No studies found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">Try adjusting your filters to see more results.</p>
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
                          className={someVisibleSelected && !allVisibleSelected ? "opacity-50" : ""}
                        />
                      </TableHead>
                      <TableHead className="w-32">NCT ID</TableHead>
                      <TableHead>Brief Title</TableHead>
                      <TableHead className="w-28 text-center">Datos</TableHead>
                      <TableHead className="w-24 text-center">Métricas</TableHead>
                      <TableHead className="w-24 text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studies.map((study) => (
                      <TableRow key={study.nct_id} className={selectedIds.has(study.nct_id) ? "bg-primary/5" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(study.nct_id)}
                            onCheckedChange={() => toggleSelection(study.nct_id)}
                            aria-label={`Select ${study.nct_id}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{study.nct_id}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-foreground line-clamp-2">{study.brief_title}</p>
                          {study.brief_summary && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {study.brief_summary.slice(0, 100)}...
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {study.has_numeric_results && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 gap-1">
                                <BarChart3 className="h-3 w-3" />
                                Num
                              </Badge>
                            )}
                            {study.has_group_comparison && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 gap-1">
                                <GitCompare className="h-3 w-3" />
                                Cmp
                              </Badge>
                            )}
                            {!study.has_numeric_results && !study.has_group_comparison && (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center text-xs text-muted-foreground">
                            {study.n_numeric_outcomes != null && study.n_numeric_outcomes > 0 && (
                              <span>{study.n_numeric_outcomes} out</span>
                            )}
                            {study.n_comparisons != null && study.n_comparisons > 0 && (
                              <span>{study.n_comparisons} cmp</span>
                            )}
                            {(study.n_numeric_outcomes == null || study.n_numeric_outcomes === 0) &&
                             (study.n_comparisons == null || study.n_comparisons === 0) && (
                              <span>—</span>
                            )}
                          </div>
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

              {/* Pagination - only show in standard filter mode (not ids mode, not advanced) */}
              {!isUrlIdsMode && !isAdvanced && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
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
