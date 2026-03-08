import { Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const PIPELINE_STEPS = [
  { num: 1, label: "Objective" },
  { num: 2, label: "Filters" },
  { num: 3, label: "Bronze" },
  { num: 4, label: "Silver" },
  { num: 5, label: "Gold" },
  { num: 6, label: "Report" },
];

export function PipelineTracker({ currentStep }: { currentStep: 1 | 2 | 3 | 4 | 5 | 6 }) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="sticky top-0 z-30 w-full bg-background border-b border-border">
        <div className="max-w-[700px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between relative">
            <div
              className="absolute top-4 left-4 right-4 h-px"
              style={{ backgroundColor: "hsl(var(--border))" }}
            />
            {PIPELINE_STEPS.map((s) => {
              const isComplete = s.num < currentStep;
              const isCurrent = s.num === currentStep;
              const isFuture = s.num > currentStep;

              const circle = (
                <div className="relative flex flex-col items-center gap-1.5 z-10">
                  <div
                    className="flex items-center justify-center rounded-full text-xs font-semibold transition-all"
                    style={{
                      width: 32,
                      height: 32,
                      backgroundColor: isCurrent
                        ? "hsl(var(--indigo))"
                        : isComplete
                          ? "hsl(var(--foreground))"
                          : "hsl(var(--background))",
                      color:
                        isComplete || isCurrent
                          ? "hsl(var(--indigo-foreground))"
                          : "hsl(var(--muted-foreground))",
                      border:
                        isComplete || isCurrent
                          ? "none"
                          : "1.5px solid hsl(var(--border))",
                      boxShadow: isCurrent
                        ? "0 0 0 3px hsl(var(--background)), 0 0 0 5px hsl(var(--indigo) / 0.3)"
                        : "none",
                    }}
                  >
                    {isComplete ? <Check className="h-3.5 w-3.5" /> : s.num}
                  </div>
                  <span
                    className="text-[10px] font-medium leading-none"
                    style={{
                      color:
                        isComplete || isCurrent
                          ? "hsl(var(--foreground))"
                          : "hsl(var(--muted-foreground))",
                      fontWeight: isComplete || isCurrent ? 600 : 400,
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              );

              if (isFuture) {
                return (
                  <Tooltip key={s.num}>
                    <TooltipTrigger asChild>{circle}</TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Available after completing this step
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={s.num}>{circle}</div>;
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
