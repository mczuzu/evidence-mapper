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
    
    // Optional context for idea-driven analysis
    const context: {
      product_idea?: string;
      target_population?: string;
      investment_budget?: "low" | "medium" | "high";
      time_to_market?: "urgent" | "standard" | "patient";
    } | undefined = body.context;

    if (!nctIds || !Array.isArray(nctIds) || nctIds.length === 0) {
      return new Response(JSON.stringify({ error: "Missing or empty nct_ids array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Determine analysis mode
    const isIdeaDriven = context?.product_idea && context.product_idea.trim().length > 0;
    console.log(`[analyze-direction] Mode: ${isIdeaDriven ? "idea-driven" : "exploratory"}`);
    if (isIdeaDriven) {
      console.log(`[analyze-direction] Product idea: ${context.product_idea?.substring(0, 100)}...`);
    }

    // Connect to external Supabase to fetch study data
    const externalUrl = "https://dxtgnfmtuvxbpnvxzxal.supabase.co";
    const externalKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dGduZm10dXZ4YnBudnh6eGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4OTg0OTksImV4cCI6MjA4NDQ3NDQ5OX0.Reya82SFyWxJFwdHwAR_pdgttqKuAGyC3xxngwvTQto";

    const supabaseExternal = createClient(externalUrl, externalKey, {
      db: { schema: "em" },
    });

    console.log(`[analyze-direction] Received ${nctIds.length} NCT IDs to analyze`);

    // Fetch study data in small parallel batches to avoid statement timeout
    const BATCH_SIZE = 5;
    const batches: string[][] = [];
    for (let i = 0; i < nctIds.length; i += BATCH_SIZE) {
      batches.push(nctIds.slice(i, i + BATCH_SIZE));
    }

    console.log(`[analyze-direction] Fetching ${nctIds.length} IDs in ${batches.length} parallel batches of ${BATCH_SIZE}`);

    const batchResults = await Promise.allSettled(
      batches.map((batchIds, idx) =>
        supabaseExternal
          .from("v_ui_study_list_v2")
          .select("nct_id, brief_title, brief_summary, semantic_labels, has_numeric_results, has_group_comparison")
          .in("nct_id", batchIds)
          .then(({ data, error }) => {
            if (error) {
              console.error(`[analyze-direction] Batch ${idx + 1} failed:`, error.message);
              return [];
            }
            return data ?? [];
          })
      )
    );

    const allStudies = batchResults.flatMap((r) =>
      r.status === "fulfilled" ? r.value : []
    );
    const studies = allStudies;
    console.log(`[analyze-direction] Fetched ${studies.length} studies from v_ui_study_list_v2`);

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

    // Get available studies with Study Profile data
    const availableStudies = (studies ?? []).filter((s) => available.includes(s.nct_id));

    // --- REAL AI ANALYSIS (V3) using Study Profiles ---
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const openaiModel = Deno.env.get("OPENAI_MODEL") ?? "gpt-4.1-mini";

    if (!openaiApiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Study Profile payload for the LLM (no raw outcome data)
    const llmPayload = {
      nct_ids: available,
      study_count: available.length,
      studies: availableStudies.map((s: any) => ({
        nct_id: s.nct_id,
        brief_title: s.brief_title ?? null,
        brief_summary: s.brief_summary ?? null,
        semantic_labels: s.semantic_labels ?? [],
        has_numeric_results: s.has_numeric_results ?? false,
        has_group_comparison: s.has_group_comparison ?? false,
        measurement_clusters: s.measurement_clusters ?? [],
      })),
    };

// Build system prompt based on mode
const systemPrompt = isIdeaDriven ? `
You are an evidence analysis assistant working on top of a curated dataset of clinical studies.
Your task is to evaluate a SPECIFIC PRODUCT IDEA against the selected evidence base and produce a decision-oriented analysis.

The user has provided:
- Product idea: ${context.product_idea}
${context.target_population ? `- Target population: ${context.target_population}` : ""}
${context.investment_budget ? `- Investment budget: ${context.investment_budget}` : ""}
${context.time_to_market ? `- Time to market: ${context.time_to_market}` : ""}

Return VALID JSON only (no markdown fences).
Use ONLY the provided payload. Do not invent details.
Output must match the V3 schema described in the user message.

IMPORTANT: Tailor all analysis sections to evaluate the feasibility and evidence support for this specific product idea.
Focus on whether the evidence justifies developing THIS product, not just general patterns.
`.trim() : `
You are an evidence analysis assistant working on top of a curated dataset of clinical studies.
Your task is to analyze the selected set of studies and produce structured analytical outputs plus a decision-oriented narrative report.

Return VALID JSON only (no markdown fences).
Use ONLY the provided payload. Do not invent details.
Output must match the V3 schema described in the user message.

IMPORTANT: This payload uses "Study Profiles" - each study includes metadata flags like has_numeric_results and has_group_comparison to indicate data richness. Use these to inform your analysis about evidence quality.
`.trim();

    // V3 contract with idea-driven enhancements
    const decisionAssessmentInstruction = isIdeaDriven
      ? `A SINGLE continuous Markdown narrative (self-contained, suitable for PDF export) that explicitly answers: Does the evidence support development of the proposed product/service "${context.product_idea?.substring(0, 100)}..."? MUST include: (1) Evidence Alignment: How well does the evidence base align with the proposed product? Which studies directly support or contradict the product thesis? (2) Evidence Weight: approx study count, % of total analyzed, signal strength (strong/moderate/weak/inconsistent). (3) Population Match: Does the evidence cover the ${context.target_population || "intended target population"}? What gaps exist? (4) Competitive Landscape: What similar interventions exist in the evidence? (5) Product-Specific Implications: ${context.investment_budget ? `Given ${context.investment_budget} budget constraints, ` : ""}${context.time_to_market ? `and ${context.time_to_market} timeline, ` : ""}assess feasibility of therapeutic product, symptom-management product, digital monitoring product, or research-first approach. (6) Final Recommendation: ONE of ✅ Evidence strongly supports this product idea | ⚠️ Evidence promising but gaps exist – recommend product + evidence generation | ❌ Evidence insufficient – research should precede product development | ❌ Evidence contradicts product thesis – pivot recommended. Use clear headings, bullets where useful, decisive tone. Be specific about THIS product idea.`
      : `A SINGLE continuous Markdown narrative (self-contained, suitable for PDF export) that explicitly answers: Is there sufficient scientific evidence to justify development of a product/service OR need for additional research? MUST include: (1) Evidence Weight: approx study count, % of total analyzed, signal strength (strong/moderate/weak/inconsistent). (2) Population Impact: estimated prevalence, % of population affected, scope (global/regional/country). (3) Product Implications: assess if evidence justifies therapeutic product, symptom-management product, digital monitoring product, or no product yet; include key risks. (4) Final Recommendation: ONE of ✅ Evidence sufficient to justify product/service development | ⚠️ Evidence promising but insufficient – product + evidence generation recommended | ❌ Evidence insufficient – research should precede | ❌ Evidence negative/inconsistent – not recommended. Use clear headings, bullets where useful, decisive tone. Avoid vague statements.`;

    const userPrompt = {
      task: isIdeaDriven 
        ? `Generate a V3 direction analysis evaluating the product idea "${context.product_idea?.substring(0, 100)}..." against the provided Study Profiles.`
        : "Generate a V3 direction analysis from the provided Study Profiles payload.",
      required_output_v3: {
        schema: "v3",
        analysis: {
          direction_summary: isIdeaDriven 
            ? "Concise summary: How well does the evidence support the proposed product idea? Key interventions studied, target populations covered, outcomes measured, and preliminary verdict on product viability."
            : "Concise summary: main intervention categories, target populations, outcomes addressed, high-level conclusions on what appears promising vs uncertain.",
          what_is_promising: [{ title: "string", description: "Describe intervention and observed benefits", study_ids: ["NCT00000000"] }],
          what_is_uncertain: [{ title: "string", description: "Explain why uncertainty remains", study_ids: ["NCT00000000"] }],
          cluster_map: {
            interventions: [{ label: "string", description: "optional", study_ids: ["NCT00000000"] }],
            populations: [{ label: "string", description: "optional", study_ids: ["NCT00000000"] }],
            outcomes: [{ label: "string", description: "optional", study_ids: ["NCT00000000"] }],
            mechanisms: [{ label: "string", description: "optional", study_ids: ["NCT00000000"] }],
          },
          gaps: {
            evidence: [{ title: "string", description: "e.g. long-term outcomes, efficacy uncertainty", study_ids: ["NCT00000000"] }],
            design: [{ title: "string", description: "e.g. lack of RCTs, heterogeneity of measures", study_ids: ["NCT00000000"] }],
            missing_subgroups: [{ title: "string", description: "underrepresented populations", study_ids: ["NCT00000000"] }],
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
            quick_wins: [{ title: "string", description: "Practical quick-win opportunities including digital/telehealth", study_ids: ["NCT00000000"] }],
          },
          decision_assessment: {
            markdown_report: decisionAssessmentInstruction,
          },
        },
        metadata: {
          study_count: 0,
          generated_at: "ISO_DATE",
          model: "string",
          mode: isIdeaDriven ? "idea-driven" : "exploratory",
          ...(isIdeaDriven && { product_idea: context.product_idea }),
        },
      },
      constraints: [
        "Use ONLY the provided payload. Do not browse or invent.",
        "Every item that references studies must include study_ids from payload.nct_ids.",
        "Keep sections 1-6 compatible with structured UI fields.",
        "Section decision_assessment.markdown_report must be a SINGLE Markdown block, not split into sub-fields.",
        "Be decisive. Avoid vague statements like 'more research is needed' without specifying why.",
        "Consider has_numeric_results and has_group_comparison flags when assessing evidence quality.",
      ],
      payload: llmPayload,
    };

    const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
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
