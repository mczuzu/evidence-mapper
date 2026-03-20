// supabase/functions/analyze-direction/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

/* =========================
   GBD 2023 Prevalence Data
========================= */
const GBD_PREVALENCE: Record<string, { pct: number; n: number }> = {
  "Anorexia nerviosa": { pct: 0.0502, n: 3924156 },
  "Artritis reumatoide": { pct: 0.2364, n: 18477245 },
  "Asma": { pct: 4.6392, n: 362659473 },
  "Bulimia nerviosa": { pct: 0.1814, n: 14183683 },
  "Cardiopatías isquémicas": { pct: 3.0625, n: 239402382 },
  "Cáncer de mama": { pct: 0.2859, n: 22349828 },
  "Cáncer de próstata": { pct: 0.1416, n: 11071413 },
  "Cirrosis": { pct: 21.5422, n: 1684019962 },
  "Colitis ulcerativa": { pct: 0.0324, n: 2528890 },
  "Consumo de alcohol": { pct: 1.5075, n: 117847906 },
  "Depresión mayor": { pct: 3.0222, n: 236254456 },
  "Dermatitis atópica": { pct: 3.2423, n: 253458336 },
  "Diabetes mellitus": { pct: 7.1731, n: 560740029 },
  "Diabetes mellitus tipo 2": { pct: 7.0636, n: 552178272 },
  "Dolor de cuello": { pct: 2.6856, n: 209943592 },
  "Endometriosis": { pct: 0.2647, n: 20694815 },
  "Enfermedad de Alzheimer y otras demencias": { pct: 0.7695, n: 60154120 },
  "Enfermedad de Crohn": { pct: 0.0177, n: 1381881 },
  "Enfermedad de Parkinson": { pct: 0.1493, n: 11674776 },
  "Enfermedad por reflujo gastroesofágico": { pct: 10.759, n: 841062491 },
  "Enfermedad renal crónica": { pct: 10.6181, n: 830028681 },
  "Enfermedad vascular cerebral": { pct: 1.3401, n: 104756097 },
  "Enfermedades cardiovasculares": { pct: 8.0141, n: 626478500 },
  "Epilepsia": { pct: 0.3234, n: 25281798 },
  "Esclerosis múltiple": { pct: 0.0261, n: 2043407 },
  "Esquizofrenia": { pct: 0.3435, n: 26854925 },
  "Fibrilación atrial": { pct: 0.7553, n: 59045057 },
  "Lumbalgia": { pct: 8.1216, n: 634889195 },
  "Migraña": { pct: 14.9279, n: 1166953911 },
  "Neoplasias": { pct: 3.3136, n: 259032177 },
  "Osteoartritis": { pct: 8.1281, n: 635389531 },
  "Psoriasis": { pct: 0.3947, n: 30854736 },
  "Síndrome de ovario poliquístico": { pct: 0.8687, n: 67906819 },
  "Trastorno bipolar": { pct: 0.457, n: 35721602 },
  "Trastorno de ansiedad": { pct: 6.0097, n: 469795345 },
  "Trastorno de déficit de atención e hiperactividad": { pct: 1.1038, n: 86284759 },
  "Trastornos depresivos": { pct: 4.1223, n: 322246572 },
  "Trastornos mentales": { pct: 14.9878, n: 1171638840 },
  "Trastornos por uso de sustancias": { pct: 2.1768, n: 170166446 },
  "Tuberculosis": { pct: 24.2548, n: 1896071746 },
  "VIH/SIDA": { pct: 0.5428, n: 42431748 },
}

const MESH_TO_GBD: Record<string, string> = {
  "Anxiety Disorders": "Trastorno de ansiedad",
  "Depressive Disorder, Major": "Depresión mayor",
  "Depression": "Trastornos depresivos",
  "Bipolar Disorder": "Trastorno bipolar",
  "Schizophrenia": "Esquizofrenia",
  "Alzheimer Disease": "Enfermedad de Alzheimer y otras demencias",
  "Parkinson Disease": "Enfermedad de Parkinson",
  "Epilepsy": "Epilepsia",
  "Multiple Sclerosis": "Esclerosis múltiple",
  "Migraine Disorders": "Migraña",
  "Cardiovascular Diseases": "Enfermedades cardiovasculares",
  "Myocardial Ischemia": "Cardiopatías isquémicas",
  "Atrial Fibrillation": "Fibrilación atrial",
  "Stroke": "Enfermedad vascular cerebral",
  "Diabetes Mellitus": "Diabetes mellitus",
  "Diabetes Mellitus, Type 2": "Diabetes mellitus tipo 2",
  "Renal Insufficiency, Chronic": "Enfermedad renal crónica",
  "Kidney Diseases": "Enfermedad renal crónica",
  "Asthma": "Asma",
  "Neoplasms": "Neoplasias",
  "Breast Neoplasms": "Cáncer de mama",
  "Prostatic Neoplasms": "Cáncer de próstata",
  "Osteoarthritis": "Osteoartritis",
  "Arthritis, Rheumatoid": "Artritis reumatoide",
  "Low Back Pain": "Lumbalgia",
  "Crohn Disease": "Enfermedad de Crohn",
  "Colitis, Ulcerative": "Colitis ulcerativa",
  "Dermatitis, Atopic": "Dermatitis atópica",
  "Psoriasis": "Psoriasis",
  "Endometriosis": "Endometriosis",
  "Polycystic Ovary Syndrome": "Síndrome de ovario poliquístico",
  "HIV Infections": "VIH/SIDA",
  "Tuberculosis": "Tuberculosis",
}

