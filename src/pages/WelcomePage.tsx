import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { exampleSearchUrl } from "@/lib/example-search";

const steps = [
  { emoji: "🟤", label: "Define your objective & search" },
  { emoji: "⬜", label: "Filter & validate with AI" },
  { emoji: "🟡", label: "Analyze evidence" },
];

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-xl w-full text-center space-y-8">
        <div className="space-y-3">
          <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            Evidence Mapper
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            AI-assisted clinical evidence analysis
          </p>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground max-w-md mx-auto">
          Search 63,000+ completed clinical trials from ClinicalTrials.gov.
          Filter and validate evidence with AI using a Bronze → Silver → Gold
          pipeline. Generate objective-driven analysis reports in seconds.
        </p>

        <Button
          size="lg"
          onClick={() => navigate("/search")}
          className="gap-2 text-base px-8"
        >
          Start searching
          <ArrowRight className="h-4 w-4" />
        </Button>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 pt-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-lg">{step.emoji}</span>
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
