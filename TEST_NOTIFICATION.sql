-- ============================================
-- TEST NOTIFICATION - Create sample notification
-- Run this AFTER creating the notifications table
-- ============================================

-- First, let's check your user ID
SELECT id, email, name, role FROM users LIMIT 5;

-- Then create a test notification (replace USER_ID and SYOR_ID below)
-- Copy one user ID from above and one syor ID from your system

/*
INSERT INTO notifications (
  user_id,
  syor_id,
  notification_type,
  title,
  message,
  is_read,
  created_by
) VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with actual user ID from above
  (SELECT id FROM syor LIMIT 1),  -- This will get any syor ID
  'new_comment',
  'Test Notification',
  'Ini adalah test notification untuk sistem STTPMP. Bell icon sepatutnya muncul dengan badge merah!',
  false,
  'YOUR_USER_ID_HERE'  -- Replace with actual user ID
);
*/

-- After replacing the IDs above, uncomment and run!

SELECT 'Replace USER_ID and SYOR_ID in the INSERT statement above, then uncomment and run!' as instruction;
