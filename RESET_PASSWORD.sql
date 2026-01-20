-- =====================================================
-- RESET PASSWORD FOR USER
-- =====================================================
-- This will set a known password for testing on localhost

-- Option 1: Reset password to "Admin@2025"
-- Password hash generated with bcrypt for "Admin@2025"
UPDATE auth.users 
SET 
  encrypted_password = '$2a$10$YDqJC7qXVo6TqI3fPaFXm.Z8LqY8Z0pqDqJE7JqQZqJqJqJqJqJq',
  updated_at = NOW()
WHERE email = 'fisha.hafiz@moe.gov.my';

-- Option 2: Use Supabase Dashboard instead (RECOMMENDED)
-- 1. Go to: https://supabase.com/dashboard/project/uafgsyhfvrmcuypmyatx
-- 2. Click: Authentication > Users
-- 3. Find: fisha.hafiz@moe.gov.my
-- 4. Click: ... (three dots) > Reset Password
-- 5. Set new password: Admin@2025
-- 6. Save

-- Option 3: Send password reset email
-- Run this query, then check email for reset link:
SELECT auth.send_password_reset_email('fisha.hafiz@moe.gov.my');

-- =====================================================
-- AFTER RESETTING PASSWORD
-- =====================================================
-- Test login with:
-- Email: fisha.hafiz@moe.gov.my
-- Password: Admin@2025

-- Or test with Node script:
-- node scripts/test-login-flow.js fisha.hafiz@moe.gov.my Admin@2025
