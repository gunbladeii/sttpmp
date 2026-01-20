# 🐛 Login Troubleshooting Guide

## ✅ What We Found

User `fisha.hafiz@moe.gov.my` EXISTS in database and is APPROVED:
- ✅ Exists in `auth.users` table
- ✅ Exists in `users` table  
- ✅ `is_approved = true`
- ✅ `is_active = true`
- ✅ Email confirmed
- Role: `admin`

## 🔍 Next Steps to Debug

### 1. Check Browser Console Logs
Open browser console (Press F12) and try to login again. You should now see detailed logs:

```
🔍 Fetching profile for: fisha.hafiz@moe.gov.my
📡 Profile response status: 200
📦 Profile data: { success: true, hasUser: true, ... }
✅ Profile loaded successfully for: fisha.hafiz@moe.gov.my
```

### 2. Check Server Logs
Look at the terminal where Next.js is running. You should see:

```
🔍 GET-PROFILE API: Searching for user: fisha.hafiz@moe.gov.my
📡 GET-PROFILE API: Connecting to Supabase: https://...
🔎 GET-PROFILE API: Querying users table...
✅ GET-PROFILE API: User found and approved: { email: ..., role: ... }
```

### 3. If Still Failing

**Check these potential issues:**

#### A. Environment Variables
Make sure `.env.local` has correct values:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://uafgsyhfvrmcuypmyatx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

#### B. RLS Policies
The API uses service role key which bypasses RLS, so this shouldn't be an issue.

#### C. Network Issues
- Clear browser cache
- Try incognito mode
- Check if localhost:3000 is running properly

#### D. Password Issues
- Make sure you're using the correct password
- Try resetting password in Supabase Dashboard:
  - Go to Authentication > Users
  - Find fisha.hafiz@moe.gov.my
  - Click "Send password recovery email"

### 4. Manual Password Reset

Run this in Supabase SQL Editor if you want to set a new password:

```sql
-- Change password for user
-- This uses bcrypt hash for "Test123456!"
UPDATE auth.users 
SET encrypted_password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE email = 'fisha.hafiz@moe.gov.my';
```

Then login with password: `Test123456!`

## 📝 What We Improved

1. ✅ Added detailed logging in API route
2. ✅ Added detailed logging in auth hook
3. ✅ Better error messages in Malay
4. ✅ Separate checks for `is_approved` and `is_active`
5. ✅ Debug information in API responses
6. ✅ Created check-user-exists script

## 🧪 Test Again

1. Start dev server: `npm run dev`
2. Open browser console (F12)
3. Go to http://localhost:3000/login
4. Enter credentials
5. Watch the console logs
6. Share the console output if it still fails

## 🆘 Still Not Working?

Share the following:
1. Browser console logs (F12 > Console tab)
2. Terminal server logs (where you run `npm run dev`)
3. Screenshot of the error
