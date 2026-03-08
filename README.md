# Evidence Mapper

**Pipeline intelligence for R&D teams — powered by 63,394 completed clinical trials**

> Know if a therapeutic space is worth entering. In minutes, not weeks.

[![Live App](https://img.shields.io/badge/Live%20App-evidence--mapper.com-black?style=flat-square)](https://evidence-mapper.com)
[![Built on](https://img.shields.io/badge/Data-ClinicalTrials.gov-blue?style=flat-square)](https://clinicaltrials.gov)
[![Phase](https://img.shields.io/badge/Trials-Phase%201–4-amber?style=flat-square)]()

---

## What is Evidence Mapper?

Evidence Mapper is an AI-native pipeline intelligence tool that transforms clinical trial data into actionable R&D decisions. 

Most R&D landscape analyses take weeks of manual work or cost thousands through consultancies like IQVIA or Clarivate. Evidence Mapper does it in minutes — scored against your specific objective, not a generic template.

---

## The Two-Process Model

Evidence Mapper is built around two distinct processes:

### Process 1 — Find the Studies
> *"What exists in this therapeutic space?"*

Structured PICO search across 63,394 completed trials from ClinicalTrials.gov:
- Filter by **condition** (MeSH-indexed)
- Filter by **intervention**
- Filter by **trial phase** (Phase 1–4)
- Filter by **results published date range**

Output: **Bronze dataset** — all matching trials

### Process 2 — Focus on What Matters
> *"Which of these trials actually answer my pipeline question?"*

AI reads every abstract and scores each trial against your specific R&D objective:
- **Silver**: AI removes noise — keeps only trials that directly address your objective
- **Gold**: AI scores each trial 0–10 against your objective
- **Report**: Evidence landscape, intervention clusters, opportunity scores, Go/No-Go signal

---

## The 6-Step Pipeline

```
① Objective → ② Filters → ③ Bronze → ④ Silver → ⑤ Gold → ⑥ Report
```

Each step has a single clear action. The pipeline tracker is always visible so you know exactly where you are.

---

## Output: Evidence Report

The report is designed for R&D pipeline decisions, not academic review:

- **Evidence Landscape Card** — total trials matched, trials scored, published RCTs (live from PubMed), evidence density signal
- **Executive Summary** — key findings across the dataset
- **What supports the objective** — strongest evidence clusters with NCT IDs
- **What contradicts or qualifies** — limitations and caveats
- **Intervention Clusters & Opportunity Score** — each cluster scored HIGH / MEDIUM / LOW opportunity
- **Pipeline Opportunities** — white space in the evidence landscape
- **Go/No-Go Signal** — explicit recommendation with rationale

### Example output (Diabetes Type 2 · Metformin · Phase 3 · 2018–2026)

```
Evidence Landscape
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Completed trials matched    26
Trials scored vs objective  18
Published RCTs (PubMed)     4,200+
Signal: HIGH evidence density
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Intervention Clusters
SGLT2 inhibitors   · 8 trials · Opportunity: LOW (saturated)
GLP-1 agonists     · 5 trials · Opportunity: MEDIUM
Novel combinations · 1 trial  · Opportunity: HIGH (white space)

Go/No-Go signal: CONDITIONAL GO
New trials need strong differentiation from existing SGLT2/GLP-1 evidence.
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS |
| Backend | Supabase (PostgreSQL) |
| AI | OpenAI GPT-4 |
| Data | AACT (ClinicalTrials.gov) — 63,394 completed trials |
| Live enrichment | PubMed E-utilities API |
| Hosting | Lovable.dev |

### Key Database Schema

```sql
em.study_index_complete     -- 63,394 studies (base)
em.study_summary_v2         -- 489 studies with comparable results
em.mesh_condition           -- MeSH condition index
em.intervention             -- intervention index
em.v_ui_study_list_v2       -- main view for UI
em.search_studies_paged()   -- server-side paginated RPC
```

---

## Search Architecture

Server-side RPC (`search_studies_paged`) handles all filtering to avoid Supabase's 1000-row URL limit:

```sql
-- Parameters
p_condition_terms   text[]
p_intervention_terms text[]
p_phases            text[]
p_year_from         int
p_year_to           int
p_only_analyzable   boolean
p_page              int
p_page_size         int DEFAULT 20

-- Returns: all study fields + total_count (window function)
```

---

## Features

- ✅ 6-step guided wizard with persistent pipeline tracker
- ✅ MeSH-indexed condition search with autocomplete
- ✅ Intervention search with autocomplete
- ✅ Phase filter (Phase 1/2/3/4/Early Phase 1/NA)
- ✅ Date range filter (results_first_posted_date)
- ✅ AI noise removal (Bronze → Silver)
- ✅ AI relevance scoring 0–10 (Silver → Gold)
- ✅ Evidence Landscape Card with live PubMed RCT count
- ✅ Intervention cluster analysis with Opportunity Score
- ✅ Go/No-Go signal
- ✅ Full-screen AI loading states with cycling messages
- ✅ Milestone toasts (Silver ready / Gold ready)
- ✅ "Try an example" with typing animation
- ✅ ClinicalTrials.gov deep links per study
- ✅ PDF export (print-optimized)
- ✅ Indigo (#4F46E5) accent for AI-powered actions

---

## Coming Soon

### 🔬 Richer Evidence Context
- **PubMed total papers count** — full literature density per condition
- **Evidence imbalance detection** — high prevalence + low trial count = opportunity signal
- **Preclinical signals** — animal studies and bioRxiv as early-stage indicators

### 🎯 PICO Completion
- **Outcome keyword field** — filter by primary endpoint type
- **Population filters** — age range and gender from AACT eligibility data

### 🏢 Competitive Intelligence
- **Sponsor detection** — identify which pharma/biotech companies are active in a space
- **Competitive activity heatmap** — visualize trial density by sponsor and indication

### 📊 Report Profiles
- **R&D Manager view** — pipeline opportunities, Go/No-Go signals, competitive positioning
- **Researcher view** — methodology, endpoints, sample sizes, bias assessment
- **Clinician view** — efficacy comparisons, safety signals, guideline relevance

### 💾 Workflow Features
- **Save & share analyses** — persistent analysis history
- **Export Gold dataset** to Excel
- **Team workspace** — share analyses with colleagues

### 🔗 Data Enrichment
- **PubMed paper linking** — connect trials to their published results
- **FDA approval status** — cross-reference with approved drugs
- **Patent landscape** — identify IP barriers per intervention cluster

---

## Getting Started

The app is fully hosted — no local setup required.

**Live:** [evidence-mapper.com](https://evidence-mapper.com)

### Try the example

1. Go to [evidence-mapper.com](https://evidence-mapper.com)
2. Click **"See a live example"**
3. Watch the AI build a search strategy from the objective
4. Follow the 6-step pipeline to a full evidence report

---

## Data Sources

- **ClinicalTrials.gov** via AACT (Aggregate Analysis of ClinicalTrials.gov) — January 2026 snapshot
- **PubMed** via NCBI E-utilities API — live query on report generation
- Database hosted on Supabase (eu-west-2)

---

## License

MIT

---

*Evidence Mapper · Pipeline intelligence powered by ClinicalTrials.gov · 63,394 completed trials indexed*
