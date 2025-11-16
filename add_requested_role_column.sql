-- Add requested_role column to users table for admin reference during approval

-- Add column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                WHERE table_name='users' AND column_name='requested_role') THEN
    ALTER TABLE users ADD COLUMN requested_role TEXT;
  END IF;
END $$;

-- Add comment to describe purpose
COMMENT ON COLUMN users.requested_role IS 'Role requested by user during registration for admin reference. Valid values: penyelaras_bahagian, penyelaras_jpn, penyelaras_jnn, peneraju_pemeriksaan';

-- Verify column added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'requested_role';
