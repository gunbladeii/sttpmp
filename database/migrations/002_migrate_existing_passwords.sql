-- Migration: Hash Existing User Passwords
-- Created: 2025-12-01
-- Description: Set temporary password for users without password_hash
-- This allows existing users to use "forgot password" to reset their accounts

-- =====================================================
-- IMPORTANT: Run this AFTER 001_security_fixes.sql
-- =====================================================

-- For all users that DON'T have a password_hash yet,
-- we'll set a RANDOM unguessable hash so they MUST use forgot password
-- This is more secure than setting a default password

UPDATE auth.users 
SET encrypted_password = crypt(gen_random_uuid()::text, gen_salt('bf', 10))
WHERE id IN (
  SELECT id FROM users 
  WHERE password_hash IS NULL 
  OR password_hash = ''
);

-- Update users table to mark that password reset is needed
-- Add a column to track if user needs password reset
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT false;

-- Mark all users without password_hash as needing reset
UPDATE users 
SET password_reset_required = true
WHERE password_hash IS NULL OR password_hash = '';

-- =====================================================
-- Create function to update user password
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_password(
  user_id UUID,
  new_password_hash TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET 
    password_hash = new_password_hash,
    password_reset_required = false,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to see how many users need password reset:
-- SELECT COUNT(*) as users_need_reset FROM users WHERE password_reset_required = true;
