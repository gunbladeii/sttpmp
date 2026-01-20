-- =====================================================
-- FINAL FIX: Drop & Recreate BOTH Notification Functions
-- =====================================================

-- Step 1: Drop ALL notification-related triggers
DROP TRIGGER IF EXISTS trigger_create_notification_on_new_syor ON syor CASCADE;
DROP TRIGGER IF EXISTS trigger_create_notification_on_status_change ON status_tracking CASCADE;

-- Step 2: Drop ALL notification functions
DROP FUNCTION IF EXISTS create_notification_on_new_syor() CASCADE;
DROP FUNCTION IF EXISTS create_notification_on_status_change() CASCADE;

-- Step 3: Recreate create_notification_on_new_syor with correct column
CREATE OR REPLACE FUNCTION create_notification_on_new_syor()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  target_user_id UUID;
  creator_name TEXT;
BEGIN
  -- Get creator name
  SELECT name INTO creator_name
  FROM users
  WHERE id = NEW.created_by;
  
  creator_name := COALESCE(creator_name, 'Pengguna');

  -- Find target user based on assignment
  IF NEW.assigned_to_department IS NOT NULL THEN
    SELECT id INTO target_user_id
    FROM users
    WHERE department_id = NEW.assigned_to_department
      AND role = 'penyelaras_bahagian'
    LIMIT 1;
  ELSIF NEW.assigned_to_jpn IS NOT NULL THEN
    SELECT id INTO target_user_id
    FROM users
    WHERE jpn_id = NEW.assigned_to_jpn
      AND role = 'penyelaras_jpn'
    LIMIT 1;
  END IF;

  -- Create notification if target user exists
  IF target_user_id IS NOT NULL THEN
    BEGIN
      INSERT INTO notifications (
        user_id,
        syor_id,
        type,
        title,
        message
      ) VALUES (
        target_user_id,
        NEW.id,
        'new_syor',
        'Syor Baharu',
        creator_name || ' telah mencipta syor baharu: "' || NEW.title || '".'
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create notification: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 4: Recreate create_notification_on_status_change with correct column
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
      RAISE WARNING 'Failed to create notification: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 5: Recreate trigger on syor table
CREATE TRIGGER trigger_create_notification_on_new_syor
  AFTER INSERT ON syor
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_new_syor();

-- Step 6: Recreate trigger on status_tracking table
CREATE TRIGGER trigger_create_notification_on_status_change
  AFTER INSERT ON status_tracking
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_status_change();

-- Step 7: Verify all triggers
SELECT 
  'ALL TRIGGERS:' as status,
  event_object_table,
  trigger_name,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE '%notification%'
ORDER BY event_object_table, trigger_name;

-- Step 8: Final verification - no more notification_type
SELECT 
  'FUNCTIONS WITH notification_type:' as status,
  COUNT(*) as count
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND pg_get_functiondef(oid) ILIKE '%notification_type%';
