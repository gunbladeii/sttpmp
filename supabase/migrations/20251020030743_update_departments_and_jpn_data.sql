-- Update Departments and JPN with comprehensive data
-- This migration safely adds new data while preserving existing references

-- Update existing departments with proper sector assignments and codes where applicable
UPDATE departments SET 
  code = 'JN',
  sector = 'SSJK'
WHERE name = 'Jemaah Nazir';

UPDATE departments SET 
  code = 'BAS',
  sector = 'SSJK'
WHERE name = 'Bahagian Audit Sekolah';

-- Insert new official departments with their codes and assigned sectors (avoiding conflicts)
INSERT INTO departments (name, code, contact_person, email, phone, sector) 
SELECT name, code, contact_person, email, phone, sector::sector_type FROM (VALUES
-- Sektor Dasar dan Perancangan (SDP)
('Bahagian Perancangan Strategik dan Hubungan Antarabangsa', 'BPSHA', 'Ketua Bahagian BPSHA', 'bpsha@moe.gov.my', '03-88841001', 'SDP'),
('Bahagian Perancangan dan Penyelidikan Dasar Pendidikan', 'EPRD', 'Ketua Bahagian EPRD', 'eprd@moe.gov.my', '03-88841002', 'SDP'),

-- Sektor Data dan Teknologi Maklumat (SDTM) - Skip BPM which already exists
('Bahagian Sumber dan Teknologi Pendidikan', 'BSTP', 'Ketua Bahagian BSTP', 'bstp@moe.gov.my', '03-88841004', 'SDTM'),

-- Sektor Standard dan Jaminan Kualiti (SSJK) - Skip existing ones
('Lembaga Peperiksaan', 'LP', 'Ketua Lembaga Peperiksaan', 'lp@moe.gov.my', '03-88841006', 'SSJK'),
('Unit Audit Dalam', 'UAD', 'Ketua Unit Audit Dalam', 'uad@moe.gov.my', '03-88841007', 'SSJK'),

-- Sektor Penaziran Kurikulum (SPK)
('Bahagian Pembangunan Kurikulum', 'BPK', 'Ketua Bahagian BPK', 'bpk@moe.gov.my', '03-88841009', 'SPK'),
('Bahagian Profesionalisme Guru', 'BPG', 'Ketua Bahagian BPG', 'bpg@moe.gov.my', '03-88841010', 'SPK'),
('Bahagian Pendidikan Islam', 'BPI', 'Ketua Bahagian BPI', 'bpi@moe.gov.my', '03-88841011', 'SPK'),
('Bahagian Pendidikan dan Latihan Teknikal Vokasional', 'BPLTV', 'Ketua Bahagian BPLTV', 'bpltv@moe.gov.my', '03-88841012', 'SPK'),
('Institut Aminuddin Baki', 'IAB', 'Ketua Institut IAB', 'iab@moe.gov.my', '03-88841013', 'SPK'),
('Institut Pendidikan Guru Malaysia', 'IPGM', 'Ketua Institut IPGM', 'ipgm@moe.gov.my', '03-88841014', 'SPK'),
('English Language Training Centre', 'ELTC', 'Ketua Pusat ELTC', 'eltc@moe.gov.my', '03-88841015', 'SPK'),

-- Sektor Penaziran Hal Ehwal Murid dan Kokurikulum (SPHEMK)
('Bahagian Sukan, Kokurikulum dan Kesenian', 'BSKK', 'Ketua Bahagian BSKK', 'bskk@moe.gov.my', '03-88841016', 'SPHEMK'),
('Bahagian Psikologi dan Kaunseling', 'BPsiko', 'Ketua Bahagian BPsiko', 'bpsiko@moe.gov.my', '03-88841017', 'SPHEMK'),
('Bahagian PERMATA', 'BPermata', 'Ketua Bahagian BPermata', 'bpermata@moe.gov.my', '03-88841018', 'SPHEMK'),

-- Sektor Penaziran Institusi Pendidikan (SPIP)
('Bahagian Pengurusan Sekolah Harian', 'BPSH', 'Ketua Bahagian BPSH', 'bpsh@moe.gov.my', '03-88841019', 'SPIP'),
('Bahagian Pengurusan Sekolah Berasrama Penuh', 'BPSBP', 'Ketua Bahagian BPSBP', 'bpsbp@moe.gov.my', '03-88841020', 'SPIP'),
('Bahagian Pendidikan Khas', 'BPKhas', 'Ketua Bahagian BPKhas', 'bpkhas@moe.gov.my', '03-88841021', 'SPIP'),
('Bahagian Pendidikan Swasta', 'BS', 'Ketua Bahagian BS', 'bs@moe.gov.my', '03-88841022', 'SPIP'),
('Bahagian Matrikulasi', 'BM', 'Ketua Bahagian BM', 'bm@moe.gov.my', '03-88841023', 'SPIP'),

-- Support/Administrative Departments (No specific sector assignment for now)
('Bahagian Akaun', 'BA', 'Ketua Bahagian BA', 'ba@moe.gov.my', '03-88841024', NULL),
('Bahagian Tajaan Pendidikan', 'BTp', 'Ketua Bahagian BTp', 'btp@moe.gov.my', '03-88841025', NULL),
('Bahagian Kewangan', 'BKew', 'Ketua Bahagian BKew', 'bkew@moe.gov.my', '03-88841026', NULL),
('Bahagian Khidmat Pengurusan', 'BKPM', 'Ketua Bahagian BKPM', 'bkpm@moe.gov.my', '03-88841027', NULL),
('Bahagian Pembangunan', 'BP', 'Ketua Bahagian BP', 'bp@moe.gov.my', '03-88841028', NULL),
('Bahagian Pengurusan Aset', 'BPA', 'Ketua Bahagian BPA', 'bpa@moe.gov.my', '03-88841029', NULL),
('Bahagian Pengurusan Sumber Manusia', 'BPSM', 'Ketua Bahagian BPSM', 'bpsm@moe.gov.my', '03-88841030', NULL),
('Bahagian Perolehan', 'BPL', 'Ketua Bahagian BPL', 'bpl@moe.gov.my', '03-88841031', NULL),
('Unit Integriti', 'UI', 'Ketua Unit UI', 'ui@moe.gov.my', '03-88841032', NULL),
('Unit Komunikasi Korporat', 'UKK', 'Ketua Unit UKK', 'ukk@moe.gov.my', '03-88841033', NULL),
('Pejabat Penasihat Undang-Undang', 'PUU', 'Ketua Pejabat PUU', 'puu@moe.gov.my', '03-88841034', NULL)
) AS new_depts(name, code, contact_person, email, phone, sector)
WHERE NOT EXISTS (
  SELECT 1 FROM departments WHERE departments.code = new_depts.code
);

