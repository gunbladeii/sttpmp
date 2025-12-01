-- Security Migration: Fix Password Storage and RLS Policies
-- Created: 2025-12-01
-- Description: Remove plaintext password storage and implement proper RLS

-- =====================================================
-- STEP 1: Remove plaintext password column
-- =====================================================

-- Drop the insecure password_plain column
ALTER TABLE users DROP COLUMN IF EXISTS password_plain;

-- Ensure password_hash column exists and is not null for active users
-- (New users will have this set during registration)

-- =====================================================
-- STEP 2: Strengthen RLS Policies - USERS table
-- =====================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view profiles" ON users;

-- Create proper role-based policies for users table
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
      AND is_approved = true
    )
  );

CREATE POLICY "Admin can update users"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
      AND is_approved = true
    )
  );

CREATE POLICY "Admin can insert users"
  ON users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
      AND is_approved = true
    )
  );

-- =====================================================
-- STEP 3: Strengthen RLS Policies - SYOR table
-- =====================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view syor" ON syor;
DROP POLICY IF EXISTS "Authorized users can insert syor" ON syor;
DROP POLICY IF EXISTS "Authorized users can update syor" ON syor;

-- Peneraju Pemeriksaan can view syor from their sector
CREATE POLICY "Peneraju can view syor from their sector"
  ON syor FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u1
      WHERE u1.id = auth.uid()
      AND u1.role = 'peneraju_pemeriksaan'
      AND u1.is_active = true
      AND u1.is_approved = true
      AND EXISTS (
        SELECT 1 FROM users u2
        WHERE u2.id = syor.created_by
        AND u2.sector = u1.sector
      )
    )
  );

-- Penyelaras Bahagian can view syor assigned to their department
CREATE POLICY "Penyelaras Bahagian can view their department syor"
  ON syor FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'penyelaras_bahagian'
      AND is_active = true
      AND is_approved = true
      AND department_id = syor.assigned_to_department
    )
  );

-- Penyelaras JPN/JNN can view syor assigned to their JPN
CREATE POLICY "Penyelaras JPN/JNN can view their JPN syor"
  ON syor FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('penyelaras_jpn', 'penyelaras_jnn')
      AND is_active = true
      AND is_approved = true
      AND jpn_id = syor.assigned_to_jpn
    )
  );

-- Admin and Pemantau can view all syor
CREATE POLICY "Admin and Pemantau can view all syor"
  ON syor FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'pemantau')
      AND is_active = true
      AND is_approved = true
    )
  );

-- Only Peneraju Pemeriksaan can create syor
CREATE POLICY "Peneraju can create syor"
  ON syor FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'peneraju_pemeriksaan'
      AND is_active = true
      AND is_approved = true
    )
  );

-- Peneraju can update their own syor
CREATE POLICY "Peneraju can update their syor"
  ON syor FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'peneraju_pemeriksaan'
      AND is_active = true
      AND is_approved = true
      AND id = syor.created_by
    )
  );

-- Admin can update any syor
CREATE POLICY "Admin can update any syor"
  ON syor FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
      AND is_approved = true
    )
  );

-- =====================================================
-- STEP 4: Strengthen RLS Policies - STATUS_TRACKING
-- =====================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view status tracking" ON status_tracking;
DROP POLICY IF EXISTS "Users can insert status tracking" ON status_tracking;
DROP POLICY IF EXISTS "Users can update status tracking" ON status_tracking;

-- Users can view status tracking for syor they can access
CREATE POLICY "Users can view accessible status tracking"
  ON status_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM syor
      WHERE syor.id = status_tracking.syor_id
    )
  );

-- Penyelaras Bahagian can insert/update for their department
CREATE POLICY "Penyelaras Bahagian can update their department status"
  ON status_tracking FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'penyelaras_bahagian'
      AND is_active = true
      AND is_approved = true
      AND department_id = status_tracking.department_id
    )
  );

CREATE POLICY "Penyelaras Bahagian can modify their department status"
  ON status_tracking FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'penyelaras_bahagian'
      AND is_active = true
      AND is_approved = true
      AND department_id = status_tracking.department_id
    )
  );

-- Penyelaras JPN can insert/update for their JPN (not JNN - read only)
CREATE POLICY "Penyelaras JPN can update their JPN status"
  ON status_tracking FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'penyelaras_jpn'
      AND is_active = true
      AND is_approved = true
      AND jpn_id = status_tracking.jpn_id
    )
  );

CREATE POLICY "Penyelaras JPN can modify their JPN status"
  ON status_tracking FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'penyelaras_jpn'
      AND is_active = true
      AND is_approved = true
      AND jpn_id = status_tracking.jpn_id
    )
  );

-- Admin can do anything
CREATE POLICY "Admin can manage all status tracking"
  ON status_tracking FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
      AND is_approved = true
    )
  );

-- =====================================================
-- STEP 5: Strengthen RLS Policies - NOTIFICATIONS
-- =====================================================

-- Drop ALL existing notification policies (including various naming patterns)
DROP POLICY IF EXISTS "Users can view notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Create fresh notification policies with auth.uid() checks
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true); -- Allow system/triggers to create notifications

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- STEP 6: Add security helper functions
-- =====================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
    AND is_active = true
    AND is_approved = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
  user_role_value user_role;
BEGIN
  SELECT role INTO user_role_value
  FROM users
  WHERE id = auth.uid()
  AND is_active = true
  AND is_approved = true;
  
  RETURN user_role_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 7: Create index for auth lookups
-- =====================================================

-- Add index for faster auth.uid() lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON users(id) WHERE is_active = true AND is_approved = true;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these to verify the migration:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_plain';
-- SELECT policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'users';
-- SELECT policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'syor';
