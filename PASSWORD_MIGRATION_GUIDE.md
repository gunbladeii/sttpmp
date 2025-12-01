# 🔐 Password Migration Guide

## Masalah Yang Dihadapi

Selepas migration `001_security_fixes.sql`:
- ❌ Old users tak boleh login
- ❌ Column `password_plain` dah di-drop
- ❌ Old users tak ada `password_hash` (bcrypt)

## ✅ Solution Implemented

### 1. Migration Script
**File:** `database/migrations/002_migrate_existing_passwords.sql`

Run this migration in Supabase SQL Editor untuk:
- Set random password untuk old users (force reset)
- Add column `password_reset_required`
- Create function `update_user_password()`

### 2. Forgot Password Flow
**Pages & APIs Created:**
- ✅ `/forgot-password` - Already exists
- ✅ `/api/auth/forgot-password` - Already exists
- ✅ `/reset-password` - NEW (just created)
- ✅ `/api/auth/update-password` - NEW (just created)

### 3. User Flow

**For Existing Users:**
1. Go to login page
2. Click "Lupa Kata Laluan?" 
3. Enter email
4. Check email for reset link
5. Click link → redirected to `/reset-password`
6. Set new password (min 8 chars)
7. Password updated in both:
   - `auth.users.encrypted_password` (Supabase Auth)
   - `users.password_hash` (bcrypt hash)

**For New Users:**
- Registration already uses bcrypt
- Login works immediately

## 📋 Deployment Checklist

### Step 1: Run Migration
```sql
-- In Supabase SQL Editor, run:
database/migrations/002_migrate_existing_passwords.sql
```

### Step 2: Verify Migration
```sql
-- Check how many users need password reset
SELECT COUNT(*) as users_need_reset 
FROM users 
WHERE password_reset_required = true;
```

### Step 3: Notify Users
Send email to all affected users:
```
Subject: Reset Kata Laluan STTPMP - Action Required

Sistem STTPMP telah dikemaskini dengan keselamatan yang lebih baik.

Sila reset kata laluan anda di:
https://sttpmp.vercel.app/forgot-password

Terima kasih.
```

## 🔧 Technical Details

### Password Reset Flow
```
User enters email → 
Supabase sends reset email → 
User clicks link (with token) → 
/reset-password page → 
User sets new password → 
API hashes with bcrypt → 
Updates both auth.users & users table → 
Redirect to login
```

### Security Features
- ✅ Bcrypt hashing (10 rounds)
- ✅ Minimum 8 characters
- ✅ Reset token expires after 1 hour
- ✅ Email verification required
- ✅ Old password completely removed

## 🚨 Important Notes

1. **Email Service Required**: Make sure Brevo API is configured
2. **NEXTAUTH_URL Must Be Set**: For redirect links
3. **Service Role Key**: Required for password updates
4. **One-time Migration**: Run `002_migrate_existing_passwords.sql` only once

## ✅ Testing Checklist

- [ ] Run migration `002_migrate_existing_passwords.sql`
- [ ] Test forgot password flow
- [ ] Receive reset email
- [ ] Click reset link
- [ ] Set new password successfully
- [ ] Login with new password
- [ ] Verify old password doesn't work

## 🎯 Next Steps

1. ✅ Environment variables set
2. ✅ Migration scripts ready
3. ⏳ Run migration in Supabase
4. ⏳ Test forgot password flow
5. ⏳ Deploy to Vercel
6. ⏳ Notify existing users

---

**Created:** 2025-12-01  
**Status:** Ready for deployment
