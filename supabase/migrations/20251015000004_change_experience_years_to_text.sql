-- Change experience_years from INTEGER to TEXT to support dropdown values
-- This migration converts numeric experience values to standardized string values

-- First, update existing data to convert numbers to our dropdown values
UPDATE candidates
SET experience_years = CASE 
  WHEN experience_years IS NULL THEN NULL
  WHEN experience_years::INTEGER <= 1 THEN '0'
  WHEN experience_years::INTEGER <= 3 THEN '2'
  WHEN experience_years::INTEGER <= 6 THEN '4'
  WHEN experience_years::INTEGER <= 10 THEN '7'
  ELSE '10'
END::TEXT
WHERE experience_years IS NOT NULL;

-- Change the column type from INTEGER to TEXT
ALTER TABLE candidates 
ALTER COLUMN experience_years TYPE TEXT USING experience_years::TEXT;

-- Add a check constraint to ensure only valid values are stored
ALTER TABLE candidates
ADD CONSTRAINT valid_experience_years CHECK (
  experience_years IS NULL OR 
  experience_years IN ('0', '2', '4', '7', '10')
);

-- Add a comment explaining the values
COMMENT ON COLUMN candidates.experience_years IS 'Experience level: 0=Entry Level (0-1 years), 2=Junior (2-3 years), 4=Mid-level (4-6 years), 7=Senior (7-10 years), 10=Expert (10+ years)';

