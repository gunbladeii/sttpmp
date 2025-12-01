-- Migration: Create announcements table for landing page & admin management

-- 1. Create the table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT FALSE NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies
-- Allow public read access to published announcements
CREATE POLICY "Allow public read access to published announcements"
ON announcements
FOR SELECT
USING (is_published = TRUE);

-- Allow admins to have full access
CREATE POLICY "Allow admin full access"
ON announcements
FOR ALL
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- 4. Function and Trigger to update 'updated_at' timestamp
-- This is a generic function that can be reused for other tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_announcements_updated_at
BEFORE UPDATE ON announcements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
