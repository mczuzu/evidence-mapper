import { Loader2, Database, Layers, FlaskConical, GitMerge } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchCounts } from "@/hooks/useSearchCounts";
import { UnifiedSearchInput, searchToParams } from "@/types/search";

interface SearchSummaryProps {
  counts: SearchCounts | undefined;
  isLoading: boolean;
  search: UnifiedSearchInput;
  selectedMeshCondition: string | null;
  selectedLabels: string[];
  selectedParamTypes: string[];
}

export function SearchSummary({
  counts,
  isLoading,
  search,
  selectedMeshCondition,
  selectedLabels,
  selectedParamTypes,
}: SearchSummaryProps) {
  const navigate = useNavigate();

  const hasAnyData =
    counts &&
    (counts.meshTotal !== null ||
      counts.baseTotal !== null ||
      counts.groupATotal !== null ||
      counts.groupBTotal !== null);

  const handleViewDataset = () => {
    const params = searchToParams(search);
    if (selectedMeshCondition) params.set("mesh", selectedMeshCondition);
    if (selectedLabels.length > 0) params.set("labels", selectedLabels.join(","));
    if (selectedParamTypes.length > 0) params.set("paramTypes", selectedParamTypes.join(","));
    navigate(`/dataset?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <span className="ml-3 text-sm text-muted-foreground">Calculando resultados...</span>
      </div>
    );
  }

  if (!hasAnyData) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Selecciona una condición MeSH o introduce términos de búsqueda para ver el resumen.
      </div>
    );
  }

  const cards: { label: string; value: number | null; icon: React.ReactNode; color: string }[] = [];

  if (counts.meshTotal !== null) {
    cards.push({
      label: `MeSH: ${selectedMeshCondition}`,
      value: counts.meshTotal,
      icon: <Database className="h-5 w-5" />,
      color: "border-blue-500/30 bg-blue-500/5",
    });
  }

  if (counts.baseTotal !== null) {
    cards.push({
      label: `Base: "${search.baseQuery}"`,
      value: counts.baseTotal,
      icon: <Layers className="h-5 w-5" />,
      color: "border-violet-500/30 bg-violet-500/5",
    });
  }

  if (counts.groupATotal !== null) {
    cards.push({
      label: `Grupo A: ${search.groupA.join(" | ")}`,
      value: counts.groupATotal,
      icon: <FlaskConical className="h-5 w-5" />,
      color: "border-emerald-500/30 bg-emerald-500/5",
    });
  }

  if (counts.groupBTotal !== null) {
    cards.push({
      label: `Grupo B: ${search.groupB.join(" | ")}`,
      value: counts.groupBTotal,
      icon: <FlaskConical className="h-5 w-5" />,
      color: "border-amber-500/30 bg-amber-500/5",
    });
  }

  return (
    <div className="space-y-4">
      {/* Dimension cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`flex items-center gap-4 rounded-lg border p-4 ${card.color}`}
          >
            <div className="text-muted-foreground">{card.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{card.label}</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {card.value != null ? card.value.toLocaleString() : "—"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Intersection result */}
      <div className="flex items-center gap-4 rounded-lg border-2 border-primary/40 bg-primary/5 p-5">
        <div className="text-primary">
          <GitMerge className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Intersección final
          </p>
          <p className="text-3xl font-bold text-foreground tabular-nums">
            {counts.intersectionTotal.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            estudios que cumplen todos los criterios activos
          </p>
        </div>
        {counts.intersectionTotal > 0 && (
          <Button onClick={handleViewDataset} className="gap-2">
            Ver dataset
            <Badge variant="secondary" className="ml-1 text-xs">
              {counts.intersectionTotal.toLocaleString()}
            </Badge>
          </Button>
        )}
      </div>
    </div>
  );
}
