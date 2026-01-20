-- =====================================================
-- FIX RLS POLICY FOR status_tracking TABLE
-- =====================================================
-- Issue: "new row violates row-level security policy"
-- Root cause: RLS policies terlalu restrictive atau tidak wujud

-- Step 1: Temporarily disable trigger that causes notification error
DROP TRIGGER IF EXISTS trigger_create_notification_on_status_change ON status_tracking;

-- Step 2: Drop existing RLS policies (force drop all variations)
DROP POLICY IF EXISTS "Users can view status tracking" ON status_tracking;
DROP POLICY IF EXISTS "Users can insert status tracking" ON status_tracking;
DROP POLICY IF EXISTS "Users can update status tracking" ON status_tracking;
DROP POLICY IF EXISTS "Users can delete status tracking" ON status_tracking;
DROP POLICY IF EXISTS "Enable read access for all users" ON status_tracking;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON status_tracking;
DROP POLICY IF EXISTS "Enable update for own records or admins" ON status_tracking;
DROP POLICY IF EXISTS "Enable delete for admins" ON status_tracking;

-- Step 3: Create comprehensive RLS policies

-- SELECT: Everyone can view
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'status_tracking' 
    AND policyname = 'Enable read access for all users'
  ) THEN
    EXECUTE 'CREATE POLICY "Enable read access for all users" 
    ON status_tracking FOR SELECT 
    USING (true)';
  END IF;
END $$;

-- INSERT: Authenticated users can insert
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'status_tracking' 
    AND policyname = 'Enable insert for authenticated users'
  ) THEN
    EXECUTE 'CREATE POLICY "Enable insert for authenticated users" 
    ON status_tracking FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL)';
  END IF;
END $$;

-- UPDATE: Users can update their own records OR admins can update any
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'status_tracking' 
    AND policyname = 'Enable update for own records or admins'
  ) THEN
    EXECUTE 'CREATE POLICY "Enable update for own records or admins" 
    ON status_tracking FOR UPDATE 
    USING (
      auth.uid() = updated_by OR
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN (''admin'', ''peneraju_pemeriksaan'')
      )
    )';
  END IF;
END $$;

-- DELETE: Admins and Peneraju can delete, or user who created the record
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'status_tracking' 
    AND policyname = 'Enable delete for admins'
  ) THEN
    EXECUTE 'CREATE POLICY "Enable delete for admins" 
    ON status_tracking FOR DELETE 
    USING (
      -- Allow if user is admin or peneraju
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN (''admin'', ''peneraju_pemeriksaan'')
      )
      OR
      -- Allow if user created this record
      auth.uid() = updated_by
    )';
  END IF;
END $$;

-- Step 4: Fix notifications table structure (if needed)
-- Ensure type column exists and notification_type is removed
DO $$ 
BEGIN
  -- Check if both columns exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'notification_type'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'type'
  ) THEN
    -- Both exist, drop notification_type column
    ALTER TABLE notifications DROP COLUMN notification_type;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'notification_type'
  ) THEN
    -- Only notification_type exists, rename to type
    ALTER TABLE notifications RENAME COLUMN notification_type TO type;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'type'
  ) THEN
    -- Neither exists, create type column
    ALTER TABLE notifications 
    ADD COLUMN type TEXT NOT NULL DEFAULT 'status_update';
  END IF;
  -- If only type exists, do nothing (already correct)
END $$;

-- Step 5: Recreate the trigger with error handling
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

      -- Insert notification with error handling (using 'type' column)
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

-- Step 6: Recreate the trigger
CREATE TRIGGER trigger_create_notification_on_status_change
  AFTER INSERT ON status_tracking
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_status_change();

-- Step 7: Verify policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'status_tracking'
ORDER BY policyname;
