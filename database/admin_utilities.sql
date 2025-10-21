-- ================================================
-- ADMIN MANAGEMENT UTILITIES FOR STTPMP
-- ================================================

-- Function to create additional admin users
CREATE OR REPLACE FUNCTION create_admin_user(
    admin_email VARCHAR(255),
    admin_name VARCHAR(255), 
    admin_password_plain TEXT
)
RETURNS JSON AS $$
DECLARE
    password_hashed VARCHAR(255);
    new_admin_id UUID;
BEGIN
    -- Validate email domain
    IF admin_email NOT LIKE '%@moe.gov.my' THEN
        RETURN json_build_object('success', false, 'message', 'Only @moe.gov.my email addresses are allowed');
    END IF;
    
    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM users WHERE email = admin_email) THEN
        RETURN json_build_object('success', false, 'message', 'Email already exists in system');
    END IF;
    
    -- Note: Password hashing should be done in application layer with bcrypt
    -- This is placeholder - actual implementation will hash in Node.js
    password_hashed := admin_password_plain; -- Will be replaced with actual bcrypt hash
    
    -- Create admin user
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
        admin_email,
        admin_name,
        'admin',
        NULL,
        NULL,
        password_hashed,
        admin_password_plain,
        true,
        true,
        true
    ) RETURNING id INTO new_admin_id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Admin user created successfully',
        'admin_id', new_admin_id,
        'email', admin_email,
        'temporary_password', admin_password_plain
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to list all pending registration requests (for admin review)
CREATE OR REPLACE FUNCTION get_pending_registrations()
RETURNS TABLE (
    id UUID,
    email VARCHAR(255),
    name VARCHAR(255),
    department_name TEXT,
    jpn_name TEXT,
    requested_at TIMESTAMPTZ,
    days_waiting INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rr.id,
        rr.email,
        rr.name,
        d.name as department_name,
        j.name as jpn_name,
        rr.requested_at,
        EXTRACT(DAY FROM (NOW() - rr.requested_at))::INTEGER as days_waiting
    FROM registration_requests rr
    LEFT JOIN departments d ON rr.department_id = d.id
    LEFT JOIN jpn j ON rr.jpn_id = j.id
    WHERE rr.approved_at IS NULL 
    AND rr.rejected_at IS NULL
    ORDER BY rr.requested_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject registration request
CREATE OR REPLACE FUNCTION reject_registration(
    request_id UUID,
    reason TEXT DEFAULT 'Registration rejected by administrator'
)
RETURNS JSON AS $$
DECLARE
    reg_record registration_requests;
BEGIN
    -- Get registration record
    SELECT * INTO reg_record FROM registration_requests 
    WHERE id = request_id AND approved_at IS NULL AND rejected_at IS NULL;
    
    IF reg_record IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Registration request not found or already processed');
    END IF;
    
    -- Mark registration as rejected
    UPDATE registration_requests 
    SET 
        rejected_at = NOW(),
        rejection_reason = reason,
        approved_by = (SELECT id FROM users WHERE email = auth.email())
    WHERE id = request_id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Registration request rejected successfully',
        'email', reg_record.email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all users (admin dashboard)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    id UUID,
    email VARCHAR(255),
    name VARCHAR(255),
    role user_role,
    department_name TEXT,
    jpn_name TEXT,
    is_active BOOLEAN,
    is_approved BOOLEAN,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        d.name as department_name,
        j.name as jpn_name,
        u.is_active,
        u.is_approved,
        u.last_login,
        u.created_at
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN jpn j ON u.jpn_id = j.id
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deactivate/activate user
CREATE OR REPLACE FUNCTION toggle_user_status(
    user_id UUID,
    new_status BOOLEAN
)
RETURNS JSON AS $$
DECLARE
    user_record users;
BEGIN
    -- Get user record
    SELECT * INTO user_record FROM users WHERE id = user_id;
    
    IF user_record IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'User not found');
    END IF;
    
    -- Prevent deactivating admin users
    IF user_record.role = 'admin' AND new_status = false THEN
        RETURN json_build_object('success', false, 'message', 'Cannot deactivate admin users');
    END IF;
    
    -- Update user status
    UPDATE users 
    SET 
        is_active = new_status,
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'User status updated successfully',
        'email', user_record.email,
        'new_status', new_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for admin dashboard statistics
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
    (SELECT COUNT(*) FROM users WHERE is_approved = false) as pending_approvals,
    (SELECT COUNT(*) FROM registration_requests WHERE approved_at IS NULL AND rejected_at IS NULL) as pending_registrations,
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_count,
    (SELECT COUNT(*) FROM users WHERE last_login >= NOW() - INTERVAL '7 days') as recent_logins;

-- Ensure RLS is properly configured for admin functions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION create_admin_user TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_registrations TO authenticated;
GRANT EXECUTE ON FUNCTION reject_registration TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_user_status TO authenticated;
GRANT SELECT ON admin_dashboard_stats TO authenticated;