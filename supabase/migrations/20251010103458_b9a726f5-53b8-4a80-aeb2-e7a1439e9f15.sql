-- Fix 1: Make bank-statements bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'bank-statements';

-- Add RLS policies for bank-statements storage
CREATE POLICY "Users can only access own bank statement files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'bank-statements' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own bank statement files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bank-statements' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own bank statement files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'bank-statements' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix 2: Create view to hide user_id for anonymous posts
CREATE VIEW community_posts_public AS
SELECT 
  id,
  CASE WHEN is_anonymous THEN NULL ELSE user_id END as user_id,
  content,
  is_anonymous,
  portfolio_data,
  likes_count,
  created_at
FROM community_posts;