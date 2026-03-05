import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { FilterSidebar } from "@/components/FilterSidebar";
import { UnifiedSearch } from "@/components/UnifiedSearch";
import { MeshConditionSearch } from "@/components/MeshConditionSearch";
import { SearchSummary } from "@/components/SearchSummary";
import { useSearchCounts } from "@/hooks/useSearchCounts";
import { UnifiedSearchInput, paramsToSearch, parseMeshFromParams } from "@/types/search";
import { Textarea } from "@/components/ui/textarea";
import { Target } from "lucide-react";

const Index = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = paramsToSearch(searchParams);
  const [search, setSearch] = useState<UnifiedSearchInput>(initialSearch);
  const [objective, setObjective] = useState<string>("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>(
    searchParams.get("labels")?.split(",").filter(Boolean) || [],
  );
  const [selectedParamTypes, setSelectedParamTypes] = useState<string[]>(
    searchParams.get("paramTypes")?.split(",").filter(Boolean) || [],
  );
  const [selectedMeshConditions, setSelectedMeshConditions] = useState<string[]>(parseMeshFromParams(searchParams));

  const {
    data: counts,
    isLoading,
    error,
  } = useSearchCounts({
    search,
    selectedMeshConditions,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <FilterSidebar
          selectedLabels={selectedLabels}
          setSelectedLabels={(labels) => {
            setSelectedLabels(labels);
          }}
          selectedParamTypes={selectedParamTypes}
          setSelectedParamTypes={(types) => {
            setSelectedParamTypes(types);
          }}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* ── STEP 0: OBJETIVO ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  1
                </div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Define tu objetivo</h2>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                Antes de explorar la evidencia, define qué quieres investigar. Tu objetivo guiará el filtrado
                inteligente y el análisis final.
              </p>
              <div className="pl-8">
                <Textarea
                  placeholder="Ej: Evaluar la eficacia de intervenciones nutricionales para mejorar la masa muscular en pacientes mayores con sarcopenia..."
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                />
                {objective.trim().length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    <Target className="h-3 w-3 text-primary" />
                    Objetivo definido · {objective.trim().length} caracteres
                  </p>
                )}
                {objective.trim().length === 0 && (
                  <p className="text-xs text-amber-600 mt-1.5">
                    El objetivo es obligatorio para acceder al dataset y al análisis.
                  </p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* ── STEP 1: FILTRAR EVIDENCIA ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  2
                </div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Filtra la evidencia</h2>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                Selecciona la condición clínica y añade términos de búsqueda para acotar el dataset inicial. Este será
                tu <span className="font-medium text-foreground">dataset Bronze</span> — el punto de partida.
              </p>
              <div className="pl-8 space-y-4">
                <MeshConditionSearch value={selectedMeshConditions} onChange={setSelectedMeshConditions} />
                <UnifiedSearch value={search} onChange={setSearch} />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* ── RESULTS ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  3
                </div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Dataset Bronze</h2>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                Estudios que coinciden con tus criterios de búsqueda. Accede al dataset para filtrarlos y validarlos
                antes del análisis.
              </p>
              <div className="pl-8">
                {error ? (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-sm text-destructive">Error loading studies: {error.message}</p>
                  </div>
                ) : (
                  <SearchSummary
                    counts={counts}
                    isLoading={isLoading}
                    search={search}
                    selectedMeshConditions={selectedMeshConditions}
                    selectedLabels={selectedLabels}
                    selectedParamTypes={selectedParamTypes}
                    objective={objective}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
