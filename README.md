# Evidence Mapper

A hands-on learning project built to develop practical digital health PM skills: 
ETL pipelines, AI-powered relevance scoring, and product design for clinical workflows.

Live: **evidence-mapper.com**

---

## What it does

Evidence Mapper lets you search, filter and AI-score 63,000+ completed clinical 
trials against a specific product hypothesis — structured as a 6-step guided workflow.

| Step | Name | What happens |
|------|------|--------------|
| 1 | Objective | Define your research question in free text |
| 2 | Filters | Build a PICO search (condition, intervention, phase, date range) |
| 3 | Bronze | All trials matching your filters from ClinicalTrials.gov |
| 4 | Silver | AI filters by relevance to your objective — keeps only matching trials |
| 5 | Gold | AI scores each trial 0–10 against your objective |
| 6 | Report | Evidence landscape, phase maturity, and a build/no-build verdict |

---

## What I built

- ETL pipeline over 63,394 completed trials from ClinicalTrials.gov via AACT 
  (January 2026 snapshot), normalized and indexed in PostgreSQL/Supabase
- MeSH-indexed condition search with autocomplete and server-side paginated RPC 
  to avoid Supabase's URL row limits
- Free-text keyword tag input for intervention search (ILIKE matching, max 5 tags)
- Three-tier filtering pipeline (Bronze → Silver → Gold) to progressively reduce 
  noise before the LLM analysis step
- Human-in-the-loop study selection for expert users who want to review studies 
  manually before generating the report
- GPT-4 scoring pipeline that reads every abstract and scores it against a 
  free-text objective
- 6-step guided UX wizard with persistent state and PDF export

---

## What I learned

### Technical

**LLM scoring is non-deterministic.**
The same set of studies scores differently across runs. Mitigation: temperature=0, 
fixed seed, explicit threshold in the prompt. The output should be treated as 
signal, not ground truth.

**API integration is where the real complexity lives — not the LLM.**
AACT schema heterogeneity, MeSH indexing quirks, and ClinicalTrials.gov data 
inconsistencies required more careful handling than the AI layer.

**Drug class names return zero results.**
Searching "SGLT2 inhibitors" finds nothing — molecule names like "empagliflozin" 
are required. A production version would map drug classes to constituent molecules 
automatically via a pharmacological ontology.

**Mechanism questions don't live in trials.**
"Is there a relationship between hormonal fluctuation and anxiety?" has no answer 
in ClinicalTrials.gov — only intervention questions do. This is a structural limit 
of the data source, not a search problem.

**63,000 trials gives you temperature, not a decision.**
The dataset is sufficient to detect signal and pattern. It is insufficient for 
clinical or regulatory claims. A production tool would need published literature 
(Cochrane, Embase), quality assessment, and risk-of-bias scoring.

### Product

**The user defines the value, not the technology.**
The same dataset produces a useless report or a useful one depending on how the 
prompt is framed. Rewriting the analysis for an entrepreneur instead of a pharma 
R&D team changed the entire output — same data, completely different utility.

**The real gap is between scientific signal and commercial decision.**
Evidence Mapper can tell you the science is promising. It can't tell you whether 
the market is ready, the regulatory path is feasible, or the unit economics work. 
That's where the actual product opportunity lives — and it's the subject of a 
separate case study.

**Public data is enough for an MVP, not enough for a defensible product.**
A production tool would need post-approval regulatory sources (EPAR, NICE 
Technology Appraisals, JCA reports, G-BA decisions) to support decisions with 
real consequences. No existing platform indexes these sources together — that 
structural gap is documented separately.

### On auditability

For an entrepreneur making a product bet, seeing the source studies is enough. 
For decisions with regulatory or clinical consequences, you'd need full 
traceability of the LLM's reasoning, not just the source data. Evidence Mapper 
shows what it analyzed, not how it weighted it.

---

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript + Tailwind CSS |
| Backend | Supabase (PostgreSQL) |
| AI | OpenAI GPT-4 |
| Data | ClinicalTrials.gov via AACT |
| Hosting | Lovable.dev |

---

## Key database schema
```
em.study_index_complete      -- 63,394 studies (base)
em.mesh_condition            -- MeSH condition index
em.intervention              -- intervention index
em.v_ui_study_list_v2        -- main view for UI
em.search_studies_paged()    -- server-side paginated RPC
```

---

MIT License
