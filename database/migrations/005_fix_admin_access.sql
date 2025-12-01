-- Fix RLS for Admin Access - Allow Authenticated Users
-- Created: 2025-12-01
-- Description: Ensure authenticated users can access all necessary tables

-- Drop existing policies first
DROP POLICY IF EXISTS "Authenticated users can view all syor" ON syor;
DROP POLICY IF EXISTS "Authenticated users can view departments" ON departments;
DROP POLICY IF EXISTS "Authenticated users can view jpn" ON jpn;
DROP POLICY IF EXISTS "Authenticated users can view status_tracking" ON status_tracking;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON users;

-- Allow authenticated users to access syor table
CREATE POLICY "Authenticated users can view all syor"
  ON syor FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to access departments table
CREATE POLICY "Authenticated users can view departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to access jpn table  
CREATE POLICY "Authenticated users can view jpn"
  ON jpn FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to access status_tracking table
CREATE POLICY "Authenticated users can view status_tracking"
  ON status_tracking FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to view all users (needed for joins)
CREATE POLICY "Authenticated users can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Note: These are permissive policies for authenticated users only
-- Unauthenticated (anon) users still cannot access anything
-- This is temporary until we properly sync auth.uid() with users.id
