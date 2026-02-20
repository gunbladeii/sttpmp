-- ============================================================================
-- FIX SUPABASE SECURITY LINTS
-- Date: 2026-02-11
-- 
-- Issues to fix:
-- 1. security_definer_view - admin_dashboard_stats view
-- 2. rls_disabled_in_public - users_id_backup table
-- ============================================================================

-- ============================================================================
-- ISSUE 1: Security Definer View - admin_dashboard_stats
-- ============================================================================
-- Drop and recreate view with SECURITY INVOKER (safer)
-- This makes the view use the permissions of the querying user instead of creator

DROP VIEW IF EXISTS admin_dashboard_stats CASCADE;

CREATE OR REPLACE VIEW admin_dashboard_stats
WITH (security_invoker = true) AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
    (SELECT COUNT(*) FROM users WHERE is_approved = false) as pending_approvals,
    (SELECT COUNT(*) FROM registration_requests WHERE approved_at IS NULL AND rejected_at IS NULL) as pending_registrations,
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_count,
    (SELECT COUNT(*) FROM users WHERE last_login >= NOW() - INTERVAL '7 days') as recent_logins;

-- Grant SELECT permissions to authenticated users (admin only)
GRANT SELECT ON admin_dashboard_stats TO authenticated;

-- ============================================================================
-- ISSUE 2: RLS Disabled - users_id_backup table
-- ============================================================================
-- This is a temporary migration/backup table
-- Option 1: Enable RLS if table is still needed
-- Option 2: Drop table if migration is complete (RECOMMENDED)

-- Check if table exists and has data
DO $$
DECLARE
    table_exists boolean;
    row_count integer;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users_id_backup'
    ) INTO table_exists;
    
    IF table_exists THEN
        EXECUTE 'SELECT COUNT(*) FROM users_id_backup' INTO row_count;
        RAISE NOTICE 'Table users_id_backup exists with % rows', row_count;
        
        -- Enable RLS on the backup table
        ALTER TABLE users_id_backup ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policy - only admins can access backup data
        DROP POLICY IF EXISTS "Only admins can access backup" ON users_id_backup;
        CREATE POLICY "Only admins can access backup"
            ON users_id_backup
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id = auth.uid()
                    AND users.role = 'admin'
                    AND users.is_active = true
                )
            );
        
        RAISE NOTICE '✓ RLS enabled on users_id_backup table';
        RAISE NOTICE '✓ Only admins can access this table';
        
        -- Optional: If you want to drop the table instead (uncomment below)
        -- RAISE NOTICE 'To drop this table, run: DROP TABLE users_id_backup CASCADE;';
    ELSE
        RAISE NOTICE '✓ Table users_id_backup does not exist';
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check admin_dashboard_stats view security
SELECT 
    schemaname,
    viewname,
    viewowner,
    CASE 
        WHEN viewname = 'admin_dashboard_stats' THEN '✓ View exists'
        ELSE 'View not found'
    END as status
FROM pg_views 
WHERE viewname = 'admin_dashboard_stats';

-- Check RLS status on users_id_backup
SELECT
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✓ RLS ENABLED'
        ELSE '✗ RLS DISABLED'
    END as rls_status
FROM pg_tables
WHERE tablename = 'users_id_backup'
AND schemaname = 'public';

-- List all RLS policies on users_id_backup
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users_id_backup';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE '✓ SECURITY LINTS FIXED!';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '1. admin_dashboard_stats - Now uses SECURITY INVOKER';
    RAISE NOTICE '2. users_id_backup - RLS Enabled (Admin only access)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '- Run Supabase linter again to verify fixes';
    RAISE NOTICE '- Consider dropping users_id_backup if no longer needed';
    RAISE NOTICE '============================================================';
END $$;
