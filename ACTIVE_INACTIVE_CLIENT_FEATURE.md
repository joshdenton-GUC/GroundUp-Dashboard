# Active/Inactive Client Feature Implementation

## Overview

This document describes the implementation of the active/inactive client toggle feature that allows administrators to control client access to the application.

## Features Implemented

### 1. Database Changes

**File:** `supabase/migrations/20251015000003_add_is_active_to_profiles.sql`

- Added `is_active` boolean column to the `profiles` table (defaults to `true`)
- Created an index on `is_active` for better query performance
- Added trigger to automatically update `updated_at` timestamp when `is_active` changes
- Added column documentation comment

### 2. TypeScript Types Updated

**File:** `src/integrations/supabase/types.ts`

- Updated `profiles` table types to include `is_active` field in:
  - `Row` interface
  - `Insert` interface
  - `Update` interface

**File:** `src/contexts/AuthContext.tsx`

- Updated `UserProfile` interface to include `is_active: boolean`

### 3. Client Manager Component

**File:** `src/components/admin/ClientManager.tsx`

#### Changes Made:

- Added import for `Switch` component from UI library
- Updated `Client` interface to include:
  - `is_active` in the nested `profiles` object
  - All current client table fields (street1, street2, city, state, zip, welcome_email_sent)
- Added new column "Status" in the clients table with toggle switch
- Added new column "Location" to display city and state
- Removed deprecated "Industry" column references
- Created `handleToggleActive` function that:
  - Toggles the client's active status
  - Updates the database
  - Shows success/error toast notifications
  - Refreshes the client list
- Updated the client details dialog to show:
  - Account Status (Active/Inactive) with color coding
  - Proper address formatting using new address fields
  - Removed industry field

#### Visual Indicators:

- Toggle switch shows current active/inactive state
- Color-coded status labels:
  - Green text for "Active"
  - Red text for "Inactive"
- Status is also displayed in the client details modal

### 4. Authentication Context

**File:** `src/contexts/AuthContext.tsx`

#### Login Protection:

Added two layers of protection:

1. **During Sign-In (`signIn` function):**

   - After successful authentication, checks if user's `is_active` is `false`
   - If inactive, immediately signs the user out
   - Returns a custom error message: "Your account has been deactivated. Please contact support for assistance."

2. **During Profile Fetch (`fetchUserProfile` function):**
   - When fetching user profile (on page load, session restoration, etc.)
   - Checks if `is_active` is `false`
   - If inactive, signs the user out and redirects to auth page with a message parameter

This ensures inactive users cannot:

- Log in with email/password
- Log in via OAuth (Google/Apple)
- Maintain an active session
- Access the application through any authentication method

### 5. Auth Page Updates

**File:** `src/pages/auth/AuthPage.tsx`

#### Changes Made:

- Added `useSearchParams` hook to read URL parameters
- Added effect to check for `account_deactivated` message parameter
- When detected, shows a prominent error toast with extended duration (10 seconds)
- Added specific error handling in sign-in for deactivated accounts
- Shows user-friendly error message: "Your account has been deactivated by an administrator. Please contact support for assistance."

## User Flow

### Admin Perspective:

1. Navigate to Admin Dashboard → Client Management
2. See list of all clients with their active/inactive status
3. Toggle the switch next to any client to activate/deactivate them
4. See instant visual feedback (green/red status indicator)
5. Receive confirmation toast notification

### Client Perspective (When Deactivated):

1. **Attempt to Login:**

   - Enter credentials and click "Sign In"
   - Authentication initially succeeds
   - System checks `is_active` status
   - User is immediately signed out
   - Error message displayed: "Your account has been deactivated. Please contact support for assistance."

2. **Already Logged In (Active Session):**
   - Admin deactivates their account
   - On next page load or navigation, profile is fetched
   - System detects inactive status
   - User is signed out
   - Redirected to login page with deactivation message

## Security Features

1. **Database-Level Control:** Status is stored in the `profiles` table, making it authoritative
2. **Multi-Layer Checks:** Verification happens both at login and profile fetch
3. **Session Invalidation:** Inactive users are immediately signed out
4. **RLS Policies:** Existing Row Level Security policies ensure only admins can modify the `is_active` field
5. **Audit Trail:** The `updated_at` timestamp automatically tracks when status changes occur

## Technical Details

### Database Schema:

```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
```

### Toggle Function:

```typescript
const handleToggleActive = async (client: Client) => {
  const newActiveStatus = !client.profiles?.is_active;

  await supabase
    .from('profiles')
    .update({ is_active: newActiveStatus })
    .eq('user_id', client.user_id);

  // Show notification and refresh list
};
```

### Login Check:

```typescript
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!error && data.user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('user_id', data.user.id)
      .single();

    if (profileData && !profileData.is_active) {
      await supabase.auth.signOut();
      return { error: { message: 'Account deactivated...' } };
    }
  }

  return { error };
};
```

## Files Modified

1. `supabase/migrations/20251015000003_add_is_active_to_profiles.sql` (NEW)
2. `src/integrations/supabase/types.ts`
3. `src/contexts/AuthContext.tsx`
4. `src/components/admin/ClientManager.tsx`
5. `src/pages/auth/AuthPage.tsx`
6. `ACTIVE_INACTIVE_CLIENT_FEATURE.md` (NEW - this file)

## Testing Checklist

- [ ] Admin can see active/inactive status for all clients
- [ ] Admin can toggle client status on/off
- [ ] Toggle switch reflects current state correctly
- [ ] Status changes are persisted to database
- [ ] Inactive clients cannot log in with email/password
- [ ] Inactive clients cannot log in with OAuth
- [ ] Active sessions are terminated when user is deactivated
- [ ] Appropriate error messages are shown to deactivated users
- [ ] Active users can log in normally
- [ ] Admin users are not affected by the feature
- [ ] Database migration runs successfully
- [ ] No TypeScript/linting errors

## Future Enhancements

Potential improvements for future iterations:

1. **Audit Logging:** Track who deactivated/activated each client and when
2. **Bulk Actions:** Allow activating/deactivating multiple clients at once
3. **Email Notifications:** Notify clients when their account is deactivated
4. **Deactivation Reason:** Add a field to store why an account was deactivated
5. **Temporary Deactivation:** Add ability to set an automatic reactivation date
6. **Filter/Sort:** Add filters to show only active or inactive clients
7. **Reactivation Workflow:** Add a process for clients to request reactivation
