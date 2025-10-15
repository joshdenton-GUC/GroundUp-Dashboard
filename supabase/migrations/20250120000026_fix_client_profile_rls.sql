-- =============================================================================
-- FIX CLIENT AND PROFILE RLS POLICIES
-- =============================================================================
-- This migration fixes RLS policies to allow clients to access their own data
-- and updates to support the new welcome_email_sent column.
-- =============================================================================

-- Drop existing function first (it may have wrong return type)
DROP FUNCTION IF EXISTS public.get_user_role(UUID);

-- Create the get_user_role function with SECURITY DEFINER to bypass RLS
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO anon;

-- =============================================================================
-- PROFILES TABLE RLS
-- =============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;

-- Create new comprehensive policies (no recursion)
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update all profiles" 
  ON public.profiles 
  FOR UPDATE 
  USING (public.get_user_role(auth.uid()) = 'admin');

-- =============================================================================
-- CLIENTS TABLE RLS
-- =============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Clients can view their own data" ON public.clients;
DROP POLICY IF EXISTS "Clients can update their own data" ON public.clients;
DROP POLICY IF EXISTS "Clients can insert their own data" ON public.clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can manage all clients" ON public.clients;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.clients;

-- Create new comprehensive policies (no recursion)
CREATE POLICY "Clients can view their own data" 
  ON public.clients 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Clients can update their own data" 
  ON public.clients 
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Clients can insert their own data" 
  ON public.clients 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all clients" 
  ON public.clients 
  FOR SELECT 
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can manage all clients" 
  ON public.clients 
  FOR ALL 
  USING (public.get_user_role(auth.uid()) = 'admin');

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant necessary table permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.clients TO authenticated;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON POLICY "Users can view own profile" ON public.profiles IS 
  'Allows authenticated users to view their own profile data';

COMMENT ON POLICY "Clients can view their own data" ON public.clients IS 
  'Allows clients to view their own client record';

COMMENT ON POLICY "Clients can update their own data" ON public.clients IS 
  'Allows clients to update their own client record (including welcome_email_sent flag)';

COMMENT ON POLICY "Admins can view all clients" ON public.clients IS 
  'Allows admin users to view all client records';

