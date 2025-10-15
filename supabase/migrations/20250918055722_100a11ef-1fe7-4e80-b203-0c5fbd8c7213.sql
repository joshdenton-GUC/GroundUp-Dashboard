-- Add remaining security policies for candidates table

-- Allow authenticated users to insert candidates (for resume uploads)
CREATE POLICY "Users can insert candidates" 
ON public.candidates 
FOR INSERT 
TO authenticated
WITH CHECK (uploaded_by = auth.uid());

-- Allow users to update candidates they uploaded
CREATE POLICY "Users can update own candidates" 
ON public.candidates 
FOR UPDATE 
TO authenticated
USING (uploaded_by = auth.uid())
WITH CHECK (uploaded_by = auth.uid());