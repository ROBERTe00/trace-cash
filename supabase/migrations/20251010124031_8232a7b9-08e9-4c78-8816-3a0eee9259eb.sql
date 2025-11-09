-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ETF', 'Crypto', 'Stock', 'Cash')),
  name TEXT NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  purchase_price DECIMAL(20, 2) NOT NULL,
  current_price DECIMAL(20, 2) NOT NULL,
  symbol TEXT,
  live_tracking BOOLEAN DEFAULT false,
  purchase_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own investments"
ON public.investments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investments"
ON public.investments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investments"
ON public.investments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investments"
ON public.investments
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_investments_updated_at
BEFORE UPDATE ON public.investments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();