-- Fix 1: Recreate community_posts_public view without SECURITY DEFINER
DROP VIEW IF EXISTS community_posts_public;
CREATE VIEW community_posts_public AS
SELECT 
  CASE WHEN is_anonymous THEN NULL ELSE user_id END as user_id,
  id,
  content,
  is_anonymous,
  portfolio_data,
  likes_count,
  created_at
FROM community_posts;

-- Fix 2: Add UPDATE policy for bank_statements
CREATE POLICY "Users can update own statements"
ON bank_statements
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix 3: Restrict community_likes to only show user's own likes
DROP POLICY IF EXISTS "Anyone can view likes" ON community_likes;

CREATE POLICY "Users can view their own likes"
ON community_likes
FOR SELECT
USING (auth.uid() = user_id);

-- Create a public view for like counts (no user_id exposure)
CREATE VIEW community_likes_count AS
SELECT post_id, COUNT(*) as likes_count
FROM community_likes
GROUP BY post_id;