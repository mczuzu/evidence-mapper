ALTER TABLE public.analysis_runs ADD COLUMN IF NOT EXISTS cache_key text;
CREATE INDEX IF NOT EXISTS idx_analysis_runs_cache_key ON public.analysis_runs(cache_key);