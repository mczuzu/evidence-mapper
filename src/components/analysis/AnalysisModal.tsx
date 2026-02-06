import { useState, useEffect } from "react";
import { Loader2, FlaskConical, Lightbulb, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface AnalysisContext {
  product_idea?: string;
  target_population?: string;
  investment_budget?: "low" | "medium" | "high";
  time_to_market?: "urgent" | "standard" | "patient";
}

interface AnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (context?: AnalysisContext) => void;
  isLoading?: boolean;
  error?: { message: string; details?: string } | null;
}

const STORAGE_KEY = "analysis-context-v1";

function loadSavedContext(): AnalysisContext {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load saved context:", e);
  }
  return {};
}

function saveContext(context: AnalysisContext) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  } catch (e) {
    console.error("Failed to save context:", e);
  }
}

export function AnalysisModal({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isLoading = false,
  error = null,
}: AnalysisModalProps) {
  const [mode, setMode] = useState<"exploratory" | "idea">("exploratory");
  const [productIdea, setProductIdea] = useState("");
  const [targetPopulation, setTargetPopulation] = useState("");
  const [investmentBudget, setInvestmentBudget] = useState<string>("");
  const [timeToMarket, setTimeToMarket] = useState<string>("");
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // Load saved context when modal opens
  useEffect(() => {
    if (open) {
      const saved = loadSavedContext();
      if (saved.product_idea) {
        setProductIdea(saved.product_idea);
        setMode("idea");
      }
      if (saved.target_population) setTargetPopulation(saved.target_population);
      if (saved.investment_budget) setInvestmentBudget(saved.investment_budget);
      if (saved.time_to_market) setTimeToMarket(saved.time_to_market);
      setShowErrorDetails(false);
    }
  }, [open]);

  const handleConfirm = () => {
    if (mode === "exploratory") {
      onConfirm(undefined);
    } else {
      // Validate product_idea is not empty
      const trimmedIdea = productIdea.trim();
      if (!trimmedIdea) {
        return; // Button should be disabled, but safety check
      }

      // Build context object, omitting empty values
      const context: AnalysisContext = {
        product_idea: trimmedIdea,
      };

      const trimmedPopulation = targetPopulation.trim();
      if (trimmedPopulation) {
        context.target_population = trimmedPopulation;
      }

      if (investmentBudget && investmentBudget !== "none") {
        context.investment_budget = investmentBudget as AnalysisContext["investment_budget"];
      }

      if (timeToMarket && timeToMarket !== "none") {
        context.time_to_market = timeToMarket as AnalysisContext["time_to_market"];
      }

      // Save for next time
      saveContext(context);

      onConfirm(context);
    }
  };

  const isIdeaValid = mode === "exploratory" || productIdea.trim().length > 0;
  const canSubmit = !isLoading && isIdeaValid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FlaskConical className="h-5 w-5 text-primary" />
            Analyze selected studies
          </DialogTitle>
          <DialogDescription>
            Optionally evaluate a concrete product idea against the selected evidence.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mode selector */}
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as "exploratory" | "idea")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger
                value="exploratory"
                className={cn(
                  "flex items-center gap-2 py-3 px-4 data-[state=active]:bg-primary/10",
                )}
              >
                <Search className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Exploratory synthesis</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    General evidence analysis
                  </div>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="idea"
                className={cn(
                  "flex items-center gap-2 py-3 px-4 data-[state=active]:bg-primary/10",
                )}
              >
                <Lightbulb className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Analyze a product idea</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    Evaluate against selected evidence
                  </div>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Idea-driven fields */}
          {mode === "idea" && (
            <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/20">
              {/* Product idea - required */}
              <div className="space-y-2">
                <Label htmlFor="product-idea" className="flex items-center gap-1">
                  Product idea <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="product-idea"
                  placeholder="Describe your product or service idea... (e.g., 'A wearable device that monitors stress levels and provides real-time biofeedback interventions for menopausal women experiencing mood fluctuations')"
                  value={productIdea}
                  onChange={(e) => setProductIdea(e.target.value)}
                  className="min-h-[100px] resize-y"
                />
                {mode === "idea" && productIdea.trim().length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Required: Describe what you want to build or validate
                  </p>
                )}
              </div>

              {/* Target population - optional */}
              <div className="space-y-2">
                <Label htmlFor="target-population">Target population (optional)</Label>
                <Input
                  id="target-population"
                  placeholder="e.g., Women 45-55 with perimenopausal symptoms"
                  value={targetPopulation}
                  onChange={(e) => setTargetPopulation(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Investment budget - optional */}
                <div className="space-y-2">
                  <Label>Investment budget (optional)</Label>
                  <Select value={investmentBudget} onValueChange={setInvestmentBudget}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      <SelectItem value="low">Low (&lt; $500K)</SelectItem>
                      <SelectItem value="medium">Medium ($500K - $5M)</SelectItem>
                      <SelectItem value="high">High (&gt; $5M)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Time to market - optional */}
                <div className="space-y-2">
                  <Label>Time to market (optional)</Label>
                  <Select value={timeToMarket} onValueChange={setTimeToMarket}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      <SelectItem value="urgent">Urgent (&lt; 6 months)</SelectItem>
                      <SelectItem value="standard">Standard (6-18 months)</SelectItem>
                      <SelectItem value="patient">Patient (&gt; 18 months)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
              <p className="text-sm text-destructive font-medium">{error.message}</p>
              {error.details && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowErrorDetails(!showErrorDetails)}
                    className="text-xs text-destructive/80 p-0 h-auto"
                  >
                    {showErrorDetails ? "Hide details" : "Show details"}
                  </Button>
                  {showErrorDetails && (
                    <pre className="text-xs text-destructive/70 bg-destructive/5 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                      {error.details}
                    </pre>
                  )}
                </>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg px-4 py-3">
            {mode === "exploratory" ? (
              <p>
                <strong>{selectedCount}</strong> studies will be analyzed to identify patterns,
                gaps, and opportunities in the evidence base.
              </p>
            ) : (
              <p>
                <strong>{selectedCount}</strong> studies will be evaluated against your product
                idea to assess evidence sufficiency and market viability.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canSubmit} className="gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <FlaskConical className="h-4 w-4" />
                Analyze
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
