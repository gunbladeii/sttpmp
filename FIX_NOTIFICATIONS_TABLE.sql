-- Fix notifications table schema to match application code
-- Run this in Supabase SQL Editor

-- Step 1: Drop existing constraints and policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Step 2: Rename column from is_read to read (if exists)
DO $$ 
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns 
            WHERE table_name='notifications' AND column_name='is_read') THEN
    ALTER TABLE notifications RENAME COLUMN is_read TO read;
  END IF;
END $$;

-- Step 3: Make syor_id nullable (for system notifications)
ALTER TABLE notifications ALTER COLUMN syor_id DROP NOT NULL;

-- Step 4: Update notification_type constraint to include new types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_notification_type_check;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add column 'type' if it doesn't exist, otherwise rename notification_type to type
DO $$ 
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns 
            WHERE table_name='notifications' AND column_name='notification_type') THEN
    ALTER TABLE notifications RENAME COLUMN notification_type TO type;
  END IF;
  
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                WHERE table_name='notifications' AND column_name='type') THEN
    ALTER TABLE notifications ADD COLUMN type TEXT;
  END IF;
END $$;

-- Update existing data to match new notification types
UPDATE notifications 
SET type = CASE 
  WHEN type = 'new_comment' THEN 'status_update'
  WHEN type = 'status_change' THEN 'status_update'
  WHEN type = 'new_response' THEN 'status_update'
  WHEN type = 'new_syor' THEN 'new_syor'
  WHEN type = 'deadline' THEN 'deadline'
  WHEN type = 'overdue' THEN 'overdue'
  WHEN type = 'system' THEN 'system'
  ELSE 'system'
END
WHERE type IS NOT NULL;

-- Add CHECK constraint for notification types
ALTER TABLE notifications 
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('deadline', 'status_update', 'new_syor', 'system', 'overdue'));

-- Step 5: Recreate RLS policies with correct column names
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Step 6: Update indexes
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_notifications_user_unread;

CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;

-- Step 7: Verify table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Expected columns:
-- id, user_id, syor_id (nullable), type, title, message, read, created_at, created_by, metadata
