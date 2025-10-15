-- Clear all existing candidate data
DELETE FROM candidates;

-- Drop policies that depend on candidate_assignments table
DROP POLICY IF EXISTS "Clients can view assigned resumes" ON storage.objects;
DROP POLICY IF EXISTS "Clients can view assigned candidates" ON candidates;

-- Drop the candidate_assignments table
DROP TABLE IF EXISTS candidate_assignments;

-- Add client_id and status columns to candidates table
ALTER TABLE candidates 
ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'hired', 'not_hired', 'interviewed', 'rejected'));

-- Create index for better performance
CREATE INDEX idx_candidates_client_id ON candidates(client_id);
CREATE INDEX idx_candidates_status ON candidates(status);

-- Create new RLS policies for the updated structure
CREATE POLICY "Clients can view their own candidates" ON candidates
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all candidates" ON candidates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Clients can update their own candidates" ON candidates
  FOR UPDATE USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );
