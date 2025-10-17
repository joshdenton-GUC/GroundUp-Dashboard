# Fix Invitation Redirect URL

## The Problem

When clicking the invitation link, it redirects to:

```
https://groundupcareers.app
```

Instead of:

```
https://groundupcareers.app/auth/callback
```

This bypasses our password setup check, so users are auto-logged in without setting a password.

## The Root Cause

Supabase has a **Site URL** setting that it uses as the default redirect. This is overriding our edge function's `redirectTo` parameter.

## The Solution

**DON'T** change the Site URL (it will break other auth flows). Instead, we catch invited users on multiple pages and redirect them to password setup.

### Step 1: Add Redirect URLs (Whitelist)

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **URL Configuration**
3. Find **Redirect URLs** section
4. Make sure these are added (one per line):

```
https://groundupcareers.app/auth/callback
https://groundupcareers.app/auth/set-password
https://groundupcareers.app
http://localhost:8080/auth/callback
http://localhost:8080/auth/set-password
http://localhost:8080
```

5. Click **Save**

**IMPORTANT:** Keep Site URL as `https://groundupcareers.app` (don't add /auth/callback)

### Step 2: Updated Files to Catch Invited Users

We've added password checks in **two places**:

1. ✅ `HomePage.tsx` - Catches users who land on home page
2. ✅ `AuthCallbackPage.tsx` - Catches users who land on callback page

This ensures invited users are redirected to password setup regardless of where they land.

### Step 3: Redeploy Edge Functions (Just to be safe)

```bash
supabase functions deploy invite-client
supabase functions deploy resend-client-invitation
```

### Step 4: Test the Fix

1. Add a new test client from admin panel
2. Open the invitation email
3. Click the invitation link
4. **No matter where it redirects** (home page or callback), you should be automatically redirected to `/auth/set-password`
5. Set your password - should see password setup page! ✅

## Alternative: Environment Variable Approach

If the above doesn't work, we need to ensure the edge functions have the correct environment variable:

### Check Environment Variables

1. Go to **Supabase Dashboard** → **Edge Functions** → **Settings**
2. Check if `SITE_URL` is set
3. If it exists, update it to: `https://groundupcareers.app`
4. If it doesn't exist, leave it - the functions will use the request origin

### Verify Edge Function Settings

The functions already have this code:

```typescript
redirectTo: `${
  req.headers.get('origin') || Deno.env.get('SITE_URL')
}/auth/callback`;
```

This means:

1. First, it tries to use the request origin (where the admin panel is hosted)
2. If that's not available, it uses the SITE_URL environment variable
3. Then it appends `/auth/callback`

## Visual Fix Guide

### Before (Wrong)

```
Invitation Email Link:
https://supabase.co/auth/v1/verify?...&redirect_to=https://groundupcareers.app
                                                      ↑
                                              Missing /auth/callback!
        ↓
User clicks link
        ↓
Redirects to: https://groundupcareers.app (home page)
        ↓
User is logged in but NO password set ❌
```

### After (Correct)

```
Invitation Email Link:
https://supabase.co/auth/v1/verify?...&redirect_to=https://groundupcareers.app/auth/callback
                                                      ↑
                                              Has /auth/callback! ✅
        ↓
User clicks link
        ↓
Redirects to: https://groundupcareers.app/auth/callback
        ↓
Auth callback checks: Does user need to set password?
        ↓
Redirects to: /auth/set-password
        ↓
User sets password ✅
```

## Quick Fix Summary

**Main Fix:** Frontend catches invited users and redirects them to password setup

**What Changed:**

1. ✅ `HomePage.tsx` - Added password check before dashboard redirect
2. ✅ `AuthCallbackPage.tsx` - Added password check
3. ✅ Whitelisted redirect URLs in Supabase

**Site URL:** Keep as `https://groundupcareers.app` (DON'T change it!)

**Why:** Changing Site URL would break password resets, email confirmations, and other auth flows

## Verification

After making these changes:

1. **Create a new test client**
2. **Check the invitation email source** (right-click → View Page Source)
3. **Look for the redirect_to parameter** in the link
4. **It should say:** `redirect_to=https://groundupcareers.app/auth/callback`
5. **Click the link** - you should see the password setup page! 🎉

## Troubleshooting

### Issue: Still redirecting to home page

**Solution:**

- Clear browser cache and cookies
- Try in incognito mode
- Check that you're testing with a NEW invitation (not an old one)
- Old invitation links have the old redirect URL baked in

### Issue: "Invalid redirect URL" error

**Solution:**

- Make sure you added the URLs to the **Redirect URLs** whitelist
- Include both production and localhost URLs
- Save the settings and wait a minute for them to take effect

### Issue: Link still shows old URL in email

**Solution:**

- You're using an old invitation link
- Create a NEW client invitation
- The new link will have the updated redirect URL

## Important Notes

⚠️ **Old invitation links will still use the old redirect URL**

This is because the redirect URL is embedded in the token when it's generated. You need to:

1. Update the Supabase settings
2. Send NEW invitations
3. The new invitations will have the correct redirect URL

✅ **After the fix, ALL new invitations will work correctly**

## Expected Flow After Fix

```
1. Admin invites client
   ↓
2. Client receives email with link containing:
   redirect_to=https://groundupcareers.app/auth/callback
   ↓
3. Client clicks link
   ↓
4. Supabase verifies token and creates session
   ↓
5. Redirects to: /auth/callback
   ↓
6. AuthCallbackPage checks: !user.user_metadata?.password_set
   ↓
7. Redirects to: /auth/set-password
   ↓
8. Client sets password
   ↓
9. Redirects to: /dashboard
   ↓
10. Client can now log in anytime! ✅
```

---

## Quick Checklist

- [ ] Update Site URL in Supabase Dashboard
- [ ] Add redirect URLs to whitelist
- [ ] Redeploy edge functions (optional but recommended)
- [ ] Test with NEW client invitation
- [ ] Verify email link includes `/auth/callback`
- [ ] Confirm password setup page appears
- [ ] Test that password is saved and login works

---

**Once you update the Site URL, all new invitations will work perfectly!** 🎉
