# Email Templates - Position and Location Update

## Overview

Updated all candidate-related email templates to include **Position** and **Location** information, providing recipients with complete context about the candidate and the job they're being considered for.

## Files Updated

### 1. **notify-client Function** ✅

**File:** `supabase/functions/notify-client/index.ts`

**Changes:**

- Added `candidateLocation` and `candidatePosition` to `NotifyClientRequest` interface
- Updated email HTML template to display:
  - **Position** (job title) in blue color (#2563eb)
  - **Location** (candidate or job location)
- Fields appear right after candidate name, before education

**Email Display Order:**

```
Candidate Name
├── Position: Software Engineer (if available)
├── Location: San Francisco, CA (if available)
├── Education: Bachelor's Degree
├── Skills: React, TypeScript, Node.js
└── Summary: Professional background...
```

### 2. **send-reminder-emails Function** ✅

**File:** `supabase/functions/send-reminder-emails/index.ts`

**Changes:**

- Updated email HTML template to include position and location
- Same display format as notify-client

**Database Update:**

- Created migration: `20251016000001_update_email_reminder_with_position_location.sql`
- Updated `get_unopened_emails_for_reminder()` RPC function to:
  - Add `candidate_location` from candidates table
  - Add `candidate_position` by LEFT JOIN with job_posts table
  - Returns complete candidate info including job title

### 3. **job-status-update Template** ✅

**Files:**

- `supabase/functions/send-email-alert/templates/types.ts`
- `supabase/functions/send-email-alert/templates/job-status-update.ts`

**Changes:**

- Added `candidateLocation` to `JobStatusUpdateData` interface
- Updated template to show location below candidate name
- Displays when job status changes (hired, interviewing, not_hired)

**Email Display:**

```
Job Title
├── Client: John Doe (email)
├── Status: HIRED
├── Candidate: Jane Smith
└── Location: New York, NY
```

### 4. **Frontend Integration** ✅

**File:** `src/components/admin/DocumentUploader.tsx`

**Changes:**

- When admin uploads candidate, passes to `notify-client`:
  - `candidateLocation`: From parsed resume OR job posting location
  - `candidatePosition`: Job title from selected job post

**Code:**

```typescript
candidateLocation: formData.location || selectedJob?.location || null,
candidatePosition: selectedJob?.title || null,
```

### 5. **CandidateInfo Component** ✅

**File:** `src/components/dashboard/CandidateInfo.tsx`

**Changes:**

- Updated candidate query to include `location` and job_posts.location
- Passes location to job status update email:
  - Tries candidate's location first
  - Falls back to job posting location

**Code:**

```typescript
candidateLocation: candidateData.location || candidateData.job_posts?.location || null,
```

## Email Templates Updated

### 📧 New Candidate Match Email

**Trigger:** When admin assigns candidate to client  
**Recipient:** Client  
**Includes:** Position ✅, Location ✅

### 📧 Reminder Email

**Trigger:** 24 hours after initial email if not opened  
**Recipient:** Client  
**Includes:** Position ✅, Location ✅

### 📧 Job Status Update Email

**Trigger:** When candidate status changes (hired/interviewing/not_hired)  
**Recipients:** Admin, configured email alerts  
**Includes:** Location ✅ (Position is the job title itself)

## Database Migrations Required

Run these migrations in order:

```bash
# 1. Add location and job_post_id to candidates table
supabase/migrations/20251016000000_add_job_post_and_location_to_candidates.sql

# 2. Update email reminder function to include position and location
supabase/migrations/20251016000001_update_email_reminder_with_position_location.sql
```

## Visual Improvements

**Position** - Displayed in **blue** (#2563eb) to stand out  
**Location** - Displayed in muted gray (#64748b) for context

Both fields are optional and only display if data is available.

## Testing Checklist

- [ ] Admin uploads resume with location
- [ ] Admin selects client and job position
- [ ] Client receives email with position and location
- [ ] If reminder sent after 24hrs, includes position and location
- [ ] When candidate hired, status update email includes location
- [ ] All fields gracefully handle missing data (don't show if null)

## Benefits

1. **Better Context:** Clients immediately see which position the candidate is for
2. **Location Awareness:** Clients know where the candidate is located
3. **Reduced Confusion:** Clear which job posting the candidate matches
4. **Professional:** Complete information in one email
5. **Consistency:** Same info across all email types

## Notes

- Location is extracted from resume during PDF parsing
- If resume parsing doesn't capture location, falls back to job posting location
- Position is always the job title from the selected job post
- All fields are optional - emails won't break if data is missing
- Email templates use conditional rendering to only show available data

## Future Enhancements

1. Add location matching/filtering in emails
2. Show distance between candidate and job location
3. Include salary information from job posting
4. Add job type (remote, hybrid, onsite) to emails
