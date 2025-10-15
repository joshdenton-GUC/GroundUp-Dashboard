-- Migration to fix admin access to job_posts table
-- The issue: RLS policies need to be corrected for admin access

-- First, ensure the get_user_role function returns TEXT consistently
-- We use CREATE OR REPLACE to avoid dependency issues
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $fn$
DECLARE
  user_role TEXT;
BEGIN
  -- This function bypasses RLS to avoid infinite recursion
  SELECT role::TEXT INTO user_role
  FROM public.profiles
  WHERE user_id = user_uuid
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'user');
END;
$fn$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO anon;

-- Now fix the job_posts policies
-- Drop existing admin policies for job_posts (these may not exist, hence IF EXISTS)
DROP POLICY IF EXISTS "Admins can view all job posts" ON public.job_posts;
DROP POLICY IF EXISTS "Admins can update all job posts" ON public.job_posts;
DROP POLICY IF EXISTS "Admins can insert job posts" ON public.job_posts;
DROP POLICY IF EXISTS "Admins can delete job posts" ON public.job_posts;

-- Create admin policies with correct TEXT comparison
CREATE POLICY "Admins can view all job posts" 
ON public.job_posts 
FOR SELECT 
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update all job posts" 
ON public.job_posts 
FOR UPDATE 
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert job posts" 
ON public.job_posts 
FOR INSERT 
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete job posts" 
ON public.job_posts 
FOR DELETE 
USING (public.get_user_role(auth.uid()) = 'admin');

-- Fix payment_transactions admin policies
DROP POLICY IF EXISTS "Admins can view all payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Admins can insert payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Admins can update payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Admins can delete payment transactions" ON public.payment_transactions;

CREATE POLICY "Admins can view all payment transactions" 
ON public.payment_transactions 
FOR SELECT 
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert payment transactions" 
ON public.payment_transactions 
FOR INSERT 
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update payment transactions" 
ON public.payment_transactions 
FOR UPDATE 
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete payment transactions" 
ON public.payment_transactions 
FOR DELETE 
USING (public.get_user_role(auth.uid()) = 'admin');
