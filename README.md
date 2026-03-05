# Evidence Mapper

**AI-assisted clinical evidence analysis system** — Browse, filter, validate, and analyze clinical trial evidence from ClinicalTrials.gov using a Bronze → Silver → Gold pipeline.

> Built with Lovable · Supabase · OpenAI GPT-4.1-mini · React · TypeScript

---

## What it does

Evidence Mapper retrieves published clinical studies for a research objective, filters them with AI, validates relevance, and generates a structured evidence analysis report — identifying what supports the objective, what contradicts it, research gaps, and concrete next steps.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS + shadcn/ui (via Lovable) |
| Backend / DB | Supabase (PostgreSQL, schema `em`) |
| Edge Functions | Supabase Edge Functions (Deno) |
| AI | OpenAI GPT-4.1-mini |
| Deployment | Lovable (frontend) + Supabase (backend) |

---

## Data Mart

The `em` schema contains a processed subset of ClinicalTrials.gov data:

- Only completed studies with published results (`has_results = true`)
- 1991–2025 — 63,394 studies
- Studies without results stored locally, excluded from the data mart

### Key tables

| Table | Description |
|---|---|
| `study_index` | Basic study info: ID, titles, phase, type, enrollment, dates |
| `study_brief_summary` | Study summaries — base for semantic filtering and AI analysis |
| `study_group_profile` | Structural summary: groups, outcomes, comparator candidates |
| `embedding_corpus` / `embedding_cluster` | AI-generated semantic embeddings and clusters |
| `condition_alias` | Semantic normalization of condition names |
| `outcome_result_unit_map` | Normalization of outcome measurement units |

### Field mapping: ClinicalTrials.gov → em

| ClinicalTrials.gov field | em field | Notes |
|---|---|---|
| NCT Number | `study_index.nct_id` | Unique identifier |
| Title | `study_index.brief_title` / `official_title` | Brief or official title |
| Conditions | `conditions.condition_name` / `browse_conditions.mesh_term` | MeSH normalized |
| Interventions | `interventions.intervention_name` / `intervention_other_names` | Includes aliases |
| Study Type | `study_index.study_type` | Interventional, Observational, etc. |
| Phase | `study_index.phase` | Clinical phase |
| Enrollment | `study_index.enrollment` | Number of participants |
| Start Date | `study_index.start_date` | |
| Primary Completion Date | `study_index.primary_completion_date` | |
| Completion Date | `study_index.completion_date` | |
| Results First Posted | `study_index.results_first_posted_date` | |
| Outcome Measures / Results | `outcome_measurements` / `outcome_counts` / `outcome_analyses` | Primary + secondary outcomes |
| Study Design / Arms | `design_groups.group_title` + `design_group_interventions` | Groups and intervention assignment |
| Location / Countries | `countries.country` | |
| Keywords | `keywords.keyword` | Study keywords |

---

## Pipeline: Bronze → Silver → Gold

### 🟤 Bronze — Raw dataset
- All studies matching MeSH + keyword search criteria
- May include noise — tangentially related studies
- Not suitable for direct analysis — must be filtered first

### ⬜ Silver — Filtered dataset
Two paths to Silver:
- **AI filtering (recommended):** `ia-keywords` extracts 5–10 keywords from the objective and filters studies where title or summary contain them. ~10 seconds.
- **Manual selection:** User selects studies directly from the Bronze table. Max 200.

### 🟡 Gold — Validated dataset
- `ranking-api` scores each study 0–10 for relevance to the objective
- Only studies with **score ≥ 4** pass
- Studies sorted by score descending
- User can deselect studies before launching analysis

### Pipeline tracker
```
📍 Pipeline:  Bronze [N]  →  Silver [N]  →  Gold [N]
```

---

## Edge Functions

All deployed on Supabase (`dxtgnfmtuvxbpnvxzxal.supabase.co`).

| Function | Stage | Description |
|---|---|---|
| `ia-keywords` | Silver filtering | Extracts keywords from objective, filters studies by title/summary |
| `ranking-api` | Gold validation | Scores relevance 0–10. Only studies ≥ 4 pass |
| `analyze-direction` | Evidence analysis | Profiling + gap proxies + objective-driven analysis |

---

## analyze-direction

### Input
`POST /functions/v1/analyze-direction`

| Field | Type | Description |
|---|---|---|
| `nct_ids` | `string[]` | Gold dataset NCT IDs. Max 200. |
| `objective` | `string` | Research objective. **Required.** Language auto-detected (ES/EN). |
| `search_meta` | `object?` | Optional. `{ mesh_term, keywords }` |

### Internal processing

1. **DB fetch** — retrieves titles and summaries from `em`. Falls back to Storage bucket `rich/{nct_id}.json`.
2. **Payload profiling** — quantitative metrics without extra DB queries: enrollment stats, intervention clusters, top title terms.
3. **Gap proxies** — infers research gaps from payload structure.
4. **Language detection** — auto-detects ES vs EN from objective text.
5. **GPT-4.1-mini** — enriched prompt with profiling + gap proxies. Temperature 0.2, `json_object` mode.

### Gap proxy types

| Type | Description |
|---|---|
| `no_summary` | Studies without readable summary |
| `small_sample` | Enrollment < 50 — limited statistical power |
| `single_cluster` | All evidence in one intervention type — no comparative data |
| `no_comparator` | < 30% of studies with RCT or comparator design |
| `outdated` | High proportion of studies with short titles |

### Intervention clusters

| Cluster | Keywords (sample) |
|---|---|
| `pharmacological` | drug, inhibitor, agonist, vaccine, injection, rct, placebo... |
| `behavioral` | cognitive, cbt, therapy, mindfulness, exercise, lifestyle... |
| `nutritional` | diet, supplement, vitamin, omega, protein, dietary... |
| `digital` | app, mobile, wearable, telemedicine, online, sensor... |
| `surgical` | surgery, transplant, implant, catheter, stent, biopsy... |
| `diagnostic` | biomarker, imaging, mri, ct, screening, marker... |

### Report sections

**direction_text:** Analyzed objective · Executive summary · What supports · What contradicts · Evidence weight · Intervention clusters

**next_steps_text:** Direct opportunities · Critical gaps · Fast tests · Limitations and caveats

### Prompt versions

| Version | Changes |
|---|---|
| `direction-v3-objective` | First objective-driven prompt. Language detection. Objective required. |
| `direction-v4-profiled` | Adds profiling + gap proxies in prompt. Bold headings. Permissive confidence validation. |

---

## Environment variables
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

---

## Local development
```bash
git clone https://github.com/mczuzu/trial-sense.git
cd trial-sense
npm install
npm run dev
```

---

## Deploy edge functions
```bash
supabase functions deploy analyze-direction --project-ref dxtgnfmtuvxbpnvxzxal
supabase functions deploy ia-keywords --project-ref dxtgnfmtuvxbpnvxzxal
```

---

*Evidence Mapper · Private · May 2025*
