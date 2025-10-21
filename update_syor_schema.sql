-- Update syor table to ensure all required fields exist
-- Run this in Supabase SQL Editor

-- Add endorsement_date field if it doesn't exist (tarikh syor)
ALTER TABLE syor ADD COLUMN IF NOT EXISTS endorsement_date DATE;

-- Update description field to support longer content (for rich text syor content)
ALTER TABLE syor ALTER COLUMN description TYPE TEXT;

-- Ensure proper constraints exist
ALTER TABLE syor ADD CONSTRAINT check_assignment 
CHECK (
  (assigned_to_department IS NOT NULL AND assigned_to_jpn IS NULL) OR
  (assigned_to_department IS NULL AND assigned_to_jpn IS NOT NULL)
);

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_syor_endorsement_date ON syor(endorsement_date);
CREATE INDEX IF NOT EXISTS idx_syor_assigned_department ON syor(assigned_to_department);
CREATE INDEX IF NOT EXISTS idx_syor_assigned_jpn ON syor(assigned_to_jpn);

COMMIT;