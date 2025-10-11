-- Fix missing INSERT policy on audit_logs table
-- This allows authenticated users to create their own audit logs
CREATE POLICY "Users can create their own audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);