-- Add fisha.hafiz@moe.gov.my to users table
-- Run this in Supabase SQL Editor

INSERT INTO users (email, name, role, is_active, is_approved) VALUES
('fisha.hafiz@moe.gov.my', 'Fisha Hafiz', 'admin', true, true);

-- Verify user was added
SELECT * FROM users WHERE email = 'fisha.hafiz@moe.gov.my';