import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { ArrowLeft, Loader2, FlaskConical, Eye, FileSearch, Filter, CheckSquare, BarChart3, GitCompare, ChevronLeft, ChevronRight } from "lucide-react";
import { useEnrichedStudies } from "@/hooks/useEnrichedStudies";
import { HighlightText } from "@/components/HighlightText";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStudies, useAllStudyIds } from "@/hooks/useStudies";
import { useDatasetStudiesByIds } from "@/hooks/useDatasetStudies";
import { paramsToSearch, searchToParams } from "@/types/search";
import { supabaseExternalPublic, EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY } from "@/lib/supabase-external";
import { toast } from "sonner";
import { AnalysisModal, AnalysisContext } from "@/components/analysis/AnalysisModal";

const DatasetPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisError, setAnalysisError] = useState<{ message: string; details?: string } | null>(null);

  // Explicit column filters (replaces toggles)
  const [filterAnalyzable, setFilterAnalyzable] = useState<string>("all");
  const [filterComparable, setFilterComparable] = useState<string>("all");

  // Check if we're in "ids" mode (specific studies from related studies link)
  const idsParam = searchParams.get("ids");
  const specificIds = useMemo(() => idsParam?.split(",").filter(Boolean) || [], [idsParam]);
  const isUrlIdsMode = specificIds.length > 0;

  // Parse unified search from URL
  const search = useMemo(() => paramsToSearch(searchParams), [searchParams]);
  const labels = useMemo(() => searchParams.get('labels')?.split(',').filter(Boolean) || [], [searchParams]);
  const paramTypes = useMemo(() => searchParams.get('paramTypes')?.split(',').filter(Boolean) || [], [searchParams]);
  const meshConditions = useMemo(() => searchParams.get('mesh')?.split(',').filter(Boolean) || [], [searchParams]);

  // Convert filter values to booleans for query
  const onlyAnalyzable = filterAnalyzable === "yes";
  const onlyComparable = filterComparable === "yes";

  // Use the unified useStudies hook
  const studiesQuery = useStudies({
    search,
    selectedLabels: labels,
    selectedParamTypes: paramTypes,
    selectedMeshConditions: meshConditions,
    page,
    onlyAnalyzable,
    onlyComparable,
  });

  // Only use IDs query when explicitly in URL IDs mode (from related studies link)
  const idsQuery = useDatasetStudiesByIds(isUrlIdsMode ? specificIds : []);

  // Hook to fetch ALL study IDs for "Select All" functionality
  const [selectAllRequested, setSelectAllRequested] = useState(false);
  const allIdsQuery = useAllStudyIds({
    search,
    selectedLabels: labels,
    selectedMeshConditions: meshConditions,
    enabled: selectAllRequested && !isUrlIdsMode,
  });

  // Determine which query result to use
  const activeQuery = isUrlIdsMode ? idsQuery : studiesQuery;
  const { data, isLoading, error } = activeQuery;

  const studies = data?.studies ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const pageSize = data?.pageSize ?? 20;

  // Fetch enriched data from study_index for visible studies
  const visibleNctIds = useMemo(() => studies.map((s) => s.nct_id), [studies]);
  const enrichedQuery = useEnrichedStudies(visibleNctIds);
  const enrichedMap = enrichedQuery.data;

  // Collect search terms for highlighting (include MeSH conditions)
  const highlightTerms = useMemo(() => {
    const terms: string[] = [];
    if (search.baseQuery.trim()) terms.push(search.baseQuery.trim());
    terms.push(...search.groupA.filter((t) => t.trim()));
    terms.push(...search.groupB.filter((t) => t.trim()));
    terms.push(...meshConditions.filter((t) => t.trim()));
    return terms;
  }, [search, meshConditions]);

  // Calculate pagination display values
  const startIndex = page * pageSize + 1;
  const endIndex = Math.min((page + 1) * pageSize, totalCount);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [filterAnalyzable, filterComparable, search.baseQuery, search.groupA, search.groupB, labels.join(",")]);

  // Handle navigation back with preserved query params
  const handleBack = () => {
    if (isUrlIdsMode) {
      navigate(-1);
    } else {
      const params = searchToParams(search);
      if (labels.length > 0) params.set('labels', labels.join(','));
      if (paramTypes.length > 0) params.set('paramTypes', paramTypes.join(','));
      const qs = params.toString();
      navigate(qs ? `/?${qs}` : "/");
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
  useEffect(() => {
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

  // Open analysis modal
  const handleOpenAnalysisModal = () => {
    setAnalysisError(null);
    setShowAnalysisModal(true);
  };

  // Run analysis with optional context (called from modal)
  const runAnalysis = async (context?: AnalysisContext) => {
    const nctIds = Array.from(selectedIds);
    if (nctIds.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      // Build search_meta from active filters
      const activeKeywords = [
        ...search.groupA,
        ...search.groupB,
        ...(search.baseQuery.trim() ? [search.baseQuery.trim()] : []),
      ].filter(Boolean);

      const searchMeta: { mesh_terms: string[]; keywords: string[] } = {
        mesh_terms: meshConditions,
        keywords: activeKeywords,
      };

      // Build request body
      const requestBody: { nct_ids: string[]; context?: AnalysisContext; search_meta?: typeof searchMeta } = { nct_ids: nctIds, search_meta: searchMeta };
      
      // Only include context if product_idea is provided
      if (context?.product_idea && context.product_idea.trim().length > 0) {
        requestBody.context = context;
      }

      // Call analyze-direction on external Supabase
      const url = `${EXTERNAL_SUPABASE_URL}/functions/v1/analyze-direction`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          apikey: EXTERNAL_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${EXTERNAL_SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorDetails = result?.error || result?.message || `HTTP ${response.status}`;
        throw { message: "Analysis failed", details: errorDetails };
      }

      if (!result) {
        throw { message: "No data returned from analysis" };
      }

      // If backend explicitly reports a DB issue, surface it clearly.
      if (typeof result.db_error === "string" && result.db_error) {
        throw { message: "Database error", details: result.db_error };
      }

      // Check for error in response body
      if (result.error) {
        throw { message: result.error, details: result.details || undefined };
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
      const isS3 = result.schema_version === "S3";
      const available: string[] = isV3
        ? (Array.isArray(result.available) ? result.available : [])
        : isS3
          ? (Array.isArray(result.study_index) ? result.study_index.map((s: any) => s.nct_id) : nctIds)
          : Object.keys(result.found_paths && typeof result.found_paths === "object" ? result.found_paths : {});

      if (available.length === 0) {
        toast.warning(`No se encontraron datos para los ${missing.length || nctIds.length} estudios seleccionados.`);
        setShowAnalysisModal(false);
        return;
      }

      if (missing.length > 0) {
        toast.info(`Análisis completado. ${missing.length} estudio(s) sin datos disponibles.`);
      }

      // The Edge Function should return { analysis: ... }
      const analysisPayload = result.analysis;
      if (!analysisPayload) {
        throw { message: "Missing analysis in response payload" };
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
        throw { message: "Failed to save analysis results", details: insertError.message };
      }

      setShowAnalysisModal(false);

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
      const errorObj = err as { message?: string; details?: string };
      setAnalysisError({
        message: errorObj.message || (err instanceof Error ? err.message : "Failed to analyze studies"),
        details: errorObj.details,
      });
      toast.error(errorObj.message || "Failed to analyze studies");
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
              <Button onClick={handleOpenAnalysisModal} disabled={selectedIds.size === 0} className="gap-2">
                <FlaskConical className="h-4 w-4" />
                Analizar seleccionados
              </Button>
            </div>
          </div>

          {/* Explicit Column Filters */}
          <div className="flex items-center justify-between bg-muted/30 border border-border rounded-lg px-4 py-3">
            <div className="flex items-center gap-6">
              <span className="text-sm font-medium text-muted-foreground">Filtrar por:</span>
              
              {/* Analyzable filter */}
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <Select value={filterAnalyzable} onValueChange={setFilterAnalyzable}>
                  <SelectTrigger className="w-36 h-8 text-sm">
                    <SelectValue placeholder="Analyzable" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="yes">Con datos numéricos</SelectItem>
                    <SelectItem value="no">Sin datos numéricos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Comparable filter */}
              <div className="flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-muted-foreground" />
                <Select value={filterComparable} onValueChange={setFilterComparable}>
                  <SelectTrigger className="w-36 h-8 text-sm">
                    <SelectValue placeholder="Comparable" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="yes">Con comparación A vs B</SelectItem>
                    <SelectItem value="no">Sin comparación</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear filters */}
              {(filterAnalyzable !== "all" || filterComparable !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterAnalyzable("all");
                    setFilterComparable("all");
                  }}
                  className="text-xs"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>

            {/* Filter result counter */}
            <div className="flex items-center gap-2">
              {(filterAnalyzable !== "all" || filterComparable !== "all") && (
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <span>{totalCount.toLocaleString()} estudios con filtros aplicados</span>
                  )}
                </Badge>
              )}
            </div>
          </div>

          {/* Banner for IDs mode */}
          {isUrlIdsMode && (
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-primary">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Vista filtrada por estudios relacionados
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
                      <TableHead className="w-28">NCT ID</TableHead>
                      <TableHead className="min-w-[200px]">Title</TableHead>
                      <TableHead className="w-40">Conditions</TableHead>
                      <TableHead className="w-40">Interventions</TableHead>
                      <TableHead className="w-28">Study Type</TableHead>
                      <TableHead className="w-24">Phase</TableHead>
                      <TableHead className="w-20 text-right">Enrollment</TableHead>
                      <TableHead className="w-24">Start</TableHead>
                      <TableHead className="w-24">Completion</TableHead>
                      <TableHead className="w-24">Results Posted</TableHead>
                      <TableHead className="w-16 text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studies.map((study) => {
                      const enriched = enrichedMap?.get(study.nct_id);
                      return (
                        <TableRow key={study.nct_id} className={selectedIds.has(study.nct_id) ? "bg-primary/5" : ""}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(study.nct_id)}
                              onCheckedChange={() => toggleSelection(study.nct_id)}
                              aria-label={`Select ${study.nct_id}`}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">{study.nct_id}</TableCell>
                          <TableCell title={enriched?.brief_title || study.brief_title || undefined}>
                            <HighlightText
                              text={enriched?.brief_title || study.brief_title}
                              terms={highlightTerms}
                              className="text-sm font-medium text-foreground line-clamp-2"
                            />
                          </TableCell>
                          <TableCell title={enriched?.conditions || undefined}>
                            <HighlightText
                              text={enriched?.conditions || "—"}
                              terms={highlightTerms}
                              className="text-xs text-muted-foreground line-clamp-2"
                            />
                          </TableCell>
                          <TableCell title={enriched?.interventions || undefined}>
                            <HighlightText
                              text={enriched?.interventions || "—"}
                              terms={highlightTerms}
                              className="text-xs text-muted-foreground line-clamp-2"
                            />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {enriched?.study_type || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {enriched?.phase || "—"}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {enriched?.enrollment != null ? enriched.enrollment.toLocaleString() : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {enriched?.start_date || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {enriched?.primary_completion_date || enriched?.completion_date || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {enriched?.results_first_posted_date || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewStudy(study.nct_id)}
                              className="gap-1"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination with "showing X-Y of Z" indicator */}
              {totalPages > 0 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando <span className="font-medium text-foreground">{startIndex}</span>–<span className="font-medium text-foreground">{endIndex}</span> de <span className="font-medium text-foreground">{totalCount.toLocaleString()}</span> estudios
                  </p>
                  
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setPage((p) => p - 1)} 
                        disabled={page === 0}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground px-4">
                        Página {page + 1} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= totalPages - 1}
                        className="gap-1"
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Analysis Modal */}
      <AnalysisModal
        open={showAnalysisModal}
        onOpenChange={setShowAnalysisModal}
        selectedCount={selectedIds.size}
        onConfirm={runAnalysis}
        isLoading={isAnalyzing}
        error={analysisError}
      />
    </div>
  );
};

export default DatasetPage;
