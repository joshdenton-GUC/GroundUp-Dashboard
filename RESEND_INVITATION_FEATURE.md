# Resend Invitation Feature

## Overview

This feature allows admins to resend invitation emails to clients who haven't completed their account setup within the 24-hour window.

## What Was Implemented

### 1. New Edge Function: `resend-client-invitation`

**Location:** `supabase/functions/resend-client-invitation/index.ts`

**Features:**

- ✅ Verifies admin authorization
- ✅ Checks if user exists
- ✅ Validates if user has already confirmed (prevents unnecessary resends)
- ✅ Resends invitation email with new 24-hour link
- ✅ Returns clear error messages

### 2. Updated Client Manager UI

**Location:** `src/components/admin/ClientManager.tsx`

**Features:**

- ✅ "Resend Invitation" button (mail icon) for each client
- ✅ Loading state while sending
- ✅ Disabled state for currently sending
- ✅ Success/error toast notifications
- ✅ Handles "already confirmed" status gracefully

## Deployment Steps

### Step 1: Deploy the New Edge Function

```bash
supabase functions deploy resend-client-invitation
```

### Step 2: Test the Feature

1. Go to Admin Dashboard → Manage Clients tab
2. Find a client in the list
3. Click the mail icon (📧) next to the eye icon
4. Verify the invitation email is resent

## How It Works

### For Pending Invitations (Not Confirmed)

1. Admin clicks the mail icon
2. System resends invitation email with a new 24-hour link
3. Client receives email and can set their password
4. Success message shows: "Invitation email has been resent to {email}"

### For Already Confirmed Users

1. Admin clicks the mail icon
2. System detects user has already confirmed
3. Friendly message shows: "This client has already confirmed their account and set up their password."
4. No email is sent (prevents spam)

## User Experience

### Admin View

```
┌─────────────┬──────────────┬──────────────┬──────────┬────────┬─────────┐
│ Company     │ Contact      │ Contact Info │ Location │ Status │ Actions │
├─────────────┼──────────────┼──────────────┼──────────┼────────┼─────────┤
│ Acme Corp   │ John Doe     │ john@acme... │ NY       │ Active │ 📧 👁️  │
└─────────────┴──────────────┴──────────────┴──────────┴────────┴─────────┘

📧 = Resend Invitation
👁️ = View Details
```

### Email Template

The same invitation email template configured in Supabase is used:

- Subject: "Welcome to Ground Up Connect"
- Contains secure link to set password
- Link expires in 24 hours

## Error Handling

The feature handles these scenarios:

### ✅ Success Cases

- **Pending user**: Email resent successfully
- **Confirmation needed**: New invitation link generated

### ⚠️ Handled Errors

- **Already confirmed**: Clear message, no email sent
- **User not found**: Proper error message
- **Invalid email**: Validation error
- **Network error**: Retry message

## API Details

### Request

```typescript
POST /functions/v1/resend-client-invitation
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "email": "client@example.com"
}
```

### Success Response (200)

```json
{
  "success": true,
  "email": "client@example.com",
  "message": "Invitation resent successfully"
}
```

### Error Response (400 - Already Confirmed)

```json
{
  "error": "already_confirmed",
  "message": "This user has already confirmed their email and set up their account."
}
```

### Error Response (404 - Not Found)

```json
{
  "error": "User not found",
  "message": "No user found with email \"client@example.com\""
}
```

## Security

- ✅ Admin-only access (role check on server-side)
- ✅ Service role key never exposed to client
- ✅ Proper authorization headers required
- ✅ Email validation
- ✅ Rate limiting via Supabase defaults

## Testing Checklist

After deployment, verify:

- [ ] Deploy edge function successfully
- [ ] Mail icon appears next to eye icon for all clients
- [ ] Click resend on a pending invitation → Success message
- [ ] Click resend on confirmed user → "Already confirmed" message
- [ ] Loading spinner shows during operation
- [ ] Button is disabled while sending
- [ ] Email is received by client
- [ ] New invitation link works
- [ ] Link expires after 24 hours

## Troubleshooting

### Issue: "Function not found"

**Solution:**

```bash
supabase functions deploy resend-client-invitation
```

### Issue: No email received

**Solution:**

- Check Supabase Dashboard → Authentication → Email Templates
- Verify SMTP settings in Supabase
- Check spam folder
- View Edge Function logs for errors

### Issue: "Already confirmed" for all users

**Solution:** This is correct behavior! Only users who haven't set their password will receive resends.

### Issue: Unauthorized error

**Solution:**

- Verify you're logged in as admin
- Check your profile has `role = 'admin'` in database
- Refresh your session

## Future Enhancements (Optional)

Potential improvements:

- Show "Pending" or "Confirmed" badge next to each client
- Add "Last invitation sent" timestamp
- Bulk resend invitations feature
- Auto-resend after X days
- Invitation expiry countdown

---

## Quick Reference

**Deploy command:**

```bash
supabase functions deploy resend-client-invitation
```

**Usage:**
Admin Dashboard → Manage Clients → Click 📧 icon

**Result:**
Client receives new invitation email with 24-hour link to set password
