-- Create storage bucket for bank statement PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('bank-statements', 'bank-statements', false, 10485760, ARRAY['application/pdf']);

-- Create bank_statements table to track uploaded files
CREATE TABLE public.bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on bank_statements
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bank_statements
CREATE POLICY "Users can view their own statements"
  ON public.bank_statements FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can upload their own statements"
  ON public.bank_statements FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own statements"
  ON public.bank_statements FOR DELETE
  USING (user_id = auth.uid());

-- Create storage policies for bank-statements bucket
CREATE POLICY "Users can upload their own PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'bank-statements' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own PDFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'bank-statements' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own PDFs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'bank-statements' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );