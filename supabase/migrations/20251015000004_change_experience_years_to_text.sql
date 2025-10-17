-- Change experience_years from INTEGER to TEXT to support dropdown values
-- This migration converts numeric experience values to standardized string values

-- Check if the column is already TEXT, if not, convert it
DO $$ 
BEGIN
  -- Check if column exists and is INTEGER type
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'candidates' 
    AND column_name = 'experience_years' 
    AND data_type = 'integer'
  ) THEN
    -- First, create a temporary column to hold converted values
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS experience_years_temp TEXT;
    
    -- Update the temp column with converted values
    UPDATE candidates
    SET experience_years_temp = CASE 
      WHEN experience_years IS NULL THEN NULL
      WHEN experience_years <= 1 THEN '0'
      WHEN experience_years <= 3 THEN '2'
      WHEN experience_years <= 6 THEN '4'
      WHEN experience_years <= 10 THEN '7'
      ELSE '10'
    END
    WHERE experience_years IS NOT NULL;
    
    -- Drop the old column and rename the temp column
    ALTER TABLE candidates DROP COLUMN experience_years;
    ALTER TABLE candidates RENAME COLUMN experience_years_temp TO experience_years;
  ELSIF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'candidates' 
    AND column_name = 'experience_years' 
    AND data_type = 'text'
  ) THEN
    -- Column is already TEXT, just update values if they're not in the valid set
    UPDATE candidates
    SET experience_years = CASE 
      WHEN experience_years IS NULL THEN NULL
      WHEN experience_years IN ('0', '2', '4', '7', '10') THEN experience_years
      WHEN experience_years ~ '^\d+$' THEN 
        CASE 
          WHEN experience_years::INTEGER <= 1 THEN '0'
          WHEN experience_years::INTEGER <= 3 THEN '2'
          WHEN experience_years::INTEGER <= 6 THEN '4'
          WHEN experience_years::INTEGER <= 10 THEN '7'
          ELSE '10'
        END
      ELSE '0' -- Default for invalid values
    END;
  END IF;
  
  -- Drop constraint if it exists (for idempotency)
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_experience_years'
  ) THEN
    ALTER TABLE candidates DROP CONSTRAINT valid_experience_years;
  END IF;
  
  -- Add the check constraint
  ALTER TABLE candidates
  ADD CONSTRAINT valid_experience_years CHECK (
    experience_years IS NULL OR 
    experience_years IN ('0', '2', '4', '7', '10')
  );
END $$;

-- Add a comment explaining the values
COMMENT ON COLUMN candidates.experience_years IS 'Experience level: 0=Entry Level (0-1 years), 2=Junior (2-3 years), 4=Mid-level (4-6 years), 7=Senior (7-10 years), 10=Expert (10+ years)';

