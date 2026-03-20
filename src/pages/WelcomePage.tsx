import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, Target, Zap } from "lucide-react";

const EXAMPLE_URL = "/search?tryExample=1";

const valueProps = [
  {
    icon: Clock,
    title: "Minutes, not weeks",
    body: "Get a full evidence landscape and AI-scored analysis in under 10 minutes. What used to require a consultant now takes a search.",
  },
  {
    icon: Target,
    title: "Scored against your hypothesis",
    body: "Every analysis is scored against your exact product question. You get a specific answer, not a generic literature review.",
  },
  {
    icon: Zap,
    title: "Know before you build",
    body: "Understand the evidence base, the gaps, and the phase maturity before committing to a roadmap. Reduce the risk of building on weak science.",
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
          className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-white leading-tight max-w-3xl"
          style={{ lineHeight: 1.15 }}
        >
          Find out if the science supports your digital health idea
        </h1>

        <p className="mt-6 text-base md:text-lg leading-relaxed max-w-[520px]" style={{ color: "#888" }}>
          Search, filter and AI-score 63,000+ completed clinical trials against
          your product hypothesis — in minutes.
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
            Two steps. One answer.
          </h2>
          <p className="mt-3 text-center text-base" style={{ color: "#888" }}>
            Structured search + AI relevance scoring. No setup required.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-14">
            {/* Card 1 */}
            <div className="rounded-xl p-10 flex flex-col" style={{ backgroundColor: "#f5f5f5" }}>
              <span className="text-xs font-mono tracking-widest uppercase" style={{ color: "#999" }}>
                01
              </span>
              <h3 className="mt-4 font-serif text-xl font-bold" style={{ color: "#0a0a0a" }}>
                Map what's already been tried
              </h3>
              <p className="mt-1 text-sm font-medium" style={{ color: "#555" }}>
                Search 63,000+ completed trials by condition, intervention and phase
              </p>
              <div className="my-5 border-t" style={{ borderColor: "#ddd" }} />
              <p className="text-sm leading-relaxed flex-1" style={{ color: "#666" }}>
                Filter across all ClinicalTrials.gov completed data by condition, intervention, trial phase and date range. Get the full picture of what's been studied, at what scale, and with what results.
              </p>
              <span
                className="mt-6 inline-flex self-start items-center rounded-full border px-3 py-1 text-xs font-semibold"
                style={{ borderColor: "rgb(180 83 9 / 0.3)", backgroundColor: "rgb(180 83 9 / 0.1)", color: "rgb(180 83 9)" }}
              >
                Evidence landscape
              </span>
            </div>

            {/* Card 2 */}
            <div className="rounded-xl p-10 flex flex-col" style={{ backgroundColor: "#0a0a0a" }}>
              <span className="text-xs font-mono tracking-widest uppercase" style={{ color: "#666" }}>
                02
              </span>
              <h3 className="mt-4 font-serif text-xl font-bold text-white">
                Get the answer to your specific question
              </h3>
              <p className="mt-1 text-sm font-medium" style={{ color: "#888" }}>
                AI scores every trial against your product hypothesis
              </p>
              <div className="my-5 border-t" style={{ borderColor: "#333" }} />
              <p className="text-sm leading-relaxed flex-1" style={{ color: "#aaa" }}>
                Most searches return noise. Evidence Mapper reads every abstract, scores each trial against your exact question, and tells you whether the evidence supports building — and where the gaps are.
              </p>
              <span className="mt-6 inline-flex self-start items-center rounded-full px-3 py-1 text-xs font-semibold bg-indigo text-indigo-foreground">
                Evidence signal · Gap analysis
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUE PROPS ──────────────────────────────────────── */}
      <section className="px-6" style={{ backgroundColor: "#f9f9f9", paddingTop: 60, paddingBottom: 60 }}>
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-center" style={{ color: "#0a0a0a" }}>
            Built for product people, not researchers
          </h2>
          <p className="mt-3 text-center text-base" style={{ color: "#888" }}>
            No academic training required. No manual screening. No waiting.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {valueProps.map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                <item.icon className="h-6 w-6" style={{ color: "#666" }} />
                <h3 className="text-sm font-semibold" style={{ color: "#0a0a0a" }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BEFORE / AFTER ───────────────────────────────────── */}
      <section className="px-6" style={{ backgroundColor: "#0a0a0a", paddingTop: 60, paddingBottom: 60 }}>
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-center text-white">
            From idea to evidence signal in minutes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mt-12 rounded-xl overflow-hidden border" style={{ borderColor: "#222" }}>
            {/* Before column */}
            <div className="p-8 space-y-6" style={{ backgroundColor: "#111" }}>
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#666" }}>Before</span>
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-white/70">Manual search</p>
                  <p className="text-xs leading-relaxed mt-1" style={{ color: "#888" }}>
                    Hours reviewing abstracts one by one across multiple databases
                  </p>
                </div>
                <div style={{ borderTop: "1px solid #222" }} />
                <div>
                  <p className="text-sm font-medium text-white/70">Generic output</p>
                  <p className="text-xs leading-relaxed mt-1" style={{ color: "#888" }}>
                    Consultant delivers a landscape report in 3 weeks that doesn't answer your specific question
                  </p>
                </div>
                <div style={{ borderTop: "1px solid #222" }} />
                <div>
                  <p className="text-sm font-medium text-white/70">No signal</p>
                  <p className="text-xs leading-relaxed mt-1" style={{ color: "#888" }}>
                    You still don't know if the science supports your idea
                  </p>
                </div>
              </div>
            </div>

            {/* After column */}
            <div className="p-8 space-y-6" style={{ backgroundColor: "#0a0a0a", borderLeft: "1px solid #222" }}>
              <span className="text-xs font-semibold uppercase tracking-widest text-indigo">With Evidence Mapper</span>
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-white">AI reads every abstract</p>
                  <p className="text-xs leading-relaxed mt-1" style={{ color: "#888" }}>
                    Automatically scored against your product hypothesis, in minutes
                  </p>
                </div>
                <div style={{ borderTop: "1px solid #222" }} />
                <div>
                  <p className="text-sm font-medium text-white">Specific to your question</p>
                  <p className="text-xs leading-relaxed mt-1" style={{ color: "#888" }}>
                    You get a structured report answering exactly what you asked
                  </p>
                </div>
                <div style={{ borderTop: "1px solid #222" }} />
                <div>
                  <p className="text-sm font-medium text-white">Clear verdict</p>
                  <p className="text-xs leading-relaxed mt-1" style={{ color: "#888" }}>
                    Yes / With conditions / Not yet — with the evidence behind it
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT THIS PROJECT ───────────────────────────────── */}
      <section className="px-6" style={{ backgroundColor: "#f9f9f9", paddingTop: 60, paddingBottom: 60 }}>
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold" style={{ color: "#0a0a0a" }}>
            About this project
          </h2>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "#555" }}>
            Evidence Mapper is a hands-on learning project, not a production product.
            I built it to develop practical skills I wanted to understand deeply as a
            digital health PM: ETL pipelines from public health datasets, AI-powered
            relevance scoring, and product design for evidence workflows.
          </p>

          <h3 className="mt-8 text-sm font-semibold" style={{ color: "#0a0a0a" }}>
            What I built
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed" style={{ color: "#555" }}>
            <li className="flex gap-2">
              <span style={{ color: "#999" }}>•</span>
              ETL pipeline ingesting 63,394 completed trials from ClinicalTrials.gov via AACT, normalized and indexed in PostgreSQL/Supabase
            </li>
            <li className="flex gap-2">
              <span style={{ color: "#999" }}>•</span>
              MeSH-indexed PICO search with condition autocomplete, free-text keyword tags, and server-side pagination
            </li>
            <li className="flex gap-2">
              <span style={{ color: "#999" }}>•</span>
              GPT-4 scoring pipeline that reads every abstract and scores it against a free-text research objective
            </li>
            <li className="flex gap-2">
              <span style={{ color: "#999" }}>•</span>
              Three-tier filtering pipeline (Bronze → Silver → Gold) to progressively reduce noise before the LLM analysis
            </li>
            <li className="flex gap-2">
              <span style={{ color: "#999" }}>•</span>
              Human-in-the-loop study selection for expert users who want to review studies before generating the report
            </li>
            <li className="flex gap-2">
              <span style={{ color: "#999" }}>•</span>
              6-step guided UX wizard with persistent state and PDF export
            </li>
          </ul>

          <h3 className="mt-8 text-sm font-semibold" style={{ color: "#0a0a0a" }}>
            What I learned
          </h3>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "#555" }}>
            Building this surfaced three categories of learning: technical, product, and the limits of public data.
          </p>

          <p className="mt-6 text-sm font-semibold" style={{ color: "#0a0a0a" }}>
            Technical
          </p>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "#555" }}>
            LLM scoring is non-deterministic. The same set of studies scores differently across runs. Fix: temperature=0, fixed seed, explicit threshold in the prompt — and treating the output as signal, not ground truth.
          </p>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "#555" }}>
            Integrating external APIs is where the real complexity lives, not in the LLM. AACT schema, ClinicalTrials.gov data heterogeneity, and MeSH indexing required more careful handling than the AI layer.
          </p>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "#555" }}>
            Drug class names return zero results. Searching "SGLT2 inhibitors" finds nothing — you need molecule names like "empagliflozin". A production version would map drug classes to molecules automatically.
          </p>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "#555" }}>
            Mechanism questions don't live in trials. "Is there a relationship between hormonal fluctuation and anxiety?" has no answer in ClinicalTrials.gov — only intervention questions do. This is a structural limit of the data source, not a search problem.
          </p>

          <p className="mt-6 text-sm font-semibold" style={{ color: "#0a0a0a" }}>
            Product
          </p>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "#555" }}>
            The user defines the value, not the technology. The same dataset produces a useless report or a useful one depending on how the prompt is framed. Rewriting the analysis for an entrepreneur instead of a pharma R&D team changed the entire output — same data, different framing.
          </p>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "#555" }}>
            The real unresolved problem is the gap between scientific signal and commercial decision. Evidence Mapper can tell you the science is promising. It can't tell you whether the market is ready, whether the regulatory path is feasible, or whether the unit economics work. That gap is where the actual product opportunity lives.
          </p>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "#555" }}>
            Public data is enough for an MVP, not enough for a defensible product. 63,000 trials gives you temperature — a sense of direction. A production tool would need published literature (Cochrane, Embase), quality assessment, and risk-of-bias scoring to support decisions with real consequences.
          </p>

          <p className="mt-6 text-sm font-semibold" style={{ color: "#0a0a0a" }}>
            On auditability
          </p>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "#555" }}>
            For an entrepreneur making a product bet, seeing the source studies is enough. For decisions with regulatory or clinical consequences — as in Verum — you'd need full traceability of the LLM's reasoning, not just the source data. Evidence Mapper shows you what it analyzed, not how it weighted it.
          </p>

          <a
            href="#"
            className="inline-flex items-center gap-1 mt-6 text-sm font-medium text-indigo hover:underline"
          >
            → See the strategy case study
          </a>

          <div className="mt-8 pt-6" style={{ borderTop: "1px solid #ddd" }}>
            <p className="text-xs" style={{ color: "#999" }}>
              Stack: React + TypeScript · Supabase (PostgreSQL) · OpenAI GPT-4 · ClinicalTrials.gov AACT · PubMed API · Lovable
            </p>
            <div className="flex gap-4 mt-3">
              <a
                href="https://github.com/mczuzu/evidence-mapper"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-indigo hover:underline"
              >
                GitHub →
              </a>
              <a
                href="https://www.linkedin.com/in/mcz/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-indigo hover:underline"
              >
                LinkedIn →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="px-6 py-8 text-center text-xs" style={{ backgroundColor: "#0a0a0a", color: "#555" }}>
        Clinical evidence synthesis · Powered by ClinicalTrials.gov · 63,394 trials indexed
      </footer>
    </div>
  );
};

export default WelcomePage;
