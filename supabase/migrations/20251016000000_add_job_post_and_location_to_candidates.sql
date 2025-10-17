-- Add job_post_id and location fields to candidates table
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS job_post_id UUID REFERENCES job_posts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_candidates_job_post_id ON candidates(job_post_id);

-- Add comment for documentation
COMMENT ON COLUMN candidates.job_post_id IS 'Reference to the job post this candidate is being considered for';
COMMENT ON COLUMN candidates.location IS 'Candidate location extracted from resume or manually entered';

