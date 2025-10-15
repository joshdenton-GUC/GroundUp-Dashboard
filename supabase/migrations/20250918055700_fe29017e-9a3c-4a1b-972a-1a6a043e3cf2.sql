-- Critical Security Fix: Add RLS policies for candidates table (create if not exists)
-- This prevents unauthorized access to sensitive personal information

DO $$
BEGIN
    -- Allow clients to view only candidates assigned to them
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'candidates' AND policyname = 'Clients can view assigned candidates') THEN
        CREATE POLICY "Clients can view assigned candidates" ON public.candidates FOR SELECT TO authenticated USING (
            id IN (
                SELECT ca.candidate_id 
                FROM public.candidate_assignments ca
                INNER JOIN public.clients c ON ca.client_id = c.id
                WHERE c.user_id = auth.uid()
            )
        );
    END IF;
    
    -- Allow users to view candidates they uploaded
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'candidates' AND policyname = 'Users can view own uploaded candidates') THEN
        CREATE POLICY "Users can view own uploaded candidates" ON public.candidates FOR SELECT TO authenticated USING (uploaded_by = auth.uid());
    END IF;
END $$;