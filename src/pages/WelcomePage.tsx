import { useNavigate } from "react-router-dom";
import { ArrowRight, Search, Sparkles, FlaskConical } from "lucide-react";

const EXAMPLE_URL = "/search?tryExample=1";

const comparisons = [
  {
    icon: Search,
    bold: "PubMed returns papers.",
    rest: "Evidence Mapper returns pipeline intelligence.",
  },
  {
    icon: Sparkles,
    bold: "PubMed doesn't score trials against your R&D objective.",
    rest: "Evidence Mapper does.",
  },
  {
    icon: FlaskConical,
    bold: "PubMed has no gap analysis.",
    rest: "Evidence Mapper identifies white space in the evidence.",
  },
];

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ backgroundColor: "#0a0a0a" }}
      >
        <span className="inline-flex items-center rounded-full border border-white/20 px-4 py-1.5 text-xs text-white/50 mb-10">
          63,394 completed trials · Phase 1–4 · ClinicalTrials.gov
        </span>

        <h1
          className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-white leading-tight max-w-2xl"
          style={{ lineHeight: 1.15 }}
        >
          Know if a therapeutic space
          <br />
          is worth entering
        </h1>

        <p className="mt-6 text-base md:text-lg leading-relaxed max-w-[520px]" style={{ color: "#888" }}>
          Evidence Mapper scans 63,000+ completed clinical trials, maps
          intervention clusters, detects evidence gaps, and delivers a go/no-go
          signal for your pipeline decision — in minutes.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => navigate("/search")}
            className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-7 py-3 text-sm font-medium hover:bg-white/90 transition-colors"
          >
            Start your analysis
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate(EXAMPLE_URL)}
            className="inline-flex items-center gap-2 rounded-lg border border-indigo text-indigo px-7 py-3 text-sm font-medium hover:bg-indigo-light/10 transition-colors"
          >
            See a live example
          </button>
        </div>
      </section>

      {/* ── TWO PROCESSES ────────────────────────────────────── */}
      <section className="bg-white px-6" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-center" style={{ color: "#0a0a0a" }}>
            Two processes. One answer.
          </h2>
          <p className="mt-3 text-center text-base" style={{ color: "#888" }}>
            Most tools stop at search. Evidence Mapper delivers pipeline intelligence.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-14">
            {/* Card 1 */}
            <div className="rounded-xl p-10 flex flex-col" style={{ backgroundColor: "#f5f5f5" }}>
              <span className="text-xs font-mono tracking-widest uppercase" style={{ color: "#999" }}>
                01
              </span>
              <h3 className="mt-4 font-serif text-xl font-bold" style={{ color: "#0a0a0a" }}>
                Find the studies
              </h3>
              <p className="mt-1 text-sm font-medium" style={{ color: "#555" }}>
                Structured search across 63,000+ trials
              </p>
              <div className="my-5 border-t" style={{ borderColor: "#ddd" }} />
              <p className="text-sm leading-relaxed flex-1" style={{ color: "#666" }}>
                Define your clinical question using conditions, interventions,
                trial phase and date range. Evidence Mapper searches MeSH-indexed
                ClinicalTrials.gov data and returns every study that matches.
              </p>
              <span className="mt-6 inline-flex self-start items-center rounded-full border px-3 py-1 text-xs font-semibold"
                style={{ borderColor: "rgb(180 83 9 / 0.3)", backgroundColor: "rgb(180 83 9 / 0.1)", color: "rgb(180 83 9)" }}
              >
                Bronze dataset
              </span>
            </div>

            {/* Card 2 */}
            <div className="rounded-xl p-10 flex flex-col" style={{ backgroundColor: "#0a0a0a" }}>
              <span className="text-xs font-mono tracking-widest uppercase" style={{ color: "#666" }}>
                02
              </span>
              <h3 className="mt-4 font-serif text-xl font-bold text-white">
                Focus on what matters
              </h3>
              <p className="mt-1 text-sm font-medium" style={{ color: "#888" }}>
                AI removes noise. You get signal.
              </p>
              <div className="my-5 border-t" style={{ borderColor: "#333" }} />
              <p className="text-sm leading-relaxed flex-1" style={{ color: "#aaa" }}>
                Most results include studies that mention your terms but don't
                answer your question. Evidence Mapper reads every abstract, scores
                each study against your objective, and keeps only what's genuinely
                relevant.
              </p>
              <span className="mt-6 inline-flex self-start items-center rounded-full px-3 py-1 text-xs font-semibold bg-indigo text-indigo-foreground">
                Silver → Gold → Report
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── VS PUBMED ────────────────────────────────────────── */}
      <section className="px-6" style={{ backgroundColor: "#f9f9f9", paddingTop: 60, paddingBottom: 60 }}>
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-center" style={{ color: "#0a0a0a" }}>
            Why not just use PubMed Advanced Search?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {comparisons.map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-4">
                <item.icon className="h-6 w-6" style={{ color: "#666" }} />
                <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
                  <span className="font-semibold" style={{ color: "#0a0a0a" }}>
                    {item.bold}
                  </span>
                  <br />
                  {item.rest}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="px-6 py-8 text-center text-xs" style={{ backgroundColor: "#0a0a0a", color: "#555" }}>
        Evidence Mapper · Built on ClinicalTrials.gov data
      </footer>
    </div>
  );
};

export default WelcomePage;
