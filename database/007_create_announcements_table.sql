-- Announcements table for Pengumuman feature
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    author_id UUID REFERENCES users(id)
);

-- Enable RLS and policies after table creation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements') THEN
        ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

        -- Policy: Only admin can insert, update, delete
        CREATE POLICY "Admin can manage announcements" ON announcements
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role = 'admin' 
                    AND users.is_active = true 
                    AND users.is_approved = true
                )
            );

        -- Policy: All users can view published announcements
        CREATE POLICY "Users can view published announcements" ON announcements
            FOR SELECT USING (published = true);

        -- Policy: Admin can view all announcements
        CREATE POLICY "Admin can view all announcements" ON announcements
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role = 'admin' 
                    AND users.is_active = true 
                    AND users.is_approved = true
                )
            );
    END IF;
END $$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_announcements_updated_at();
