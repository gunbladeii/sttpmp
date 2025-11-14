# Email Notification Setup Guide

## 📧 Sistem Email Notification untuk STTPMP

Sistem kini boleh menghantar email automatic bila admin approve/reject user registration.

---

## ✨ Features

✅ **Approval Email** - Automatic bila admin approve user
✅ **Rejection Email** - Automatic bila admin reject user (optional)
✅ **Beautiful HTML Template** - Professional government-style design
✅ **Role Information** - Include role yang diberikan
✅ **Login Link** - Direct link ke login page
✅ **Security Notice** - Reminder tentang keselamatan akaun

---

## 🚀 Setup Instructions

### Step 1: Daftar Resend Account

1. Pergi ke [resend.com](https://resend.com)
2. Sign up dengan email (FREE tier: 3,000 emails/month)
3. Verify email anda

### Step 2: Add & Verify Domain

**Option A: Production Domain (Recommended)**
```
1. Go to Resend Dashboard → Domains
2. Click "Add Domain"
3. Enter your domain: sttpmp.gov.my
4. Add DNS records provided by Resend:
   - TXT record for verification
   - MX records for email sending
5. Wait for verification (usually 24-48 hours)
```

**Option B: Development (Temporary)**
```
Guna default: onboarding@resend.dev
(For testing only - has limitations)
```

### Step 3: Generate API Key

```
1. Go to Resend Dashboard → API Keys
2. Click "Create API Key"
3. Name: STTPMP Production
4. Permission: Sending access
5. Copy the API key (starts with re_...)
```

### Step 4: Update Environment Variables

Edit `.env.local`:

```bash
# Email Configuration (Resend)
RESEND_API_KEY=re_123456789_YourActualAPIKey
RESEND_FROM_EMAIL=noreply@sttpmp.gov.my

# App URL (for login links in email)
NEXT_PUBLIC_APP_URL=https://sttpmp.vercel.app
```

**For Development:**
```bash
RESEND_FROM_EMAIL=onboarding@resend.dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For Production (Vercel):**
```bash
RESEND_FROM_EMAIL=noreply@sttpmp.gov.my
NEXT_PUBLIC_APP_URL=https://sttpmp.vercel.app
```

---

## 📝 Vercel Deployment

Add environment variables in Vercel dashboard:

```
RESEND_API_KEY=re_123456789_YourActualAPIKey
RESEND_FROM_EMAIL=noreply@sttpmp.gov.my
NEXT_PUBLIC_APP_URL=https://sttpmp.vercel.app
```

---

## 🧪 Testing

### Local Testing:

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Login as admin
3. Go to Admin page
4. Approve a pending user
5. Check Resend dashboard → Logs untuk verify email sent
6. Check user's email inbox

---

## 📧 Email Templates

### Approval Email Content:

- ✅ Success badge
- User name & role assigned
- Login button/link
- System info (email, role, status)
- Security notice
- Professional footer with MOE branding

---

## ✅ Files Modified

- ✅ `/src/lib/email.ts` - Email service (NEW)
- ✅ `/src/app/api/admin/approve-registration/route.ts` - Send email on approval
- ✅ `.env.local` - Environment variables
- ✅ `package.json` - Resend dependency

---

**Status:** ✅ Ready for testing (add RESEND_API_KEY)
**Email Service:** Resend
**Free Tier:** 3,000 emails/month
