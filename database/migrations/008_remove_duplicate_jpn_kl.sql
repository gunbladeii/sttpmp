-- ============================================
-- Migration: Remove Duplicate JPN Kuala Lumpur
-- Description: Remove duplicate "JPN Kuala Lumpur" entry, keep only "JPN W.P Kuala Lumpur"
-- Date: 2026-02-20
-- Issue: Two entries for Kuala Lumpur causing confusion in UI
-- ============================================

-- STEP 1: Check for duplicates
SELECT 
  'BEFORE CLEANUP - JPN Kuala Lumpur entries:' as info,
  id, name, state
FROM jpn 
WHERE name ILIKE '%kuala lumpur%'
ORDER BY name;

-- STEP 2: If there are users/syor assigned to old "JPN Kuala Lumpur", migrate them to "JPN W.P Kuala Lumpur"
-- Update users table
UPDATE users 
SET jpn_id = (SELECT id FROM jpn WHERE name = 'JPN W.P Kuala Lumpur')
WHERE jpn_id = (SELECT id FROM jpn WHERE name = 'JPN Kuala Lumpur');

-- Update syor table (deprecated columns, but still in use for legacy data)
UPDATE syor 
SET assigned_to_jpn = (SELECT id FROM jpn WHERE name = 'JPN W.P Kuala Lumpur')
WHERE assigned_to_jpn = (SELECT id FROM jpn WHERE name = 'JPN Kuala Lumpur');

-- Update status_tracking table
UPDATE status_tracking 
SET jpn_id = (SELECT id FROM jpn WHERE name = 'JPN W.P Kuala Lumpur')
WHERE jpn_id = (SELECT id FROM jpn WHERE name = 'JPN Kuala Lumpur');

-- STEP 3: Delete the duplicate entry
DELETE FROM jpn 
WHERE name = 'JPN Kuala Lumpur' 
AND state = 'Kuala Lumpur';

-- STEP 4: Verify cleanup
SELECT 
  'AFTER CLEANUP - JPN Kuala Lumpur entries:' as info,
  id, name, state
FROM jpn 
WHERE name ILIKE '%kuala lumpur%'
ORDER BY name;

-- STEP 5: List all JPN for verification (should be 16 total)
SELECT 
  'ALL JPN ENTRIES (Total):' as info,
  COUNT(*) as total_jpn
FROM jpn;

SELECT 
  name, state
FROM jpn
ORDER BY name;

-- Expected result: Only "JPN W.P Kuala Lumpur" should remain
-- Total JPN count: 16 (14 states + 3 Wilayah Persekutuan)
