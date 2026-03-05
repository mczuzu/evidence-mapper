// supabase/functions/ia-keywords/index.ts
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Use POST" }, 405)

  try {
    const body = await req.json().catch(() => ({}))
    const objective = typeof body?.objective === "string" ? body.objective.trim() : ""
    const nctIds = normalizeNctIds(body?.nct_ids)

    if (!objective) return json({ error: "Missing objective" }, 400)
    if (nctIds.length === 0) return json({ error: "Missing nct_ids" }, 400)

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")

    if (!supabaseUrl || !serviceRoleKey) return json({ error: "Missing Supabase env vars" }, 500)
    if (!openaiApiKey) return json({ error: "Missing OPENAI_API_KEY" }, 500)

    // ── Step 1: Extract keywords from objective via LLM ──────────────────────
    const keywordResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0,
        max_tokens: 200,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Extract 5-10 search keywords from the research objective.
Return ONLY valid JSON: { "keywords": ["keyword1", "keyword2", ...] }
Rules:
- Include singular and plural forms if different (e.g. "muscle" and "muscles")
- Include common synonyms and abbreviations (e.g. "CKD" for "chronic kidney disease")
- Use lowercase
- Prefer specific clinical terms over generic ones
- No stopwords`,
          },
          {
            role: "user",
            content: `Research objective: "${objective}"`,
          },
        ],
      }),
    })

    if (!keywordResp.ok) {
      return json({ error: "OpenAI keyword extraction failed" }, 502)
    }

    const keywordOut = await keywordResp.json()
    const keywordContent = keywordOut?.choices?.[0]?.message?.content
    if (!keywordContent) return json({ error: "Empty keyword response" }, 502)

    let keywords: string[] = []
    try {
      const parsed = JSON.parse(keywordContent)
      keywords = Array.isArray(parsed?.keywords)
        ? parsed.keywords.filter((k: unknown) => typeof k === "string" && k.trim().length > 0)
        : []
    } catch {
      return json({ error: "Failed to parse keywords from LLM" }, 502)
    }

    if (keywords.length === 0) return json({ error: "No keywords extracted" }, 502)

    // ── Step 2: Filter studies in DB by keywords ─────────────────────────────
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const db = supabase.schema("em")

    // Fetch titles for all nct_ids
    const { data: indexData, error: indexErr } = await db
      .from("study_index")
      .select("nct_id, brief_title, official_title")
      .in("nct_id", nctIds)

    if (indexErr) return json({ error: indexErr.message }, 500)

    // Fetch summaries
    const { data: summaryData, error: summaryErr } = await db
      .from("study_brief_summary")
      .select("nct_id, brief_summary")
      .in("nct_id", nctIds)

    if (summaryErr) return json({ error: summaryErr.message }, 500)

    // Build lookup maps
    const titleMap = new Map<string, string>()
    for (const r of indexData ?? []) {
      const title = [r.brief_title, r.official_title].filter(Boolean).join(" ")
      titleMap.set(r.nct_id, title.toLowerCase())
    }

    const summaryMap = new Map<string, string>()
    for (const r of summaryData ?? []) {
      summaryMap.set(r.nct_id, (r.brief_summary ?? "").toLowerCase())
    }

    // Filter: study matches if ANY keyword appears in title OR summary
    const kwLower = keywords.map((k) => k.toLowerCase())

    const matchedIds = nctIds.filter((nctId) => {
      const title = titleMap.get(nctId) ?? ""
      const summary = summaryMap.get(nctId) ?? ""
      const text = `${title} ${summary}`
      return kwLower.some((kw) => text.includes(kw))
    })

    // Cap at 200 for downstream processing
    const nctIdsFiltered = matchedIds.slice(0, 200)

    return json({
      objective,
      keywords,
      total_input: nctIds.length,
      total_matched: matchedIds.length,
      total_filtered: nctIdsFiltered.length,
      capped: matchedIds.length > 200,
      nct_ids_filtered: nctIdsFiltered,
    })
  } catch (e) {
    return json({ error: "Unhandled error", details: String(e) }, 500)
  }
})
