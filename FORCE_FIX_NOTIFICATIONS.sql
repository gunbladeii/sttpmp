-- =====================================================
-- FORCE FIX NOTIFICATIONS COLUMN ISSUE
-- =====================================================
-- This script will ensure notifications table only has 'type' column
-- and all triggers use the correct column name

-- Step 1: Drop ALL triggers on status_tracking
DROP TRIGGER IF EXISTS trigger_create_notification_on_status_change ON status_tracking CASCADE;
DROP TRIGGER IF EXISTS create_notification_on_status_change ON status_tracking CASCADE;
DROP TRIGGER IF EXISTS notify_status_change ON status_tracking CASCADE;

-- Step 2: Drop the trigger function if exists
DROP FUNCTION IF EXISTS create_notification_on_status_change() CASCADE;
DROP FUNCTION IF EXISTS notify_status_change() CASCADE;

-- Step 3: Fix notifications table column
DO $$ 
BEGIN
  -- If notification_type exists, drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'notification_type'
  ) THEN
    ALTER TABLE notifications DROP COLUMN notification_type CASCADE;
  END IF;
  
  -- Ensure type column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE notifications 
    ADD COLUMN type TEXT NOT NULL DEFAULT 'status_update';
  END IF;
END $$;

-- Step 4: Create the trigger function with correct column name (type)
CREATE OR REPLACE FUNCTION create_notification_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  syor_record RECORD;
  target_user_id UUID;
  notification_title TEXT;
  notification_message TEXT;
  updater_name TEXT;
  syor_title TEXT;
BEGIN
  -- Get syor details with error handling
  BEGIN
    SELECT s.*, u.name as updater_name, s.title as syor_title
    INTO syor_record
    FROM syor s
    LEFT JOIN users u ON u.id = NEW.updated_by
    WHERE s.id = NEW.syor_id;

    updater_name := COALESCE(syor_record.updater_name, 'Pengguna');
    syor_title := COALESCE(syor_record.syor_title, 'Syor');

    -- Determine target user based on assignment
    IF NEW.department_id IS NOT NULL THEN
      SELECT id INTO target_user_id
      FROM users
      WHERE department_id = NEW.department_id
        AND role = 'penyelaras_bahagian'
      LIMIT 1;
    ELSIF NEW.jpn_id IS NOT NULL THEN
      SELECT id INTO target_user_id
      FROM users
      WHERE jpn_id = NEW.jpn_id
        AND role = 'penyelaras_jpn'
      LIMIT 1;
    END IF;

    -- If target user found and it's not the same person
    IF target_user_id IS NOT NULL AND target_user_id != NEW.updated_by THEN
      -- Determine notification message based on status
      IF NEW.status = 'selesai' THEN
        notification_title := 'Status Dikemas Kini: Selesai';
        notification_message := updater_name || ' telah menandakan syor "' || syor_title || '" sebagai selesai.';
      ELSIF NEW.status = 'dalam_tindakan' THEN
        notification_title := 'Status Dikemas Kini: Dalam Tindakan';
        notification_message := updater_name || ' telah mengemas kini status syor "' || syor_title || '" kepada dalam tindakan.';
      ELSE
        notification_title := 'Maklum Balas Baharu';
        notification_message := updater_name || ' telah mengemas kini syor "' || syor_title || '".';
      END IF;

      -- Insert notification using 'type' column (NOT notification_type)
      INSERT INTO notifications (
        user_id,
        syor_id,
        type,
        title,
        message
      ) VALUES (
        target_user_id,
        NEW.syor_id,
        'status_change',
        notification_title,
        notification_message
      );
    END IF;

  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to create notification: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Recreate the trigger
CREATE TRIGGER trigger_create_notification_on_status_change
  AFTER INSERT ON status_tracking
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_status_change();

-- Step 6: Verify notifications table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
