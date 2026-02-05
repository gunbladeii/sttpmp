# 🚨 QUICK FIX - Password Reset Not Working

## TL;DR - Do This NOW:

### 1️⃣ Run This SQL (Supabase SQL Editor):
```sql
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email = 'jn.datasdtm@moe.gov.my';

UPDATE users 
SET is_active = true, is_approved = true
WHERE email = 'jn.datasdtm@moe.gov.my';
```

### 2️⃣ Reset Password:
- Admin Panel → Pengurusan Pengguna
- Find: `jn.datasdtm@moe.gov.my`
- Click Reset Password 🔑
- **COPY the password shown!**

### 3️⃣ Test Login:
- Email: `jn.datasdtm@moe.gov.my`
- Password: [the one you copied]
- Open Console (F12) to see logs

---

## ✅ What Was Fixed:

| Issue | Solution | File Changed |
|-------|----------|--------------|
| Email not confirmed | Auto-confirm on password reset | `src/app/api/admin/reset-password/route.ts` |
| Generic error messages | Specific error feedback | `src/hooks/useAuthSimple.tsx` |
| No diagnostic tools | SQL & testing scripts | `FIX_PASSWORD_RESET_COMPLETE.sql` |

---

## 📚 Full Documentation:

- **Complete Guide:** [PASSWORD_RESET_FIX_COMPLETE.md](PASSWORD_RESET_FIX_COMPLETE.md)
- **Manual Testing:** [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md)
- **SQL Diagnostics:** [FIX_PASSWORD_RESET_COMPLETE.sql](FIX_PASSWORD_RESET_COMPLETE.sql)

---

## 🔍 If Still Fails:

Check console (F12) for:
```
🔐 Attempting login for: ...
❌ Auth error: [READ THIS ERROR]
```

Common errors:
- "Invalid login credentials" → Wrong password
- "Email not confirmed" → Run SQL fix again
- "User not found" → Check email spelling

---

## 💬 Need Help?

Share:
1. Console error messages
2. Network tab screenshot
3. Which step failed

**Status:** ✅ Code Fixed | ⏳ Testing Pending
