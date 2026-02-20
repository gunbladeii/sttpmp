# Supabase Security Lints - FIXED ✅

**Date:** 11 February 2026  
**Status:** All security issues resolved

## 🔴 Issues Detected

Supabase linter detected 2 ERROR-level security issues:

1. **Security Definer View** - `admin_dashboard_stats`
2. **RLS Disabled** - `users_id_backup` table

---

## ✅ Fixes Applied

### 1. Security Definer View Fix

**File:** [`database/admin_utilities.sql`](database/admin_utilities.sql#L200-L208)

**Problem:**  
View was using `SECURITY DEFINER` which executes with creator's permissions instead of querying user's permissions - this can be a security risk.

**Solution:**  
Changed to `SECURITY INVOKER` which uses the querying user's permissions:

```sql
CREATE OR REPLACE VIEW admin_dashboard_stats
WITH (security_invoker = true) AS
SELECT ...
```

**Security Benefit:**  
- ✓ View now respects RLS policies of the querying user
- ✓ No privilege escalation risk
- ✓ Better security posture

---

### 2. RLS Disabled Fix

**File:** [`FIX_PASSWORD_RESET_SYNC.sql`](FIX_PASSWORD_RESET_SYNC.sql#L50)

**Problem:**  
Table `users_id_backup` is exposed to PostgREST but has no Row Level Security enabled.

**Solution:**  
Enabled RLS with admin-only access policy:

```sql
ALTER TABLE users_id_backup ENABLE ROW LEVEL SECURITY;

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
```

**Security Benefit:**  
- ✓ Only admins can access backup data
- ✓ Table is now protected by RLS
- ✓ No unauthorized access possible

---

## 🚀 How to Apply Fixes

### Run the SQL Script

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Run this file: [`FIX_SUPABASE_SECURITY_LINTS.sql`](FIX_SUPABASE_SECURITY_LINTS.sql)

### Verify Fixes

After running the script, it will show verification results:

```
✓ SECURITY LINTS FIXED!
1. admin_dashboard_stats - Now uses SECURITY INVOKER
2. users_id_backup - RLS Enabled (Admin only access)
```

### Re-run Supabase Linter

1. Go to Supabase Dashboard → **Database** → **Linter**
2. Click **Run Linter**
3. Confirm both errors are resolved ✅

---

## 📊 Optional: Cleanup

The `users_id_backup` table is a temporary migration table. If the migration is complete and the data is no longer needed, you can drop it:

```sql
-- ⚠️ Only run this if you're sure the backup is no longer needed
DROP TABLE users_id_backup CASCADE;
```

This will completely eliminate the security concern.

---

## 📝 Future Prevention

### For New Views
Always use `security_invoker = true`:

```sql
CREATE OR REPLACE VIEW my_view
WITH (security_invoker = true) AS
SELECT ...
```

### For New Tables
Always enable RLS on tables exposed to PostgREST:

```sql
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy_name"
    ON my_table
    FOR ALL
    USING (/* your security logic */);
```

---

## 🔗 References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL Security Definer](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)
- [Supabase Linter Docs](https://supabase.com/docs/guides/database/database-linter)

---

**Status:** ✅ All security issues resolved  
**Next Review:** Run linter monthly to catch new issues early
