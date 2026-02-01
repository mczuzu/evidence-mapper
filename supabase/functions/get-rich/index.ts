import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(resBody: unknown, status = 200) {
  return new Response(JSON.stringify(resBody), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

async function safeReadJson(req: Request): Promise<any | null> {
  const ct = req.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null;
  const text = await req.text();
  if (!text || text.trim().length === 0) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function downloadFromRichBucket(supabase: ReturnType<typeof createClient>, nctId: string) {
  const bucket = "rich";
  const candidates = [`${nctId}.json`, `rich_out/${nctId}.json`];

  for (const path of candidates) {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (!error && data) {
      const text = await data.text();
      return { ok: true as const, path, text };
    }
  }
  return { ok: false as const };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);

    const body = req.method === "POST" ? await safeReadJson(req) : null;
    const nctId = (body?.nct_id as string | undefined) ?? url.searchParams.get("nct_id") ?? null;

    if (!nctId || !/^NCT\d{8}$/i.test(nctId)) {
      return json({ error: "Missing or invalid nct_id (expected NCT########)" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const normalized = nctId.toUpperCase();
    const dl = await downloadFromRichBucket(supabase, normalized);

    if (!dl.ok) {
      return json({ error: "Rich JSON not found in bucket 'rich'", nct_id: normalized }, 404);
    }

    return new Response(dl.text, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("GET_RICH_UNHANDLED", e);
    return json({ error: "Unhandled error", details: String(e) }, 500);
  }
});
