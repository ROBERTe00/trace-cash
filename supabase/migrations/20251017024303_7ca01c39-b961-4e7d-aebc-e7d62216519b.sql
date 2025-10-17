-- Create ai_audit_logs table
CREATE TABLE public.ai_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL,
  feature TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  temperature NUMERIC,
  input_prompt TEXT NOT NULL,
  ai_raw_response TEXT NOT NULL,
  ui_summary TEXT,
  latency_ms INTEGER,
  error TEXT,
  success BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.ai_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own AI logs"
ON public.ai_audit_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI logs"
ON public.ai_audit_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_audit_logs;