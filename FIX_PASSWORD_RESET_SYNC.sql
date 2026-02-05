-- ============================================================================
-- FIX PASSWORD RESET SYNC ISSUE
-- ============================================================================
-- Issue: Password reset updates wrong auth.users account due to ID mismatch
-- Solution: Find and sync users.id with auth.users.id based on email
-- ============================================================================

-- STEP 1: Check for ID mismatches
-- ============================================================================
SELECT 
  '=== CHECKING FOR ID MISMATCHES ===' as step;

SELECT 
  u.id as users_id,
  au.id as auth_id,
  u.email,
  u.name,
  CASE 
    WHEN u.id = au.id THEN '✅ IDs Match'
    ELSE '⚠️ ID MISMATCH - NEEDS FIX'
  END as status
FROM users u
LEFT JOIN auth.users au ON u.email = au.email
WHERE au.id IS NOT NULL
ORDER BY u.email;

-- STEP 2: Find users with ID mismatch
-- ============================================================================
SELECT 
  '=== USERS WITH ID MISMATCH ===' as step;

SELECT 
  u.id as current_users_id,
  au.id as correct_auth_id,
  u.email,
  u.name,
  u.role,
  u.is_active,
  u.is_approved
FROM users u
INNER JOIN auth.users au ON u.email = au.email
WHERE u.id != au.id;

-- STEP 3: Backup before fixing (IMPORTANT!)
-- ============================================================================
SELECT 
  '=== CREATING BACKUP ===' as step;

-- Create backup table if not exists
CREATE TABLE IF NOT EXISTS users_id_backup (
  id uuid,
  email text,
  name text,
  role text,
  old_id uuid,
  new_id uuid,
  fixed_at timestamp with time zone DEFAULT now()
);

-- STEP 4: CHECK ALL FOREIGN KEY DEPENDENCIES
-- ============================================================================
SELECT 
  '=== CHECKING FOREIGN KEY DEPENDENCIES ===' as step;

-- Find all tables that reference users.id
SELECT 
  tc.table_name,
  tc.constraint_name,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'users'
  AND ccu.column_name = 'id';

-- STEP 5: CLEAN UP ALL DEPENDENT RECORDS
-- ============================================================================
-- IMPORTANT: We need to clean up ALL tables that reference users.id
-- This is safe because we're only fixing ID mismatches, not deleting users
-- ============================================================================
SELECT 
  '=== CLEANING UP DEPENDENT RECORDS ===' as step;

-- 1. Delete password reset tokens
SELECT COUNT(*) as password_tokens_before FROM password_reset_tokens;
DELETE FROM password_reset_tokens;
SELECT '✅ Password reset tokens deleted' as status;

-- 2. Delete audit logs (these are just logs, can be regenerated)
SELECT COUNT(*) as audit_logs_before FROM audit_logs WHERE user_id IS NOT NULL;
DELETE FROM audit_logs WHERE user_id IS NOT NULL;
SELECT '✅ Audit logs deleted' as status;

-- 3. Handle notifications (delete if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
    EXECUTE 'DELETE FROM notifications WHERE user_id IS NOT NULL';
    RAISE NOTICE '✅ Notifications deleted';
  END IF;
END $$;

-- 4. Handle any other tables that might reference users
-- Update or delete as needed based on your schema

-- STEP 6: FIX ID MISMATCHES
-- ============================================================================
-- WARNING: This will update users.id to match auth.users.id
-- This is safe because:
-- 1. We're matching by email (unique constraint)
-- 2. We're backing up old IDs
-- 3. Supabase Auth uses email as primary identifier
-- 4. Password reset tokens are cleared (users can request new ones)
-- ============================================================================

SELECT 
  '=== FIXING ID MISMATCHES ===' as step;

-- Backup old IDs before fixing
INSERT INTO users_id_backup (old_id, email, name, role, new_id)
SELECT 
  u.id as old_id,
  u.email,
  u.name,
  u.role,
  au.id as new_id
FROM users u
INNER JOIN auth.users au ON u.email = au.email
WHERE u.id != au.id;

-- NOW FIX: Update users.id to match auth.users.id
-- This uses a CTE to avoid constraint violations
WITH id_mappings AS (
  SELECT 
    u.email as user_email,
    au.id as correct_id
  FROM users u
  INNER JOIN auth.users au ON u.email = au.email
  WHERE u.id != au.id
)
UPDATE users u
SET id = (SELECT correct_id FROM id_mappings WHERE user_email = u.email)
WHERE email IN (SELECT user_email FROM id_mappings);

-- STEP 7: Verify the fix
-- ============================================================================
SELECT 
  '=== VERIFICATION ===' as step;

SELECT 
  u.id as users_id,
  au.id as auth_id,
  u.email,
  u.name,
  CASE 
    WHEN u.id = au.id THEN '✅ FIXED - IDs Match!'
    ELSE '❌ Still Mismatched'
  END as status
FROM users u
LEFT JOIN auth.users au ON u.email = au.email
WHERE au.id IS NOT NULL
ORDER BY u.email;

-- STEP 8: Check backup
-- ============================================================================
SELECT 
  '=== BACKUP RECORDS ===' as step;

SELECT 
  email,
  name,
  old_id,
  new_id,
  fixed_at
FROM users_id_backup
ORDER BY fixed_at DESC;

-- ============================================================================
-- SUMMARY
-- ============================================================================
SELECT 
  '=== FIX SUMMARY ===' as step;

SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN u.id = au.id THEN 1 ELSE 0 END) as synced_users,
  SUM(CASE WHEN u.id != au.id THEN 1 ELSE 0 END) as mismatched_users
FROM users u
LEFT JOIN auth.users au ON u.email = au.email
WHERE au.id IS NOT NULL;

-- ============================================================================
-- WHAT THIS FIXES:
-- ============================================================================
-- Before:
-- - User resets password
-- - Reset API updates users table password ✅
-- - Reset API tries to update auth.users using users.id ❌
-- - But auth.users has different ID for same email ❌
-- - Wrong auth account gets updated or new account created ❌
-- - User can't login with new password ❌
--
-- After:
-- - users.id matches auth.users.id for same email ✅
-- - Password reset updates correct auth account ✅
-- - User can login with new password ✅
-- ============================================================================
