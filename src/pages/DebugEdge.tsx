import React, { useState } from "react";

// HARDCODED external Supabase credentials (no env vars)
const EXTERNAL_SUPABASE_URL = "https://dxtgnfmtuvxbpnvxzxal.supabase.co";
const EXTERNAL_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dGduZm10dXZ4YnBudnh6eGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NDI5NDQsImV4cCI6MjA1MzIxODk0NH0.E7DkNJaAfI2xjh3lcYxhH5lTdO-Y-V5VfPEbBqBjF0U";

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

  const push = (r: DebugResult) => setResults((prev) => [r, ...prev]);

  const testGetRich = async () => {
    setLoading(true);

    try {
      const url = `${EXTERNAL_SUPABASE_URL}/functions/v1/get-rich?nct_id=${encodeURIComponent(nctId)}`;

      const { status, text, json } = await fetchJson(url, {
        method: "GET",
        headers: {
          apikey: EXTERNAL_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${EXTERNAL_SUPABASE_ANON_KEY}`,
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
      push({
        ok: false,
        url: "get-rich",
        error: String(e),
      });
    } finally {
      setLoading(false);
    }
  };

  const testAnalyzeDirection = async () => {
    setLoading(true);

    try {
      const ids = nctIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = { nct_ids: ids };
      const url = `${EXTERNAL_SUPABASE_URL}/functions/v1/analyze-direction`;

      const { status, text, json } = await fetchJson(url, {
        method: "POST",
        headers: {
          apikey: EXTERNAL_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${EXTERNAL_SUPABASE_ANON_KEY}`,
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
      push({
        ok: false,
        url: "analyze-direction",
        error: String(e),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 900 }}>
      <h2>Debug – Supabase Edge Functions</h2>

      <div style={{ marginBottom: 16, padding: 12, background: "#f0f9ff", borderRadius: 6 }}>
        <div><b>External Supabase URL:</b></div>
        <code>{EXTERNAL_SUPABASE_URL}</code>
        <div style={{ marginTop: 8 }}><b>Anon Key:</b> (hardcoded, first 50 chars)</div>
        <code>{EXTERNAL_SUPABASE_ANON_KEY.substring(0, 50)}...</code>
      </div>

      <hr />

      <div style={{ marginBottom: 16 }}>
        <div>NCT ID (get-rich)</div>
        <input value={nctId} onChange={(e) => setNctId(e.target.value)} style={{ width: "100%", padding: 8 }} />
        <button onClick={testGetRich} disabled={loading} style={{ marginTop: 8 }}>
          Test get-rich (GET)
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div>NCT IDs (analyze-direction, comma separated)</div>
        <input value={nctIds} onChange={(e) => setNctIds(e.target.value)} style={{ width: "100%", padding: 8 }} />
        <button onClick={testAnalyzeDirection} disabled={loading} style={{ marginTop: 8 }}>
          Test analyze-direction (POST)
        </button>
      </div>

      <hr />

      <h3>Results</h3>

      {results.map((r, i) => (
        <div
          key={i}
          style={{
            border: "1px solid #ddd",
            borderRadius: 6,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <b>{r.ok ? "✅ OK" : "❌ FAIL"}</b> – {r.url}
          </div>

          {r.status && <div>Status: {r.status}</div>}

          {r.error && <pre style={{ whiteSpace: "pre-wrap", color: "red" }}>{r.error}</pre>}

          {r.request && (
            <>
              <b>Request</b>
              <pre>{JSON.stringify(r.request, null, 2)}</pre>
            </>
          )}

          {r.responseJson ? (
            <>
              <b>Response (JSON)</b>
              <pre style={{ maxHeight: 300, overflow: "auto" }}>{JSON.stringify(r.responseJson, null, 2)}</pre>
            </>
          ) : (
            r.responseText && (
              <>
                <b>Response (text)</b>
                <pre style={{ maxHeight: 300, overflow: "auto" }}>{r.responseText}</pre>
              </>
            )
          )}
        </div>
      ))}
    </div>
  );
}
