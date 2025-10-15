-- Add role column to profiles table if it doesn't exist
-- This is a simple migration to ensure the role column exists

-- Check if the role column exists and add it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' 
                   AND column_name = 'role' 
                   AND table_schema = 'public') THEN
        -- Create the role column if it doesn't exist
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'client';
        RAISE NOTICE 'Added role column to profiles table';
    ELSE
        RAISE NOTICE 'Role column already exists in profiles table';
    END IF;
END $$;
