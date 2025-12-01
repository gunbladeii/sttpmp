-- Migration: Update RLS policies for announcements table to use 'published' column

-- Drop old policies if exist
DROP POLICY IF EXISTS "Allow public read access to published announcements" ON announcements;
DROP POLICY IF EXISTS "Allow admin full access" ON announcements;

-- Create new public read policy
CREATE POLICY "Allow public read access to published announcements"
ON announcements
FOR SELECT
USING (published = TRUE);

-- Create new admin full access policy
CREATE POLICY "Allow admin full access"
ON announcements
FOR ALL
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);