-- Insert JPN data safely
INSERT INTO jpn (name, state, contact_person, email, phone, address) 
SELECT * FROM (VALUES
('JPN Johor', 'Johor', 'Pengarah JPN Johor', 'jpnjohor@moe.gov.my', '07-2234567', 'Kompleks JPN Johor, Johor Bahru'),
('JPN Kedah', 'Kedah', 'Pengarah JPN Kedah', 'jpnkedah@moe.gov.my', '04-7334567', 'Kompleks JPN Kedah, Alor Setar'),
('JPN Kelantan', 'Kelantan', 'Pengarah JPN Kelantan', 'jpnkelantan@moe.gov.my', '09-7484567', 'Kompleks JPN Kelantan, Kota Bharu'),
('JPN Melaka', 'Melaka', 'Pengarah JPN Melaka', 'jpnmelaka@moe.gov.my', '06-2834567', 'Kompleks JPN Melaka, Melaka'),
('JPN Negeri Sembilan', 'Negeri Sembilan', 'Pengarah JPN Negeri Sembilan', 'jpnns@moe.gov.my', '06-7634567', 'Kompleks JPN N9, Seremban'),
('JPN Pahang', 'Pahang', 'Pengarah JPN Pahang', 'jpnpahang@moe.gov.my', '09-5134567', 'Kompleks JPN Pahang, Kuantan'),
('JPN Perak', 'Perak', 'Pengarah JPN Perak', 'jpnperak@moe.gov.my', '05-5534567', 'Kompleks JPN Perak, Ipoh'),
('JPN Perlis', 'Perlis', 'Pengarah JPN Perlis', 'jpnperlis@moe.gov.my', '04-9734567', 'Kompleks JPN Perlis, Kangar'),
('JPN Pulau Pinang', 'Pulau Pinang', 'Pengarah JPN Pulau Pinang', 'jpnpp@moe.gov.my', '04-2284567', 'Kompleks JPN Pulau Pinang, Georgetown'),
('JPN Sabah', 'Sabah', 'Pengarah JPN Sabah', 'jpnsabah@moe.gov.my', '088-234567', 'Kompleks JPN Sabah, Kota Kinabalu'),
('JPN Sarawak', 'Sarawak', 'Pengarah JPN Sarawak', 'jpnsarawak@moe.gov.my', '082-634567', 'Kompleks JPN Sarawak, Kuching'),
('JPN Selangor', 'Selangor', 'Pengarah JPN Selangor', 'jpnselangor@moe.gov.my', '03-5512234', 'Kompleks JPN Selangor, Shah Alam'),
('JPN Terengganu', 'Terengganu', 'Pengarah JPN Terengganu', 'jpnterengganu@moe.gov.my', '09-6234567', 'Kompleks JPN Terengganu, Kuala Terengganu'),
('JPN W.P Kuala Lumpur', 'W.P Kuala Lumpur', 'Pengarah JPN WP KL', 'jpnkl@moe.gov.my', '03-26921234', 'Kompleks JPN KL, Jalan Duta'),
('JPN W.P Labuan', 'W.P Labuan', 'Pengarah JPN WP Labuan', 'jpnlabuan@moe.gov.my', '087-421234', 'Kompleks JPN Labuan, Labuan'),
('JPN W.P Putrajaya', 'W.P Putrajaya', 'Pengarah JPN WP Putrajaya', 'jpnputrajaya@moe.gov.my', '03-88841234', 'Kompleks JPN Putrajaya, Putrajaya')
) AS new_jpn(name, state, contact_person, email, phone, address)
WHERE NOT EXISTS (
  SELECT 1 FROM jpn WHERE jpn.name = new_jpn.name
);
