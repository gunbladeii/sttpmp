-- Assign users to their respective departments/JPNs
-- Run this in Supabase SQL Editor

-- First, let's see what departments and JPNs exist
SELECT 'Departments:' as type, id, name, code FROM departments 
UNION ALL
SELECT 'JPNs:' as type, id, name, state FROM jpn;

-- Let's assign iqbal (penyelaras_bahagian) to BPPDP department
-- First find iqbal's user ID and BPPDP department ID

-- Check iqbal's current details
SELECT id, name, email, role, department_id, jpn_id 
FROM users 
WHERE email LIKE '%iqbal%' OR name LIKE '%iqbal%';

-- Check available departments
SELECT id, name, code FROM departments WHERE name LIKE '%BPPDP%' OR code LIKE '%BPPDP%';

-- Update iqbal to be assigned to BPPDP department (assuming it exists)
-- Replace the UUIDs below with actual values from the queries above
UPDATE users 
SET department_id = (SELECT id FROM departments WHERE code = 'BPPDP' LIMIT 1)
WHERE email LIKE '%iqbal%' AND role = 'penyelaras_bahagian';

-- If we need to create sample department/JPN, uncomment below:
/*
-- Create sample department if not exists
INSERT INTO departments (name, code, description) 
VALUES ('Bahagian Pembangunan Profesional Dan Pengurusan', 'BPPDP', 'Department handling professional development and management')
ON CONFLICT (code) DO NOTHING;

-- Create sample JPN if not exists  
INSERT INTO jpn (name, state, description)
VALUES ('JPN Selangor', 'Selangor', 'Jabatan Pendidikan Negeri Selangor')
ON CONFLICT (name) DO NOTHING;
*/

-- Verify the assignment
SELECT u.name, u.email, u.role, d.name as department_name, d.code as department_code
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
WHERE u.role IN ('penyelaras_bahagian', 'penyelaras_jpn');

COMMIT;