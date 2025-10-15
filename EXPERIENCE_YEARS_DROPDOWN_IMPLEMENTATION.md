# Experience Years Dropdown Implementation

## Summary

Updated the experience years field to use standardized dropdown values instead of arbitrary numeric values, ensuring consistency across the application and improving data quality.

## Changes Made

### 1. Backend (Supabase Functions)

#### `supabase/functions/parse-resume/types.ts`

- Changed `experience_years` from `number` to `string`
- Now supports dropdown values: "0", "2", "4", "7", "10"

#### `supabase/functions/parse-resume/openai-analyzer.ts`

- Updated OpenAI JSON schema to use `string` enum for `experience_years` with values: ["0", "2", "4", "7", "10"]
- Added detailed prompt instructions to map experience years to specific dropdown values:
  - "0" = Entry Level (0-1 years)
  - "2" = Junior (2-3 years)
  - "4" = Mid-level (4-6 years)
  - "7" = Senior (7-10 years)
  - "10" = Expert (10+ years)
- Created `mapExperienceToDropdownValue()` helper function to convert numeric values to dropdown strings
- Updated `transformToCandidateInfo()` to use the mapping function

### 2. Frontend (React Components)

#### `src/integrations/supabase/types.ts`

- Updated `candidates` table type definitions (Row, Insert, Update)
- Changed `experience_years` from `number | null` to `string | null`

#### `src/components/admin/DocumentUploader.tsx`

- Made the experience years dropdown **interactive** (removed `disabled` prop)
- Added `onValueChange` handler to update form state
- Removed `parseInt()` conversion when saving to database (now stores string directly)
- Updated styling to use `bg-background` instead of `bg-muted`

#### `src/components/admin/CandidateManager.tsx`

- Changed `experience_years` type from `number | null` to `string | null`
- Added `getExperienceLabel()` helper function to convert dropdown values to readable labels
- Updated display logic to show proper experience labels instead of raw values

#### `src/components/dashboard/ReviewCandidates.tsx`

- Changed `experience_years` type from `number` to `string`
- Added `getExperienceLabel()` helper function
- Updated formatted resume display to use the helper function
- Fixed database insert to use `.select().single()` to retrieve candidate ID

### 3. Database Migration

#### `supabase/migrations/20251015000004_change_experience_years_to_text.sql`

- Migrates existing numeric values to dropdown string values using intelligent mapping
- Changes column type from `INTEGER` to `TEXT`
- Adds check constraint to ensure only valid values are stored
- Adds descriptive comment to the column

## Dropdown Values

| Value | Label       | Experience Range |
| ----- | ----------- | ---------------- |
| "0"   | Entry Level | 0-1 years        |
| "2"   | Junior      | 2-3 years        |
| "4"   | Mid-level   | 4-6 years        |
| "7"   | Senior      | 7-10 years       |
| "10"  | Expert      | 10+ years        |

## Benefits

1. **Data Consistency**: All experience values now use standardized options
2. **Better UX**: Users can select from clear, predefined categories
3. **Improved AI Parsing**: OpenAI now understands exactly which value to return
4. **Type Safety**: Proper TypeScript types ensure compile-time safety
5. **Database Integrity**: Check constraint prevents invalid values

## Testing Checklist

- [ ] Upload a resume and verify experience level is correctly parsed
- [ ] Manually adjust experience level in DocumentUploader dropdown
- [ ] Verify candidate is saved with correct experience value
- [ ] Check CandidateManager displays proper experience labels
- [ ] Verify ReviewCandidates shows correct experience information
- [ ] Run database migration on staging environment
- [ ] Test with various resume formats (different experience levels)
- [ ] Verify existing data is properly migrated

## Rollback Plan

If needed, the migration can be rolled back with:

```sql
-- Remove the check constraint
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS valid_experience_years;

-- Convert back to INTEGER (may lose precision)
ALTER TABLE candidates
ALTER COLUMN experience_years TYPE INTEGER USING
  CASE
    WHEN experience_years IN ('0', '2', '4', '7', '10')
    THEN experience_years::INTEGER
    ELSE NULL
  END;
```

## Files Modified

1. `supabase/functions/parse-resume/types.ts`
2. `supabase/functions/parse-resume/openai-analyzer.ts`
3. `src/integrations/supabase/types.ts`
4. `src/components/admin/DocumentUploader.tsx`
5. `src/components/admin/CandidateManager.tsx`
6. `src/components/dashboard/ReviewCandidates.tsx`
7. `supabase/migrations/20251015000004_change_experience_years_to_text.sql` (new file)

## Implementation Date

October 15, 2025
