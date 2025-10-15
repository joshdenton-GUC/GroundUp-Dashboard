-- Fix RLS policies for clients table to allow new users to create their own client record
-- This migration adds the missing INSERT policy for clients

-- Add policy to allow clients to insert their own client record
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Clients can insert their own data') THEN
        CREATE POLICY "Clients can insert their own data" ON public.clients FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
END $$;
