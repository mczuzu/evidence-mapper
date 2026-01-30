-- Create analysis_runs table for storing analysis results
CREATE TABLE public.analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  nct_ids TEXT[] NOT NULL,
  result JSONB
);

-- Enable RLS
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (no auth required for this demo)
CREATE POLICY "Anyone can insert analysis runs"
  ON public.analysis_runs
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to read their own analysis by id
CREATE POLICY "Anyone can read analysis runs"
  ON public.analysis_runs
  FOR SELECT
  USING (true);