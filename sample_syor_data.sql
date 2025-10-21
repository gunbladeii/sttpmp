-- Create sample syor data for testing role-based filtering
-- Run this in Supabase SQL Editor

-- First, let's check what departments and users we have
SELECT 'Current Users:' as info, id, name, email, role, department_id, jpn_id FROM users;
SELECT 'Current Departments:' as info, id, name, code FROM departments;
SELECT 'Current JPNs:' as info, id, name, state FROM jpn;

-- Create sample departments if they don't exist
INSERT INTO departments (name, code, description) VALUES
('Bahagian Pembangunan Profesional Dan Pengurusan', 'BPPDP', 'Professional Development and Management Division'),
('Bahagian Teknologi Pendidikan', 'BTP', 'Educational Technology Division'),
('Bahagian Kurikulum', 'BK', 'Curriculum Division')
ON CONFLICT (code) DO NOTHING;

-- Create sample JPNs if they don't exist
INSERT INTO jpn (name, state, description) VALUES
('JPN Selangor', 'Selangor', 'Jabatan Pendidikan Negeri Selangor'),
('JPN Kuala Lumpur', 'Kuala Lumpur', 'Jabatan Pendidikan Wilayah Persekutuan Kuala Lumpur'),
('JPN Johor', 'Johor', 'Jabatan Pendidikan Negeri Johor')
ON CONFLICT (name) DO NOTHING;

-- Get department and JPN IDs for reference
-- (You'll need to update the UUIDs below with actual values from your database)

-- Sample syor data - you'll need to replace UUIDs with actual values
-- Insert sample syor assigned to different departments and JPNs

-- Syor for BPPDP Department
INSERT INTO syor (
  title, 
  description, 
  assigned_to_department, 
  priority, 
  due_date, 
  created_by,
  created_at
) VALUES
(
  'Penambahbaikan Kurikulum Matematik Tingkatan 4',
  'Kajian semula dan penambahbaikan kurikulum matematik untuk tingkatan 4 bagi meningkatkan pemahaman pelajar terhadap konsep algebra dan geometri. Cadangan termasuk penambahan aktiviti interaktif dan penggunaan teknologi dalam pengajaran.',
  (SELECT id FROM departments WHERE code = 'BPPDP' LIMIT 1),
  'tinggi',
  '2025-12-31',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  NOW()
),
(
  'Pelaksanaan Sistem Pembelajaran Digital',
  'Memperkenalkan platform pembelajaran digital yang menyeluruh untuk semua sekolah menengah. Platform ini akan merangkumi bahan pembelajaran interaktif, sistem penilaian online, dan modul komunikasi guru-pelajar.',
  (SELECT id FROM departments WHERE code = 'BTP' LIMIT 1),
  'kritikal',
  '2025-11-30',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  NOW()
);

-- Syor for JPNs
INSERT INTO syor (
  title, 
  description, 
  assigned_to_jpn, 
  priority, 
  due_date, 
  created_by,
  created_at
) VALUES
(
  'Program Literasi Awal Kanak-kanak',
  'Pembangunan program literasi komprehensif untuk kanak-kanak prasekolah dan tahun 1-3. Program ini akan merangkumi kaedah pengajaran inovatif, bahan bacaan yang menarik, dan latihan intensif untuk guru.',
  (SELECT id FROM jpn WHERE name = 'JPN Selangor' LIMIT 1),
  'sederhana',
  '2026-03-15',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  NOW()
);

-- Create initial status tracking for the syor
INSERT INTO status_tracking (syor_id, status, weight, comments, updated_by, updated_at)
SELECT 
  s.id,
  'belum_selesai',
  0.0,
  'Syor baru telah dicipta dan menunggu tindakan.',
  s.created_by,
  s.created_at
FROM syor s
WHERE s.created_at >= NOW() - INTERVAL '1 minute';

-- Update iqbal to be assigned to BPPDP department
UPDATE users 
SET department_id = (SELECT id FROM departments WHERE code = 'BPPDP' LIMIT 1)
WHERE email LIKE '%iqbal%' AND role = 'penyelaras_bahagian';

-- Verify everything is set up correctly
SELECT 
  u.name as user_name, 
  u.role, 
  d.name as department_name, 
  j.name as jpn_name
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN jpn j ON u.jpn_id = j.id
WHERE u.role IN ('penyelaras_bahagian', 'penyelaras_jpn');

SELECT 
  s.title,
  s.priority,
  d.name as assigned_department,
  j.name as assigned_jpn,
  st.status
FROM syor s
LEFT JOIN departments d ON s.assigned_to_department = d.id
LEFT JOIN jpn j ON s.assigned_to_jpn = j.id
LEFT JOIN status_tracking st ON s.id = st.syor_id
ORDER BY s.created_at DESC;

COMMIT;