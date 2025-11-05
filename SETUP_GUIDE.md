# 🚀 GroundUp Careers - Complete Setup Guide

This guide will help you set up Supabase, Resend, and DNS configuration for the GroundUp Dashboard.

---

## 📋 Prerequisites

- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Access to your domain registrar (for DNS)
- [ ] Email address for account signups

---

## 1️⃣ SUPABASE SETUP

### Step 1: Create/Access Supabase Project

1. **Visit**: https://supabase.com/dashboard
2. **Sign in** or create a new account
3. **Create New Project** (or select existing):
   - **Project Name**: `GroundUp-Dashboard`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Select closest to your users (e.g., US East, EU West)
   - **Plan**: Start with Free tier

### Step 2: Get API Keys

1. Go to **Settings** (⚙️ icon in sidebar)
2. Click **API** in the settings menu
3. Copy these values:

```env
VITE_SUPABASE_URL=https://[your-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...  (starts with eyJ)
```

4. Scroll down to find **Service Role Key** (keep this SECRET!)
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  (different from anon key)
```

### Step 3: Run Database Migrations

Your Supabase project needs the database schema. Run migrations:

```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref [your-project-id]

# Push migrations
supabase db push
```

### Step 4: Deploy Edge Functions

Deploy the Supabase Edge Functions (for email sending):

```bash
# Deploy all functions
supabase functions deploy send-email-alert
supabase functions deploy notify-client
supabase functions deploy send-reminder-emails
supabase functions deploy resend-client-invitation
supabase functions deploy resend-webhook
supabase functions deploy stripe-webhook
```

### Step 5: Set Edge Function Secrets

**CRITICAL:** Edge functions need environment variables:

```bash
# Set Resend API Key (get this from Step 2 below)
supabase secrets set RESEND_API_KEY=re_your_actual_resend_key

# Set Supabase Service Role Key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_step_2

# Set App URL
supabase secrets set VITE_APP_URL=https://groundupcareers.app
```

To verify secrets:
```bash
supabase secrets list
```

---

## 2️⃣ RESEND SETUP

### Step 1: Create Resend Account

1. **Visit**: https://resend.com
2. **Sign Up** with your email
3. **Verify your email address**

### Step 2: Add Your Domain

1. Click **"Domains"** in the left sidebar
2. Click **"+ Add Domain"**
3. Enter your domain: `groundupcareers.com` (or your actual domain)
4. Click **"Add Domain"**

### Step 3: Get Your API Key

1. Click **"API Keys"** in the sidebar
2. Click **"+ Create API Key"**
3. Settings:
   - **Name**: `GroundUp Production`
   - **Permission**: `Sending access` (or `Full access`)
4. Click **"Create"**
5. **⚠️ COPY THE KEY NOW** - starts with `re_` - you can only see it once!

Example: `re_123abc456def789ghi`

---

## 3️⃣ DNS CONFIGURATION FOR RESEND

### Step 1: Get DNS Records from Resend

In Resend dashboard, after adding your domain, you'll see DNS records like:

```
Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GN... (long string)
TTL: 3600

