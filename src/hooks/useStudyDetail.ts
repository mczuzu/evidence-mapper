// src/hooks/useStudyDetail.ts
import { useQuery } from "@tanstack/react-query";
import { supabaseExternal } from "@/lib/supabase-external";

export type StudyBasicInfo = {
  nct_id: string;
  brief_title: string;
  official_title?: string | null;
  semantic_labels?: string[] | null;
  param_type_set?: string[] | null;
  n_result_rows: number;
  n_unique_outcomes: number;
  total_n_reported: number | null;
  max_n_reported: number | null;
};

export type PrimaryOutcome = {
  title: string;
  time_frame?: string | null;
  description?: string | null;
};

export type StudyRichInfo = {
  nct_id: string;
  titles?: { brief?: string; official?: string };
  conditions?: string[];
  enrollment?: number | null;
  updated_at?: string | null;
  brief_summary?: string | null;
  primary_outcomes?: PrimaryOutcome[];
  eligibility_preview?: string | null;
  detailed_description_preview?: string | null;
};

async function fetchRich(nctId: string): Promise<StudyRichInfo | null> {
  // Llamada directa al endpoint de Edge Function con headers correctos desde supabase client
  // Nota: usamos fetch nativo para poder manejar 404 sin lanzar "error" de supabase-js
  const url = `https://dxtgnfmtuvxbpnvxzxal.supabase.co/functions/v1/get-rich?nct_id=${encodeURIComponent(nctId)}`;

  const anon = (supabaseExternal as any).supabaseKey as string | undefined;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      apikey: anon ?? "",
      Authorization: `Bearer ${anon ?? ""}`,
    },
  });

  // 404 = “no hay rich para este estudio” (caso esperado)
  if (res.status === 404) return null;

  // Cualquier otro no-2xx sí es error real
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`get-rich failed: ${res.status} ${txt}`);
  }

  const json = (await res.json()) as StudyRichInfo;
  return json;
}

export function useStudyBasicInfo(nctId: string | undefined) {
  return useQuery({
    queryKey: ["study-basic", nctId],
    enabled: !!nctId,
    queryFn: async () => {
      if (!nctId) throw new Error("Missing nctId");

      const { data, error } = await supabaseExternal
        .from("v_ui_study_list")
        .select(
          "nct_id, brief_title, official_title, semantic_labels, param_type_set, n_result_rows, n_unique_outcomes, total_n_reported, max_n_reported",
        )
        .eq("nct_id", nctId)
        .single();

      if (error) throw error;
      return data as unknown as StudyBasicInfo;
    },
    staleTime: 30_000,
  });
}

export function useStudyRichInfo(nctId: string | undefined) {
  return useQuery({
    queryKey: ["study-rich", nctId],
    // CLAVE: si nctId es undefined, NO llama nunca (evita get-rich 400)
    enabled: !!nctId,
    queryFn: async () => {
      if (!nctId) return null;
      return fetchRich(nctId);
    },
    // No “reintentes” un 404 (no sirve)
    retry: (failCount, err: any) => {
      const msg = String(err?.message ?? "");
      if (msg.includes("get-rich failed: 404")) return false;
      return failCount < 1;
    },
    staleTime: 30_000,
  });
}
