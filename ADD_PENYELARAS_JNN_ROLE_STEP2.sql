-- =====================================================================
-- STEP 2: Update constraint to allow penyelaras_jnn with jpn_id
-- RUN THIS AFTER STEP 1 IS SUCCESSFULLY COMPLETED
-- =====================================================================

-- Drop existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_role_assignment;

-- Add updated constraint that includes penyelaras_jnn
ALTER TABLE users ADD CONSTRAINT check_role_assignment CHECK (
    role IS NULL OR -- Allow NULL for pending approval users
    (role = 'admin' AND department_id IS NULL AND jpn_id IS NULL) OR
    (role = 'peneraju_pemeriksaan' AND department_id IS NULL AND jpn_id IS NULL) OR
    (role = 'penyelaras_bahagian' AND department_id IS NOT NULL AND jpn_id IS NULL) OR
    (role = 'penyelaras_jpn' AND department_id IS NULL AND jpn_id IS NOT NULL) OR
    (role = 'penyelaras_jnn' AND department_id IS NULL AND jpn_id IS NOT NULL) OR -- New role with JPN assignment (READ-ONLY)
    (role = 'pemantau')
);

-- Add comment to document the role
COMMENT ON TYPE user_role IS 'User roles: admin (full access), peneraju_pemeriksaan (sector lead with edit), penyelaras_bahagian (department coordinator with edit), penyelaras_jpn (state coordinator with edit), penyelaras_jnn (state coordinator READ-ONLY), pemantau (viewer only)';

-- Verify the constraint was updated
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass 
AND conname = 'check_role_assignment';
