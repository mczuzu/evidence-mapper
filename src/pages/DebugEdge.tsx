import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RequestLog {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  status?: number;
  responseTime?: number;
  response?: string;
  error?: string;
}

export default function DebugEdge() {
  const [baseUrl, setBaseUrl] = useState("https://dxtgnfmtuvxbpnvxzxal.supabase.co");
  const [anonKey, setAnonKey] = useState("");
  const [nctIdsRaw, setNctIdsRaw] = useState("NCT00997893");
  const [loading, setLoading] = useState<string | null>(null);
  const [log, setLog] = useState<RequestLog | null>(null);

  const parseNctIds = (): string[] => {
    return nctIdsRaw
      .split(/[\n,]+/)
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  };

  const callFunction = async (functionName: "get-rich" | "analyze-direction") => {
    const nctIds = parseNctIds();
    if (nctIds.length === 0) {
      setLog({ url: "", method: "POST", headers: {}, body: "", error: "No NCT IDs provided" });
      return;
    }

    const url = `${baseUrl.replace(/\/$/, "")}/functions/v1/${functionName}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
    };

    let body: Record<string, unknown>;
    if (functionName === "get-rich") {
      body = { nct_id: nctIds[0], nct_ids: nctIds };
    } else {
      body = { nct_ids: nctIds };
    }

    const bodyStr = JSON.stringify(body, null, 2);

    setLog({
      url,
      method: "POST",
      headers,
      body: bodyStr,
    });
    setLoading(functionName);

    const startTime = performance.now();

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      const responseText = await response.text();

      setLog({
        url,
        method: "POST",
        headers,
        body: bodyStr,
        status: response.status,
        responseTime,
        response: responseText,
      });
    } catch (err) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      setLog({
        url,
        method: "POST",
        headers,
        body: bodyStr,
        responseTime,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Edge Function Debug</h1>
        <p className="text-muted-foreground text-sm">
          Herramienta de diagnóstico para testear Edge Functions directamente con fetch nativo.
        </p>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baseUrl">Supabase Base URL</Label>
              <Input
                id="baseUrl"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://xxxx.supabase.co"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="anonKey">Anon Key (JWT)</Label>
              <Input
                id="anonKey"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJ..."
                type="password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nctIds">NCT IDs (uno por línea o separados por coma)</Label>
              <Textarea
                id="nctIds"
                value={nctIdsRaw}
                onChange={(e) => setNctIdsRaw(e.target.value)}
                placeholder="NCT00997893&#10;NCT12345678"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acciones</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button
              onClick={() => callFunction("get-rich")}
              disabled={loading !== null}
              variant="outline"
            >
              {loading === "get-rich" ? "Calling..." : "Call get-rich"}
            </Button>
            <Button
              onClick={() => callFunction("analyze-direction")}
              disabled={loading !== null}
            >
              {loading === "analyze-direction" ? "Calling..." : "Call analyze-direction"}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {log && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resultado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Request Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-foreground">Request</h3>
                <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                  <div>
                    <span className="text-muted-foreground">URL:</span> {log.url}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Method:</span> {log.method}
                  </div>
                </div>
              </div>

              {/* Headers */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-foreground">Headers</h3>
                <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(log.headers, null, 2)}
                </pre>
              </div>

              {/* Body */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-foreground">Body</h3>
                <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {log.body}
                </pre>
              </div>

              {/* Response */}
              {(log.status !== undefined || log.error) && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-foreground">Response</h3>
                  <div className="bg-muted p-3 rounded text-xs font-mono space-y-1">
                    {log.status !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Status:</span>{" "}
                        <span
                          className={
                            log.status >= 200 && log.status < 300
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {log.status}
                        </span>
                      </div>
                    )}
                    {log.responseTime !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Time:</span> {log.responseTime}ms
                      </div>
                    )}
                    {log.error && (
                      <div className="text-red-600">
                        <span className="text-muted-foreground">Error:</span> {log.error}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Response Body */}
              {log.response && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-foreground">Response Body (raw)</h3>
                  <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {log.response}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
