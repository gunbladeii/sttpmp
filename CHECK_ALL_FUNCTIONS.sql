-- =====================================================
-- CHECK ALL FUNCTIONS - Find the REAL culprit
-- =====================================================

-- Show FULL DEFINITION of calculate_weight_from_status function
SELECT 
  'CALCULATE_WEIGHT FUNCTION:' as info,
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'calculate_weight_from_status';

-- Show FULL DEFINITION of create_notification function
SELECT 
  'CREATE_NOTIFICATION FUNCTION:' as info,
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'create_notification_on_status_change';

-- Check for ANY OTHER functions that insert into notifications
SELECT 
  'ALL FUNCTIONS THAT INSERT NOTIFICATIONS:' as info,
  routine_name,
  LENGTH(routine_definition) as def_length,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition ILIKE '%INSERT%INTO%notifications%'
ORDER BY routine_name;

-- Alternative: Check pg_proc directly for function bodies
SELECT 
  'PG_PROC FUNCTIONS:' as info,
  proname as function_name,
  pg_get_functiondef(oid) as full_definition
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND pg_get_functiondef(oid) ILIKE '%notification_type%'
ORDER BY proname;
