-- Test data for create syor functionality
-- Run this in Supabase SQL Editor

-- Make sure we have a peneraju user for testing
INSERT INTO users (email, name, role, is_active, is_approved, password_hash, password_plain, email_verified) 
VALUES (
  'peneraju.test@moe.gov.my',
  'Peneraju Test User',
  'peneraju_pemeriksaan',
  true,
  true,
  '$2b$10$example_hash', -- Replace with actual hash
  'Test123!', -- For admin reference
  true
) ON CONFLICT (email) DO UPDATE SET
  role = 'peneraju_pemeriksaan',
  is_active = true,
  is_approved = true;

-- Ensure we have some departments for testing
INSERT INTO departments (name, code, contact_person, email, phone) VALUES
('Bahagian Pembangunan Profesional Dan Pengurusan', 'BPPDP', 'Ahmad bin Hassan', 'ahmad.hassan@moe.gov.my', '03-88841234'),
('Bahagian Teknologi Pendidikan', 'BTP', 'Lim Wei Ming', 'lim.weiming@moe.gov.my', '03-88841237'),
('Bahagian Kurikulum', 'BK', 'Raj Kumar', 'raj.kumar@moe.gov.my', '03-88841236')
ON CONFLICT (code) DO NOTHING;

-- Ensure we have some JPNs for testing
INSERT INTO jpn (name, state, contact_person, email, phone, address) VALUES
('JPN Selangor', 'Selangor', 'Datuk Mohd Yusof', 'yusof@jpnselangor.gov.my', '03-55121234', 'Kompleks JPN Selangor, Shah Alam'),
('JPN Kuala Lumpur', 'Kuala Lumpur', 'Datin Sarah Abdullah', 'sarah@jpnkl.gov.my', '03-26921234', 'Kompleks JPN KL, Jalan Duta'),
('JPN Johor', 'Johor', 'Encik Raman Krishnan', 'raman@jpnjohor.gov.my', '07-22431234', 'Kompleks JPN Johor, Johor Bahru')
ON CONFLICT (name) DO NOTHING;

-- Check what we have created
SELECT 'Users:' as type, email, name, role FROM users WHERE role = 'peneraju_pemeriksaan';
SELECT 'Departments:' as type, code, name FROM departments;
SELECT 'JPNs:' as type, name, state FROM jpn;

COMMIT;