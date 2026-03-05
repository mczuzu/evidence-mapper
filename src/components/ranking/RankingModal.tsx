import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, BarChart3 } from "lucide-react";

interface RankingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (objective: string) => void;
  isLoading: boolean;
  error?: { message: string; details?: string } | null;
}

export const RankingModal = ({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isLoading,
  error,
}: RankingModalProps) => {
  const [objective, setObjective] = useState("");

  const handleConfirm = () => {
    if (!objective.trim()) return;
    onConfirm(objective.trim());
  };

  const handleClose = () => {
    if (!isLoading) {
      setObjective("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="h-5 w-5 text-primary" />
            Ranking AI
          </DialogTitle>
          <DialogDescription>
            Introduce tu objetivo de investigación. El sistema evaluará los{" "}
            <strong>{selectedCount} estudios seleccionados</strong>{" "}
            y mostrará solo los relevantes, ordenados por relevancia.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Textarea
            placeholder="Ej: interventions that improve muscle function in CKD patients on dialysis"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            rows={4}
            disabled={isLoading}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Sé específico: indica población, intervención y outcome de interés.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <p className="text-sm text-destructive font-medium">{error.message}</p>
            {error.details && (
              <p className="text-xs text-destructive/80 mt-1">{error.details}</p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!objective.trim() || isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Evaluando...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4" />
                Ranking AI
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
