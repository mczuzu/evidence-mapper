import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, Brain } from "lucide-react";
import { exampleSearchUrl } from "@/lib/example-search";

const comparisonItems = [
  "PubMed finds papers. Evidence Mapper tells you what they mean for your objective.",
  "PubMed returns thousands of results. Evidence Mapper returns a focused, scored dataset.",
  "PubMed stops at search. Evidence Mapper generates a gap analysis with recommendations.",
];

const steps = [
  { emoji: "🟤", label: "Define your objective & search" },
  { emoji: "⬜", label: "Filter & validate with AI" },
  { emoji: "🟡", label: "Generate evidence report" },
];

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="flex flex-col items-center justify-center px-4 pt-24 pb-20 text-center"
        style={{ backgroundColor: "#0f0f0f" }}
      >
        <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/70 mb-8">
          63,394 completed clinical trials · ClinicalTrials.gov
        </span>

        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white max-w-3xl leading-tight">
          From clinical question to evidence report
        </h1>

        <p className="mt-5 text-base md:text-lg text-white/60 max-w-2xl leading-relaxed">
          Evidence Mapper structures your search, removes irrelevant studies automatically, and synthesizes what the evidence says — so you don't have to do it manually.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
          <Button
            size="lg"
            onClick={() => navigate("/search")}
            className="gap-2 text-base px-8 bg-white text-black hover:bg-white/90"
          >
            Start searching
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={() => navigate(exampleSearchUrl())}
            className="gap-2 text-base px-8 text-white/80 hover:text-white hover:bg-white/10"
          >
            See a live example
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* TWO PROCESSES */}
      <section className="px-4 py-20 max-w-5xl mx-auto">
        <h2 className="font-serif text-2xl md:text-3xl font-semibold text-center text-foreground mb-12">
          Two processes. One answer.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Process 1 */}
          <div className="rounded-xl border border-border bg-muted/40 p-8 space-y-4">
            <span className="text-xs font-mono text-muted-foreground">01</span>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-foreground" />
              <h3 className="font-serif text-xl font-semibold text-foreground">Find the studies</h3>
            </div>
            <p className="text-sm font-medium text-foreground/80">
              Structured search across 63,000+ trials
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Define your clinical question using conditions, interventions, trial phase and date range. Evidence Mapper searches MeSH-indexed ClinicalTrials.gov data and returns every study that matches your criteria.
            </p>
            <span className="inline-flex items-center rounded-full border border-amber-700/30 bg-amber-700/10 px-3 py-1 text-xs font-semibold text-amber-700">
              Bronze dataset
            </span>
          </div>

          {/* Process 2 */}
          <div className="rounded-xl p-8 space-y-4 text-white" style={{ backgroundColor: "#0f0f0f" }}>
            <span className="text-xs font-mono text-white/50">02</span>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-white" />
              <h3 className="font-serif text-xl font-semibold text-white">Focus on what matters</h3>
            </div>
            <p className="text-sm font-medium text-white/70">
              AI removes noise. You get signal.
            </p>
            <p className="text-sm text-white/50 leading-relaxed">
              Most search results include studies that mention your terms but don't actually answer your question. Evidence Mapper reads every abstract, scores each study against your specific objective, and keeps only what's genuinely relevant.
            </p>
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
              Silver → Gold → Report
            </span>
          </div>
        </div>
      </section>

      {/* VS PUBMED */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-2xl font-semibold text-center text-foreground mb-10">
            Why not just use PubMed Advanced Search?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {comparisonItems.map((item, i) => (
              <div key={i} className="rounded-lg border border-border bg-background p-6">
                <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PIPELINE STEPS */}
      <section className="px-4 py-12 pb-20">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-lg">{step.emoji}</span>
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default WelcomePage;
