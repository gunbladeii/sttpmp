-- ============================================================================
-- FIX PASSWORD RESET AUTHENTICATION ISSUE
-- Problem: Temporary passwords set by admin are rejected during login
-- Solution: Verify auth.users table has correct password hash
-- ============================================================================

-- 1. Check if user exists in auth.users with correct email
SELECT 
  u.id as user_id,
  u.email,
  u.name,
  au.id as auth_user_id,
  au.email as auth_email,
  au.email_confirmed_at,
  au.encrypted_password IS NOT NULL as has_password,
  LENGTH(au.encrypted_password) as password_length
FROM users u
LEFT JOIN auth.users au ON au.email = u.email
WHERE u.email = 'jn.datasdtm@moe.gov.my';

-- 2. If auth user is missing, we need to understand why
-- Check if there are any auth users with similar emails
SELECT 
  id,
  email,
  email_confirmed_at,
  encrypted_password IS NOT NULL as has_password,
  created_at,
  updated_at
FROM auth.users 
WHERE email LIKE '%datasdtm%'
   OR email = 'jn.datasdtm@moe.gov.my';

-- 3. Check our users table
SELECT 
  id,
  email,
  name,
  role,
  is_active,
  created_at
FROM users
WHERE email = 'jn.datasdtm@moe.gov.my';

-- 4. Verify RLS policies are not blocking auth
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'auth' 
  AND tablename = 'users';

-- ============================================================================
-- DIAGNOSTIC RESULTS INTERPRETATION:
-- ============================================================================
-- If auth_user_id IS NULL:
--   - User exists in users table but NOT in auth.users
--   - Need to create auth user first
--
-- If has_password IS FALSE:
--   - Auth user exists but no password set
--   - Admin password reset should work
--
-- If password_length < 50:
--   - Password hash might be corrupted
--   - Need to reset password again
-- ============================================================================
