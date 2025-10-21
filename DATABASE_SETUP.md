# 🗄️ STTPMP Database Setup Guide

## Step 1: Reset Database (Supabase Dashboard)

### A) Delete All Tables (If Any Exist):
```sql
-- Run this in Supabase SQL Editor to clean up
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS status_tracking CASCADE;
DROP TABLE IF EXISTS syor CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS jpn CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- Drop types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS priority_type CASCADE;
DROP TYPE IF EXISTS status_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS pemeriksaan_type CASCADE;
```

## Step 2: Create Schema

### B) Run schema.sql:
1. Copy entire content from `database/schema.sql`
2. Paste in Supabase SQL Editor
3. Click "Run" ▶️

## Step 3: Insert Sample Data

### C) Run sample-data.sql:
1. Copy entire content from `database/sample-data.sql`
2. Paste in Supabase SQL Editor
3. Click "Run" ▶️

## Step 4: Verify Setup

### D) Check Tables Created:
```sql
-- Verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Should show:
- ✅ audit_logs
- ✅ departments
- ✅ jpn
- ✅ notifications
- ✅ status_tracking
- ✅ syor
- ✅ users

### E) Check Sample Data:
```sql
-- Check users
SELECT email, name, role, is_approved FROM users;

-- Check departments
SELECT name, code FROM departments;

-- Check syor
SELECT title, priority FROM syor LIMIT 3;
```

## Step 5: Test Authentication

1. Go to: `http://localhost:3003/login`
2. Email: `admin@moe.gov.my`
3. Use **Development Login** (yellow button)
4. Should redirect to dashboard

## Troubleshooting:

### Error: "relation does not exist"
- Tables not created in correct order
- Re-run Step 1 & 2 completely

### Error: "type does not exist"  
- Custom types not created
- Run the DROP commands first, then schema.sql

### Error: "foreign key violation"
- Sample data referencing non-existent records
- Make sure schema.sql runs successfully first

### Magic Link Setup:
If you want real Magic Link (vs Development Login):

1. **Supabase Dashboard** → Authentication → Settings
2. **Site URL**: `http://localhost:3003`  
3. **Redirect URLs**: `http://localhost:3003/auth/callback`
4. **Email Provider**: Enable ✅

## 🎯 Quick Test Commands:

```sql
-- Test user exists and is approved
SELECT * FROM users WHERE email = 'admin@moe.gov.my';

-- Test syor assignment
SELECT s.title, d.name as department, s.priority 
FROM syor s 
LEFT JOIN departments d ON s.assigned_to_department = d.id
LIMIT 5;
```