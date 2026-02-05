-- ============================================================================
-- COMPREHENSIVE PASSWORD RESET FIX & VERIFICATION
-- ============================================================================
-- This script will:
-- 1. Check current auth status
-- 2. Fix any missing email confirmations
-- 3. Test password reset flow
-- 4. Provide actionable recommendations
-- ============================================================================

-- STEP 1: Current Status Check
-- ============================================================================
SELECT '=== STEP 1: USER STATUS CHECK ===' as step;

-- Check if user exists in both tables
SELECT 
  'User Table Status' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ User exists in users table'
    ELSE '❌ User NOT found in users table'
  END as status,
  COUNT(*) as count
FROM users 
WHERE email = 'jn.datasdtm@moe.gov.my';

-- Check auth user
SELECT 
  'Auth User Status' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ User exists in auth.users'
    ELSE '❌ User NOT found in auth.users'
  END as status,
  COUNT(*) as count
FROM auth.users 
WHERE email = 'jn.datasdtm@moe.gov.my';

-- Detailed user information
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.is_active,
  u.is_approved,
  CASE 
    WHEN au.id IS NOT NULL THEN '✅ Linked to auth'
    ELSE '❌ NOT linked to auth'
  END as auth_status,
  CASE 
    WHEN au.email_confirmed_at IS NOT NULL THEN '✅ Email confirmed'
    ELSE '❌ Email NOT confirmed'
  END as email_status,
  CASE 
    WHEN au.encrypted_password IS NOT NULL THEN '✅ Has password'
    ELSE '❌ No password'
  END as password_status,
  au.last_sign_in_at as last_login,
  au.created_at as auth_created
FROM users u
LEFT JOIN auth.users au ON au.email = u.email
WHERE u.email = 'jn.datasdtm@moe.gov.my';

-- STEP 2: Fix Missing Email Confirmations
-- ============================================================================
SELECT '=== STEP 2: FIX EMAIL CONFIRMATIONS ===' as step;

-- This is THE KEY FIX - ensure email is confirmed so user can login
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'jn.datasdtm@moe.gov.my'
  AND email_confirmed_at IS NULL
RETURNING 
  id,
  email,
  email_confirmed_at,
  '✅ Email confirmation updated' as status;

-- If no rows returned, email was already confirmed
SELECT 
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Email already confirmed'
    ELSE '❌ Email still not confirmed - manual intervention needed'
  END as confirmation_status,
  email_confirmed_at
FROM auth.users
WHERE email = 'jn.datasdtm@moe.gov.my';

-- STEP 3: Verify User is Active and Approved
-- ============================================================================
SELECT '=== STEP 3: VERIFY USER STATUS ===' as step;

SELECT 
  email,
  name,
  role,
  CASE 
    WHEN is_active THEN '✅ Active'
    ELSE '❌ Inactive - Need to activate'
  END as active_status,
  CASE 
    WHEN is_approved THEN '✅ Approved'
    ELSE '❌ Not Approved - Need approval'
  END as approval_status
FROM users
WHERE email = 'jn.datasdtm@moe.gov.my';

-- Fix if needed
UPDATE users 
SET 
  is_active = true,
  is_approved = true,
  updated_at = NOW()
WHERE email = 'jn.datasdtm@moe.gov.my'
  AND (is_active = false OR is_approved = false)
RETURNING 
  email,
  '✅ User activated and approved' as status;

-- STEP 4: Verification Query
-- ============================================================================
SELECT '=== STEP 4: FINAL VERIFICATION ===' as step;

-- This should show ALL checkmarks
SELECT 
  u.email,
  u.name,
  CASE WHEN u.is_active THEN '✅' ELSE '❌' END as "Active",
  CASE WHEN u.is_approved THEN '✅' ELSE '❌' END as "Approved",
  CASE WHEN au.id IS NOT NULL THEN '✅' ELSE '❌' END as "Auth Exists",
  CASE WHEN au.email_confirmed_at IS NOT NULL THEN '✅' ELSE '❌' END as "Email Confirmed",
  CASE WHEN au.encrypted_password IS NOT NULL THEN '✅' ELSE '❌' END as "Has Password",
  au.last_sign_in_at as "Last Login"
FROM users u
LEFT JOIN auth.users au ON au.email = u.email
WHERE u.email = 'jn.datasdtm@moe.gov.my';

-- STEP 5: Instructions for Admin
-- ============================================================================
SELECT '=== STEP 5: NEXT ACTIONS ===' as step;

SELECT 
  '📋 INSTRUCTIONS' as type,
  'After running this script:
  
  1. ✅ Go to Admin Panel → Users
  2. ✅ Click "Reset Password" for user: jn.datasdtm@moe.gov.my
  3. ✅ Copy the temporary password shown
  4. ✅ Try logging in with:
     - Email: jn.datasdtm@moe.gov.my
     - Password: [the temporary password]
  5. ✅ Check browser console (F12) for any errors
  6. ✅ If still fails, check Network tab for API responses
  
  Common Issues:
  - ❌ Email not confirmed → Fixed by this script
  - ❌ User not active/approved → Fixed by this script
  - ❌ Old browser cache → Clear cache and try again
  - ❌ Wrong password → Use exact password from admin panel
  - ❌ CORS/Network error → Check console for details
  
  ' as instructions;
