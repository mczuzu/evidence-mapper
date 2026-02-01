// src/pages/DebugEdge.tsx
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
  // Inputs
  const [baseUrl, setBaseUrl] = useState("https://dxtgnfmtuvxbpnvxzxal.supabase.co");
  const [anonKey, setAnonKey] = useState("");

  // Params
  const [nctId, setNctId] = useState("NCT00997893");
  const [nctIds, setNctIds] = useState("NCT00997893");

  // UI state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DebugResult[]>([]);

  const push = (r: DebugResult) => setResults((prev) => [r, ...prev]);

  const validate = (): { ok: true } | { ok: false; error: string } => {
    const u = baseUrl?.trim();
    const k = anonKey?.trim();

    if (!u) return { ok: false, error: "Missing Supabase URL" };
    if (!u.startsWith("https://") || !u.includes(".supabase.co")) {
      return { ok: false, error: "Supabase URL looks wrong (expected https://<ref>.supabase.co)" };
    }
    if (!k) return { ok: false, error: "Missing Anon key" };

    // Supabase anon keys are JWT-like and typically start with eyJ
    if (!k.startsWith("eyJ")) {
      return {
        ok: false,
        error:
          "Anon key looks wrong (expected JWT starting with 'eyJ'). Make sure you're using the Supabase ANON key, not OpenAI key, not sb_publishable.",
      };
    }
    return { ok: true };
  };

  const testGetRich = async () => {
    setLoading(true);
    try {
      const chk = validate();
      if (!chk.ok) {
        push({ ok: false, url: "get-rich", error: chk.error });
        return;
      }

      const u = baseUrl.trim();
      const k = anonKey.trim();
      const url = `${u}/functions/v1/get-rich?nct_id=${encodeURIComponent(nctId.trim())}`;

      const { status, text, json } = await fetchJson(url, {
        method: "GET",
        headers: {
          apikey: k,
          Authorization: `Bearer ${k}`,
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
      const chk = validate();
      if (!chk.ok) {
        push({ ok: false, url: "analyze-direction", error: chk.error });
        return;
      }

      const u = baseUrl.trim();
      const k = anonKey.trim();

      const ids = nctIds
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      const url = `${u}/functions/v1/analyze-direction`;
      const payload = { nct_ids: ids };

      const { status, text, json } = await fetchJson(url, {
        method: "POST",
        headers: {
          apikey: k,
          Authorization: `Bearer ${k}`,
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
        .map((s) => s.trim().toUpperCase())
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

      <div
        style={{ display: "grid", gap: 8, marginBottom: 12, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}
      >
        <label>
          <div style={{ marginBottom: 4 }}>
            <b>Supabase URL</b>
          </div>
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            placeholder="https://<project-ref>.supabase.co"
          />
        </label>

        <label>
          <div style={{ marginBottom: 4 }}>
            <b>Anon key (Supabase)</b>
          </div>
          <input
            value={anonKey}
            onChange={(e) => setAnonKey(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            placeholder="eyJhbGciOi..."
          />
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
            Showing prefix: {anonKey ? `${anonKey.slice(0, 10)}… (len ${anonKey.length})` : "(empty)"}
          </div>
        </label>
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
                {r.status !== undefined && (
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
