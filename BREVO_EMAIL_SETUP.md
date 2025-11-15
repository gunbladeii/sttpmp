# 📧 Brevo (Sendinblue) Email Setup Guide

Email notification system menggunakan **Brevo** (formerly Sendinblue) - FREE 300 emails/day!

## ✅ Kelebihan Brevo

- 🆓 **300 emails/day FREE** (9,000 emails/month)
- ✅ **NO credit card** required
- ✅ **NO domain verification** needed untuk testing
- ✅ Boleh hantar ke **SEMUA EMAIL** (Gmail, Yahoo, MOE, etc.)
- ✅ Professional email service
- ✅ Fast delivery & good reputation

---

## 🚀 Setup Steps

### Step 1: Sign Up Brevo Account

1. **Pergi ke:** https://app.brevo.com/account/register
2. **Fill in:**
   - Email: `noreply.sttpmp.jn@gmail.com` (atau email lain)
   - Password: (pilih password kuat)
   - Company name: `Jemaah Nazir - MOE`
3. **Verify email** - Check inbox dan click verification link
4. **Login** ke Brevo dashboard

---

### Step 2: Get API Key

1. **Login** ke https://app.brevo.com
2. **Click nama kau** (top right) → **SMTP & API**
3. **Scroll down** ke **API Keys** section
4. **Click "Create a new API key"**
5. **Name**: `STTPMP Production`
6. **Copy API key** (starts with `xkeysib-...`)
   - ⚠️ **IMPORTANT**: Save sekarang! Lepas ni takkan nampak dah

---

### Step 3: Update `.env.local`

Paste API key dalam `.env.local`:

```env
BREVO_API_KEY=xkeysib-your_actual_api_key_here
BREVO_FROM_EMAIL=noreply.sttpmp.jn@gmail.com
```

---

### Step 4: Test Email

1. **Restart dev server**:
   ```bash
   # Kill current server (Ctrl+C)
   npm run dev
   ```

2. **Login sebagai admin** → http://localhost:3000/login

3. **Approve pending user** → http://localhost:3000/admin/users

4. **Check email** - User akan terima email dengan:
   - Logo Jemaah Nazir
   - Professional template
   - Login button
   - FROM: `noreply.sttpmp.jn@gmail.com`

---

## 🎯 Production Setup (Vercel)

When deploy to Vercel, add environment variables:

```
BREVO_API_KEY=xkeysib-your_actual_api_key_here
BREVO_FROM_EMAIL=noreply.sttpmp.jn@gmail.com
NEXT_PUBLIC_APP_URL=https://sttpmp.vercel.app
```

---

## 📊 Free Tier Limits

| Feature | Free Tier |
|---------|-----------|
| Emails per day | 300 |
| Emails per month | 9,000 |
| Sender domains | Unlimited |
| Credit card | Not required |
| Contract | No contract |

---

## 🔧 Troubleshooting

### Email tak sampai?

1. **Check Brevo dashboard** → Logs
2. **Check API key** betul ke tak
3. **Check FROM email** valid ke tak
4. **Check terminal** untuk error messages

### Error: "Invalid API key"

1. Copy API key baru dari Brevo
2. Update `.env.local`
3. Restart dev server

---

## 🆚 Brevo vs Resend

| Feature | Brevo | Resend |
|---------|-------|--------|
| Free emails/day | 300 | 100 |
| Domain verification | Optional | Required |
| Gmail support | Yes (instant) | Need verify |
| Setup time | 5 minutes | 5 minutes |
| Best for | Testing & Production | Production only |

**Recommendation:** Brevo is better for government portals! 👍

---

## 📞 Support

- **Brevo Dashboard:** https://app.brevo.com
- **Brevo Docs:** https://developers.brevo.com
- **Status:** https://status.brevo.com

---

## ✅ Checklist

- [ ] Sign up Brevo account
- [ ] Verify email address
- [ ] Get API key
- [ ] Update `.env.local`
- [ ] Test email sending
- [ ] Add to Vercel (for production)

---

**🎉 Done! Email system ready dengan 300 emails/day FREE!**
