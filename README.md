
# Evidence Mapper

A hands-on digital health product project: ETL pipelines, multi-tiered AI filtering, and product architecture for clinical evidence discovery.

Live: **[evidence-mapper.com](https://evidence-mapper.com/)**

---

## What it does

Evidence Mapper lets product teams, founders, and researchers search, filter, and AI-score 63,000+ completed clinical trials with reported results against a specific product hypothesis — structured as a 6-step guided workflow.

| Step | Name | What happens |
|:---:|---|---|
| 1 | **Objective** | Define your research question or product hypothesis in free text |
| 2 | **Filters** | Build a PICO-aligned search (condition, intervention, phase, date range) |
| 3 | **Bronze** | Retrieve all candidate trials matching filters from ClinicalTrials.gov (AACT) |
| 4 | **Silver** | AI filters by relevance to your objective — eliminates out-of-scope trials |
| 5 | **Gold** | AI scores each trial (0–10) and structures key findings against the objective |
| 6 | **Report** | Generates an evidence landscape, maturity assessment, and build/no-build signal |

---

## What I built

- **ETL pipeline** over 63,394 completed trials **with reported results** from ClinicalTrials.gov via AACT (January 2026 snapshot), normalized and indexed in PostgreSQL/Supabase.
- **MeSH-indexed condition search** with autocomplete and server-side paginated RPC to avoid Supabase URL row limits.
- **Keyword tag engine** for intervention queries (ILIKE matching, capped at 5 tags to prevent query degradation).
- **Three-tier filtering architecture (Bronze → Silver → Gold)** to progressively eliminate noise before heavy LLM processing.
- **Human-in-the-loop (HITL) review gate** allowing domain experts to inspect and curate candidate studies before report generation.
- **AI scoring pipeline (GPT-4)** evaluating trial abstracts against free-text product hypotheses using structured scoring rubrics.
- **Guided 6-step UX wizard** with persistent state management and client-side PDF export.

---

## What I learned

### Data & Evidence Architecture (The "Evidence Unit" Challenge)

**Completed ≠ Reported Results.**
Most registry entries declare research intent, not scientific outcome data. We strictly filtered the AACT database for completed trials with *reported results* (yielding the 63k+ baseline). Working with raw registry data proved that trial completion status alone is not synonymous with available clinical evidence.

**Clinical evidence is non-comparable without a unified schema.**
Unstructured trial abstracts report heterogeneous endpoints, varying sample demographics, and disparate comparator arms. An AI layer cannot reliably evaluate raw text at scale without first structuring an atomic **"Evidence Unit"** anchored in the PICO framework (Population, Intervention, Comparator, Outcome).

**Evidence validity is hierarchical and stage-dependent (The Origin of Verum).**
A single registry provides market and interventional signal, not definitive clinical proof. A complete evidence engine requires synthesizing multiple layers with distinct epistemic weights:
- *Early Signal & Safety:* Clinical trial registries (ClinicalTrials.gov/AACT).
- *Methodological Validation & Synthesis:* Peer-reviewed literature (PubMed, Cochrane, Embase) with risk-of-bias evaluation.
- *Clinical Adoption & Health Economics:* Post-approval HTA and regulatory reports (NICE, G-BA, EPAR).

*The realization that robust evidence synthesis requires structured PICO extraction across multi-source hierarchies directly led to the development of my next project, **Verum**.*

### Technical

**LLM scoring is non-deterministic.**
The same set of studies can produce variable relevance scores across runs. Mitigation: `temperature=0`, fixed seed, explicit numerical rubrics in the system prompt. The output must be framed as a prioritization signal, not clinical ground truth.

**Data pipeline complexity exceeds model integration complexity.**
AACT schema heterogeneity, MeSH hierarchy mapping, and missing data handling required significantly more architectural effort than the OpenAI API layer.

**Drug class queries require pharmacological ontology mapping.**
Searching generic drug classes (e.g., "SGLT2 inhibitors") returns zero registry matches because records store specific molecule names (e.g., "empagliflozin"). A production iteration requires automated class-to-molecule resolution.

**Mechanism questions do not live in interventional registries.**
Hypotheses asking "why" (e.g., *"Does hormonal fluctuation cause anxiety?"*) cannot be answered by ClinicalTrials.gov—registries only evaluate interventional efficacy. This is an inherent property of the data source, not a search failure.

**Registry data provides directional temperature, not a clinical decision.**
63k trials are sufficient to detect research momentum and clinical focus, but insufficient for regulatory or medical claims without risk-of-bias auditing and full-text extraction.

### Product

**User context defines output utility.**
The same underlying data produces vastly different utility depending on persona framing. Structuring synthesis for a digital health founder requires risk/feasibility framing, whereas pharma R&D requires methodological rigor.

**The primary product gap sits between scientific signal and commercial decision.**
Evidence Mapper identifies scientific activity; it does not solve for market timing, regulatory pathways, or unit economics. Framing this bridge represents the broader product opportunity.

**Public data enables MVPs; multi-source indexing builds defensibility.**
Public registry data validated the workflow hypothesis, but defensible decision-support tools require proprietary indexing of post-approval regulatory datasets (EPAR, NICE Technology Appraisals, JCA reports).

### On Auditability

For early-stage product scoping, viewing source trial links provides adequate validation. For high-stakes clinical or regulatory workflows, full traceability of the LLM's intermediate reasoning steps—not just the underlying bibliography—is non-negotiable.

---

## Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, TypeScript, Tailwind CSS, Shadcn UI |
| **Backend & DB** | Supabase (PostgreSQL, RPC functions) |
| **AI Layer** | OpenAI GPT-4 API (Structured Prompting) |
| **Data Source** | ClinicalTrials.gov via AACT Database |
| **Deployment** | Lovable.dev |

---

## Database Architecture

```sql
em.study_index_complete      -- 63,394 normalized trials with reported results
em.mesh_condition            -- MeSH condition index for autocomplete
em.intervention              -- Cleaned intervention entity index
em.v_ui_study_list_v2        -- Performance-optimized UI view
em.search_studies_paged()    -- Server-side RPC for paginated high-volume queries
```

---

## License

MIT License