const TOP_CONDITIONS_BY_STUDY_COUNT = [
  { mesh_term: "Pathological Conditions, Signs and Symptoms", study_count: 13936 },
  { mesh_term: "Neoplasms", study_count: 11199 },
  { mesh_term: "Nervous System Diseases", study_count: 7656 },
  { mesh_term: "Mental Disorders", study_count: 6209 },
  { mesh_term: "Cardiovascular Diseases", study_count: 6043 },
  { mesh_term: "Nutritional and Metabolic Diseases", study_count: 5978 },
]

const TOTAL_STUDIES_IN_DB = 63394

/* =========================
   Intervention keyword clusters
========================= */
const INTERVENTION_CLUSTERS: Record<string, string[]> = {
  pharmacological: ["drug", "medication", "pill", "tablet", "dose", "mg", "placebo", "randomized controlled", "rct", "metformin", "statin", "antidepressant", "antibiotic", "vaccine", "injection", "infusion", "inhibitor", "agonist", "antagonist"],
  behavioral: ["cognitive", "behavioral", "cbt", "therapy", "counseling", "psychotherapy", "mindfulness", "meditation", "exercise", "physical activity", "lifestyle", "coaching", "intervention program", "training", "education"],
  nutritional: ["diet", "nutrition", "supplement", "vitamin", "mineral", "omega", "protein", "caloric", "food", "eating", "nutritional", "dietary", "probiotic", "prebiotic", "micronutrient"],
  digital: ["app", "mobile", "digital", "wearable", "telemedicine", "telehealth", "online", "remote", "sensor", "device", "platform", "software", "algorithm", "ai", "machine learning"],
  surgical: ["surgery", "surgical", "operation", "procedure", "transplant", "implant", "catheter", "stent", "biopsy", "resection", "laparoscopic"],
  diagnostic: ["biomarker", "imaging", "scan", "mri", "ct", "blood test", "screening", "diagnosis", "detection", "marker", "assay", "questionnaire", "scale", "assessment"],
}

/* =========================
   Types
========================= */
type SimpleAnalysis = {
  direction_text: string
  next_steps_text: string
  confidence: "low" | "medium"
}

type MissingReason = "invalid_nct" | "no_db_row" | "empty_summary" | "db_error" | "no_rich_fallback" | "rich_parse_error"
type MissingItem = { nct_id: string; reason: MissingReason }

type DBStudyRow = {
  nct_id: string
  brief_title: string | null
  official_title: string | null
  brief_summary: string | null
}

type RichStudy = {
  nct_id: string
  titles?: { brief?: string; official?: string }
  conditions?: string[]
  enrollment?: number
  brief_summary?: string
  eligibility_preview?: string
  detailed_description_preview?: string
  primary_outcomes?: Array<{ title?: string; time_frame?: string; description?: string }>
}

type PayloadStudy = {
  nct_id: string
  brief_title: string | null
  official_title: string | null
  brief_summary: string | null
  conditions?: string[]
  enrollment?: number | null
  eligibility_preview?: string | null
  detailed_description_preview?: string | null
  primary_outcomes?: Array<{ title: string | null; time_frame: string | null; description: string | null }>
}

type PayloadProfiling = {
  total_studies: number
  studies_with_summary: number
  studies_without_summary: number
  avg_enrollment: number | null
  median_enrollment: number | null
  enrollment_range: { min: number; max: number } | null
  intervention_clusters: Record<string, number>
  dominant_cluster: string | null
  top_title_terms: string[]
}

