-- =====================================================================
-- STEP 1: Add 'penyelaras_jnn' to user_role enum type
-- RUN THIS FIRST, THEN RUN STEP 2 IN A SEPARATE QUERY
-- =====================================================================

-- Add new enum value
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'penyelaras_jnn';

-- Verify the enum value was added
SELECT 
    enumlabel as role_value
FROM pg_enum
WHERE enumtypid = 'user_role'::regtype
ORDER BY enumsortorder;
