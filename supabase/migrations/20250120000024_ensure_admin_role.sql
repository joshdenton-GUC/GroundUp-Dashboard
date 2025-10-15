-- Ensure admin role is properly set
-- This migration ensures at least one user has admin role

DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Check if any admin exists
  SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
  
  -- If no admin exists, set the first user as admin
  IF admin_count = 0 THEN
    UPDATE public.profiles 
    SET role = 'admin' 
    WHERE id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1);
    
    RAISE NOTICE 'Set first user as admin';
  END IF;
  
  -- Log current admin users
  RAISE NOTICE 'Current admin users: %', (
    SELECT string_agg(user_id::text, ', ') 
    FROM public.profiles 
    WHERE role = 'admin'
  );
  
END $$;
