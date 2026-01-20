-- =====================================================
-- DEEP ANALYSIS: Find ALL Hidden Triggers & Functions
-- =====================================================

-- 1. List ALL triggers in database
SELECT 
  'ALL TRIGGERS:' as section,
  trigger_schema,
  trigger_name,
  event_object_table as table_name,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 2. List ALL functions that mention 'notifications' table
SELECT 
  'FUNCTIONS WITH NOTIFICATIONS:' as section,
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition ILIKE '%notifications%'
ORDER BY routine_name;

-- 3. Check notifications table columns RIGHT NOW
SELECT 
  'CURRENT NOTIFICATIONS COLUMNS:' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notifications'
ORDER BY ordinal_position;

-- 4. List ALL triggers specifically on 'syor' table
SELECT 
  'SYOR TABLE TRIGGERS:' as section,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'syor';

-- 5. List ALL triggers specifically on 'status_tracking' table
SELECT 
  'STATUS_TRACKING TRIGGERS:' as section,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'status_tracking';
