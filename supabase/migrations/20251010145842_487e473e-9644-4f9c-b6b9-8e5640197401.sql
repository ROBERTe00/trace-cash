-- Fix SECURITY DEFINER function search_path vulnerability
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Add UPDATE policy for community comments
CREATE POLICY "Users can update their own comments"
ON public.community_comments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);