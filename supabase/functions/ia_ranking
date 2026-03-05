// supabase/functions/ranking-api/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function normalizeNctIds(input: unknown): string[] {
  const raw = Array.isArray(input) ? input : []
  return [...new Set(raw)]
    .filter((x) => typeof x === "string")
    .map((x) => x.trim().toUpperCase())
    .filter((x) => /^NCT\d{8}$/.test(x))
}

type StudyData = {
  nct_id: string
  brief_title: string | null
  official_title: string | null
  study_type: string | null
  phase: string | null
  enrollment: number | null
  brief_summary: string | null
}

type RankedStudy = {
  nct_id: string
  score: number
  reason: string
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Use POST" }, 405)

  try {
    const body = await req.json().catch(() => ({}))
    const nctIds = normalizeNctIds(body?.nct_ids)
    const objective = typeof body?.objective === "string" ? body.objective.trim() : ""

    if (nctIds.length === 0) return json({ error: "Missing nct_ids" }, 400)
    if (!objective) return json({ error: "Missing objective" }, 400)
    if (nctIds.length > 200) return json({ error: "Too many nct_ids (max 200)" }, 400)

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")

    if (!supabaseUrl || !serviceRoleKey) return json({ error: "Missing Supabase env vars" }, 500)
    if (!openaiApiKey) return json({ error: "Missing OPENAI_API_KEY" }, 500)

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const db = supabase.schema("em")

    // Fetch titles + metadata
    const { data: indexData, error: indexErr } = await db
      .from("study_index")
      .select("nct_id, brief_title, official_title, study_type, phase, enrollment")
      .in("nct_id", nctIds)

    if (indexErr) return json({ error: indexErr.message }, 500)

    // Fetch summaries
    const { data: summaryData, error: summaryErr } = await db
      .from("study_brief_summary")
      .select("nct_id, brief_summary")
      .in("nct_id", nctIds)

    if (summaryErr) return json({ error: summaryErr.message }, 500)

    // Merge
    const summaryMap = new Map<string, string>()
    for (const r of summaryData ?? []) {
      summaryMap.set(r.nct_id, r.brief_summary ?? "")
    }

    const studies: StudyData[] = (indexData ?? []).map((r: any) => ({
      nct_id: r.nct_id,
      brief_title: r.brief_title ?? null,
      official_title: r.official_title ?? null,
      study_type: r.study_type ?? null,
      phase: r.phase ?? null,
      enrollment: r.enrollment ?? null,
      brief_summary: summaryMap.get(r.nct_id) ?? null,
    }))

    if (studies.length === 0) {
      return json({ error: "No studies found in DB for provided nct_ids" }, 404)
    }

    // Build compact payload for LLM (truncate summaries to save tokens)
    const studyPayload = studies.map((s) => ({
      nct_id: s.nct_id,
      brief_title: s.brief_title,
      study_type: s.study_type,
      phase: s.phase,
      enrollment: s.enrollment,
      brief_summary: s.brief_summary
        ? s.brief_summary.replace(/\s+/g, " ").trim().slice(0, 600)
        : null,
    }))

    const systemPrompt = `
You are a clinical research relevance evaluator.

Given a user objective and a list of clinical studies, evaluate each study's relevance to the objective.

Rules:
- Score each study from 0 to 10 (10 = highly relevant, 0 = not relevant)
- Only include studies with score >= 4
- Be strict: only include studies that genuinely address the objective
- Provide a concise reason (max 20 words) per study explaining the relevance
- Return ONLY valid JSON, no markdown, no explanation outside JSON

Output format (exact):
{
  "ranked": [
    { "nct_id": "NCT12345678", "score": 8, "reason": "Directly tests intervention X in target population Y" },
    ...
  ]
}

Sort by score descending.
`.trim()

    const userPrompt = JSON.stringify({
      objective,
      studies: studyPayload,
    })

    // Call OpenAI
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60_000)

    let ranked: RankedStudy[] = []

    try {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      })

      if (!resp.ok) {
        const err = await resp.text()
        return json({ error: "OpenAI call failed", details: err }, 502)
      }

      const out = await resp.json()
      const content = out?.choices?.[0]?.message?.content
      if (!content) return json({ error: "Empty OpenAI response" }, 502)

      const parsed = JSON.parse(content)
      ranked = Array.isArray(parsed?.ranked) ? parsed.ranked : []
    } finally {
      clearTimeout(timeout)
    }

    // Validate and clean output
    const validRanked = ranked
      .filter(
        (r) =>
          typeof r.nct_id === "string" &&
          /^NCT\d{8}$/.test(r.nct_id) &&
          typeof r.score === "number" &&
          r.score >= 4
      )
      .sort((a, b) => b.score - a.score)

    return json({
      objective,
      total_input: nctIds.length,
      total_relevant: validRanked.length,
      ranked: validRanked,
    })
  } catch (e) {
    return json({ error: "Unhandled error", details: String(e) }, 500)
  }
})
