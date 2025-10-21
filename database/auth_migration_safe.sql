-- Safe Migration to add password authentication to users table
-- This script checks for existing columns before adding them

-- Check and add password columns to users table if they don't exist
DO $$
BEGIN
    -- Add password_hash column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'password_hash') THEN
        ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
    END IF;

    -- Add password_plain column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'password_plain') THEN
        ALTER TABLE users ADD COLUMN password_plain TEXT;
    END IF;

    -- Add email_verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'email_verified') THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
    END IF;

    -- Add verification_token column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'verification_token') THEN
        ALTER TABLE users ADD COLUMN verification_token VARCHAR(255);
    END IF;

    -- Add verification_token_expires column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'verification_token_expires') THEN
        ALTER TABLE users ADD COLUMN verification_token_expires TIMESTAMPTZ;
    END IF;

    -- Add password_reset_token column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'password_reset_token') THEN
        ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255);
    END IF;

    -- Add password_reset_expires column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'password_reset_expires') THEN
        ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMPTZ;
    END IF;

    -- Add last_login column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_login') THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMPTZ;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email, email_verified);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);

-- Update existing users to have email_verified = true (if any)
UPDATE users SET email_verified = true WHERE email IS NOT NULL AND email_verified IS NULL;

-- Create registration requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_plain TEXT NOT NULL, -- For admin reference
    department_id UUID REFERENCES departments(id),
    jpn_id UUID REFERENCES jpn(id),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    verification_token VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for registration_requests
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can create registration requests" ON registration_requests;
DROP POLICY IF EXISTS "Users can view own registration" ON registration_requests;
DROP POLICY IF EXISTS "Admin can view all registrations" ON registration_requests;
DROP POLICY IF EXISTS "Admin can update registrations" ON registration_requests;

-- Allow users to insert their own registration
CREATE POLICY "Users can create registration requests" ON registration_requests
    FOR INSERT WITH CHECK (true);

-- Allow users to view their own registration status
CREATE POLICY "Users can view own registration" ON registration_requests
    FOR SELECT USING (email = auth.email());

-- Admin can view all registrations
CREATE POLICY "Admin can view all registrations" ON registration_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.email = auth.email() 
            AND users.role = 'admin' 
            AND users.is_active = true 
            AND users.is_approved = true
        )
    );

-- Admin can update registrations (approve/reject)
CREATE POLICY "Admin can update registrations" ON registration_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.email = auth.email() 
            AND users.role = 'admin' 
            AND users.is_active = true 
            AND users.is_approved = true
        )
    );

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_registration_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS registration_requests_updated_at ON registration_requests;

-- Create trigger
CREATE TRIGGER registration_requests_updated_at
    BEFORE UPDATE ON registration_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_registration_requests_updated_at();

-- Function to approve registration and create user
CREATE OR REPLACE FUNCTION approve_registration(
    request_id UUID,
    assigned_role user_role DEFAULT 'pemantau'
)
RETURNS JSON AS $$
DECLARE
    reg_record registration_requests;
    new_user_id UUID;
BEGIN
    -- Get registration record
    SELECT * INTO reg_record FROM registration_requests 
    WHERE id = request_id AND approved_at IS NULL AND rejected_at IS NULL;
    
    IF reg_record IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Registration request not found or already processed');
    END IF;
    
    -- Create user account
    INSERT INTO users (
        email, 
        name, 
        role, 
        department_id, 
        jpn_id, 
        password_hash, 
        password_plain,
        email_verified,
        is_active, 
        is_approved
    ) VALUES (
        reg_record.email,
        reg_record.name,
        assigned_role,
        reg_record.department_id,
        reg_record.jpn_id,
        reg_record.password_hash,
        reg_record.password_plain,
        reg_record.email_verified,
        true,
        true
    ) RETURNING id INTO new_user_id;
    
    -- Mark registration as approved
    UPDATE registration_requests 
    SET 
        approved_at = NOW(),
        approved_by = (SELECT id FROM users WHERE email = auth.email())
    WHERE id = request_id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Registration approved successfully',
        'user_id', new_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- CREATE INITIAL ADMIN ACCOUNT AND SAMPLE DATA
-- ================================================

-- Insert sample department (required for some users)
INSERT INTO departments (id, name, code, contact_person, email, phone) 
VALUES (
    gen_random_uuid(),
    'Bahagian Perancangan dan Penyelidikan Dasar Pendidikan',
    'BPPDP',
    'Pengarah BPPDP',
    'bppdp@moe.gov.my',
    '03-8884-xxxx'
) ON CONFLICT (code) DO NOTHING;

-- Insert sample JPN (required for some users)
INSERT INTO jpn (id, name, state, contact_person, email, phone, address)
VALUES (
    gen_random_uuid(),
    'Jabatan Pendidikan Negeri Selangor',
    'Selangor',
    'Pengarah JPN Selangor',
    'jpn.selangor@moe.gov.my',
    '03-5544-xxxx',
    'Shah Alam, Selangor'
) ON CONFLICT DO NOTHING;

-- Create initial admin account (safe check for existing admin)
DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- Check if admin already exists with the specific email
    SELECT id INTO admin_id FROM users WHERE email = 'fisha.hafiz@moe.gov.my';
    
    IF admin_id IS NULL THEN
        -- Check if any admin exists
        SELECT id INTO admin_id FROM users WHERE role = 'admin' AND email LIKE '%@moe.gov.my' LIMIT 1;
        
        IF admin_id IS NULL THEN
            INSERT INTO users (
                email,
                name,
                role,
                department_id,
                jpn_id,
                password_hash,
                password_plain,
                email_verified,
                is_active,
                is_approved,
                created_at
            ) VALUES (
                'fisha.hafiz@moe.gov.my',
                'Administrator Sistem STTPMP',
                'admin',
                NULL,
                NULL,
                '$2b$12$LQv3c1yqBwlVHpPjrFCOWu.AtRqmWSV5T8nYJ9Z1ZV8yKqmB0aBB6', -- Admin123!
                'Admin123!', -- Plain text untuk admin reference
                true,
                true,
                true,
                NOW()
            );
            
            RAISE NOTICE 'Admin account created: fisha.hafiz@moe.gov.my with password: Admin123!';
        ELSE
            RAISE NOTICE 'Admin account already exists in system';
        END IF;
    ELSE
        RAISE NOTICE 'Admin account fisha.hafiz@moe.gov.my already exists';
    END IF;
END $$;