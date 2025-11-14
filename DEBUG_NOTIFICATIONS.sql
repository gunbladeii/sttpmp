-- ============================================
-- DEBUG: Check RLS Policies and Notifications
-- Run this to debug why notifications don't appear
-- ============================================

-- 1. Check RLS policies on notifications table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'notifications';

-- 2. Check notifications for iqbal
SELECT 
  n.id,
  n.user_id,
  n.syor_id,
  n.title,
  n.message,
  n.is_read,
  n.created_at,
  u.name as for_user,
  u.email as for_email
FROM notifications n
JOIN users u ON u.id = n.user_id
WHERE u.name = 'iqbal'
ORDER BY n.created_at DESC;

-- 3. Test RLS policy manually (should return notifications)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub TO 'bcf4ad9a-6da5-4c6d-8833-a08e87c8757a';

SELECT * FROM notifications 
WHERE user_id = 'bcf4ad9a-6da5-4c6d-8833-a08e87c8757a';

RESET ROLE;

-- 4. Check if auth.uid() works properly
SELECT auth.uid();

-- Success
SELECT 'Debug queries completed!' as status;