type GapProxy = {
  type: "missing_phase" | "small_sample" | "no_comparator" | "single_cluster" | "no_summary" | "outdated"
  description: string
  affected_count: number
  severity: "high" | "medium" | "low"
}

type SearchMeta = { mesh_term?: string; keywords?: string[] }

type RequestBody = {
  nct_ids: string[]
  objective?: string
  search_meta?: SearchMeta
}

/* =========================
   Helpers
========================= */
function json(resBody: unknown, status = 200) {
  return new Response(JSON.stringify(resBody), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  })
}

function clampTextAny(s: unknown, maxChars: number): string | null {
  if (s == null) return null
  const t = String(s).replace(/\s+/g, " ").trim()
  if (!t) return null
  return t.length > maxChars ? t.slice(0, maxChars) + "…" : t
}

function normalizeNctIds(input: unknown): string[] {
  const raw = Array.isArray(input) ? input : []
  return [...new Set(raw)]
    .filter((x) => typeof x === "string")
    .map((x) => x.trim().toUpperCase())
    .filter((x) => /^NCT\d{8}$/.test(x))
}

function pickSentences(text: string, maxChars = 900, keywords: string[] = []) {
  const clean = String(text).replace(/\s+/g, " ").trim()
  if (!clean) return null
  const sentences = clean.split(/(?<=[.!?])\s+/)
  let pool = sentences
  if (keywords.length) {
    const kw = keywords.map((k) => k.toLowerCase())
    const hits = sentences.filter((s) => kw.some((k) => s.toLowerCase().includes(k)))
    if (hits.length) pool = hits
  }
  let out = ""
  for (const s of pool) {
    const st = s.trim()
    if (!st) continue
    const next = out ? `${out} ${st}` : st
    if (next.length > maxChars) break
    out = next
    if (out.length >= maxChars) break
  }
  return out.slice(0, maxChars)
}

function normalizeSearchMeta(meta: any): SearchMeta | null {
  if (!meta || typeof meta !== "object") return null
  return {
    mesh_term: typeof meta.mesh_term === "string" ? meta.mesh_term.trim() : undefined,
    keywords: Array.isArray(meta.keywords)
      ? meta.keywords.filter((k: any) => typeof k === "string").map((k: string) => k.trim())
      : undefined,
  }
}

function detectLanguage(text: string): "es" | "en" {
  const hasSpanish =
    /[áéíóúüñ¿¡]/i.test(text) ||
    /\b(para|con|que|los|las|del|una|intervención|pacientes|mejorar|evaluar|eficacia|tratamiento|sobre|como|entre|desde)\b/i.test(text)
  return hasSpanish ? "es" : "en"
}

/* =========================
   Payload Profiling
========================= */
function buildPayloadProfiling(payload: PayloadStudy[]): PayloadProfiling {
  const total = payload.length
  const withSummary = payload.filter((s) => s.brief_summary && s.brief_summary.trim().length > 20).length
  const withoutSummary = total - withSummary

  const enrollments = payload
    .map((s) => s.enrollment)
    .filter((e): e is number => typeof e === "number" && e > 0)

  const avgEnrollment = enrollments.length > 0
    ? Math.round(enrollments.reduce((a, b) => a + b, 0) / enrollments.length)
    : null

  const sortedEnrollments = [...enrollments].sort((a, b) => a - b)
  const medianEnrollment = sortedEnrollments.length > 0
    ? sortedEnrollments[Math.floor(sortedEnrollments.length / 2)]
    : null

  const enrollmentRange = enrollments.length > 0
    ? { min: Math.min(...enrollments), max: Math.max(...enrollments) }
    : null

  const clusterCounts: Record<string, number> = {}
  for (const clusterName of Object.keys(INTERVENTION_CLUSTERS)) {
    clusterCounts[clusterName] = 0
  }
  for (const study of payload) {
    const text = [study.brief_title, study.brief_summary].filter(Boolean).join(" ").toLowerCase()
    for (const [clusterName, keywords] of Object.entries(INTERVENTION_CLUSTERS)) {
      if (keywords.some((kw) => text.includes(kw))) {
        clusterCounts[clusterName]++
      }
    }
  }

  const dominantCluster = Object.entries(clusterCounts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)[0]?.[0] ?? null

  const stopwords = new Set(["the", "a", "an", "of", "in", "for", "and", "or", "with", "to", "on", "at", "by", "is", "are", "was", "were", "be", "been", "has", "have", "had", "this", "that", "from", "as", "it", "its", "not", "but", "study", "trial", "effect", "effects", "using", "use", "based", "after", "before", "during", "vs", "versus"])
  const termFreq: Record<string, number> = {}
  for (const study of payload) {
    const words = (study.brief_title ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopwords.has(w))
    for (const word of words) {
      termFreq[word] = (termFreq[word] ?? 0) + 1
    }
  }
  const topTitleTerms = Object.entries(termFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([term]) => term)

  return {
    total_studies: total,
    studies_with_summary: withSummary,
    studies_without_summary: withoutSummary,
    avg_enrollment: avgEnrollment,
    median_enrollment: medianEnrollment,
    enrollment_range: enrollmentRange,
    intervention_clusters: clusterCounts,
    dominant_cluster: dominantCluster,
    top_title_terms: topTitleTerms,
  }
}

