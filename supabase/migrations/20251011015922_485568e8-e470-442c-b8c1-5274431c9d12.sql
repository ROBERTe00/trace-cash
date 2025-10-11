-- STEP 6: Create RLS policies for bank-statements storage bucket

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload own bank statements"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bank-statements' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read own bank statements"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'bank-statements' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own bank statements"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'bank-statements' AND
  (storage.foldername(name))[1] = auth.uid()::text
);