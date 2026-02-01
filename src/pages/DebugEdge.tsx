import React, { useState } from "react";
import { supabaseExternal } from "../lib/supabase-external";

type DebugResult = {
  ok: boolean;
  status?: number;
  url: string;
  request?: any;
  responseText?: string;
  responseJson?: any;
  error?: string;
};

async function fetchJson(url: string, init: RequestInit): Promise<{ status: number; text: string; json?: any }> {
  const res = await fetch(url, init);
  const text = await res.text();
  let json: any = undefined;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    // keep as text
  }
  return { status: res.status, text, json };
}

export default function DebugEdge() {
  const [nctId, setNctId] = useState("NCT00997893");
  const [nctIds, setNctIds] = useState("NCT00997893");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DebugResult[]>([]);

  // Read env vars (must exist in Lovable project env)
  const baseUrl = ((import.meta as any).env?.VITE_EXTERNAL_SUPABASE_URL as string | undefined)?.trim();
  const anonKey = ((import.meta as any).env?.VITE_EXTERNAL_SUPABASE_ANON_KEY as string | undefined)?.trim();

  const push = (r: DebugResult) => setResults((prev) => [r, ...prev]);

  const preflightCheck = (): { ok: true } | { ok: false; error: string } => {
    if (!baseUrl) return { ok: false, error: "Missing env var: VITE_EXTERNAL_SUPABASE_URL" };
    if (!anonKey) return { ok: false, error: "Missing env var: VITE_EXTERNAL_SUPABASE_ANON_KEY" };
    return { ok: true };
  };

  const testGetRich = async () => {
    setLoading(true);
    try {
      const chk = preflightCheck();
      if (!chk.ok) {
        push({ ok: false, url: "get-rich", error: chk.error });
        return;
      }

      const url = `${baseUrl}/functions/v1/get-rich?nct_id=${encodeURIComponent(nctId)}`;

      const { status, text, json } = await fetchJson(url, {
        method: "GET",
        headers: {
          apikey: anonKey!,
          Authorization: `Bearer ${anonKey!}`,
        },
      });

      push({
        ok: status >= 200 && status < 300,
        status,
        url,
        responseText: text,
        responseJson: json,
      });
    } catch (e: any) {
      push({ ok: false, url: "get-rich", error: String(e) });
    } finally {
      setLoading(false);
    }
  };

  const testAnalyzeDirection = async () => {
    setLoading(true);
    try {
      const chk = preflightCheck();
      if (!chk.ok) {
        push({ ok: false, url: "analyze-direction", error: chk.error });
        return;
      }

      const ids = nctIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const url = `${baseUrl}/functions/v1/analyze-direction`;
      const payload = { nct_ids: ids };

      const { status, text, json } = await fetchJson(url, {
        method: "POST",
        headers: {
          apikey: anonKey!,
          Authorization: `Bearer ${anonKey!}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      push({
        ok: status >= 200 && status < 300,
        status,
        url,
        request: payload,
        responseText: text,
        responseJson: json,
      });
    } catch (e: any) {
      push({ ok: false, url: "analyze-direction", error: String(e) });
    } finally {
      setLoading(false);
    }
  };

  const testSupabaseJsInvoke = async () => {
    setLoading(true);
    try {
      const ids = nctIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = { nct_ids: ids };

      const { data, error } = await supabaseExternal.functions.invoke("analyze-direction", {
        body: payload,
      });

      if (error) {
        push({
          ok: false,
          url: "supabase-js invoke analyze-direction",
          error: JSON.stringify(error, null, 2),
          request: payload,
        });
      } else {
        push({
          ok: true,
          url: "supabase-js invoke analyze-direction",
          responseJson: data,
          request: payload,
        });
      }
    } catch (e: any) {
      push({ ok: false, url: "supabase-js invoke analyze-direction", error: String(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 980 }}>
      <h2>Debug - Supabase Edge Functions</h2>

      <div style={{ marginBottom: 12, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <div>
          <b>Env check</b>
        </div>
        <div style={{ marginTop: 6 }}>
          <div>
            <b>VITE_EXTERNAL_SUPABASE_URL:</b> {baseUrl ?? "(undefined)"}
          </div>
          <div>
            <b>VITE_EXTERNAL_SUPABASE_ANON_KEY:</b>{" "}
            {anonKey ? `${anonKey.slice(0, 10)}… (len ${anonKey.length})` : "(undefined)"}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ marginBottom: 6 }}>NCT ID (get-rich)</div>
          <input
            value={nctId}
            onChange={(e) => setNctId(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            placeholder="NCT00997893"
          />
          <button onClick={testGetRich} disabled={loading} style={{ marginTop: 8 }}>
            Test get-rich (GET)
          </button>
        </div>

        <div>
          <div style={{ marginBottom: 6 }}>NCT IDs (analyze-direction) - comma separated</div>
          <input
            value={nctIds}
            onChange={(e) => setNctIds(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            placeholder="NCT00997893,NCT05388656"
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={testAnalyzeDirection} disabled={loading}>
              Test analyze-direction (fetch POST)
            </button>
            <button onClick={testSupabaseJsInvoke} disabled={loading}>
              Test analyze-direction (supabase-js invoke)
            </button>
          </div>
        </div>
      </div>

      <hr />

      <h3>Latest results</h3>
      <div style={{ display: "grid", gap: 12 }}>
        {results.map((r, idx) => (
          <div key={idx} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div>
                  <b>URL:</b> {r.url}
                </div>
                {"status" in r && r.status !== undefined && (
                  <div>
                    <b>Status:</b> {r.status}
                  </div>
                )}
              </div>
              <div>
                <b>{r.ok ? "OK" : "FAIL"}</b>
              </div>
            </div>

            {r.request && (
              <>
                <div style={{ marginTop: 8 }}>
                  <b>Request</b>
                </div>
                <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(r.request, null, 2)}</pre>
              </>
            )}

            {r.error && (
              <>
                <div style={{ marginTop: 8 }}>
                  <b>Error</b>
                </div>
                <pre style={{ whiteSpace: "pre-wrap" }}>{r.error}</pre>
              </>
            )}

            {r.responseJson !== undefined ? (
              <>
                <div style={{ marginTop: 8 }}>
                  <b>Response (JSON)</b>
                </div>
                <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(r.responseJson, null, 2)}</pre>
              </>
            ) : r.responseText ? (
              <>
                <div style={{ marginTop: 8 }}>
                  <b>Response (text)</b>
                </div>
                <pre style={{ whiteSpace: "pre-wrap" }}>{r.responseText}</pre>
              </>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
