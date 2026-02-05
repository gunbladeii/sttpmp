# 🧪 Manual Testing Guide - Password Reset Fix

## ⚠️ IMPORTANT: Run SQL Fix First

Before testing, you **MUST** run this SQL in Supabase SQL Editor to fix existing users:

### Step 1: Run This SQL Query

```sql
-- Fix email confirmation for the affected user
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'jn.datasdtm@moe.gov.my';

-- Ensure user is active and approved
UPDATE users 
SET 
  is_active = true,
  is_approved = true,
  updated_at = NOW()
WHERE email = 'jn.datasdtm@moe.gov.my';

-- Verify the fix
SELECT 
  u.email,
  u.name,
  u.is_active,
  u.is_approved,
  au.email_confirmed_at,
  au.last_sign_in_at
FROM users u
LEFT JOIN auth.users au ON au.email = u.email
WHERE u.email = 'jn.datasdtm@moe.gov.my';
```

**Expected Result:**
```
email: jn.datasdtm@moe.gov.my
name: Iqbal
is_active: true
is_approved: true
email_confirmed_at: 2026-02-05 (or similar date)
last_sign_in_at: (may be null if never logged in)
```

---

## 🔧 Step 2: Reset Password via Admin Panel

1. **Login as Admin**
   - Email: `jn.kualiti@moe.gov.my` or your admin account
   - Password: Your admin password

2. **Navigate to User Management**
   - Click "Pengurusan Pengguna" in navigation
   - Or go to: `https://sttpmp.vercel.app/admin/users`

3. **Find the User**
   - Search for: `jn.datasdtm@moe.gov.my`
   - Or search for: `Iqbal`

4. **Reset Password**
   - Click the 🔑 "Reset Password" button
   - Wait for confirmation dialog
   - **COPY the temporary password shown** (very important!)
   - Click OK to close dialog

5. **Check Email** (Optional)
   - User should receive email with temporary password
   - Email subject: "Kata Laluan Baharu - Sistem STTPMP"

---

## 🧪 Step 3: Test Login

### A. Open Browser Console First
Press **F12** to open Developer Tools, then go to **Console** tab

### B. Navigate to Login Page
- URL: `https://sttpmp.vercel.app/login`
- Or local: `http://localhost:3000/login`

### C. Enter Credentials
- **Email:** `jn.datasdtm@moe.gov.my`
- **Password:** [Paste the temporary password you copied]

### D. Monitor Console Output

**Expected Console Logs (Success):**
```
🔐 Attempting login for: jn.datasdtm@moe.gov.my
✅ Auth successful for user ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
✅ Login successful for: jn.datasdtm@moe.gov.my
```

**If Error - Check Console:**
```
❌ Auth error: [error details]
❌ Login error: [error message]
```

### E. Check Network Tab (if login fails)
1. Go to **Network** tab in DevTools
2. Try login again
3. Look for these requests:
   - `/api/auth/get-profile` - should be 200 OK
   - Response should contain user data

---

## ✅ Expected Results

### Successful Login:
- ✅ No error message on screen
- ✅ Redirected to dashboard
- ✅ Can see navigation menu
- ✅ Can view syor list
- ✅ Console shows success messages

### Failed Login (Common Issues):

#### Error: "Email atau password tidak betul"
**Cause:** Wrong password or email not confirmed
**Fix:**
1. Verify you copied the FULL password (no spaces, no truncation)
2. Run SQL fix again (Step 1 above)
3. Reset password again and get new temporary password

#### Error: "Email belum disahkan"
**Cause:** `email_confirmed_at` is still NULL
**Fix:**
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'jn.datasdtm@moe.gov.my';
```

#### Error: "Akaun belum diluluskan"
**Cause:** `is_approved` is false
**Fix:**
```sql
UPDATE users 
SET is_approved = true
WHERE email = 'jn.datasdtm@moe.gov.my';
```

#### Error: "Akaun telah dinyahaktifkan"
**Cause:** `is_active` is false
**Fix:**
```sql
UPDATE users 
SET is_active = true
WHERE email = 'jn.datasdtm@moe.gov.my';
```

---

## 📊 Verification Checklist

Use this checklist to verify the fix:

- [ ] **SQL Fix Run:** Executed SQL in Supabase
- [ ] **Email Confirmed:** `email_confirmed_at` has timestamp
- [ ] **User Active:** `is_active = true`
- [ ] **User Approved:** `is_approved = true`
- [ ] **Password Reset:** Done via admin panel
- [ ] **Password Copied:** Temporary password saved
- [ ] **Email Received:** User got email notification
- [ ] **Console Open:** DevTools console is visible
- [ ] **Login Attempted:** Entered correct credentials
- [ ] **Console Success:** See ✅ success logs
- [ ] **Login Success:** Redirected to dashboard
- [ ] **Full Access:** Can navigate and use system

---

## 🔄 Alternative: Direct Supabase Dashboard Method

If admin panel doesn't work, use Supabase directly:

### 1. Go to Supabase Dashboard
URL: https://supabase.com/dashboard/project/uafgsyhfvrmcuypmyatx

### 2. Navigate to Authentication → Users

### 3. Find User
Search for: `jn.datasdtm@moe.gov.my`

### 4. Click on User Email

### 5. Edit User
- Set new password: `[Your Choice]`
- Check "Email Confirmed" ✅
- Check "Auto-confirm user" ✅
- Click "Save"

### 6. Note the Password
Write down or copy the password you set

### 7. Test Login
Use email + new password

---

## 📝 Quick Reference - SQL Queries

### Check User Status:
```sql
SELECT 
  u.email,
  u.is_active,
  u.is_approved,
  au.email_confirmed_at,
  au.encrypted_password IS NOT NULL as has_password
FROM users u
LEFT JOIN auth.users au ON au.email = u.email
WHERE u.email = 'jn.datasdtm@moe.gov.my';
```

### Fix All Issues:
```sql
-- Fix auth user
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'jn.datasdtm@moe.gov.my';

-- Fix user status
UPDATE users 
SET 
  is_active = true,
  is_approved = true,
  updated_at = NOW()
WHERE email = 'jn.datasdtm@moe.gov.my';
```

### Check All Users:
```sql
SELECT 
  u.email,
  u.name,
  u.role,
  u.is_active,
  u.is_approved,
  au.email_confirmed_at IS NOT NULL as email_confirmed
FROM users u
LEFT JOIN auth.users au ON au.email = u.email
ORDER BY u.created_at DESC;
```

---

## 🆘 Still Not Working?

If you've tried everything:

1. **Clear Browser Cache**
   - Press Ctrl+Shift+Del
   - Clear cached images and files
   - Clear cookies and site data

2. **Try Incognito/Private Window**
   - Eliminates cache issues
   - Fresh session

3. **Check Supabase Project Status**
   - Dashboard might be down
   - Check status page

4. **Share Console Output**
   - Copy all console logs
   - Share for further debugging

5. **Check Error Details**
   - Network tab
   - Response bodies
   - Status codes

---

**Last Updated:** February 5, 2026  
**Status:** Ready for Testing
