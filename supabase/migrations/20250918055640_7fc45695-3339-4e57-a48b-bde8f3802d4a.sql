-- Critical Security Fix: Add RLS policies for candidates table
-- Only allow clients to view candidates assigned to them

-- Policy 1: Clients can view candidates assigned to them through candidate_assignments
CREATE POLICY "Clients can view assigned candidates" 
ON public.candidates 
FOR SELECT 
TO authenticated
USING (
  id IN (
    SELECT ca.candidate_id 
    FROM public.candidate_assignments ca
    INNER JOIN public.clients c ON ca.client_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Policy 2: Users can view candidates they uploaded
CREATE POLICY "Users can view uploaded candidates" 
ON public.candidates 
FOR SELECT 
TO authenticated
USING (uploaded_by = auth.uid());