-- ============================================
-- Migration: Enable Multiple Assignments
-- Description: Allow one syor to be assigned to multiple departments OR multiple JPNs
-- Date: 2026-02-20
-- ============================================

-- STEP 1: Drop existing check_assignment constraint from syor table
-- This constraint prevents multiple assignments
ALTER TABLE syor 
DROP CONSTRAINT IF EXISTS check_assignment;

-- STEP 2: Make assigned_to_department and assigned_to_jpn nullable and deprecated
-- We will use status_tracking table for actual assignments now
COMMENT ON COLUMN syor.assigned_to_department IS 'DEPRECATED: Use status_tracking table for assignments. Kept for backward compatibility.';
COMMENT ON COLUMN syor.assigned_to_jpn IS 'DEPRECATED: Use status_tracking table for assignments. Kept for backward compatibility.';

-- STEP 3: Add UNIQUE constraint to status_tracking to prevent duplicate assignments
-- Ensures one syor can't be assigned to the same department/jpn twice
ALTER TABLE status_tracking 
ADD CONSTRAINT unique_syor_department 
UNIQUE (syor_id, department_id);

ALTER TABLE status_tracking 
ADD CONSTRAINT unique_syor_jpn 
UNIQUE (syor_id, jpn_id);

-- STEP 4: Update the check_tracking_assignment constraint to be more flexible
-- Still ensures each tracking record has either department OR jpn, but not both
-- (This constraint remains the same, it's already correct)

-- STEP 5: Add index for better query performance on multiple assignments
CREATE INDEX IF NOT EXISTS idx_status_tracking_syor_department 
ON status_tracking(syor_id, department_id) 
WHERE department_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_status_tracking_syor_jpn 
ON status_tracking(syor_id, jpn_id) 
WHERE jpn_id IS NOT NULL;

-- ============================================
-- Verification Queries
-- ============================================

-- Check constraints on syor table
SELECT con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'syor';

-- Check constraints on status_tracking table
SELECT con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'status_tracking';

-- Check indexes on status_tracking
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'status_tracking';
