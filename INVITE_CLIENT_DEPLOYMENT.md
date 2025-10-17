# Deploy the Invite Client Edge Function

## Problem

The error you encountered (`403 Forbidden - "not_admin"`) occurs because `supabase.auth.admin.inviteUserByEmail()` requires the **service role key**, which should never be exposed on the client side for security reasons.

## Solution

We've created a Supabase Edge Function that runs server-side with secure access to the service role key.

## Files Created

1. `supabase/functions/invite-client/index.ts` - The edge function
2. `supabase/functions/invite-client/README.md` - Documentation
3. Updated `src/components/admin/AddClientDialog.tsx` - Now calls the edge function

## Deployment Steps

### Step 1: Install Supabase CLI (if not already installed)

```bash
npm install -g supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

### Step 3: Link Your Project (if not already linked)

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

You can find your project ref in your Supabase dashboard URL:
`https://app.supabase.com/project/YOUR_PROJECT_REF`

### Step 4: Deploy the Edge Function

```bash
supabase functions deploy invite-client
```

### Step 5: Verify Deployment

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions** in the left sidebar
3. You should see `invite-client` listed
4. Check the logs to ensure it deployed successfully

### Step 6: Test the Function

Try adding a new client from your admin dashboard. The function should now work without the 403 error.

## What Changed

### Before (❌ Client-Side - Insecure)

```typescript
// This requires service role key - NOT SECURE
await supabase.auth.admin.inviteUserByEmail(email, {...})
```

### After (✅ Server-Side - Secure)

```typescript
// Calls edge function with user's auth token
await supabase.functions.invoke('invite-client', {
  body: { email, fullName, companyName, ... }
})
```

## Security Benefits

✅ Service role key never exposed to client  
✅ Admin verification on server-side  
✅ Proper authorization checks  
✅ Protection against unauthorized access  
✅ Secure email duplicate checking

## Troubleshooting

### Issue: "Function not found"

**Solution:** Make sure you've deployed the function:

```bash
supabase functions deploy invite-client
```

### Issue: "Unauthorized" error

**Solution:** Verify that:

1. You're logged in as an admin user
2. Your profile has `role = 'admin'` in the database
3. The function is properly deployed

### Issue: Edge function timeout

**Solution:** Check the Supabase Edge Function logs in your dashboard for specific errors

### Issue: Email not being sent

**Solution:** Verify that:

1. Your Supabase project has email authentication enabled
2. Email templates are configured in Supabase Dashboard > Authentication > Email Templates
3. Check the Edge Function logs for any email-related errors

## Testing Locally (Optional)

If you want to test the function locally before deploying:

```bash
# Start local Supabase
supabase start

# Serve the function locally
supabase functions serve invite-client

# Make a test request
curl -X POST 'http://localhost:54321/functions/v1/invite-client' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "fullName": "Test User",
    "companyName": "Test Company"
  }'
```

## Next Steps

After deployment:

1. Test creating a new client from the admin dashboard
2. Verify the invitation email is sent
3. Test that duplicate email detection works
4. Confirm the client can set their password via the invitation link

---

If you encounter any issues during deployment, check the Supabase Edge Function logs in your dashboard for detailed error messages.
