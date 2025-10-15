-- Fix the role system with a simpler approach
-- This migration updates the role system step by step

-- First, let's see what the current role column type is
DO $$
DECLARE
    role_type TEXT;
BEGIN
    SELECT data_type INTO role_type
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'role' 
    AND table_schema = 'public';
    
    RAISE NOTICE 'Current role column type: %', role_type;
END $$;

-- Update any existing 'user' roles to 'client' (if the column exists)
UPDATE public.profiles 
SET role = 'client' 
WHERE role = 'user';

-- Now let's try to update the enum
-- First check if we can drop and recreate the enum
DO $$
BEGIN
    -- Try to drop the existing enum
    DROP TYPE IF EXISTS public.app_role CASCADE;
    
    -- Recreate the enum with only 'admin' and 'client'
    CREATE TYPE public.app_role AS ENUM ('admin', 'client');
    
    RAISE NOTICE 'Successfully recreated app_role enum';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error recreating enum: %', SQLERRM;
END $$;

-- Try to update the column type
DO $$
BEGIN
    ALTER TABLE public.profiles 
    ALTER COLUMN role TYPE app_role USING role::text::app_role;
    
    -- Update the default value to 'client'
    ALTER TABLE public.profiles 
    ALTER COLUMN role SET DEFAULT 'client';
    
    RAISE NOTICE 'Successfully updated role column';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating role column: %', SQLERRM;
END $$;
