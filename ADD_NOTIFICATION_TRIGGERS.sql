-- ============================================
-- NOTIFICATION TRIGGERS - Auto-create notifications
-- Run this AFTER creating notifications table
-- ============================================

-- Function to automatically create notifications when status_tracking is inserted
CREATE OR REPLACE FUNCTION create_notification_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  syor_record RECORD;
  target_user_id UUID;
  notification_title TEXT;
  notification_message TEXT;
  updater_name TEXT;
  syor_title TEXT;
  updater_role TEXT;
  creator_user_id UUID;
BEGIN
  -- Get syor details and updater info
  SELECT 
    s.*,
    u.name as updater_name,
    u.role as updater_role,
    s.title as syor_title,
    s.created_by as creator_id
  INTO syor_record
  FROM syor s
  LEFT JOIN users u ON u.id = NEW.updated_by
  WHERE s.id = NEW.syor_id;

  updater_name := syor_record.updater_name;
  updater_role := syor_record.updater_role;
  syor_title := syor_record.syor_title;
  creator_user_id := syor_record.creator_id;

  -- SCENARIO 1: Notify Penyelaras when Admin/Peneraju adds comment
  IF updater_role IN ('admin', 'peneraju_pemeriksaan') THEN
    -- Determine target user based on assignment
    IF NEW.department_id IS NOT NULL THEN
      -- Find penyelaras for this department
      SELECT id INTO target_user_id
      FROM users
      WHERE department_id = NEW.department_id
        AND role = 'penyelaras_bahagian'
      LIMIT 1;
    ELSIF NEW.jpn_id IS NOT NULL THEN
      -- Find penyelaras for this JPN
      SELECT id INTO target_user_id
      FROM users
      WHERE jpn_id = NEW.jpn_id
        AND role = 'penyelaras_jpn'
      LIMIT 1;
    END IF;

    -- Create notification if target user found and it's not the same person
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
        notification_message := updater_name || ' telah menambah maklum balas: "' || COALESCE(SUBSTRING(NEW.comments, 1, 100), '') || '"';
      END IF;

      -- Insert notification for Penyelaras
      INSERT INTO notifications (
        user_id,
        syor_id,
        notification_type,
        title,
        message,
        created_by,
        metadata
      ) VALUES (
        target_user_id,
        NEW.syor_id,
        'new_comment',
        notification_title,
        notification_message,
        NEW.updated_by,
        jsonb_build_object(
          'status', NEW.status,
          'weight', NEW.weight,
          'comments', NEW.comments
        )
      );
    END IF;
  END IF;

  -- SCENARIO 2: Notify Admin/Peneraju when Penyelaras responds
  IF updater_role IN ('penyelaras_bahagian', 'penyelaras_jpn') THEN
    -- Notify the creator (admin/peneraju who created the syor)
    IF creator_user_id IS NOT NULL AND creator_user_id != NEW.updated_by THEN
      notification_title := 'Respons Baharu dari Penyelaras';
      notification_message := updater_name || ' telah memberi respons kepada syor "' || syor_title || '": "' || COALESCE(SUBSTRING(NEW.comments, 1, 100), '') || '"';

      INSERT INTO notifications (
        user_id,
        syor_id,
        notification_type,
        title,
        message,
        created_by,
        metadata
      ) VALUES (
        creator_user_id,
        NEW.syor_id,
        'new_response',
        notification_title,
        notification_message,
        NEW.updated_by,
        jsonb_build_object(
          'status', NEW.status,
          'weight', NEW.weight,
          'comments', NEW.comments
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trigger_create_notification_on_status_change ON status_tracking;

-- Create trigger on status_tracking table
CREATE TRIGGER trigger_create_notification_on_status_change
  AFTER INSERT ON status_tracking
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_status_change();

-- Function to create notification when new syor is assigned
CREATE OR REPLACE FUNCTION create_notification_on_new_syor()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  creator_name TEXT;
BEGIN
  -- Get creator name
  SELECT name INTO creator_name FROM users WHERE id = NEW.created_by;

  -- Determine target user based on assignment
  IF NEW.assigned_to_department IS NOT NULL THEN
    -- Find penyelaras for this department
    SELECT id INTO target_user_id
    FROM users
    WHERE department_id = NEW.assigned_to_department
      AND role = 'penyelaras_bahagian'
    LIMIT 1;
  ELSIF NEW.assigned_to_jpn IS NOT NULL THEN
    -- Find penyelaras for this JPN
    SELECT id INTO target_user_id
    FROM users
    WHERE jpn_id = NEW.assigned_to_jpn
      AND role = 'penyelaras_jpn'
    LIMIT 1;
  END IF;

  -- Create notification if target user found
  IF target_user_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      syor_id,
      notification_type,
      title,
      message,
      created_by,
      metadata
    ) VALUES (
      target_user_id,
      NEW.id,
      'new_syor',
      'Syor Baharu Ditugaskan',
      creator_name || ' telah menugaskan syor baharu kepada anda: "' || NEW.title || '".',
      NEW.created_by,
      jsonb_build_object(
        'priority', NEW.priority,
        'due_date', NEW.due_date
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trigger_create_notification_on_new_syor ON syor;

-- Create trigger on syor table
CREATE TRIGGER trigger_create_notification_on_new_syor
  AFTER INSERT ON syor
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_new_syor();

-- Success message
SELECT 'Notification triggers created successfully!' as status;
