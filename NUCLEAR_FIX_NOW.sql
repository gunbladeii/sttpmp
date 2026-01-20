-- =====================================================
-- NUCLEAR FIX: Force Replace Function & Trigger
-- =====================================================
-- This will COMPLETELY remove and recreate everything

-- Step 1: Drop trigger (force)
DROP TRIGGER IF EXISTS trigger_create_notification_on_status_change ON status_tracking CASCADE;

-- Step 2: Drop function (force with CASCADE to remove all dependencies)
DROP FUNCTION IF EXISTS create_notification_on_status_change() CASCADE;

-- Step 3: Verify function is gone
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'create_notification_on_status_change'
  ) THEN
    RAISE EXCEPTION 'Function still exists! Manual intervention needed.';
  ELSE
    RAISE NOTICE 'Function successfully dropped ✓';
  END IF;
END $$;

-- Step 4: Create BRAND NEW function with correct column name (type)
CREATE OR REPLACE FUNCTION create_notification_on_status_change()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  target_user_id UUID;
  notification_title TEXT;
  notification_message TEXT;
  updater_name TEXT;
  syor_title TEXT;
BEGIN
  -- Get updater name
  SELECT name INTO updater_name
  FROM users
  WHERE id = NEW.updated_by;
  
  updater_name := COALESCE(updater_name, 'Pengguna');

  -- Get syor title
  SELECT title INTO syor_title
  FROM syor
  WHERE id = NEW.syor_id;
  
  syor_title := COALESCE(syor_title, 'Syor');

  -- Find target user
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

  -- Create notification if target user exists and is different
  IF target_user_id IS NOT NULL AND target_user_id != NEW.updated_by THEN
    -- Build message based on status
    IF NEW.status = 'selesai' THEN
      notification_title := 'Status Selesai';
      notification_message := updater_name || ' telah selesaikan syor "' || syor_title || '".';
    ELSIF NEW.status = 'dalam_tindakan' THEN
      notification_title := 'Dalam Tindakan';
      notification_message := updater_name || ' sedang ambil tindakan pada syor "' || syor_title || '".';
    ELSE
      notification_title := 'Status Dikemaskini';
      notification_message := updater_name || ' telah kemaskini syor "' || syor_title || '".';
    END IF;

    -- INSERT using 'type' column (NOT notification_type)
    BEGIN
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
    EXCEPTION WHEN OTHERS THEN
      -- Don't fail the transaction if notification fails
      RAISE WARNING 'Notification insert failed: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 5: Recreate trigger
CREATE TRIGGER trigger_create_notification_on_status_change
  AFTER INSERT ON status_tracking
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_status_change();

-- Step 6: Verify setup
SELECT 
  'VERIFICATION:' as status,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_create_notification_on_status_change';

-- Step 7: Final check - ensure type column exists
SELECT 
  'FINAL CHECK:' as status,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'notifications'
  AND column_name IN ('type', 'notification_type')
ORDER BY column_name;
