-- Add 'interviewing' status to candidates table
-- This status indicates a candidate is currently in the interview process

-- Update the CHECK constraint to include 'interviewing'
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_status_check;

ALTER TABLE candidates ADD CONSTRAINT candidates_status_check 
  CHECK (status IN ('pending_review', 'pending', 'interviewing', 'hired', 'not_hired', 'interviewed', 'rejected'));

-- Update comment to reflect the updated workflow
COMMENT ON COLUMN candidates.status IS 
  'pending_review: Assigned by admin, awaiting client decision | 
   pending: Accepted by client, in candidate pool | 
   interviewing: Interview scheduled/in progress | 
   interviewed: Interview completed | 
   hired: Hired | 
   not_hired: Not selected after review | 
   rejected: Rejected by client during initial review';

