-- Check the current structure of the profiles table
-- This migration just checks what columns exist

DO $$
DECLARE
    column_count INTEGER;
    rec RECORD;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND table_schema = 'public';
    
    RAISE NOTICE 'Profiles table has % columns', column_count;
    
    -- List all columns
    FOR rec IN 
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: % (type: %)', rec.column_name, rec.data_type;
    END LOOP;
END $$;
