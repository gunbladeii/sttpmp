-- Quick check for specific user
-- Replace the email with the user you want to check
SELECT 
  '=== USER AUTH STATUS CHECK ===' as info;

-- Check current status
WITH user_check AS (
  SELECT 
    u.id as users_id,
    u.email,
    u.name,
    u.is_active,
    u.is_approved,
    au.id as auth_id,
    au.email_confirmed_at,
    au.last_sign_in_at
  FROM users u
  LEFT JOIN auth.users au ON u.email = au.email
  WHERE u.email = 'jn.datasdtm@moe.gov.my'  -- 👈 CHANGE THIS EMAIL
)
SELECT 
  email,
  name,
  users_id,
  auth_id,
  CASE 
    WHEN users_id = auth_id THEN '✅ IDs Match - No Issues'
    WHEN auth_id IS NULL THEN '⚠️ No Auth Account - Will Create on Reset'
    ELSE '❌ ID MISMATCH - NEEDS FIX'
  END as status,
  CASE 
    WHEN is_active THEN '✅ Active'
    ELSE '❌ Inactive'
  END as active_status,
  CASE 
    WHEN is_approved THEN '✅ Approved'
    ELSE '❌ Not Approved'
  END as approval_status,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Email Confirmed'
    ELSE '⚠️ Email Not Confirmed'
  END as email_status,
  last_sign_in_at as last_login
FROM user_check;

-- Show recent password reset attempts
SELECT 
  '=== RECENT RESET ATTEMPTS ===' as info;

SELECT 
  prt.token,
  prt.used,
  prt.expires_at,
  prt.created_at,
  CASE 
    WHEN prt.expires_at < NOW() THEN '❌ Expired'
    WHEN prt.used THEN '✅ Used'
    ELSE '⏳ Pending'
  END as token_status
FROM password_reset_tokens prt
WHERE prt.user_id IN (
  SELECT id FROM users WHERE email = 'jn.datasdtm@moe.gov.my'  -- 👈 CHANGE THIS EMAIL
)
ORDER BY prt.created_at DESC
LIMIT 5;
