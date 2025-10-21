-- Fix role assignment constraint issues
-- Run this in Supabase SQL Editor

-- First, let's see what constraints exist
-- You can run this to check: SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'users';

-- Drop the problematic role assignment constraint if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_role_assignment;

-- Create a simpler role constraint that just validates role values
ALTER TABLE users ADD CONSTRAINT check_valid_roles 
CHECK (role IN ('pemantau', 'penyelaras_bahagian', 'penyelaras_jpn', 'peneraju_pemeriksaan', 'admin'));

-- Ensure department_id and jpn_id can be null for flexibility
ALTER TABLE users ALTER COLUMN department_id DROP NOT NULL;
ALTER TABLE users ALTER COLUMN jpn_id DROP NOT NULL;

-- Update any users that might be causing issues by clearing their department/jpn assignments temporarily
UPDATE users SET department_id = NULL, jpn_id = NULL WHERE role IN ('pemantau', 'admin');

-- Commit the changes
COMMIT;