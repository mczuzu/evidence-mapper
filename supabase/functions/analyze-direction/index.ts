import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const nctIds: string[] = body.nct_ids;

    if (!nctIds || !Array.isArray(nctIds) || nctIds.length === 0) {
      return new Response(JSON.stringify({ error: "Missing or empty nct_ids array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Connect to external Supabase to fetch study data
    const externalUrl = "https://dxtgnfmtuvxbpnvxzxal.supabase.co";
    const externalKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dGduZm10dXZ4YnBudnh6eGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4OTg0OTksImV4cCI6MjA4NDQ3NDQ5OX0.Reya82SFyWxJFwdHwAR_pdgttqKuAGyC3xxngwvTQto";

    const supabaseExternal = createClient(externalUrl, externalKey, {
      db: { schema: "em" },
    });

    // Fetch study data for the selected NCT IDs (only columns that exist)
    const { data: studies, error: studiesError } = await supabaseExternal
      .from("v_study_summary_v1")
      .select("nct_id, brief_title")
      .in("nct_id", nctIds);

    if (studiesError) {
      console.error("Error fetching studies:", studiesError);
      return new Response(JSON.stringify({ error: "Failed to fetch study data", details: studiesError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine which studies are available vs missing
    const foundIds = new Set((studies ?? []).map((s) => s.nct_id));
    const available = nctIds.filter((id) => foundIds.has(id));
    const missing = nctIds.filter((id) => !foundIds.has(id));

    // If no studies are available, return early with missing info (NOT a 404)
    if (available.length === 0) {
      return new Response(
        JSON.stringify({
          schema: "v3",
          available: [],
          missing,
          analysis: null,
          metadata: {
            study_count: 0,
            generated_at: new Date().toISOString(),
            model: null,
            message: "No studies found for the provided NCT IDs.",
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get study titles for context (only available studies)
    const availableStudies = (studies ?? []).filter((s) => available.includes(s.nct_id));
    const studyTitles = availableStudies.map((s) => s.brief_title).filter(Boolean);
    const titleSummary = studyTitles.slice(0, 3).join(", ") || "selected clinical trials";

    // --- REAL AI ANALYSIS (V3) ---
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const openaiModel = Deno.env.get("OPENAI_MODEL") ?? "gpt-4.1-mini";

    if (!openaiApiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Minimal payload for the LLM (only available studies)
    const llmPayload = {
      nct_ids: available,
      studies: availableStudies.map((s: any) => ({
        nct_id: s.nct_id,
        brief_title: s.brief_title ?? null,
      })),
      title_summary: titleSummary,
    };

    const systemPrompt = `

You are a rigorous evidence analyst.
Return VALID JSON only (no markdown).
Use ONLY the provided payload. Do not invent details.
Output must match the V3 schema described in the user message.
`.trim();

    // V3 contract (lightweight, aligned with your new UI sections)
    const userPrompt = {
      task: "Generate a V3 direction analysis from the provided studies payload.",
      required_output_v3: {
        schema: "v3",
        analysis: {
          direction_summary: "string",
          what_is_promising: [{ title: "string", description: "string", study_ids: ["NCT00000000"] }],
          what_is_uncertain: [{ title: "string", description: "string", study_ids: ["NCT00000000"] }],
          cluster_map: {
            interventions: [{ label: "string", study_ids: ["NCT00000000"] }],
            populations: [{ label: "string", study_ids: ["NCT00000000"] }],
            outcomes: [{ label: "string", study_ids: ["NCT00000000"] }],
            mechanisms: [{ label: "string", study_ids: ["NCT00000000"] }],
          },
          gaps: {
            evidence: [{ title: "string", description: "string", study_ids: ["NCT00000000"] }],
            design: [{ title: "string", description: "string", study_ids: ["NCT00000000"] }],
            missing_subgroups: [{ title: "string", description: "string", study_ids: ["NCT00000000"] }],
          },
          next_studies: {
            proposals: [
              {
                title: "string",
                population: "string",
                intervention: "string",
                comparator: "string",
                primary_outcomes: ["string"],
                follow_up: "string",
                rationale: "string",
                study_ids: ["NCT00000000"],
              },
            ],
            quick_wins: [{ title: "string", description: "string", study_ids: ["NCT00000000"] }],
          },
        },
        metadata: {
          study_count: 0,
          generated_at: "ISO_DATE",
          model: "string",
        },
      },
      constraints: [
        "Use ONLY the provided payload. Do not browse or invent.",
        "Every item that references studies must include study_ids from payload.nct_ids.",
        "Keep text concise and non-generic.",
      ],
      payload: llmPayload,
    };

    const openaiResp = await fetch("<https://api.openai.com/v1/chat/completions>", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: openaiModel,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userPrompt) },
        ],
      }),
    });

    if (!openaiResp.ok) {
      const errText = await openaiResp.text();
      return new Response(
        JSON.stringify({
          error: "OpenAI call failed",
          status: openaiResp.status,
          details: errText.slice(0, 1000),
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const out = await openaiResp.json();
    const content = out?.choices?.[0]?.message?.content;

    let analysisV3: any = null;
    try {
      analysisV3 = JSON.parse(content);
    } catch {
      analysisV3 = { raw: content };
    }

    // Enforce schema + metadata (in case model omits fields)
    const responseBody = {
      schema: "v3",
      available,
      missing,
      analysis: analysisV3?.analysis ?? analysisV3,
      metadata: {
        study_count: available.length,
        generated_at: new Date().toISOString(),
        model: openaiModel,
      },
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in analyze-direction:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: "Internal server error", details: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
