-- Delete user from Supabase Auth table
-- Run this in Supabase SQL Editor if user exists in auth but not in users table

-- First, check if user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'jnjk.maklumat@moe.gov.my';

-- If user exists, delete using admin function
-- Note: This requires service_role or admin privileges
-- DELETE FROM auth.users WHERE email = 'jnjk.maklumat@moe.gov.my';
