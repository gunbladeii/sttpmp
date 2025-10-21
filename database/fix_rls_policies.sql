-- Fix Row Level Security policies for user registration
-- Run this script in Supabase SQL Editor

-- First, let's check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Option 1: Temporarily disable RLS for testing (NOT recommended for production)
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Option 2: Create proper RLS policies (RECOMMENDED)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can register themselves" ON public.users;
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Allow registration (insert) for all users (since this is self-registration)
CREATE POLICY "Allow user registration" ON public.users
    FOR INSERT 
    WITH CHECK (true);

-- Allow users to read their own data
CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT 
    USING (auth.uid()::text = id::text OR email = current_setting('app.current_user_email', true));

-- Allow admins to read and update all users
CREATE POLICY "Admins can manage users" ON public.users
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.email = current_setting('app.current_user_email', true) 
            AND u.role = 'admin' 
            AND u.is_active = true 
            AND u.is_approved = true
        )
    );

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create a function to set current user context for RLS
CREATE OR REPLACE FUNCTION set_current_user_email(user_email text)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_email', user_email, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the policies
SELECT 'RLS policies created successfully' as status;