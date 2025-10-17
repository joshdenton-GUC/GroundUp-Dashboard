# Invite Client Edge Function

This Supabase Edge Function handles the secure creation and invitation of new client accounts.

## Purpose

This function is called by admin users to invite new clients to the platform. It:

- Validates that the caller is an admin
- Checks for duplicate email addresses
- Creates a new user account via Supabase Auth
- Creates the associated profile and client records
- Sends an invitation email for the client to set their password

## Why This Function Exists

The `supabase.auth.admin.inviteUserByEmail()` method requires the service role key, which should never be exposed on the client side. This edge function runs server-side with secure access to the service role key.

## Request Format

**Endpoint:** `POST /functions/v1/invite-client`

**Headers:**

- `Authorization: Bearer <user-access-token>`
- `Content-Type: application/json`

**Body:**

```json
{
  "email": "client@example.com",
  "fullName": "John Doe",
  "companyName": "Acme Corporation",
  "contactPhone": "(555) 123-4567",
  "street1": "123 Main St",
  "street2": "Suite 100",
  "city": "New York",
  "state": "NY",
  "zip": "10001"
}
```

**Required Fields:**

- `email`
- `fullName`
- `companyName`

## Response Format

**Success (200):**

```json
{
  "success": true,
  "userId": "uuid",
  "email": "client@example.com",
  "companyName": "Acme Corporation",
  "message": "Client invited successfully"
}
```

**Error (4xx/5xx):**

```json
{
  "error": "error_code",
  "message": "Human-readable error message"
}
```

## Error Codes

- `401` - Missing or invalid authorization
- `403` - User is not an admin
- `400` - Missing required fields
- `409` - Email already exists (duplicate_email)
- `500` - Server error

## Deployment

Deploy this function using the Supabase CLI:

```bash
supabase functions deploy invite-client
```

## Environment Variables

This function uses the following environment variables (automatically available):

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key with admin privileges
- `SITE_URL` - Your site URL for redirect links

## Testing

Test locally:

```bash
supabase functions serve invite-client
```

Then make a request:

```bash
curl -X POST 'http://localhost:54321/functions/v1/invite-client' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "fullName": "Test User",
    "companyName": "Test Company"
  }'
```
