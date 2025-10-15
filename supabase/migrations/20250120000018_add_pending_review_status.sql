-- Add 'pending_review' status to candidates table
-- This status indicates a candidate has been assigned to a client but not yet reviewed

-- First, update the CHECK constraint to include 'pending_review'
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_status_check;

ALTER TABLE candidates ADD CONSTRAINT candidates_status_check 
  CHECK (status IN ('pending_review', 'pending', 'hired', 'not_hired', 'interviewed', 'rejected'));

-- Update any existing candidates with NULL client_id to have 'pending' status
UPDATE candidates SET status = 'pending' WHERE status IS NULL;

-- Add comment to explain the workflow
COMMENT ON COLUMN candidates.status IS 
  'pending_review: Assigned by admin, awaiting client decision | 
   pending: Accepted by client, in candidate pool | 
   interviewing: Interview scheduled | 
   hired: Hired | 
   not_hired: Not selected after review | 
   rejected: Rejected by client during initial review';

