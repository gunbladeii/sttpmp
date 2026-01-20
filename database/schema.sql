-- STTPMP Database Schema
-- Dashboard Status Tindakan Terhadap Perakuan Menteri Pendidikan

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing types if they exist (for clean reset)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS priority_type CASCADE;
DROP TYPE IF EXISTS status_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS pemeriksaan_type CASCADE;

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'peneraju_pemeriksaan', 'penyelaras_bahagian', 'penyelaras_jpn', 'pemantau');
CREATE TYPE priority_type AS ENUM ('rendah', 'sederhana', 'tinggi', 'kritikal');
CREATE TYPE status_type AS ENUM ('belum_selesai', 'dalam_tindakan', 'selesai');
CREATE TYPE notification_type AS ENUM ('deadline', 'status_update', 'new_syor', 'system', 'overdue');
CREATE TYPE pemeriksaan_type AS ENUM ('mata_pelajaran', 'keciciran_murid', 'infrastruktur', 'kualiti_guru', 'kurikulum');

-- Departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- JPN (Jabatan Pendidikan Negeri) table
CREATE TABLE jpn (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table with MOE email domain restriction
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'pemantau',
    department_id UUID REFERENCES departments(id),
    jpn_id UUID REFERENCES jpn(id),
    is_active BOOLEAN DEFAULT true,
    is_approved BOOLEAN DEFAULT false, -- Admin approval required
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only @moe.gov.my emails
    CONSTRAINT check_moe_email CHECK (email LIKE '%@moe.gov.my'),
    
    -- Role-specific constraints
    CONSTRAINT check_role_assignment CHECK (
        (role = 'admin' AND department_id IS NULL AND jpn_id IS NULL) OR
        (role = 'peneraju_pemeriksaan' AND department_id IS NULL AND jpn_id IS NULL) OR
        (role = 'penyelaras_bahagian' AND department_id IS NOT NULL AND jpn_id IS NULL) OR
        (role = 'penyelaras_jpn' AND department_id IS NULL AND jpn_id IS NOT NULL) OR
        (role = 'pemantau')
    )
);

-- Syor (Recommendations) table with enhanced workflow
CREATE TABLE syor (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    priority priority_type NOT NULL DEFAULT 'sederhana',
    pemeriksaan_type pemeriksaan_type NOT NULL,
    due_date DATE NOT NULL,
    response_deadline DATE NOT NULL, -- Deadline untuk jawapan
    created_by UUID NOT NULL REFERENCES users(id),
    assigned_by UUID REFERENCES users(id), -- Peneraju pemeriksaan yang assign
    assigned_to_department UUID REFERENCES departments(id),
    assigned_to_jpn UUID REFERENCES jpn(id),
    document_url TEXT,
    endorsement_date DATE, -- Tarikh endorsement YB Menteri
    is_overdue BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure at least one assignment
    CONSTRAINT check_assignment CHECK (
        assigned_to_department IS NOT NULL OR assigned_to_jpn IS NOT NULL
    ),
    
    -- Response deadline must be before or equal to due date
    CONSTRAINT check_deadlines CHECK (response_deadline <= due_date)
);

-- Status tracking table
CREATE TABLE status_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    syor_id UUID NOT NULL REFERENCES syor(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id),
    jpn_id UUID REFERENCES jpn(id),
    status status_type NOT NULL DEFAULT 'belum_selesai',
    weight DECIMAL(3,2) NOT NULL DEFAULT 0,
    comments TEXT,
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure weight matches status
    CONSTRAINT check_weight_status CHECK (
        (status = 'belum_selesai' AND weight = 0) OR
        (status = 'dalam_tindakan' AND weight = 0.5) OR
        (status = 'selesai' AND weight = 1)
    ),
    
    -- Ensure tracking assignment matches syor assignment
    CONSTRAINT check_tracking_assignment CHECK (
        (department_id IS NOT NULL AND jpn_id IS NULL) OR
        (department_id IS NULL AND jpn_id IS NOT NULL)
    )
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    syor_id UUID REFERENCES syor(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_syor_assigned_department ON syor(assigned_to_department);
CREATE INDEX idx_syor_assigned_jpn ON syor(assigned_to_jpn);
CREATE INDEX idx_syor_created_by ON syor(created_by);
CREATE INDEX idx_syor_due_date ON syor(due_date);
CREATE INDEX idx_status_tracking_syor ON status_tracking(syor_id);
CREATE INDEX idx_status_tracking_status ON status_tracking(status);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- Functions for automatic weight calculation
CREATE OR REPLACE FUNCTION calculate_weight_from_status()
RETURNS TRIGGER AS $$
BEGIN
    CASE NEW.status
        WHEN 'belum_selesai' THEN NEW.weight = 0;
        WHEN 'dalam_tindakan' THEN NEW.weight = 0.5;
        WHEN 'selesai' THEN NEW.weight = 1;
    END CASE;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic weight calculation
CREATE TRIGGER trigger_calculate_weight
    BEFORE INSERT OR UPDATE ON status_tracking
    FOR EACH ROW
    EXECUTE FUNCTION calculate_weight_from_status();

-- Function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating timestamps
CREATE TRIGGER trigger_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_jpn_updated_at
    BEFORE UPDATE ON jpn
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_syor_updated_at
    BEFORE UPDATE ON syor
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE jpn ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE syor ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be customized based on requirements)
-- Users can read all departments and JPN
CREATE POLICY "Users can view departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Users can view jpn" ON jpn FOR SELECT USING (true);

-- Users can view their own profile and others based on role
CREATE POLICY "Users can view profiles" ON users FOR SELECT USING (true);

-- Syor policies - Allow broader access for development
CREATE POLICY "Users can view syor" ON syor FOR SELECT USING (true);
CREATE POLICY "Authorized users can insert syor" ON syor FOR INSERT WITH CHECK (true);
CREATE POLICY "Authorized users can update syor" ON syor FOR UPDATE USING (true);

-- Status tracking policies
CREATE POLICY "Users can view status tracking" ON status_tracking FOR SELECT USING (true);
CREATE POLICY "Users can insert status tracking" ON status_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update status tracking" ON status_tracking FOR UPDATE USING (true);

-- Notifications policies
CREATE POLICY "Users can view notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Users can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update notifications" ON notifications FOR UPDATE USING (true);

-- Audit logs policies
CREATE POLICY "Users can view audit logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Users can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);