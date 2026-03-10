# Evidence Mapper

A hands-on learning project built to develop practical digital health PM skills: ETL pipelines, AI-powered relevance scoring, and product design for clinical workflows.

**Live:** [evidence-mapper.com](https://evidence-mapper.com)

---

## What it does

Evidence Mapper lets you search, filter and AI-score 63,000+ completed clinical trials against a specific research question — structured as a 6-step guided workflow.

**Step 1 — Objective:** Define your research question in free text  
**Step 2 — Filters:** Build a PICO search (condition, intervention, phase, date range)  
**Step 3 — Bronze:** All trials matching your filters from ClinicalTrials.gov  
**Step 4 — Silver:** AI removes noise — keeps only trials relevant to your objective  
**Step 5 — Gold:** AI scores each trial 0–10 against your objective  
**Step 6 — Report:** Evidence landscape, intervention clusters, Go/No-Go signal  

---

## What I built

- ETL pipeline over 63,394 completed trials from ClinicalTrials.gov via AACT (January 2026 snapshot), normalized and indexed in PostgreSQL/Supabase
- MeSH-indexed condition search with autocomplete and server-side paginated RPC to avoid Supabase's URL row limits
- GPT-4 scoring pipeline that reads every abstract and scores it against a free-text objective
- 6-step guided UX wizard with persistent state, milestone toasts, live PubMed enrichment, and PDF export

---

## What I learned

The most interesting outcome wasn't technical — it was strategic. Building this led me to map the competitive landscape in clinical evidence AI and identify a structural gap: no existing platform indexes post-approval regulatory sources (EPAR, NICE Technology Appraisals, JCA reports, G-BA decisions). That's a separate case study.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS |
| Backend | Supabase (PostgreSQL) |
| AI | OpenAI GPT-4 |
| Data | ClinicalTrials.gov via AACT |
| Live enrichment | PubMed E-utilities API |
| Hosting | Lovable.dev |

---

## Key database schema
```sql
em.study_index_complete      -- 63,394 studies (base)
em.mesh_condition            -- MeSH condition index
em.intervention              -- intervention index
em.v_ui_study_list_v2        -- main view for UI
em.search_studies_paged()    -- server-side paginated RPC
```

---

MIT License
