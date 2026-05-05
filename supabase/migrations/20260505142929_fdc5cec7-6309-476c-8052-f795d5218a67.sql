CREATE TABLE public.rejected_bronze (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  nct_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  rejected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.rejected_silver (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  nct_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  score NUMERIC,
  rejected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.rejected_gold (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  nct_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  rejected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rejected_bronze_session ON public.rejected_bronze(session_id);
CREATE INDEX idx_rejected_silver_session ON public.rejected_silver(session_id);
CREATE INDEX idx_rejected_gold_session ON public.rejected_gold(session_id);

ALTER TABLE public.rejected_bronze ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rejected_silver ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rejected_gold ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert rejected_bronze" ON public.rejected_bronze FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read rejected_bronze" ON public.rejected_bronze FOR SELECT USING (true);
CREATE POLICY "Anyone can insert rejected_silver" ON public.rejected_silver FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read rejected_silver" ON public.rejected_silver FOR SELECT USING (true);
CREATE POLICY "Anyone can insert rejected_gold" ON public.rejected_gold FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read rejected_gold" ON public.rejected_gold FOR SELECT USING (true);