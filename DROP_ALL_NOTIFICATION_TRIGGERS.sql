-- =====================================================
-- ULTIMATE FIX: Drop ALL Old Notification Triggers
-- =====================================================

-- Step 1: List all triggers on status_tracking (for reference)
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'status_tracking';

-- Step 2: Drop ALL possible trigger names
DROP TRIGGER IF EXISTS trigger_create_notification_on_status_change ON status_tracking CASCADE;
DROP TRIGGER IF EXISTS create_notification_on_status_change ON status_tracking CASCADE;
DROP TRIGGER IF EXISTS notify_status_change ON status_tracking CASCADE;
DROP TRIGGER IF EXISTS status_tracking_notification_trigger ON status_tracking CASCADE;
DROP TRIGGER IF EXISTS trg_notify_status_change ON status_tracking CASCADE;

-- Step 3: Drop ALL possible function names that might insert with notification_type
DROP FUNCTION IF EXISTS create_notification_on_status_change() CASCADE;
DROP FUNCTION IF EXISTS notify_status_change() CASCADE;
DROP FUNCTION IF EXISTS create_status_notification() CASCADE;
DROP FUNCTION IF EXISTS notify_on_status_update() CASCADE;

-- Step 4: Clean up notifications table structure
DO $$ 
BEGIN
  -- Drop notification_type if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'notifications' 
    AND column_name = 'notification_type'
  ) THEN
    EXECUTE 'ALTER TABLE notifications DROP COLUMN notification_type CASCADE';
    RAISE NOTICE 'Dropped notification_type column';
  END IF;
  
  -- Ensure type column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'notifications' 
    AND column_name = 'type'
  ) THEN
    EXECUTE 'ALTER TABLE notifications ADD COLUMN type TEXT NOT NULL DEFAULT ''status_update''';
    RAISE NOTICE 'Created type column';
  ELSE
    RAISE NOTICE 'Type column already exists';
  END IF;
END $$;

-- Step 5: Verify no triggers remain on status_tracking
SELECT 
  'REMAINING TRIGGERS:' as info,
  trigger_name, 
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'status_tracking';

-- Step 6: Verify notifications table structure
SELECT 
  'NOTIFICATIONS COLUMNS:' as info,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'notifications'
ORDER BY ordinal_position;
