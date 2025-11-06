-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  syor_id UUID NOT NULL REFERENCES syor(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('new_comment', 'status_change', 'new_response', 'new_syor')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_syor_id ON notifications(syor_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: System can insert notifications for any user
CREATE POLICY "Authenticated users can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

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
BEGIN
  -- Get syor details
  SELECT s.*, u.name as updater_name, s.title as syor_title
  INTO syor_record
  FROM syor s
  LEFT JOIN users u ON u.id = NEW.updated_by
  WHERE s.id = NEW.syor_id;

  updater_name := syor_record.updater_name;
  syor_title := syor_record.syor_title;

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

  -- If target user found and it's not the same person who made the change
  IF target_user_id IS NOT NULL AND target_user_id != NEW.updated_by THEN
    -- Determine notification type and message
    IF NEW.status = 'selesai' THEN
      notification_title := 'Status Dikemas Kini: Selesai';
      notification_message := updater_name || ' telah menandakan syor "' || syor_title || '" sebagai selesai.';
    ELSIF NEW.status = 'dalam_tindakan' THEN
      notification_title := 'Status Dikemas Kini: Dalam Tindakan';
      notification_message := updater_name || ' telah mengemas kini status syor "' || syor_title || '" kepada dalam tindakan.';
    ELSIF NEW.status = 'belum_selesai' THEN
      notification_title := 'Status Dikemas Kini: Belum Selesai';
      notification_message := updater_name || ' telah mengemas kini status syor "' || syor_title || '".';
    ELSE
      notification_title := 'Maklum Balas Baharu';
      notification_message := updater_name || ' telah menambah maklum balas kepada syor "' || syor_title || '".';
    END IF;

    -- Insert notification
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

  -- Also notify admin/peneraju if the updater is penyelaras
  IF NEW.updated_by IS NOT NULL THEN
    DECLARE
      updater_role TEXT;
      admin_user_id UUID;
    BEGIN
      SELECT role INTO updater_role FROM users WHERE id = NEW.updated_by;
      
      -- If updater is penyelaras, notify admin/peneraju
      IF updater_role IN ('penyelaras_bahagian', 'penyelaras_jpn') THEN
        -- Get admin or peneraju who created the syor
        SELECT created_by INTO admin_user_id FROM syor WHERE id = NEW.syor_id;
        
        IF admin_user_id IS NOT NULL AND admin_user_id != NEW.updated_by THEN
          INSERT INTO notifications (
            user_id,
            syor_id,
            notification_type,
            title,
            message,
            created_by,
            metadata
          ) VALUES (
            admin_user_id,
            NEW.syor_id,
            'new_response',
            'Respons Baharu dari Penyelaras',
            updater_name || ' telah memberi respons kepada syor "' || syor_title || '".',
            NEW.updated_by,
            jsonb_build_object(
              'status', NEW.status,
              'weight', NEW.weight,
              'comments', NEW.comments
            )
          );
        END IF;
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on status_tracking table
DROP TRIGGER IF EXISTS trigger_create_notification_on_status_change ON status_tracking;
CREATE TRIGGER trigger_create_notification_on_status_change
  AFTER INSERT ON status_tracking
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_status_change();

-- Function to create notification when new syor is created
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

  -- If target user found
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

-- Create trigger on syor table
DROP TRIGGER IF EXISTS trigger_create_notification_on_new_syor ON syor;
CREATE TRIGGER trigger_create_notification_on_new_syor
  AFTER INSERT ON syor
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_new_syor();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT USAGE ON SEQUENCE notifications_id_seq TO authenticated;

COMMENT ON TABLE notifications IS 'Stores notifications for users about syor updates';
COMMENT ON COLUMN notifications.notification_type IS 'Type of notification: new_comment, status_change, new_response, new_syor';
COMMENT ON COLUMN notifications.metadata IS 'Additional JSON data related to the notification';
