import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import {
  ArrowLeft,
  Loader2,
  FlaskConical,
  Eye,
  FileSearch,
  Filter,
  CheckSquare,
  BarChart3,
  GitCompare,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { useEnrichedStudies } from "@/hooks/useEnrichedStudies";
import { HighlightText } from "@/components/HighlightText";
import { TruncatedCell } from "@/components/TruncatedCell";
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
import { RankingModal } from "@/components/ranking/RankingModal";

type RankedStudy = {
  nct_id: string;
  score: number;
  reason: string;
};

const DatasetPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRanking, setIsRanking] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [analysisError, setAnalysisError] = useState<{ message: string; details?: string } | null>(null);
  const [rankingError, setRankingError] = useState<{ message: string; details?: string } | null>(null);
  const [rankingResults, setRankingResults] = useState<RankedStudy[] | null>(null);

  const [filterAnalyzable, setFilterAnalyzable] = useState<string>("all");
  const [filterComparable, setFilterComparable] = useState<string>("all");

  const idsParam = searchParams.get("ids");
  const specificIds = useMemo(() => idsParam?.split(",").filter(Boolean) || [], [idsParam]);
  const isUrlIdsMode = specificIds.length > 0;

  const search = useMemo(() => paramsToSearch(searchParams), [searchParams]);
  const labels = useMemo(() => searchParams.get("labels")?.split(",").filter(Boolean) || [], [searchParams]);
  const paramTypes = useMemo(() => searchParams.get("paramTypes")?.split(",").filter(Boolean) || [], [searchParams]);
  const meshConditions = useMemo(() => searchParams.get("mesh")?.split(",").filter(Boolean) || [], [searchParams]);

  const onlyAnalyzable = filterAnalyzable === "yes";
  const onlyComparable = filterComparable === "yes";

  const studiesQuery = useStudies({
    search,
    selectedLabels: labels,
    selectedParamTypes: paramTypes,
    selectedMeshConditions: meshConditions,
    page,
    onlyAnalyzable,
    onlyComparable,
  });

  const idsQuery = useDatasetStudiesByIds(isUrlIdsMode ? specificIds : []);

  const [selectAllRequested, setSelectAllRequested] = useState(false);
  const allIdsQuery = useAllStudyIds({
    search,
    selectedLabels: labels,
    selectedMeshConditions: meshConditions,
    enabled: selectAllRequested && !isUrlIdsMode,
  });

  const activeQuery = isUrlIdsMode ? idsQuery : studiesQuery;
  const { data, isLoading, error } = activeQuery;

  const allStudies = data?.studies ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const pageSize = data?.pageSize ?? 20;

  const studies = useMemo(() => {
    if (!rankingResults) return allStudies;
    const scoreMap = new Map(rankingResults.map((r) => [r.nct_id, r]));
    return allStudies
      .filter((s) => scoreMap.has(s.nct_id))
      .sort((a, b) => (scoreMap.get(b.nct_id)?.score ?? 0) - (scoreMap.get(a.nct_id)?.score ?? 0));
  }, [allStudies, rankingResults]);

  const visibleNctIds = useMemo(() => studies.map((s) => s.nct_id), [studies]);
  const enrichedQuery = useEnrichedStudies(visibleNctIds);
  const enrichedMap = enrichedQuery.data;

  const highlightTerms = useMemo(() => {
    const terms: string[] = [];
    if (search.baseQuery.trim()) terms.push(search.baseQuery.trim());
    terms.push(...search.groupA.filter((t) => t.trim()));
    terms.push(...search.groupB.filter((t) => t.trim()));
    for (const m of meshConditions) {
      if (m.trim()) {
        terms.push(m.trim());
        const words = m
          .trim()
          .split(/\s+/)
          .filter((w) => w.length > 2);
        terms.push(...words);
      }
    }
    const seen = new Set<string>();
    return terms.filter((t) => {
      const key = t.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [search, meshConditions]);

  const startIndex = page * pageSize + 1;
  const endIndex = Math.min((page + 1) * pageSize, totalCount);

  useEffect(() => {
    setPage(0);
    setRankingResults(null);
  }, [filterAnalyzable, filterComparable, search.baseQuery, search.groupA, search.groupB, labels.join(",")]);

  const handleBack = () => {
    if (isUrlIdsMode) {
      navigate(-1);
    } else {
      const params = searchToParams(search);
      if (labels.length > 0) params.set("labels", labels.join(","));
      if (paramTypes.length > 0) params.set("paramTypes", paramTypes.join(","));
      const qs = params.toString();
      navigate(qs ? `/?${qs}` : "/");
    }
  };

  const toggleSelection = (nctId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nctId)) next.delete(nctId);
      else next.add(nctId);
      return next;
    });
  };

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

  const handleSelectAll = async () => {
    if (isUrlIdsMode) {
      setSelectedIds(new Set(specificIds));
    } else {
      setSelectAllRequested(true);
    }
  };

  useEffect(() => {
    if (selectAllRequested && allIdsQuery.data && allIdsQuery.data.length > 0) {
      setSelectedIds(new Set(allIdsQuery.data));
      setSelectAllRequested(false);
      toast.success(`${allIdsQuery.data.length} estudios seleccionados`);
    }
  }, [selectAllRequested, allIdsQuery.data]);

  const handleClearSelection = () => setSelectedIds(new Set());
  const handleViewStudy = (nctId: string) => navigate(`/study/${nctId}`);

  const handleOpenAnalysisModal = () => {
    setAnalysisError(null);
    setShowAnalysisModal(true);
  };

  const handleOpenRankingModal = () => {
    setRankingError(null);
    setShowRankingModal(true);
  };

  const clearRanking = () => setRankingResults(null);

  const allVisibleSelected = studies.length > 0 && studies.every((s) => selectedIds.has(s.nct_id));
  const someVisibleSelected = studies.some((s) => selectedIds.has(s.nct_id));

  // ── Analysis ───────────────────────────────────────────────────────────────
  const runAnalysis = async (context?: AnalysisContext) => {
    const nctIds = Array.from(selectedIds);
    if (nctIds.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const activeKeywords = [
        ...search.groupA,
        ...search.groupB,
        ...(search.baseQuery.trim() ? [search.baseQuery.trim()] : []),
      ].filter(Boolean);

      const searchMeta = { mesh_terms: meshConditions, keywords: activeKeywords };
      const requestBody: { nct_ids: string[]; context?: AnalysisContext; search_meta?: typeof searchMeta } = {
        nct_ids: nctIds,
        search_meta: searchMeta,
      };

      if (context?.product_idea && context.product_idea.trim().length > 0) {
        requestBody.context = context;
      }

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

      if (!response.ok) throw { message: "Analysis failed", details: result?.error || `HTTP ${response.status}` };
      if (!result) throw { message: "No data returned from analysis" };
      if (typeof result.db_error === "string" && result.db_error)
        throw { message: "Database error", details: result.db_error };
      if (result.error) throw { message: result.error, details: result.details };

      const missing: string[] = Array.isArray(result.missing)
        ? result.missing
            .map((m: any) => (typeof m === "string" ? m : m?.nct_id))
            .filter((x: any) => typeof x === "string" && x.length > 0)
        : [];

      const isS3 = result.schema_version === "S3";
      const isV3 = result.schema === "v3";
      const available: string[] = isV3
        ? Array.isArray(result.available)
          ? result.available
          : []
        : isS3
          ? Array.isArray(result.study_index)
            ? result.study_index.map((s: any) => s.nct_id)
            : nctIds
          : Object.keys(result.found_paths && typeof result.found_paths === "object" ? result.found_paths : {});

      if (available.length === 0) {
        toast.warning(`No se encontraron datos para los ${missing.length || nctIds.length} estudios seleccionados.`);
        setShowAnalysisModal(false);
        return;
      }

      if (missing.length > 0) toast.info(`Análisis completado. ${missing.length} estudio(s) sin datos disponibles.`);

      const analysisPayload = result.analysis;
      if (!analysisPayload) throw { message: "Missing analysis in response payload" };

      const analysisId = crypto.randomUUID();
      const { error: insertError } = await supabaseExternalPublic.from("analysis_runs").insert({
        id: analysisId,
        nct_ids: available,
        dataset_query: isUrlIdsMode ? null : searchParams.toString(),
        prompt_version: result.prompt_version ?? result?.metadata?.model ?? "v3",
        schema_version:
          result.schema_version ?? (typeof result.schema === "string" ? result.schema.toUpperCase() : "V3"),
        analysis: analysisPayload,
      });

      if (insertError) throw { message: "Failed to save analysis results", details: insertError.message };

      setShowAnalysisModal(false);
      navigate(`/analysis/${analysisId}`, {
        state: {
          run: {
            id: analysisId,
            nct_ids: available,
            analysis: analysisPayload,
            prompt_version: result.prompt_version ?? result?.metadata?.model ?? "v3",
            schema_version:
              result.schema_version ?? (typeof result.schema === "string" ? result.schema.toUpperCase() : "V3"),
          },
        },
      });
    } catch (err) {
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

  // ── Ranking ────────────────────────────────────────────────────────────────
  const runRanking = async (objective: string) => {
    const nctIds = Array.from(selectedIds);
    if (nctIds.length === 0) return;

    setIsRanking(true);
    setRankingError(null);

    try {
      const url = `${EXTERNAL_SUPABASE_URL}/functions/v1/ranking-api`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          apikey: EXTERNAL_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${EXTERNAL_SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nct_ids: nctIds, objective }),
      });

      const result = await response.json();
      if (!response.ok) throw { message: result?.error || "Ranking API failed", details: result?.details };
      if (!Array.isArray(result?.ranked)) throw { message: "Invalid response from ranking API" };

      if (result.ranked.length === 0) {
        toast.warning("No se encontraron estudios relevantes para ese objetivo.");
        setShowRankingModal(false);
        return;
      }

      setRankingResults(result.ranked);
      // Auto-select all ranked studies
      setSelectedIds(new Set(result.ranked.map((r: RankedStudy) => r.nct_id)));
      setShowRankingModal(false);
      toast.success(`${result.ranked.length} estudios relevantes seleccionados de ${nctIds.length} evaluados.`);
    } catch (err) {
      const errorObj = err as { message?: string; details?: string };
      setRankingError({
        message: errorObj.message || "Error al generar ranking",
        details: errorObj.details,
      });
      toast.error(errorObj.message || "Error al generar ranking");
    } finally {
      setIsRanking(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* ── Top bar ── */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {isUrlIdsMode ? "Volver" : "Volver a filtros"}
              </Button>
              <h1 className="font-serif text-xl font-bold text-foreground">
                {isUrlIdsMode
                  ? `Estudios seleccionados: ${specificIds.length}`
                  : rankingResults
                    ? `Ranking IA: ${studies.length} estudios relevantes`
                    : `Dataset: ${totalCount.toLocaleString()} estudios`}
              </h1>
            </div>
          </div>

          {/* ── Two-step action bar ── */}
          <div className="flex items-center justify-between bg-muted/20 border border-border rounded-xl px-5 py-4 gap-6 flex-wrap">
            {/* Step 1 */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                1 · Seleccionar estudios
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={allIdsQuery.isLoading || totalCount === 0}
                  className="gap-1.5"
                >
                  {allIdsQuery.isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckSquare className="h-3.5 w-3.5" />
                  )}
                  Seleccionar todos
                  {totalCount > 0 && <span className="text-muted-foreground">({totalCount})</span>}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenRankingModal}
                  disabled={isRanking || totalCount === 0}
                  className="gap-1.5"
                >
                  {isRanking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Selección con IA
                </Button>

                {selectedIds.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelection}
                    className="gap-1 text-muted-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                    Limpiar
                  </Button>
                )}
              </div>
            </div>

            {/* Divider + count */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-foreground">{selectedIds.size}</span>
              <span className="text-xs text-muted-foreground">seleccionados</span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                2 · Analizar evidencia
              </span>
              <Button onClick={handleOpenAnalysisModal} disabled={selectedIds.size === 0} size="sm" className="gap-2">
                <FlaskConical className="h-4 w-4" />
                Analizar seleccionados
                {selectedIds.size > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {selectedIds.size}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Ranking active banner */}
          {rankingResults && (
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Selección IA activa — {studies.length} estudios relevantes ordenados por relevancia
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={clearRanking} className="gap-1">
                <X className="h-3.5 w-3.5" />
                Ver todos
              </Button>
            </div>
          )}

          {/* ── Column Filters ── */}
          <div className="flex items-center justify-between bg-muted/30 border border-border rounded-lg px-4 py-3">
            <div className="flex items-center gap-6">
              <span className="text-sm font-medium text-muted-foreground">Filtrar por:</span>

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

          {/* IDs mode banner */}
          {isUrlIdsMode && (
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-primary">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Vista filtrada por estudios relacionados</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2">
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver
              </Button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive">Error loading dataset: {error.message}</p>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Loading studies...</p>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && studies.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileSearch className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">No studies found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {rankingResults
                  ? "La selección IA no encontró estudios relevantes. Prueba con otro objetivo."
                  : "Try adjusting your filters to see more results."}
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
                      {rankingResults && <TableHead className="w-24 text-center">Score IA</TableHead>}
                      <TableHead className="w-16 text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studies.map((study) => {
                      const enriched = enrichedMap?.get(study.nct_id);
                      const ranked = rankingResults?.find((r) => r.nct_id === study.nct_id);
                      return (
                        <TableRow
                          key={study.nct_id}
                          className={selectedIds.has(study.nct_id) ? "bg-primary/5" : ""}
                          title={ranked ? `Relevancia: ${ranked.reason}` : undefined}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(study.nct_id)}
                              onCheckedChange={() => toggleSelection(study.nct_id)}
                              aria-label={`Select ${study.nct_id}`}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            <HighlightText text={study.nct_id} terms={highlightTerms} />
                          </TableCell>
                          <TruncatedCell
                            fullText={enriched?.brief_title || study.brief_title || undefined}
                            highlightTerms={highlightTerms}
                          >
                            <HighlightText
                              text={enriched?.brief_title || study.brief_title}
                              terms={highlightTerms}
                              className="text-sm font-medium text-foreground line-clamp-2"
                            />
                          </TruncatedCell>
                          <TruncatedCell fullText={enriched?.conditions || undefined} highlightTerms={highlightTerms}>
                            <HighlightText
                              text={enriched?.conditions || "—"}
                              terms={highlightTerms}
                              className="text-xs text-muted-foreground line-clamp-2"
                            />
                          </TruncatedCell>
                          <TruncatedCell
                            fullText={enriched?.interventions || undefined}
                            highlightTerms={highlightTerms}
                          >
                            <HighlightText
                              text={enriched?.interventions || "—"}
                              terms={highlightTerms}
                              className="text-xs text-muted-foreground line-clamp-2"
                            />
                          </TruncatedCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <HighlightText text={enriched?.study_type || "—"} terms={highlightTerms} />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <HighlightText text={enriched?.phase || "—"} terms={highlightTerms} />
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
                          {rankingResults && (
                            <TableCell className="text-center">
                              {ranked ? (
                                <Badge
                                  variant={ranked.score >= 8 ? "default" : ranked.score >= 6 ? "secondary" : "outline"}
                                  className="text-xs font-mono"
                                  title={ranked.reason}
                                >
                                  {ranked.score}/10
                                </Badge>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                          )}
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

              {/* Pagination */}
              {!rankingResults && totalPages > 0 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando <span className="font-medium text-foreground">{startIndex}</span>–
                    <span className="font-medium text-foreground">{endIndex}</span> de{" "}
                    <span className="font-medium text-foreground">{totalCount.toLocaleString()}</span> estudios
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

      <AnalysisModal
        open={showAnalysisModal}
        onOpenChange={setShowAnalysisModal}
        selectedCount={selectedIds.size}
        onConfirm={runAnalysis}
        isLoading={isAnalyzing}
        error={analysisError}
      />

      <RankingModal
        open={showRankingModal}
        onOpenChange={setShowRankingModal}
        selectedCount={selectedIds.size}
        onConfirm={runRanking}
        isLoading={isRanking}
        error={rankingError}
      />
    </div>
  );
};

export default DatasetPage;
