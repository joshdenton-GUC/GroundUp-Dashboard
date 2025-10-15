-- ============================================================================
-- FIX ADMIN ACCESS TO JOB_POSTS TABLE
-- ============================================================================
-- This script fixes the RLS policies to allow admins to access job_posts data
-- Run this directly in your Supabase SQL Editor
-- ============================================================================

BEGIN;

-- Drop existing admin policies for job_posts
DROP POLICY IF EXISTS "Admins can view all job posts" ON public.job_posts;
DROP POLICY IF EXISTS "Admins can update all job posts" ON public.job_posts;
DROP POLICY IF EXISTS "Admins can insert job posts" ON public.job_posts;
DROP POLICY IF EXISTS "Admins can delete job posts" ON public.job_posts;

-- Recreate admin policies with correct type casting (TEXT instead of app_role enum)
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

-- Fix payment_transactions admin policies as well
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

-- Ensure get_user_role function is consistent and returns TEXT
DROP FUNCTION IF EXISTS public.get_user_role(UUID);

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

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the policies were created correctly:

-- View all policies on job_posts
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'job_posts'
ORDER BY policyname;

-- View all policies on payment_transactions
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'payment_transactions'
ORDER BY policyname;

-- Test get_user_role function
SELECT public.get_user_role(auth.uid()) as current_user_role;

