-- =====================================================================
-- FIX: Update check_valid_roles constraint to include penyelaras_jnn
-- This constraint validates role values beyond the ENUM type
-- =====================================================================

-- Drop the old check_valid_roles constraint if exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_valid_roles;

-- Add updated constraint that includes penyelaras_jnn
ALTER TABLE users ADD CONSTRAINT check_valid_roles CHECK (
    role IS NULL OR 
    role IN ('admin', 'peneraju_pemeriksaan', 'penyelaras_bahagian', 'penyelaras_jpn', 'penyelaras_jnn', 'pemantau')
);

-- Verify the constraint was updated
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass 
AND conname = 'check_valid_roles';
