-- ===============================================
-- CHECK EXISTING USERS IN LOCALHOST DATABASE
-- ===============================================
-- Run this to see what users are available for testing

-- Show all users with their details
SELECT 
  id,
  email,
  name,
  role,
  is_approved,
  approval_status,
  created_at
FROM users
WHERE is_approved = true
  AND approval_status = 'approved'
ORDER BY created_at DESC;

-- If no users exist, you can add a test user:
-- This will create: test@moe.gov.my with password: Test123456!

-- Insert test user into users table
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
  'test@moe.gov.my',
  'Test User',
  'admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Password: Test123456!
  (SELECT id FROM departments LIMIT 1),
  (SELECT id FROM jpn LIMIT 1),
  true,
  'approved',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Then create auth user in Supabase Dashboard:
-- Email: test@moe.gov.my
-- Password: Test123456!
-- Confirm Email: YES
