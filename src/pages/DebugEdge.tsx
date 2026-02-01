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
  // --- inputs ---
  const [nctId, setNctId] = useState("NCT00997893");
  const [nctIds, setNctIds] = useState("NCT00997893");

  // --- supabase config (HARDCODED, no env) ---
  const [baseUrl] = useState("https://dxtgnfmtuvxbpnvxzxal.supabase.co");
  const [anonKey, setAnonKey] = useState("");

  // --- ui state ---
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DebugResult[]>([]);

  const push = (r: DebugResult) => setResults((prev) => [r, ...prev]);

  const validate = (): boolean => {
    if (!baseUrl) {
      push({ ok: false, url: "-", error: "Missing baseUrl" });
      return false;
    }
    if (!anonKey) {
      push({ ok: false, url: "-", error: "Missing anonKey" });
      return false;
    }
    return true;
  };

  // --- tests ---
  const testGetRich = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const url = `${baseUrl}/functions/v1/get-rich?nct_id=${encodeURIComponent(nctId)}`;

      const { status, text, json } = await fetchJson(url, {
        method: "GET",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
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
    if (!validate()) return;
    setLoading(true);

    try {
      const ids = nctIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = { nct_ids: ids };
      const url = `${baseUrl}/functions/v1/analyze-direction`;

      const { status, text, json } = await fetchJson(url, {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
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

  const testSupabaseInvoke = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const ids = nctIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = { nct_ids: ids };

      const { data, error } = await supabaseExternal.functions.invoke("analyze-direction", { body: payload });

      if (error) {
        push({
          ok: false,
          url: "supabase-js invoke",
          error: JSON.stringify(error, null, 2),
          request: payload,
        });
      } else {
        push({
          ok: true,
          url: "supabase-js invoke",
          responseJson: data,
          request: payload,
        });
      }
    } catch (e: any) {
      push({
        ok: false,
        url: "supabase-js invoke",
        error: String(e),
      });
    } finally {
      setLoading(false);
    }
  };

  // --- UI ---
  return (
    <div style={{ padding: 16, maxWidth: 900 }}>
      <h2>Debug – Supabase Edge Functions</h2>

      <div style={{ marginBottom: 16 }}>
        <div>
          <b>Supabase URL</b>
        </div>
        <div>{baseUrl}</div>

        <div style={{ marginTop: 8 }}>
          <b>Anon key</b>
        </div>
        <input
          value={anonKey}
          onChange={(e) => setAnonKey(e.target.value)}
          placeholder="paste anon key here"
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      <hr />

      <div style={{ marginBottom: 16 }}>
        <div>NCT ID (get-rich)</div>
        <input value={nctId} onChange={(e) => setNctId(e.target.value)} style={{ width: "100%", padding: 8 }} />
        <button onClick={testGetRich} disabled={loading}>
          Test get-rich (GET)
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div>NCT IDs (analyze-direction, comma separated)</div>
        <input value={nctIds} onChange={(e) => setNctIds(e.target.value)} style={{ width: "100%", padding: 8 }} />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={testAnalyzeDirection} disabled={loading}>
            Test analyze-direction (fetch)
          </button>
          <button onClick={testSupabaseInvoke} disabled={loading}>
            Test analyze-direction (supabase-js)
          </button>
        </div>
      </div>

      <hr />

      <h3>Latest results</h3>

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
            <b>{r.ok ? "OK" : "FAIL"}</b> – {r.url}
          </div>

          {r.status && <div>Status: {r.status}</div>}

          {r.error && <pre style={{ whiteSpace: "pre-wrap" }}>{r.error}</pre>}

          {r.request && (
            <>
              <b>Request</b>
              <pre>{JSON.stringify(r.request, null, 2)}</pre>
            </>
          )}

          {r.responseJson ? (
            <>
              <b>Response (JSON)</b>
              <pre>{JSON.stringify(r.responseJson, null, 2)}</pre>
            </>
          ) : (
            r.responseText && (
              <>
                <b>Response (text)</b>
                <pre>{r.responseText}</pre>
              </>
            )
          )}
        </div>
      ))}
    </div>
  );
}
