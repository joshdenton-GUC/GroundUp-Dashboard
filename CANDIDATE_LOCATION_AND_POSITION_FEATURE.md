# Candidate Location and Job Position Feature Implementation

## Overview

This document outlines the implementation of the location and job position tracking feature for candidates. This feature ensures that candidates are properly associated with specific job positions and their location information is captured from resumes.

## Changes Made

### 1. Database Migration

**File:** `supabase/migrations/20251016000000_add_job_post_and_location_to_candidates.sql`

- Added `job_post_id` column to `candidates` table (UUID, references `job_posts.id`)
- Added `location` column to `candidates` table (TEXT)
- Created index on `job_post_id` for better query performance
- Added comments for documentation

**To apply this migration:**

```bash
# If using Supabase CLI
supabase db push

# Or apply via Supabase Dashboard > SQL Editor
```

### 2. TypeScript Type Updates

**File:** `src/integrations/supabase/types.ts`

Updated the `candidates` table type definition to include:

- `job_post_id: string | null` in Row, Insert, and Update types
- `location: string | null` in Row, Insert, and Update types
- Added foreign key relationship for `job_post_id`

### 3. Resume Parser Updates

**Files:**

- `supabase/functions/parse-resume/types.ts`
- `supabase/functions/parse-resume/gemini-analyzer.ts`

**Changes:**

- Added `location: string` field to `CandidateInfo` interface
- Updated Gemini response schema to extract location from resumes
- Modified prompt to instruct AI to extract location (city, state/country) from contact information
- Updated `transformToCandidateInfo` function to include location in the parsed data

### 4. DocumentUploader Component Updates

**File:** `src/components/admin/DocumentUploader.tsx`

**Major Changes:**

1. **New Interfaces:**

   - Added `JobPost` interface to represent job positions

2. **State Management:**

   - Added `location` field to `CandidateFormData`
   - Added `selectedJobPost` field to `CandidateFormData`
   - Added `jobPosts` state array
   - Added `loadingJobPosts` state

3. **New Functionality:**

   - `fetchJobPosts()` - Fetches job posts for the selected client
   - Auto-loads job posts when a client is selected
   - Auto-fills location from parsed resume data

4. **UI Components:**

   - Added "Location" field (read-only, auto-filled from resume)
   - Added "Select Job Position" dropdown that:
     - Shows all active/draft job posts for the selected client
     - Displays job title and location
     - Shows warning if no job posts are available
     - Required field before submission

5. **Validation:**

   - Form submission now requires:
     - Resume uploaded and parsed
     - Client selected
     - Job position selected
   - Added helpful warning messages for missing requirements

6. **Database Insert:**

   - Updated candidate insert to include:
     - `location` field
     - `job_post_id` field

7. **Success Message:**
   - Enhanced to show the job position title assigned

### 5. CandidateInfo Component Updates

**File:** `src/components/dashboard/CandidateInfo.tsx`

**Changes:**

1. **Database Query Enhancement:**

   - Updated candidates query to include:
     - `location` field
     - `job_post_id` field
     - Joined `job_posts` table to fetch job title and location

2. **New Helper Functions:**

   - `getJobTitle(candidate)` - Gets job title from joined data or fallback
   - `getLocation(candidate)` - Gets location from candidate or job post

3. **Display Updates:**

   - Position column now shows actual job title from database
   - Location column now shows candidate or job location
   - Updated to use `job_post_id` instead of deprecated `jobId`

4. **Email Alerts:**
   - Updated job status alert to include actual job title from database

## Workflow

### Admin Workflow (Resume Upload)

1. Admin uploads a PDF resume
2. System parses resume and extracts:
   - Name, email, phone
   - **Location** (city, state/country)
   - Skills, experience, education, summary
3. Admin selects a client to assign the candidate to
4. System loads all job posts for that client
5. **Admin selects a specific job position** (required)
6. System displays:
   - Parsed location from resume
   - Selected job position with its location
7. Admin submits the candidate
8. Database stores:
   - All candidate information
   - `location` from resume
   - `job_post_id` linking to specific job position
   - `client_id` for the assigned client

### Client Workflow (View Candidates)

1. Client views their candidates in "My Candidates" page
2. Table displays:
   - Candidate name
   - **Position** - Job title they're being considered for
   - **Location** - Candidate's location or job location
   - Source (uploaded by them or admin assigned)
   - Submit date
   - Status
   - Action buttons

## Benefits

1. **Better Organization:** Candidates are now properly linked to specific job positions
2. **Location Tracking:** Candidate location is automatically extracted from resumes
3. **Accurate Reporting:** Email alerts include the actual job title
4. **Improved UX:** Admin must select a job position, ensuring data integrity
5. **Flexibility:** Location can come from the candidate's resume or the job post
6. **Data Integrity:** Foreign key relationship ensures valid job post references

## Migration Guide

1. **Apply Database Migration:**

   ```bash
   supabase db push
   ```

2. **Deploy Updated Code:**

   - Frontend changes (React components)
   - Backend changes (Supabase functions)

3. **Test the Workflow:**

   - Upload a test resume
   - Verify location is extracted
   - Select a client
   - Verify job posts load
   - Select a job position
   - Submit and verify data is saved correctly
   - Check candidate display page

4. **Existing Data:**
   - Existing candidates will have `null` for `job_post_id` and `location`
   - They will display "No Position Assigned" and "-" respectively
   - Admin can update them by editing if needed (future enhancement)

## Notes

- **Only POSTED jobs appear in the selector** - Job posts must be:
  - Status: `active` (posted/published)
  - Payment Status: `completed` (paid for)
- Draft jobs are NOT shown because they haven't been posted yet
- If a client has no active posted jobs, admin will see a warning message
- Location extraction depends on the resume format and quality
- The system gracefully handles missing location data

## Future Enhancements

1. Add ability to edit candidate's job position assignment
2. Add ability to manually edit location if parsing fails
3. Add filtering by position and location in candidate lists
4. Add analytics by position and location
5. Support multiple positions per candidate (if needed)
