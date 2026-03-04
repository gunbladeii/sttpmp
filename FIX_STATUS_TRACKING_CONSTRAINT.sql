-- Fix check_tracking_assignment constraint
-- Allow admin/peneraju_pemeriksaan to insert records without department_id or jpn_id
-- (They don't belong to any specific department/JPN but still need to add maklum balas)

ALTER TABLE status_tracking
DROP CONSTRAINT IF EXISTS check_tracking_assignment;

ALTER TABLE status_tracking
ADD CONSTRAINT check_tracking_assignment CHECK (
    -- penyelaras_bahagian: has department, no JPN
    (department_id IS NOT NULL AND jpn_id IS NULL)
    OR
    -- penyelaras_jpn: has JPN, no department
    (department_id IS NULL AND jpn_id IS NOT NULL)
    OR
    -- admin/peneraju_pemeriksaan: neither department nor JPN (central roles)
    (department_id IS NULL AND jpn_id IS NULL)
);
