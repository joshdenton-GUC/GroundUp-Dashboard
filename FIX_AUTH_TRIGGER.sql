-- =============================================================================
-- FIX AUTHENTICATION TRIGGER
-- =============================================================================
-- This ensures the handle_new_user trigger is properly set up
-- Run this in Supabase SQL Editor to fix the auth flow
-- =============================================================================

-- Step 1: Drop and recreate the trigger function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_name TEXT;
  v_contact_phone TEXT;
  v_address TEXT;
  v_user_id TEXT;
  v_profile_count INTEGER;
BEGIN
  -- Log the trigger execution
  RAISE NOTICE 'handle_new_user trigger fired for user: %', NEW.id;
  
  -- Get the current count of profiles to generate the next user ID
  SELECT COUNT(*) + 1 INTO v_profile_count FROM public.profiles;
  
  -- Generate the user ID in format "User_XX" where XX is zero-padded
  v_user_id := 'User_' || LPAD(v_profile_count::TEXT, 2, '0');

  -- Insert profile record with generated user ID
  BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, role)
    VALUES (
      NEW.id, 
      NEW.email,
      v_user_id,
      'client'
    );
    RAISE NOTICE 'Profile created for user: % with user_id: %', NEW.email, v_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
  END;

  -- Extract company information from user metadata
  v_company_name := NEW.raw_user_meta_data ->> 'company_name';
  v_contact_phone := NEW.raw_user_meta_data ->> 'contact_phone';
  v_address := NEW.raw_user_meta_data ->> 'address';

  -- Create client record if company name is provided
  IF v_company_name IS NOT NULL AND v_company_name != '' THEN
    BEGIN
      INSERT INTO public.clients (user_id, company_name, contact_phone, address, welcome_email_sent)
      VALUES (
        NEW.id,
        v_company_name,
        v_contact_phone,
        v_address,
        false
      )
      ON CONFLICT (user_id) DO NOTHING;
      RAISE NOTICE 'Client record created for user: % with company: %', NEW.email, v_company_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create client for user %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 2: Ensure the trigger exists and is enabled
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.clients TO anon, authenticated;

-- Step 4: Verify the trigger exists
SELECT tgname, tgenabled, tgtype 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- =============================================================================
-- MANUAL FIX FOR ORPHANED USERS (if any exist)
-- =============================================================================
-- If you have users that signed up but don't have profiles, run this:

-- First, check for orphaned users:
-- SELECT u.id, u.email, u.created_at
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON u.id = p.user_id
-- WHERE p.user_id IS NULL;

-- If you find orphaned users, manually create their profiles:
-- (Replace the values below with actual user data)

/*
DO $$
DECLARE
  v_user_id UUID := 'REPLACE_WITH_ACTUAL_USER_ID';
  v_email TEXT := 'REPLACE_WITH_USER_EMAIL';
  v_company_name TEXT := 'REPLACE_WITH_COMPANY_NAME';
  v_user_count INTEGER;
BEGIN
  -- Generate user_id
  SELECT COUNT(*) + 1 INTO v_user_count FROM public.profiles;
  
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    v_user_id,
    v_email,
    'User_' || LPAD(v_user_count::TEXT, 2, '0'),
    'client'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create client
  IF v_company_name IS NOT NULL THEN
    INSERT INTO public.clients (user_id, company_name, welcome_email_sent)
    VALUES (v_user_id, v_company_name, false)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RAISE NOTICE 'Fixed orphaned user: %', v_email;
END $$;
*/

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Check that everything is set up correctly:

-- 1. Trigger exists
SELECT 'Trigger exists:' as check, EXISTS(
  SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
) as result;

-- 2. Function exists
SELECT 'Function exists:' as check, EXISTS(
  SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user'
) as result;

-- 3. Recent profiles match auth users
SELECT 'Recent profiles count:' as check, COUNT(*) as result
FROM public.profiles
WHERE created_at > NOW() - INTERVAL '1 day';

-- 4. No orphaned users (should be 0)
SELECT 'Orphaned users count:' as check, COUNT(*) as result
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL;

