-- Fix Security Definer Views by changing them to Security Invoker
-- This ensures the views use the querying user's permissions instead of the creator's

-- Drop and recreate community_likes_count view with SECURITY INVOKER
DROP VIEW IF EXISTS public.community_likes_count;

CREATE VIEW public.community_likes_count
WITH (security_invoker=true)
AS
SELECT 
  post_id,
  COUNT(*) as likes_count
FROM public.community_likes
GROUP BY post_id;

-- Drop and recreate community_posts_public view with SECURITY INVOKER
DROP VIEW IF EXISTS public.community_posts_public;

CREATE VIEW public.community_posts_public
WITH (security_invoker=true)
AS
SELECT 
  id,
  content,
  created_at,
  is_anonymous,
  user_id,
  likes_count,
  portfolio_data
FROM public.community_posts;