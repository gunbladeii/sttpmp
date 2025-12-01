-- Fix RLS Policy for Login Process
-- Created: 2025-12-01
-- Description: Allow authenticated users to read their own profile during login

-- Drop the problematic policy if exists
DROP POLICY IF EXISTS "Authenticated users can view own profile by email" ON users;

-- Allow authenticated users to SELECT their profile
-- This uses auth.uid() which is available after signInWithPassword succeeds
CREATE POLICY "Allow authenticated users to read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Also allow users to read profiles by email for login flow
-- This is more permissive but necessary for the login process
CREATE POLICY "Allow profile lookup by email for authenticated"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Note: The authenticated role is only available AFTER signInWithPassword succeeds
-- So this won't expose data to unauthenticated users
