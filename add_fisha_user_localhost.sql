-- ===============================================
-- ADD USER: fisha.hafiz@moe.gov.my TO LOCALHOST
-- ===============================================
-- Run this in Supabase SQL Editor for your LOCAL development database
-- This will create the user account so you can login on localhost

-- Step 1: Insert into users table (use existing department/jpn IDs from your local DB)
INSERT INTO users (
  email,
  name,
  role,
  password,
  department_id,
  jpn_id,
  is_approved,
  approval_status,
  created_at,
  updated_at
) VALUES (
  'fisha.hafiz@moe.gov.my',
  'Fisha Hafiz',
  'admin', -- Change to appropriate role: 'admin', 'penyelaras_jnn', 'pegawai_jpn', 'pegawai_jabatan'
  '$2a$10$YourHashedPasswordHere', -- This is a placeholder
  (SELECT id FROM departments LIMIT 1), -- Use actual department_id
  (SELECT id FROM jpn LIMIT 1), -- Use actual jpn_id
  true,
  'approved',
  NOW(),
  NOW()
);

-- Step 2: Create auth user in Supabase Auth
-- NOTE: You need to do this via Supabase Dashboard > Authentication > Users
-- Click "Add User" and enter:
-- - Email: fisha.hafiz@moe.gov.my
-- - Password: (your password)
-- - Email Confirm: YES (enable this)

-- OR use this SQL if you have access (requires admin privileges):
-- This creates the auth.users record
/*
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'fisha.hafiz@moe.gov.my',
  crypt('YourPasswordHere', gen_salt('bf')), -- Replace with actual password
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);
*/

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================
-- Check if user exists
SELECT id, email, name, role, is_approved, approval_status 
FROM users 
WHERE email = 'fisha.hafiz@moe.gov.my';

-- Check departments (to get correct department_id)
SELECT id, name, code FROM departments ORDER BY name;

-- Check JPNs (to get correct jpn_id)
SELECT id, name, state FROM jpn ORDER BY name;