/* =========================
   Gap Proxies
========================= */
function buildGapProxies(payload: PayloadStudy[], allNctIds: string[]): GapProxy[] {
  const gaps: GapProxy[] = []

  const noSummary = allNctIds.length - payload.length
  if (noSummary > 0) {
    gaps.push({
      type: "no_summary",
      description: `${noSummary} of ${allNctIds.length} studies have no readable summary — results may be incomplete or unpublished.`,
      affected_count: noSummary,
      severity: noSummary > allNctIds.length * 0.3 ? "high" : "medium",
    })
  }

  const smallSamples = payload.filter((s) => typeof s.enrollment === "number" && s.enrollment < 50)
  if (smallSamples.length > 0) {
    gaps.push({
      type: "small_sample",
      description: `${smallSamples.length} studies have fewer than 50 participants — findings may lack statistical power.`,
      affected_count: smallSamples.length,
      severity: smallSamples.length > payload.length * 0.5 ? "high" : "medium",
    })
  }

  const clusterCounts: Record<string, number> = {}
  for (const study of payload) {
    const text = [study.brief_title, study.brief_summary].filter(Boolean).join(" ").toLowerCase()
    for (const [clusterName, keywords] of Object.entries(INTERVENTION_CLUSTERS)) {
      if (keywords.some((kw) => text.includes(kw))) {
        clusterCounts[clusterName] = (clusterCounts[clusterName] ?? 0) + 1
      }
    }
  }
  const activeClusters = Object.values(clusterCounts).filter((c) => c > 0).length
  if (activeClusters <= 1 && payload.length >= 3) {
    const dominant = Object.entries(clusterCounts).sort(([, a], [, b]) => b - a)[0]?.[0]
    gaps.push({
      type: "single_cluster",
      description: `Evidence concentrated in a single intervention type (${dominant ?? "unknown"}). No comparative data across categories.`,
      affected_count: payload.length,
      severity: "medium",
    })
  }

  const comparatorTerms = ["placebo", "control group", "comparator", "vs.", "versus", "randomized", "rct", "double-blind", "active control"]
  const withComparator = payload.filter((s) => {
    const text = [s.brief_title, s.brief_summary].filter(Boolean).join(" ").toLowerCase()
    return comparatorTerms.some((t) => text.includes(t))
  })
  if (withComparator.length < payload.length * 0.3 && payload.length >= 3) {
    gaps.push({
      type: "no_comparator",
      description: `Only ${withComparator.length} of ${payload.length} studies have explicit comparator or RCT design — causal claims are limited.`,
      affected_count: payload.length - withComparator.length,
      severity: "high",
    })
  }

  const shortTitleStudies = payload.filter((s) => (s.brief_title ?? "").length < 20)
  if (shortTitleStudies.length > payload.length * 0.4 && payload.length >= 5) {
    gaps.push({
      type: "outdated",
      description: `A significant portion of studies appear to be older trials with limited reporting. More recent evidence may be missing.`,
      affected_count: shortTitleStudies.length,
      severity: "low",
    })
  }

  return gaps
}

/* =========================
   Evidence weight
========================= */
function buildEvidenceWeight(
  nRequested: number,
  nAnalyzed: number,
  nMissing: number,
  missingReasons: MissingReason[],
  meshTerm?: string,
) {
  const studyRatioPct = parseFloat(((nRequested / TOTAL_STUDIES_IN_DB) * 100).toFixed(4))
  const topRef = TOP_CONDITIONS_BY_STUDY_COUNT.find(
    (c) => meshTerm && c.mesh_term.toLowerCase().includes(meshTerm.toLowerCase().split(",")[0])
  )
  const gbdKey = meshTerm ? MESH_TO_GBD[meshTerm] : undefined
  const gbdData = gbdKey ? GBD_PREVALENCE[gbdKey] : undefined
  return {
    total_db_studies: TOTAL_STUDIES_IN_DB,
    studies_found: nRequested,
    studies_analyzed: nAnalyzed,
    studies_excluded: nMissing,
    exclusion_reasons: [...new Set(missingReasons)],
    study_ratio_pct: studyRatioPct,
    comparable_condition: topRef ?? null,
    gbd_prevalence: gbdData
      ? { condition_name_gbd: gbdKey, global_prevalence_pct: gbdData.pct, global_n_cases: gbdData.n }
      : null,
  }
}

