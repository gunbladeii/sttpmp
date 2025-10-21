-- Add syor_documents table for storing uploaded PDF documents
CREATE TABLE syor_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    syor_id UUID REFERENCES syor(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    google_drive_id TEXT NOT NULL UNIQUE,
    google_drive_link TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_syor_documents_syor_id ON syor_documents(syor_id);
CREATE INDEX idx_syor_documents_uploaded_by ON syor_documents(uploaded_by);

-- Add RLS policies
ALTER TABLE syor_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view documents for syor they have access to
CREATE POLICY "Users can view documents for accessible syor" ON syor_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM syor s
            WHERE s.id = syor_documents.syor_id
            AND (
                -- Admin can see all
                auth.jwt() ->> 'role' = 'admin'
                -- Peneraju can see all
                OR auth.jwt() ->> 'role' = 'peneraju_pemeriksaan'
                -- Penyelaras can see their assigned syor
                OR (auth.jwt() ->> 'role' = 'penyelaras_bahagian' AND s.assigned_to_department = (auth.jwt() ->> 'department_id')::UUID)
                OR (auth.jwt() ->> 'role' = 'penyelaras_jpn' AND s.assigned_to_jpn = (auth.jwt() ->> 'jpn_id')::UUID)
                -- Pemantau can see all
                OR auth.jwt() ->> 'role' = 'pemantau'
            )
        )
    );

-- Policy: Penyelaras can insert documents for their assigned syor
CREATE POLICY "Penyelaras can upload documents" ON syor_documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM syor s
            WHERE s.id = syor_documents.syor_id
            AND (
                auth.jwt() ->> 'role' = 'admin'
                OR (auth.jwt() ->> 'role' = 'penyelaras_bahagian' AND s.assigned_to_department = (auth.jwt() ->> 'department_id')::UUID)
                OR (auth.jwt() ->> 'role' = 'penyelaras_jpn' AND s.assigned_to_jpn = (auth.jwt() ->> 'jpn_id')::UUID)
            )
        )
    );

-- Policy: Users can delete their own documents or admin can delete any
CREATE POLICY "Users can delete own documents" ON syor_documents
    FOR DELETE USING (
        uploaded_by = auth.uid()
        OR auth.jwt() ->> 'role' = 'admin'
    );