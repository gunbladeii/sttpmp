-- =====================================================
-- QUICK FIX: TROUBLESHOOT LOGIN ISSUE
-- =====================================================
-- Run this in Supabase SQL Editor to diagnose the problem

-- Step 1: Check if user exists in users table
SELECT 
  'User in users table:' as check_type,
  id,
  email,
  name,
  role,
  is_approved,
  department_id,
  jpn_id
FROM users 
WHERE email = 'fisha.hafiz@moe.gov.my';

-- Step 2: Check if user exists in auth.users
SELECT 
  'User in auth.users:' as check_type,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'fisha.hafiz@moe.gov.my';

-- Step 3: Show RLS policies on users table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users';

-- =====================================================
-- SOLUTION 1: If user doesn't exist at all
-- =====================================================
-- Run this if Step 1 and Step 2 above return no results

-- First, create auth user (do this in Supabase Dashboard instead):
-- Go to Authentication > Users > Add User
-- Email: fisha.hafiz@moe.gov.my
-- Password: (your password)
-- Auto Confirm Email: YES

-- Then insert into users table:
INSERT INTO users (
  email,
  name,
  role,
  is_approved,
  created_at,
  updated_at
) VALUES (
  'fisha.hafiz@moe.gov.my',
  'Fisha Hafiz',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE 
SET is_approved = true;

-- =====================================================
-- SOLUTION 2: If user exists but is_approved = false
-- =====================================================
-- Run this to approve the user
UPDATE users 
SET is_approved = true
WHERE email = 'fisha.hafiz@moe.gov.my';

-- =====================================================
-- SOLUTION 3: Temporarily disable RLS for testing
-- =====================================================
-- WARNING: Only use this for debugging on localhost!
-- DO NOT run this in production!

-- Disable RLS (for testing only)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- After testing, re-enable it:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