/* =========================
   Storage fallback
========================= */
async function downloadRichJSON(supabase: ReturnType<typeof createClient>, bucket: string, nctId: string) {
  const candidates = [`${nctId}.json`, `rich_out/${nctId}.json`]
  for (const path of candidates) {
    const { data, error } = await supabase.storage.from(bucket).download(path)
    if (!error && data) {
      const text = await data.text()
      return { ok: true as const, path, text }
    }
  }
  return { ok: false as const }
}

/* =========================
   DB fetch
========================= */
async function fetchStudiesFromDB(supabase: ReturnType<typeof createClient>, nctIds: string[]) {
  const db = supabase.schema("em")

  const { data: idx, error: idxErr } = await db
    .from("study_index")
    .select("nct_id, brief_title, official_title")
    .in("nct_id", nctIds)

  if (idxErr) return { ok: false as const, error: idxErr.message }

  const { data: bs, error: bsErr } = await db
    .from("study_brief_summary")
    .select("nct_id, brief_summary")
    .in("nct_id", nctIds)

  if (bsErr) return { ok: false as const, error: bsErr.message }

  const idxMap = new Map<string, { brief_title: string | null; official_title: string | null }>()
  for (const r of (idx ?? [])) {
    idxMap.set((r as any).nct_id, { brief_title: (r as any).brief_title ?? null, official_title: (r as any).official_title ?? null })
  }

  const bsMap = new Map<string, string | null>()
  for (const r of (bs ?? [])) {
    bsMap.set((r as any).nct_id, (r as any).brief_summary ?? null)
  }

  const rows: DBStudyRow[] = nctIds.map((id) => ({
    nct_id: id,
    brief_title: idxMap.get(id)?.brief_title ?? null,
    official_title: idxMap.get(id)?.official_title ?? null,
    brief_summary: bsMap.get(id) ?? null,
  }))

  return { ok: true as const, rows }
}

/* =========================
   Payload builders
========================= */
function toPayloadFromDB(row: DBStudyRow): PayloadStudy {
  const summary = row.brief_summary ? pickSentences(row.brief_summary, 900, []) : null
  return {
    nct_id: row.nct_id,
    brief_title: clampTextAny(row.brief_title, 160),
    official_title: clampTextAny(row.official_title, 240),
    brief_summary: summary ? clampTextAny(summary, 900) : null,
  }
}

function toPayloadFromRich(s: RichStudy): PayloadStudy {
  return {
    nct_id: s.nct_id,
    brief_title: clampTextAny(s.titles?.brief, 160),
    official_title: clampTextAny(s.titles?.official, 240),
    brief_summary: s.brief_summary ? pickSentences(s.brief_summary, 900, []) : null,
    conditions: Array.isArray(s.conditions) ? s.conditions.slice(0, 8) : undefined,
    enrollment: s.enrollment ?? null,
    eligibility_preview: s.eligibility_preview ? pickSentences(s.eligibility_preview, 450, []) : null,
    detailed_description_preview: s.detailed_description_preview ? pickSentences(s.detailed_description_preview, 450, []) : null,
    primary_outcomes: Array.isArray(s.primary_outcomes)
      ? s.primary_outcomes
          .map((o) => ({ title: clampTextAny(o?.title, 160), time_frame: clampTextAny(o?.time_frame, 120), description: clampTextAny(o?.description, 260) }))
          .filter((o) => o.title || o.time_frame || o.description)
          .slice(0, 6)
      : undefined,
  }
}

/* =========================
   Prompt
========================= */
const PROMPT_VERSION = "direction-v4-profiled"
const SCHEMA_VERSION = "S3"

