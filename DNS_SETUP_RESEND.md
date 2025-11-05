# 📧 Resend DNS Configuration Guide

This guide shows exactly what DNS records you need to add for Resend email sending.

---

## 🎯 What You'll Need

1. **Your domain**: `groundupcareers.com` (or your actual domain)
2. **Access to DNS settings**: Through your registrar (GoDaddy, Namecheap, Cloudflare, etc.)
3. **Resend account**: Created at https://resend.com

---

## 📝 Step-by-Step DNS Setup

### Step 1: Get Your DNS Records from Resend

1. Log in to https://resend.com
2. Go to **Domains** → Click your domain
3. You'll see DNS records like this:

```
┌─────────────────────────────────────────────────────┐
│ DNS Records to Add                                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Record 1: DKIM (TXT Record)                        │
│ Type:     TXT                                      │
│ Name:     resend._domainkey                        │
│ Value:    p=MIGfMA0GCSqG... (long cryptographic)  │
│ TTL:      3600                                     │
│                                                     │
│ Record 2: Feedback Loop (MX Record)                │
│ Type:     MX                                       │
│ Name:     @                                        │
│ Value:    feedback-smtp.resend.com                 │
│ Priority: 10                                       │
│ TTL:      3600                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**⚠️ IMPORTANT**: Your actual values will be different! Use the EXACT values shown in YOUR Resend dashboard.

---

## 🌐 DNS Provider Instructions

### Option 1: Cloudflare (Recommended)

**Why Cloudflare?** Fast DNS propagation, free, easy to use.

#### Setup Steps:

1. **Log in to Cloudflare**: https://dash.cloudflare.com
2. **Select your domain** from the list
3. **Go to DNS** → **Records** tab
4. **Add Record 1 (DKIM TXT)**:
   ```
   Type:    TXT
   Name:    resend._domainkey
   Content: [Paste from Resend - starts with p=MIG...]
   TTL:     Auto (or 3600)
   Proxy:   DNS only (grey cloud icon 🌥️)
   ```
   Click **Save**

5. **Add Record 2 (MX)**:
   ```
   Type:     MX
   Name:     @
   Mail server: feedback-smtp.resend.com
   Priority: 10
   TTL:      Auto (or 3600)
   Proxy:    DNS only (grey cloud icon 🌥️)
   ```
   Click **Save**

6. **Verify**:
   - Go back to Resend dashboard
   - Click **"Verify Domain"**
   - Wait 5-10 minutes
   - Status should show ✅ **Verified**

---

### Option 2: GoDaddy

#### Setup Steps:

1. **Log in to GoDaddy**: https://account.godaddy.com
2. **Go to**: My Products → Domains
3. **Click DNS** next to your domain
4. **Scroll to Records** section

5. **Add Record 1 (DKIM TXT)**:
   - Click **"Add"** button
   - **Type**: TXT
   - **Name**: `resend._domainkey`
   - **Value**: [Paste from Resend]
   - **TTL**: 1 Hour (3600)
   - Click **"Save"**

6. **Add Record 2 (MX)**:
   - Click **"Add"** button
   - **Type**: MX
   - **Name**: `@` (or leave blank)
   - **Value**: `feedback-smtp.resend.com`
   - **Priority**: 10
   - **TTL**: 1 Hour
   - Click **"Save"**

7. **Important**: Click **"Save All Changes"** at the top

---

### Option 3: Namecheap

#### Setup Steps:

1. **Log in to Namecheap**: https://ap.www.namecheap.com
2. **Go to**: Domain List → Click **"Manage"** next to your domain
3. **Click**: Advanced DNS tab

4. **Add Record 1 (DKIM TXT)**:
   - Click **"Add New Record"**
   - **Type**: TXT Record
   - **Host**: `resend._domainkey`
   - **Value**: [Paste from Resend - entire value]
   - **TTL**: Automatic (or 3600)
   - Click green checkmark ✓

5. **Add Record 2 (MX)**:
   - Click **"Add New Record"**
   - **Type**: MX Record
   - **Host**: `@`
   - **Value**: `feedback-smtp.resend.com`
   - **Priority**: 10
   - **TTL**: Automatic
   - Click green checkmark ✓

6. **Click**: "Save All Changes" button at the top

---

### Option 4: Google Domains

#### Setup Steps:

1. **Log in to Google Domains**: https://domains.google.com
2. **Select your domain**
3. **Click**: DNS (on the left menu)
4. **Scroll down to**: Custom resource records

5. **Add Record 1 (DKIM TXT)**:
   - **Name**: `resend._domainkey`
   - **Type**: TXT
   - **TTL**: 3600
   - **Data**: [Paste from Resend]
   - Click **"Add"**

6. **Add Record 2 (MX)**:
   - **Name**: `@` (or leave blank for root)
   - **Type**: MX
   - **TTL**: 3600
   - **Data**: `10 feedback-smtp.resend.com`
   - Click **"Add"**

---

### Option 5: Other DNS Providers

Most DNS providers have similar interfaces. Look for:
- **DNS Management** or **DNS Records**
- **Add Record** or **Add New Record** button
- Fields for Type, Name/Host, Value/Content, TTL

General tips:
- Use `@` or leave blank for root domain
- TTL can be 3600 (1 hour) or Auto
- Don't add quotes around values
- Copy values EXACTLY from Resend

---

## ✅ Verification Checklist

### 1. Check DNS Propagation

Visit: https://dnschecker.org

**For TXT Record:**
- Enter: `resend._domainkey.groundupcareers.com`
- Type: TXT
- Click "Search"
- Should show your DKIM value globally

**For MX Record:**
- Enter: `groundupcareers.com`
- Type: MX
- Click "Search"
- Should show `feedback-smtp.resend.com` with priority 10

### 2. Verify in Resend Dashboard

1. Go to Resend → Domains
2. Click your domain
3. Click **"Verify Domain"** button
4. Wait for verification (can take 10 mins - 24 hours)
5. Status should show: ✅ **Verified**

### 3. Test Email Sending

Once verified, send a test email:

```bash
# From your app, or use Resend dashboard
# Go to Emails → Send Test Email
```

---

## ⏱️ DNS Propagation Timeline

| Time | What to Expect |
|------|----------------|
| 5-10 minutes | Records visible in some locations |
| 1 hour | Records visible in most locations |
| 24 hours | Full global propagation |
| 48 hours | Maximum time (rare) |

**Tip**: Cloudflare is fastest (5-10 mins), GoDaddy can take 1-24 hours.

---

## 🚨 Troubleshooting

### Issue: Domain not verifying after 24 hours

**Solutions:**
1. Check DNS records are EXACT (no extra spaces, quotes)
2. Use https://dnschecker.org to verify records exist
3. Try removing and re-adding records
4. Contact your DNS provider support
5. Check for conflicting records (delete old DKIM records)

### Issue: "DKIM validation failed"

**Solutions:**
1. Verify TXT record value is complete (it's very long!)
2. Some DNS providers split long TXT records - combine them
3. Remove any quotes around the value
4. TTL should be 3600 or higher

### Issue: "MX record not found"

**Solutions:**
1. Name field should be `@` (root domain)
2. Priority should be exactly `10`
3. Value should be `feedback-smtp.resend.com` (no extra text)
4. Wait 1 hour and try again

### Issue: Emails still not sending

**Check:**
1. ✅ Domain verified in Resend
2. ✅ API key is correct (starts with `re_`)
3. ✅ API key set in Supabase: `supabase secrets list`
4. ✅ Check Resend logs: Dashboard → Emails
5. ✅ Check Supabase logs: `supabase functions logs send-email-alert`

---

## 🎓 Understanding the Records

### What is DKIM (TXT Record)?

**Purpose**: Proves emails from your domain are authentic
**How it works**: Cryptographic signature validates sender
**Required**: Yes, for Resend to send from your domain

### What is the MX Record?

**Purpose**: Receives bounce notifications and feedback
**How it works**: Routes delivery reports back to Resend
**Required**: Yes, for delivery monitoring

---

## 📋 Quick Reference Card

**Copy this for your DNS provider:**

```
─────────────────────────────────────
Record 1: DKIM
─────────────────────────────────────
Type:     TXT
Name:     resend._domainkey
Value:    [GET FROM RESEND DASHBOARD]
TTL:      3600
─────────────────────────────────────
Record 2: MX Feedback
─────────────────────────────────────
Type:     MX
Name:     @
Value:    feedback-smtp.resend.com
Priority: 10
TTL:      3600
─────────────────────────────────────
```

---

## 🔗 Helpful Links

- **Resend Dashboard**: https://resend.com/domains
- **DNS Checker**: https://dnschecker.org
- **Resend Docs**: https://resend.com/docs/send-with-dns
- **Resend Support**: support@resend.com

---

**Need help?** Contact support or check the main SETUP_GUIDE.md
