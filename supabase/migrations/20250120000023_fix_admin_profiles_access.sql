-- Fix admin access to profiles table
-- This migration ensures admins can access all profiles data

DO $$
BEGIN
  -- Ensure RLS is enabled on profiles
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

  -- Drop existing admin policies if they exist to recreate them
  DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

  -- Create admin policies for profiles
  CREATE POLICY "Admins can view all profiles" ON public.profiles 
    FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');
  
  CREATE POLICY "Admins can update all profiles" ON public.profiles 
    FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

  -- Ensure the get_user_role function exists and works properly
  CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
  RETURNS app_role
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
  AS $fn$
    SELECT role FROM public.profiles WHERE user_id = user_uuid;
  $fn$;

  -- Grant necessary permissions
  GRANT USAGE ON SCHEMA public TO authenticated;
  GRANT SELECT ON public.profiles TO authenticated;
  GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;

END $$;