function buildSystemPrompt(lang: "es" | "en") {
  const isEs = lang === "es"

  // Section headings — used in both direction_text and next_steps_text
  const h = {
    objective:   isEs ? "Objetivo analizado"              : "Analyzed objective",
    executive:   isEs ? "Resumen ejecutivo"               : "Executive summary",
    supports:    isEs ? "Lo que apoya el objetivo"        : "What supports the objective",
    qualifies:   isEs ? "Lo que contradice o matiza"      : "What contradicts or qualifies",
    weight:      isEs ? "Peso de la evidencia"            : "Evidence weight",
    clusters:    isEs ? "Clusters de intervención"        : "Intervention clusters",
    opps:        isEs ? "Oportunidades directas"          : "Direct opportunities",
    gaps:        isEs ? "Gaps críticos identificados"     : "Critical gaps identified",
    fasttests:   isEs ? "Tests rápidos"                   : "Fast tests",
    caveats:     isEs ? "Limitaciones y advertencias"     : "Limitations and caveats",
  }

  return `
You are a dual-role evidence analyst: clinical researcher + strategic advisor.

CRITICAL LANGUAGE RULE: Respond ENTIRELY in ${isEs ? "Spanish" : "English"}. Do NOT mix languages.

Your mission: produce an OBJECTIVE-DRIVEN evidence assessment using ALL provided context:
(1) research objective, (2) study payload, (3) quantitative profiling, (4) inferred gap proxies.

Return VALID JSON only. No markdown fences, no backticks, no extra keys.
Exact output shape:
{
  "direction_text": "<string>",
  "next_steps_text": "<string>",
  "confidence": "low" | "medium"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIRECTION_TEXT STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write direction_text as a series of bold section headings followed by bullet lines.
Use this EXACT format for each section:

**${h.objective}**
- [one sentence restating the objective]

**${h.executive}**
- [bullet 1: high-level verdict on the objective — supported / partial / conflicting / insufficient]
- [bullet 2: reference profiling numbers — X studies, avg enrollment Y, dominant cluster Z]
- [bullet 3: key finding #1]
- [bullet 4: key finding #2]
- [bullet 5: overall signal strength]

**${h.supports}**
- **[intervention or study name]**: [what was studied, outcomes found, enrollment size] — [${isEs ? "Fuerte" : "Strong"} | ${isEs ? "Moderado" : "Moderate"} | ${isEs ? "Preliminar" : "Preliminary"}]
- [repeat for each supporting item]

**${h.qualifies}**
- **[limitation or gap type]**: [specific finding that limits, qualifies, or conflicts — reference gap proxies where relevant]
- [repeat for each item]

**${h.weight}**
- **${isEs ? "Cobertura" : "Coverage"}**: X studies of ${TOTAL_STUDIES_IN_DB} total in DB — [ratio %]
- **${isEs ? "Calidad del dataset" : "Dataset quality"}**: [% with summaries, avg/median enrollment if available, dominant cluster]
- **${isEs ? "Veredicto" : "Verdict"}**: [${isEs ? "Suficiente para actuar" : "Sufficient to act"} | ${isEs ? "Con matices" : "With caveats"} | ${isEs ? "Insuficiente" : "Insufficient"}] — [one sentence justification]

**${h.clusters}**
- **[cluster name] (N ${isEs ? "estudios" : "studies"})**: [brief description of what this cluster covers in this dataset] — [${isEs ? "Listo para aplicar" : "Ready to apply"} | ${isEs ? "Necesita validación" : "Needs validation"} | ${isEs ? "Solo investigación" : "Research-stage only"}]
- [only list clusters with count > 0 in profiling.intervention_clusters]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT_STEPS_TEXT STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write next_steps_text as a series of bold section headings followed by bullet lines.
Use this EXACT format:

**${isEs ? "Clusters de intervención y puntuación de oportunidad" : "Intervention Clusters & Opportunity Score"}**
For each distinct intervention cluster identified in the studies (e.g. SGLT2 inhibitors, GLP-1 agonists, DPP-4 inhibitors, etc.):
1. Count how many studies belong to this cluster
2. Assess evidence saturation (how many studies, how consistent the results, how recent)
3. Assign an Opportunity Score: HIGH / MEDIUM / LOW

Opportunity Score logic:
- LOW: 5+ studies, consistent results, recent trials → saturated space
- MEDIUM: 2-4 studies OR mixed results → selective opportunity
- HIGH: 0-1 studies OR older evidence only → white space, first-mover

Format each cluster as:
- **[Cluster name]** · [N studies] · Opportunity: **[HIGH/MEDIUM/LOW]** — [One sentence explaining the score]

End this section with:
- **${isEs ? "Cluster de mayor oportunidad" : "Highest opportunity cluster"}**: [name] — [brief rationale]

**${h.opps}**
- **[opportunity name]**: [description grounded in specific studies] — [${isEs ? "Aplicar ahora" : "Apply now"} | ${isEs ? "Piloto 4-12 semanas" : "Pilot 4-12 weeks"} | ${isEs ? "Requiere RCT 12-24 meses" : "Requires RCT 12-24 months"}]
- [repeat — ONLY opportunities directly derived from objective + payload]

**${h.gaps}**
IMPORTANT: Use explicit R&D pipeline language in this section:
- Use "pipeline opportunity" instead of "research gap"
- Use "first-mover advantage available" instead of "more studies needed"
- Use "white space in the evidence landscape" instead of "limited evidence"
- **[gap type from gap_proxies]** (${isEs ? "afecta" : "affects"} N ${isEs ? "estudios" : "studies"}, ${isEs ? "severidad" : "severity"}: [high|medium|low]): [what is missing and why it matters for the objective]
- **${isEs ? "Estudios de alto ROI a ejecutar" : "High-ROI studies to run"}**: [specific design + timeline to close the gap]
- **${isEs ? "No financiar" : "Do not fund"}**: [what would be redundant or low-signal]
- **${isEs ? "Señal Go/No-Go" : "Go/No-Go signal"}**: [GO | CONDITIONAL GO | NO-GO] — [one-sentence rationale based on evidence density, gap severity, and opportunity score]

**${h.fasttests}**
- **[test name]**: [specific pilot under 12 weeks aligned with objective]
- **${isEs ? "Señal go/no-go" : "Go/no-go signal"}**: [specific measurable metric]

**${h.caveats}**
- [all caveats and limitations go HERE — keep all sections above free of caveats]
- [reference profiling and gap_proxies data where relevant]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT FORMATTING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Section headings: **bold**, on their own line, followed by bullet lines
- Bullet lines start with "- " (dash space)
- Key terms, study IDs, metrics, verdicts: **bold**
- Each section heading appears EXACTLY ONCE — never repeat a section
- Do NOT include field names "direction_text" or "next_steps_text" anywhere in the output text
- Do NOT add blank lines between the heading and its first bullet
- Respond in ${isEs ? "Spanish" : "English"} throughout — zero language mixing
- Never recommend "digital health app" by default
- This analysis is specifically designed for R&D pipeline decisions
`.trim()
}

