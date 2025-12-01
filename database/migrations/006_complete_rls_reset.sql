-- Complete RLS Reset for Authenticated Users
-- Drop ALL existing restrictive policies and create simple ones

-- ===== SYOR TABLE =====
DROP POLICY IF EXISTS "Peneraju can view syor from their sector" ON syor;
DROP POLICY IF EXISTS "Penyelaras Bahagian can view their department syor" ON syor;
DROP POLICY IF EXISTS "Penyelaras JPN/JNN can view their JPN syor" ON syor;
DROP POLICY IF EXISTS "Admin and Pemantau can view all syor" ON syor;
DROP POLICY IF EXISTS "Authenticated users can view all syor" ON syor;

CREATE POLICY "Allow all authenticated to view syor"
  ON syor FOR SELECT
  TO authenticated
  USING (true);

-- ===== USERS TABLE =====
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to read own profile" ON users;
DROP POLICY IF EXISTS "Allow profile lookup by email for authenticated" ON users;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON users;

CREATE POLICY "Allow all authenticated to view users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- ===== DEPARTMENTS TABLE =====
DROP POLICY IF EXISTS "Authenticated users can view departments" ON departments;

CREATE POLICY "Allow all authenticated to view departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

-- ===== JPN TABLE =====
DROP POLICY IF EXISTS "Authenticated users can view jpn" ON jpn;

CREATE POLICY "Allow all authenticated to view jpn"
  ON jpn FOR SELECT
  TO authenticated
  USING (true);

-- ===== STATUS_TRACKING TABLE =====
DROP POLICY IF EXISTS "Authenticated users can view status_tracking" ON status_tracking;

CREATE POLICY "Allow all authenticated to view status_tracking"
  ON status_tracking FOR SELECT
  TO authenticated
  USING (true);

-- Verify policies
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies 
WHERE tablename IN ('syor', 'users', 'departments', 'jpn', 'status_tracking')
ORDER BY tablename, policyname;
