-- ============================================
-- FIX: RLS POLICY FOR NOTIFICATIONS
-- This fixes the issue where notifications don't show
-- because auth.uid() doesn't work with custom auth
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- TEMPORARY: Disable RLS to allow all authenticated users
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Grant access to authenticated role
GRANT ALL ON notifications TO authenticated;

-- Success message
SELECT 'RLS disabled for notifications - all authenticated users can access' as status;

-- NOTE: This is a temporary fix. For production, you should implement proper service role authentication
-- or use Supabase Auth instead of custom authentication.