/* =========================
   OpenAI
========================= */
async function callOpenAI(openaiApiKey: string, systemPrompt: string, userPrompt: unknown) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort("timeout"), 90_000)
  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${openaiApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userPrompt) },
        ],
      }),
    })
    if (!resp.ok) {
      const errText = await resp.text()
      return { ok: false as const, status: resp.status, details: errText }
    }
    const out = await resp.json()
    const content = out?.choices?.[0]?.message?.content
    if (!content) return { ok: false as const, status: 502, details: "Empty OpenAI response" }

    const parsed = JSON.parse(content) as SimpleAnalysis

    // Permissive validation — only require the two text fields
    if (typeof parsed?.direction_text !== "string" || typeof parsed?.next_steps_text !== "string") {
      return { ok: false as const, status: 502, details: "Invalid JSON shape from model" }
    }
    // Normalize confidence — model sometimes returns "high" or other values
    if (!["low", "medium"].includes(parsed.confidence)) {
      parsed.confidence = "medium"
    }

    return { ok: true as const, parsed }
  } catch (e) {
    return { ok: false as const, status: 502, details: String(e) }
  } finally {
    clearTimeout(t)
  }
}

/* =========================
   Handler
========================= */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })

  try {
    if (req.method !== "POST") return json({ error: "Use POST" }, 405)

    const body = (await req.json().catch(() => ({}))) as RequestBody
    const nctIds = normalizeNctIds((body as any)?.nct_ids)
    const objective = typeof (body as any)?.objective === "string" ? (body as any).objective.trim() : ""
    const searchMeta = normalizeSearchMeta((body as any)?.search_meta)

    if (nctIds.length === 0) return json({ error: "Missing nct_ids" }, 400)
    if (!objective) return json({ error: "Missing objective" }, 400)
    if (nctIds.length > 200) return json({ error: "Too many nct_ids (max 200)" }, 400)

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")

    if (!supabaseUrl || !serviceRoleKey) return json({ error: "Missing Supabase env vars" }, 500)
    if (!openaiApiKey) return json({ error: "Missing OPENAI_API_KEY" }, 500)

    const lang = detectLanguage(objective)
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // 1) DB fetch
    const dbRes = await fetchStudiesFromDB(supabase, nctIds)
    if (!dbRes.ok) {
      const ew = buildEvidenceWeight(nctIds.length, 0, nctIds.length, ["db_error"], searchMeta?.mesh_term)
      return json({
        schema_version: SCHEMA_VERSION, prompt_version: PROMPT_VERSION,
        generated_at: new Date().toISOString(), objective, search_meta: searchMeta,
        evidence_weight: ew,
        missing: nctIds.map((id) => ({ nct_id: id, reason: "db_error" })),
        found_paths: {}, db_error: dbRes.error,
        profiling: null, gap_proxies: [],
        analysis: { direction_text: "- DB query failed.", next_steps_text: "- Fix DB access and retry.", confidence: "low" } satisfies SimpleAnalysis,
        study_index: [],
      }, 200)
    }

    const dbRows = dbRes.rows
    const missing: MissingItem[] = []
    const found_paths: Record<string, string> = {}
    const payload: PayloadStudy[] = []

    // 2) Build payload
    for (const row of dbRows) {
      if (!row?.nct_id || !/^NCT\d{8}$/.test(row.nct_id)) {
        missing.push({ nct_id: String(row?.nct_id ?? "UNKNOWN"), reason: "invalid_nct" }); continue
      }
      const hasSummary = !!row.brief_summary && String(row.brief_summary).trim().length > 0
      if (hasSummary) { payload.push(toPayloadFromDB(row)); continue }

      const richRes = await downloadRichJSON(supabase, "rich", row.nct_id)
      if (!richRes.ok) { missing.push({ nct_id: row.nct_id, reason: "empty_summary" }); continue }

      found_paths[row.nct_id] = richRes.path
      try {
        const parsed = JSON.parse(richRes.text) as RichStudy
        if (!parsed?.nct_id) { missing.push({ nct_id: row.nct_id, reason: "rich_parse_error" }); continue }
        const p = toPayloadFromRich(parsed)
        if (!p.brief_summary) { missing.push({ nct_id: row.nct_id, reason: "no_rich_fallback" }); continue }
        p.brief_title = p.brief_title ?? clampTextAny(row.brief_title, 160)
        p.official_title = p.official_title ?? clampTextAny(row.official_title, 240)
        payload.push(p)
      } catch {
        missing.push({ nct_id: row.nct_id, reason: "rich_parse_error" })
      }
    }

    // 3) Evidence weight
    const missingReasons = missing.map((m) => m.reason)
    const evidenceWeight = buildEvidenceWeight(nctIds.length, payload.length, missing.length, missingReasons, searchMeta?.mesh_term)

    // 4) Profiling + gap proxies — no DB queries
    const profiling = buildPayloadProfiling(payload)
    const gapProxies = buildGapProxies(payload, nctIds)

    // 5) Nothing usable
    if (payload.length === 0) {
      return json({
        schema_version: SCHEMA_VERSION, prompt_version: PROMPT_VERSION,
        generated_at: new Date().toISOString(), objective, search_meta: searchMeta,
        evidence_weight: evidenceWeight, missing, found_paths,
        profiling, gap_proxies: gapProxies,
        analysis: { direction_text: "- No usable study summaries found.", next_steps_text: "- Backfill em.study_brief_summary.", confidence: "low" } satisfies SimpleAnalysis,
        study_index: dbRows.map((r) => ({ nct_id: r.nct_id, brief_title: r.brief_title })),
      }, 200)
    }

    // 6) Call OpenAI
    const systemPrompt = buildSystemPrompt(lang)
    const userPrompt = {
      prompt_version: PROMPT_VERSION,
      schema_version: SCHEMA_VERSION,
      generated_at: new Date().toISOString(),
      objective,
      task: `Analyze what the evidence says about this objective: "${objective}". Use profiling and gap_proxies to enrich your analysis with quantitative context. Follow the exact output structure from the system prompt.`,
      search_meta: searchMeta ?? undefined,
      evidence_weight: evidenceWeight,
      profiling,
      gap_proxies: gapProxies,
      payload,
    }
    const openai = await callOpenAI(openaiApiKey, systemPrompt, userPrompt)

    if (!openai.ok) return json({ error: "OpenAI call failed", status: openai.status, details: openai.details }, 502)

    // 7) Respond
    return json({
      schema_version: SCHEMA_VERSION,
      prompt_version: PROMPT_VERSION,
      generated_at: new Date().toISOString(),
      objective,
      search_meta: searchMeta,
      evidence_weight: evidenceWeight,
      profiling,
      gap_proxies: gapProxies,
      missing,
      found_paths,
      analysis: openai.parsed,
      study_index: payload.map((p) => ({ nct_id: p.nct_id, brief_title: p.brief_title })),
    })
  } catch (e) {
    return json({ error: "Unhandled error", details: String(e) }, 500)
  }
})
