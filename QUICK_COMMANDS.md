# ⚡ Quick Command Reference

Copy and paste these commands to set up your GroundUp Dashboard.

---

## 🔧 Initial Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Install Supabase CLI
```bash
npm install -g supabase
```

---

## 🗄️ Supabase Setup

### Link Your Project
```bash
# Replace [your-project-id] with your actual Supabase project ID
supabase link --project-ref [your-project-id]
```

### Push Database Migrations
```bash
supabase db push
```

### Deploy All Edge Functions
```bash
supabase functions deploy send-email-alert
supabase functions deploy notify-client
supabase functions deploy send-reminder-emails
supabase functions deploy resend-client-invitation
supabase functions deploy resend-webhook
supabase functions deploy stripe-webhook
```

### Set Edge Function Secrets
```bash
# Set Resend API Key (get from https://resend.com/api-keys)
supabase secrets set RESEND_API_KEY=re_your_actual_key_here

# Set Supabase Service Role Key (get from Supabase Dashboard → Settings → API)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Set App URL
supabase secrets set VITE_APP_URL=https://groundupcareers.app
```

### List All Secrets (to verify)
```bash
supabase secrets list
```

### View Function Logs
```bash
# View logs for a specific function
supabase functions logs send-email-alert

# Follow logs in real-time
supabase functions logs send-email-alert --follow
```

---

## 🧪 Development

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Lint Code
```bash
npm run lint
```

---

## 🔍 Debugging

### Check Supabase Status
```bash
supabase status
```

### Test Database Connection
```bash
supabase db remote status
```

### View Edge Function Details
```bash
supabase functions list
```

### Invoke Function Manually (for testing)
```bash
supabase functions invoke send-email-alert --data '{"alertType":"test"}'
```

---

## 📧 Resend Testing

### Check DNS Records
```bash
# Install dig (if not already installed)
# macOS/Linux - usually pre-installed
# Windows - use nslookup instead

# Check DKIM TXT record
dig resend._domainkey.groundupcareers.com TXT +short

# Check MX record
dig groundupcareers.com MX +short
```

### Or use online tools:
- https://dnschecker.org
- https://mxtoolbox.com

---

## 🔄 Update Commands

### Update Supabase CLI
```bash
npm update -g supabase
```

### Update Project Dependencies
```bash
npm update
```

### Pull Latest DB Schema
```bash
supabase db pull
```

---

## 🧹 Cleanup Commands

### Clear Node Modules (if having issues)
```bash
rm -rf node_modules package-lock.json
npm install
```

### Clear Build Cache
```bash
rm -rf dist
npm run build
```

---

## 🎯 Common Workflows

### After Updating Environment Variables
```bash
# Restart dev server
# Press Ctrl+C to stop, then:
npm run dev
```

### After Updating Edge Functions
```bash
# Deploy specific function
supabase functions deploy send-email-alert

# View logs to check for errors
supabase functions logs send-email-alert
```

### After Updating Database Schema
```bash
# Create migration from changes
supabase db diff -f new_migration

# Push to remote
supabase db push
```

---

## 🚀 Production Deployment

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# or use:
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
# etc...
```

### Deploy to Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Set environment variables
netlify env:set VITE_SUPABASE_URL "your-value"
```

---

## 🆘 Emergency Commands

### Reset Local Database
```bash
supabase db reset
```

### Restart Supabase Services
```bash
supabase stop
supabase start
```

### Check All Environment Variables
```bash
# View .env file
cat .env

# Check Supabase secrets
supabase secrets list
```

---

## 📋 Pre-Flight Checklist

Before launching, run these checks:

```bash
# 1. Check environment variables are set
cat .env

# 2. Check Supabase secrets
supabase secrets list

# 3. Test database connection
supabase db remote status

# 4. Check edge functions are deployed
supabase functions list

# 5. Build production
npm run build

# 6. Preview production build
npm run preview
```

---

## 🔗 Quick Links

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Resend Dashboard**: https://resend.com
- **Stripe Dashboard**: https://dashboard.stripe.com
- **DNS Checker**: https://dnschecker.org
- **Project Docs**: See SETUP_GUIDE.md

---

**💡 Tip**: Bookmark this file for quick reference!
