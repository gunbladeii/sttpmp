# Google reCAPTCHA v3 Setup Guide

## 🔒 Keselamatan Login dengan reCAPTCHA

Sistem STTPMP kini dilengkapi dengan **Google reCAPTCHA v3** untuk perlindungan daripada bot dan automated attacks.

## ✨ Kelebihan reCAPTCHA v3

1. **Invisible** - Pengguna tak perlu solve puzzle atau klik "I'm not a robot"
2. **Score-based** - Automatically detect robot (0.0 = bot, 1.0 = human)
3. **Non-intrusive** - Better user experience
4. **Free** - Google service
5. **MYDS Compliant** - Sesuai untuk government portal

---

## 📋 Setup Instructions

### Step 1: Daftar reCAPTCHA di Google

1. Pergi ke [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Login dengan Google account
3. Klik **"+"** untuk create site baru

### Step 2: Fill in Site Details

```
Label: STTPMP Login Protection
reCAPTCHA type: ✅ reCAPTCHA v3
Domains: 
  - localhost (untuk development)
  - yourdomain.gov.my (untuk production)
  - vercel.app (jika deploy di Vercel)

Accept reCAPTCHA Terms of Service: ✅
Send alerts to owners: ✅ (optional)
```

### Step 3: Copy Keys

Selepas submit, anda akan dapat 2 keys:

1. **Site Key** (Public) - Untuk client-side
2. **Secret Key** (Private) - Untuk server-side

### Step 4: Update Environment Variables

Edit file `.env.local` dan update:

```bash
# Google reCAPTCHA v3 Configuration
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
RECAPTCHA_SECRET_KEY=6LcYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
```

### Step 5: Restart Development Server

```bash
npm run dev
```

---

## 🧪 Testing

1. Pergi ke login page: `http://localhost:3000/login`
2. Anda akan nampak badge hijau: **"🔒 Perlindungan Bot Aktif (reCAPTCHA v3)"**
3. Try login - reCAPTCHA akan verify automatically
4. Check browser console untuk score (0.0 - 1.0)

---

## 🎯 Score Threshold

Current threshold: **0.5**

- **Score ≥ 0.5** = Human ✅ (Allow login)
- **Score < 0.5** = Suspected bot ❌ (Block login)

You can adjust threshold in `/src/app/api/verify-recaptcha/route.ts`:

```typescript
const threshold = 0.5 // Change this value (0.0 to 1.0)
```

**Recommended values:**
- `0.3` - More lenient (fewer false positives)
- `0.5` - Balanced (recommended)
- `0.7` - Stricter (may block some humans)

---

## 🔍 How It Works

1. User visits login page
2. reCAPTCHA script loads automatically
3. When user clicks "Log Masuk":
   - Frontend gets reCAPTCHA token
   - Send token to `/api/verify-recaptcha`
   - Backend verifies with Google API
   - Check score against threshold
   - Allow/block login based on score

---

## 🚨 Error Messages

**Malay (User-facing):**
- "Sistem keselamatan belum siap. Sila cuba lagi."
- "Verifikasi keselamatan gagal"
- "Aktiviti mencurigakan dikesan. Sila cuba lagi."

**English (Console/Logs):**
- "reCAPTCHA verification error"
- "RECAPTCHA_SECRET_KEY not configured"

---

## 🌐 Production Deployment

### Vercel Deployment

1. Add environment variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key
   RECAPTCHA_SECRET_KEY=your_secret_key
   ```

2. Update reCAPTCHA domains in Google Console:
   ```
   your-project.vercel.app
   yourdomain.gov.my
   ```

3. Redeploy

---

## 📊 Monitoring

Check reCAPTCHA analytics:
1. Go to [reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Select your site
3. View analytics dashboard:
   - Total requests
   - Score distribution
   - Suspicious activity

---

## 🔧 Troubleshooting

### Issue: Badge tidak muncul
**Solution:** Check console untuk errors, verify `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set

### Issue: "Verifikasi gagal"
**Solution:** Verify `RECAPTCHA_SECRET_KEY` is correct in `.env.local`

### Issue: Domain not allowed
**Solution:** Add your domain to reCAPTCHA admin console

### Issue: Score too low (legitimate users blocked)
**Solution:** Lower threshold from 0.5 to 0.3

---

## 📚 References

- [reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
- [Score Interpretation Guide](https://developers.google.com/recaptcha/docs/v3#interpreting_the_score)

---

## ✅ Features Implemented

- [x] Invisible reCAPTCHA v3 integration
- [x] Score-based verification (threshold: 0.5)
- [x] Security badge indicator
- [x] Loading state for reCAPTCHA script
- [x] Error handling with user-friendly messages
- [x] Server-side verification API
- [x] Malay language support
- [x] MYDS compliant design

---

**Status:** ✅ Ready for production (after adding reCAPTCHA keys)

**Security Level:** High 🔒

**User Experience:** Excellent (Invisible protection)
