-- Fix: Allow NULL values for role column during registration
-- Users will have NULL role until admin assigns role during approval

-- Step 1: Drop the existing constraint that requires role assignment based on org
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_role_assignment;

-- Step 2: Make role column nullable
ALTER TABLE users ALTER COLUMN role DROP NOT NULL;

-- Step 3: Remove default value for role (no auto-assignment)
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;

-- Step 4: Add updated constraint that allows NULL role (for pending users)
-- Constraint only applies when role IS NOT NULL (approved users)
ALTER TABLE users ADD CONSTRAINT check_role_assignment CHECK (
    role IS NULL OR -- Allow NULL for pending approval users
    (role = 'admin' AND department_id IS NULL AND jpn_id IS NULL) OR
    (role = 'peneraju_pemeriksaan' AND department_id IS NULL AND jpn_id IS NULL) OR
    (role = 'penyelaras_bahagian' AND department_id IS NOT NULL AND jpn_id IS NULL) OR
    (role = 'penyelaras_jpn' AND department_id IS NULL AND jpn_id IS NOT NULL) OR
    (role = 'pemantau')
);

-- Verify the changes
SELECT 
    column_name,
    is_nullable,
    column_default,
    data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role';