Type: MX
Name: @ (or leave blank for root domain)
Value: feedback-smtp.resend.com
Priority: 10
TTL: 3600
```

### Step 2: Add Records to Your DNS Provider

Choose your DNS provider below:

#### **Option A: Cloudflare**
1. Log in to Cloudflare
2. Select your domain
3. Go to **DNS** → **Records**
4. Click **"+ Add record"**
5. Add each record from Resend:
   - **Type**: TXT or MX
   - **Name**: (from Resend)
   - **Content/Value**: (from Resend)
   - **TTL**: Auto or 3600
   - **Proxy status**: DNS only (grey cloud)
6. Click **"Save"**

#### **Option B: GoDaddy**
1. Log in to GoDaddy
2. Go to **My Products** → **Domains**
3. Click **DNS** next to your domain
4. Click **"Add"** button
5. Add each record from Resend
6. Click **"Save"**

#### **Option C: Namecheap**
1. Log in to Namecheap
2. Go to **Domain List** → select domain
3. Click **"Advanced DNS"**
4. Click **"Add New Record"**
5. Add each record from Resend
6. Click **"Save All Changes"**

#### **Option D: Google Domains**
1. Log in to Google Domains
2. Select your domain → **DNS**
3. Scroll to **Custom records**
4. Click **"Manage custom records"**
5. Add each record from Resend

### Step 3: Verify Domain in Resend

1. After adding DNS records, **wait 10-30 minutes** for propagation
2. In Resend dashboard, click **"Verify Domain"**
3. Status should change to **"Verified"** ✅

**Check DNS propagation**: https://dnschecker.org

---

## 4️⃣ UPDATE ENVIRONMENT VARIABLES

### Local Development (.env)

Update your `.env` file in the project root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_or_pk_test_key

# App
VITE_APP_URL=https://groundupcareers.app/

# Gemini AI
VITE_GEMINI_API_KEY=your_gemini_key
```

### Supabase Edge Functions (Secrets)

Set these using Supabase CLI (see Step 1.5 above):

```bash
supabase secrets set RESEND_API_KEY=re_your_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_key
supabase secrets set VITE_APP_URL=https://groundupcareers.app
```

---

## 5️⃣ TEST YOUR SETUP

### Test 1: Supabase Connection

```bash
npm run dev
```

Visit: http://localhost:5173

Try to log in - if you see the login page and no console errors, Supabase is working!

### Test 2: Email Sending

1. Create an admin account
2. Go to Admin Dashboard
3. Upload a test resume
4. Check if you receive an email notification

### Test 3: Check Resend Dashboard

1. Go to Resend dashboard → **Emails**
2. You should see sent emails listed
3. Check delivery status

---

## 🎯 QUICK CHECKLIST

- [ ] Supabase project created
- [ ] Database migrations run (`supabase db push`)
- [ ] Edge functions deployed
- [ ] Supabase secrets set (RESEND_API_KEY, etc.)
- [ ] Resend account created
- [ ] Resend domain added
- [ ] DNS records added to domain registrar
- [ ] Resend domain verified ✅
- [ ] `.env` file updated with all keys
- [ ] Test email sent successfully

---

## 🆘 TROUBLESHOOTING

### Issue: Emails not sending

**Check:**
1. Resend domain is verified (green checkmark in Resend dashboard)
2. DNS records propagated (wait 24 hours max)
3. RESEND_API_KEY set in Supabase secrets
4. Edge functions deployed successfully
5. Check Supabase logs: `supabase functions logs send-email-alert`

### Issue: "Invalid API key" error

**Fix:**
```bash
# Recreate API key in Resend dashboard
# Update Supabase secret
supabase secrets set RESEND_API_KEY=re_new_key_here
```

### Issue: DNS not verifying

**Fix:**
- Wait longer (DNS can take up to 48 hours)
- Check records with: https://dnschecker.org
- Ensure records EXACTLY match Resend's values
- Remove any duplicate records

### Issue: Supabase connection failed

**Fix:**
1. Check API keys are correct in `.env`
2. Check project is not paused (free tier)
3. Verify URL matches your project

---

## 📚 ADDITIONAL RESOURCES

- **Supabase Docs**: https://supabase.com/docs
- **Resend Docs**: https://resend.com/docs
- **Supabase CLI**: https://supabase.com/docs/guides/cli
- **DNS Checker**: https://dnschecker.org

---

## ✅ NEXT STEPS

After setup is complete:

1. **Create Admin Account**: Sign up with your email
2. **Configure Email Alerts**: Admin Dashboard → Email Alerts Manager
3. **Add Your First Client**: Admin Dashboard → Client Manager
4. **Test Resume Upload**: Upload a test PDF resume
5. **Configure Stripe**: Add Stripe secret key for payments

---

**Questions?** Check the main README.md or create an issue on GitHub.
