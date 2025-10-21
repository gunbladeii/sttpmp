-- Temporary fix: Disable RLS on users table for testing
-- Run this in Supabase SQL Editor

-- Disable RLS temporarily to allow registration testing
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Check current status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Note: Remember to re-enable RLS after testing:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;