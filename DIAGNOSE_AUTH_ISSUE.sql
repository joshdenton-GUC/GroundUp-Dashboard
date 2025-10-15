-- =============================================================================
-- DIAGNOSE AUTHENTICATION ISSUE
-- =============================================================================
-- Run these queries in Supabase SQL Editor to diagnose the problem
-- =============================================================================

-- 1. Check if the handle_new_user trigger exists
SELECT tgname, tgenabled, tgtype 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
-- Expected: Should show the trigger exists and is enabled

-- 2. Check if the handle_new_user function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';
-- Expected: Should show the function exists

-- 3. Check recent users in auth.users (run as superuser)
SELECT id, email, created_at, confirmed_at, email_confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
-- Expected: Should show recent signups

-- 4. Check if profiles exist for those users
SELECT user_id, email, full_name, role, created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;
-- Expected: Should match the users from auth.users

-- 5. Check if clients exist for those users  
SELECT user_id, company_name, created_at
FROM public.clients
ORDER BY created_at DESC
LIMIT 10;
-- Expected: Should match the users from auth.users

-- 6. Find orphaned users (users without profiles)
SELECT u.id, u.email, u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
ORDER BY u.created_at DESC;
-- Expected: Should be EMPTY (no orphaned users)

-- 7. Check if email confirmation is required
SELECT raw_app_meta_data, raw_user_meta_data
FROM auth.users
WHERE email = 'YOUR_TEST_EMAIL_HERE';
-- Replace YOUR_TEST_EMAIL_HERE with the email you're testing

