// supabase/functions/parse-objective/index.ts
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

const SYSTEM_PROMPT = `You are a clinical research search strategist. Given a research objective, extract the most relevant search parameters for ClinicalTrials.gov.

Return ONLY valid JSON with this exact structure:
{
  "conditions": ["MeSH term 1", "MeSH term 2"],
  "interventions": ["specific molecule or intervention 1", "specific molecule or intervention 2"],
  "phases": ["Phase 2", "Phase 3"],
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation of choices"
}

Rules:
- conditions: use MeSH-indexed terms only (e.g. "Obesity" not "being fat", "Type 2 Diabetes Mellitus" not "diabetes")
- interventions: always use specific molecule names, not drug classes (e.g. "semaglutide" not "GLP-1 agonist", "whey protein" not "protein supplement")
- interventions: include 2-5 specific terms maximum
- conditions: include 1-3 terms maximum
- phases: only include if the objective implies a specific development stage, otherwise omit
- If no clear condition is implied, use related indications
- confidence: how confident you are in the extraction (0-1)`

async function hashHex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Use POST" }, 405)

  try {
    const body = await req.json().catch(() => ({}))
    const objective = typeof body?.objective === "string" ? body.objective.trim() : ""
    if (!objective) return json({ error: "Missing objective" }, 400)

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")

    if (!supabaseUrl || !serviceRoleKey) return json({ error: "Missing Supabase env vars" }, 500)
    if (!openaiApiKey) return json({ error: "Missing OPENAI_API_KEY" }, 500)

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // ── Cache check ──────────────────────────────────────────────────────────
    const cacheKey = "parse:" + (await hashHex(objective.toLowerCase()))
    const { data: cached } = await supabase
      .from("analysis_runs")
      .select("result")
      .eq("cache_key", cacheKey)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (cached?.result) {
      return json({ ...(cached.result as Record<string, unknown>), cached: true })
    }

    // ── LLM call ─────────────────────────────────────────────────────────────
    const llmResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0,
        max_tokens: 400,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Research objective: "${objective}"` },
        ],
      }),
    })

    if (!llmResp.ok) {
      const t = await llmResp.text()
      console.error("OpenAI error:", llmResp.status, t)
      return json({ error: "OpenAI parse failed" }, 502)
    }

    const llmOut = await llmResp.json()
    const content = llmOut?.choices?.[0]?.message?.content
    if (!content) return json({ error: "Empty LLM response" }, 502)

    let parsed: {
      conditions?: unknown
      interventions?: unknown
      phases?: unknown
      confidence?: unknown
      reasoning?: unknown
    }
    try {
      parsed = JSON.parse(content)
    } catch {
      return json({ error: "Failed to parse LLM JSON" }, 502)
    }

    const cleanArr = (x: unknown, max: number): string[] => {
      if (!Array.isArray(x)) return []
      return [...new Set(
        x.filter((s): s is string => typeof s === "string")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      )].slice(0, max)
    }

    const conditionsRaw = cleanArr(parsed.conditions, 3)
    const interventions = cleanArr(parsed.interventions, 5)
    const phases = cleanArr(parsed.phases, 4)
    const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0
    const reasoning = typeof parsed.reasoning === "string" ? parsed.reasoning : ""

    // ── Validate conditions against em.search_mesh_conditions (external DB) ──
    const externalUrl = Deno.env.get("VITE_EXTERNAL_SUPABASE_URL")
    const externalKey = Deno.env.get("VITE_EXTERNAL_SUPABASE_ANON_KEY")
    const validatedConditions: string[] = []
    if (externalUrl && externalKey) {
      const externalDb = createClient(externalUrl, externalKey, { db: { schema: "em" } })
      for (const term of conditionsRaw) {
        try {
          const { data, error } = await externalDb.rpc("search_mesh_conditions", { q: term, lim: 1 })
          if (!error && Array.isArray(data) && data.length > 0) {
            validatedConditions.push(term)
          }
        } catch (e) {
          console.error("MeSH validation error for", term, e)
        }
      }
    } else {
      // Fallback: keep raw conditions if external creds missing
      validatedConditions.push(...conditionsRaw)
    }

    // ── Build SearchInput rows ───────────────────────────────────────────────
    const rows: Array<{ id: number; type: string; terms: string[]; operator: "AND" }> = []
    let id = 1
    if (validatedConditions.length > 0) {
      rows.push({ id: id++, type: "condition", terms: validatedConditions, operator: "AND" })
    }
    if (interventions.length > 0) {
      rows.push({ id: id++, type: "intervention", terms: interventions, operator: "AND" })
    }
    if (phases.length > 0) {
      rows.push({ id: id++, type: "phase", terms: phases, operator: "AND" })
    }

    const result = {
      rows,
      objective,
      confidence,
      reasoning,
    }

    // ── Cache the result ─────────────────────────────────────────────────────
    try {
      await supabase.from("analysis_runs").insert({
        nct_ids: [],
        cache_key: cacheKey,
        result,
      })
    } catch (e) {
      console.error("Cache insert error:", e)
    }

    return json(result)
  } catch (e) {
    console.error("parse-objective error:", e)
    return json({ error: "Unhandled error", details: String(e) }, 500)
  }
})
