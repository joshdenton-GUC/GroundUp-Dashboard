-- Inspect the current database structure
-- This migration will help us understand what columns exist

-- Check if profiles table exists and what columns it has
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Check if profiles table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        RAISE NOTICE 'Profiles table exists';
        
        -- List all columns in profiles table
        FOR rec IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Column: % (type: %, nullable: %, default: %)', rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
        END LOOP;
    ELSE
        RAISE NOTICE 'Profiles table does not exist';
    END IF;
    
    -- Check if clients table exists and what columns it has
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients' AND table_schema = 'public') THEN
        RAISE NOTICE 'Clients table exists';
        
        -- List all columns in clients table
        FOR rec IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'clients' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Column: % (type: %, nullable: %, default: %)', rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
        END LOOP;
    ELSE
        RAISE NOTICE 'Clients table does not exist';
    END IF;
END $$;
