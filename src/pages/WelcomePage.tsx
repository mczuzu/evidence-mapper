import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { exampleSearchUrl } from "@/lib/example-search";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const features = [
  {
    icon: "🔬",
    title: "Structured PICO search",
    description:
      "Filter by condition, intervention, phase and date range using MeSH-indexed clinical trial data",
  },
  {
    icon: "🤖",
    title: "AI-powered filtering",
    description:
      "Bronze → Silver → Gold pipeline removes noise and validates relevance automatically",
  },
  {
    icon: "📊",
    title: "Evidence reports in seconds",
    description:
      "Generate objective-driven analysis reports with gaps, opportunities and recommendations",
  },
];

const comparison = [
  {
    feature: "Clinical trials with results",
    us: "✅ 63,000+",
    them: "✅ Yes",
  },
  {
    feature: "AI relevance filtering",
    us: "✅ Automated",
    them: "❌ Manual",
  },
  {
    feature: "Evidence gap analysis report",
    us: "✅ One click",
    them: "❌ Not available",
  },
];

const steps = [
  { emoji: "🟤", label: "Define your objective & search" },
  { emoji: "⬜", label: "Filter & validate with AI" },
  { emoji: "🟡", label: "Analyze evidence" },
];

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* SECTION 1 — Hero */}
      <section className="flex flex-col items-center justify-center px-4 pt-24 pb-20 text-center">
        <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
          Evidence Mapper
        </h1>
        <p className="mt-4 text-lg md:text-2xl font-bold text-foreground max-w-2xl leading-snug">
          From 63,000 clinical trials to an actionable evidence report in
          minutes
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Button
            size="lg"
            onClick={() => navigate("/search")}
            className="gap-2 text-base px-8"
          >
            Start searching
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate(exampleSearchUrl())}
            className="gap-2 text-base px-8"
          >
            ✦ Try a live example
          </Button>
        </div>
      </section>

      {/* SECTION 2 — Why Evidence Mapper? */}
      <section className="px-4 py-16 max-w-5xl mx-auto">
        <h2 className="font-serif text-2xl font-semibold text-center text-foreground mb-10">
          Why Evidence Mapper?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border bg-card text-card-foreground p-6 space-y-3"
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="font-serif text-base font-semibold text-foreground">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3 — Comparison table */}
      <section className="px-4 py-16 max-w-3xl mx-auto">
        <h2 className="font-serif text-2xl font-semibold text-center text-foreground mb-10">
          vs. PubMed Advanced Search
        </h2>
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]" />
                <TableHead className="text-center font-semibold text-foreground">
                  Evidence Mapper
                </TableHead>
                <TableHead className="text-center font-semibold text-foreground">
                  PubMed Advanced
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparison.map((row) => (
                <TableRow key={row.feature}>
                  <TableCell className="font-medium text-foreground">
                    {row.feature}
                  </TableCell>
                  <TableCell className="text-center">{row.us}</TableCell>
                  <TableCell className="text-center">{row.them}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* SECTION 4 — Pipeline steps */}
      <section className="px-4 py-12 pb-20">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
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
