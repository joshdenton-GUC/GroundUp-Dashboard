-- =============================================================================
-- FIX CLIENT AND PROFILE RLS POLICIES (CORRECTED)
-- =============================================================================
-- Run this in Supabase SQL Editor
-- =============================================================================

-- DROP the existing function first (it has wrong return type)
DROP FUNCTION IF EXISTS public.get_user_role(UUID);

-- Recreate with correct return type (TEXT instead of app_role)
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
  
  RETURN COALESCE(user_role, 'client');
END;
$fn$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO anon;

-- =============================================================================
-- PROFILES TABLE RLS
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;

-- Create new policies (no recursion!)
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update all profiles" 
  ON public.profiles FOR UPDATE 
  USING (public.get_user_role(auth.uid()) = 'admin');

-- =============================================================================
-- CLIENTS TABLE RLS
-- =============================================================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Clients can view their own data" ON public.clients;
DROP POLICY IF EXISTS "Clients can update their own data" ON public.clients;
DROP POLICY IF EXISTS "Clients can insert their own data" ON public.clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can manage all clients" ON public.clients;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.clients;

-- Create new policies (no recursion!)
CREATE POLICY "Clients can view their own data" 
  ON public.clients FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Clients can update their own data" 
  ON public.clients FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Clients can insert their own data" 
  ON public.clients FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all clients" 
  ON public.clients FOR SELECT 
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can manage all clients" 
  ON public.clients FOR ALL 
  USING (public.get_user_role(auth.uid()) = 'admin');

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.clients TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- =============================================================================
-- VERIFY IT WORKED
-- =============================================================================

-- Test these queries after running the above:
-- 1. Check function exists:
--    SELECT public.get_user_role(auth.uid());
-- 
-- 2. Test profile access:
--    SELECT * FROM profiles WHERE user_id = auth.uid();
-- 
-- 3. Test client access:
--    SELECT * FROM clients WHERE user_id = auth.uid();

