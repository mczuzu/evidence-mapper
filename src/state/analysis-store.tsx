import React, { createContext, useContext, useMemo, useRef } from "react";

export interface AnalysisTheme {
  title: string;
  description: string;
  study_ids: string[];
}

export interface AnalysisGap {
  title: string;
  description: string;
  study_ids: string[];
}

export interface AnalysisResult {
  analysis: {
    direction: string;
    themes: AnalysisTheme[];
    gaps: AnalysisGap[];
    suggested_next_steps: string[];
  };
  metadata?: {
    study_count?: number;
    generated_at?: string;
  };
}

export interface StoredAnalysisRun {
  id: string;
  created_at: string;
  nct_ids: string[];
  result: AnalysisResult;
}

type AnalysisStoreApi = {
  setRun: (run: StoredAnalysisRun) => void;
  getRun: (id: string) => StoredAnalysisRun | undefined;
};

const AnalysisStoreContext = createContext<AnalysisStoreApi | null>(null);

export function AnalysisStoreProvider({ children }: { children: React.ReactNode }) {
  const runsRef = useRef<Map<string, StoredAnalysisRun>>(new Map());

  const api = useMemo<AnalysisStoreApi>(() => {
    return {
      setRun: (run) => {
        runsRef.current.set(run.id, run);
      },
      getRun: (id) => runsRef.current.get(id),
    };
  }, []);

  return <AnalysisStoreContext.Provider value={api}>{children}</AnalysisStoreContext.Provider>;
}

export function useAnalysisStore() {
  const ctx = useContext(AnalysisStoreContext);
  if (!ctx) throw new Error("useAnalysisStore must be used within AnalysisStoreProvider");
  return ctx;
}
