-- Add unique constraint to clients table to prevent duplicate client records
-- This migration ensures that each user can only have one client record

-- Add unique constraint on user_id column (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'clients_user_id_unique'
    ) THEN
        ALTER TABLE public.clients 
        ADD CONSTRAINT clients_user_id_unique UNIQUE (user_id);
    END IF;
END $$;
