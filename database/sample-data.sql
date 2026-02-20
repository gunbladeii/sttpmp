-- Sample data for STTPMP system

-- Insert sample departments
INSERT INTO departments (name, code, contact_person, email, phone) VALUES
('Bahagian Pendidikan Menengah', 'BPM', 'Ahmad bin Hassan', 'ahmad.hassan@moe.gov.my', '03-88841234'),
('Bahagian Pendidikan Rendah', 'BPR', 'Siti Aminah binti Ali', 'siti.aminah@moe.gov.my', '03-88841235'),
('Bahagian Pembangunan Kurikulum', 'BPK', 'Raj Kumar s/o Krishnan', 'raj.kumar@moe.gov.my', '03-88841236'),
('Bahagian Teknologi Pendidikan', 'BTP', 'Lim Wei Ming', 'lim.weiming@moe.gov.my', '03-88841237');

-- Insert sample JPN (updated: removed duplicate KL, using W.P naming)
INSERT INTO jpn (name, state, contact_person, email, phone, address) VALUES
('JPN Selangor', 'Selangor', 'Datuk Mohd Yusof', 'yusof@jpnselangor.gov.my', '03-55121234', 'Kompleks JPN Selangor, Shah Alam'),
('JPN W.P Kuala Lumpur', 'W.P Kuala Lumpur', 'Datin Sarah Abdullah', 'sarah@jpnkl.gov.my', '03-26921234', 'Kompleks JPN KL, Jalan Duta'),
('JPN Johor', 'Johor', 'Encik Raman Krishnan', 'raman@jpnjohor.gov.my', '07-22431234', 'Kompleks JPN Johor, Johor Bahru'),
('JPN Penang', 'Pulau Pinang', 'Puan Lim Ai Choo', 'aichoo@jpnpenang.gov.my', '04-22881234', 'Kompleks JPN Penang, Georgetown')
ON CONFLICT (name) DO NOTHING;

-- Insert sample users (updated with correct roles)
INSERT INTO users (email, name, role, department_id, jpn_id, is_active, is_approved) VALUES
('admin@moe.gov.my', 'Administrator MOE', 'admin', NULL, NULL, true, true),
('peneraju@moe.gov.my', 'Peneraju Pemeriksaan MOE', 'peneraju_pemeriksaan', NULL, NULL, true, true),
('ahmad.hassan@moe.gov.my', 'Ahmad bin Hassan', 'penyelaras_bahagian', (SELECT id FROM departments WHERE code = 'BPM'), NULL, true, true),
('siti.aminah@moe.gov.my', 'Siti Aminah binti Ali', 'penyelaras_bahagian', (SELECT id FROM departments WHERE code = 'BPR'), NULL, true, true),
('raj.kumar@moe.gov.my', 'Raj Kumar s/o Krishnan', 'penyelaras_bahagian', (SELECT id FROM departments WHERE code = 'BPK'), NULL, true, true),
('jpn.selangor@moe.gov.my', 'Penyelaras JPN Selangor', 'penyelaras_jpn', NULL, (SELECT id FROM jpn WHERE state = 'Selangor'), true, true),
('jpn.kl@moe.gov.my', 'Penyelaras JPN KL', 'penyelaras_jpn', NULL, (SELECT id FROM jpn WHERE state = 'W.P Kuala Lumpur'), true, true),
('pemantau@moe.gov.my', 'Pemantau Sistem', 'pemantau', NULL, NULL, true, true);

-- Insert sample syor (updated with required fields)
INSERT INTO syor (title, description, priority, pemeriksaan_type, due_date, response_deadline, created_by, assigned_by, assigned_to_department) VALUES
(
    'Penambahbaikan Kurikulum Matematik Tingkatan 4',
    'Kajian semula dan penambahbaikan kurikulum matematik untuk tingkatan 4 bagi meningkatkan pemahaman pelajar terhadap konsep algebra dan geometri. Cadangan termasuk penambahan aktiviti hands-on dan penggunaan teknologi dalam pengajaran.',
    'tinggi',
    'kurikulum',
    '2025-12-31',
    '2025-11-30',
    (SELECT id FROM users WHERE email = 'peneraju@moe.gov.my'),
    (SELECT id FROM users WHERE email = 'peneraju@moe.gov.my'),
    (SELECT id FROM departments WHERE code = 'BPK')
),
(
    'Pelaksanaan Sistem Pembelajaran Digital',
    'Memperkenalkan platform pembelajaran digital yang menyeluruh untuk semua sekolah menengah. Platform ini akan merangkumi bahan pembelajaran interaktif, sistem penilaian online, dan modul komunikasi guru-pelajar.',
    'kritikal',
    'infrastruktur',
    '2025-11-30',
    '2025-10-31',
    (SELECT id FROM users WHERE email = 'peneraju@moe.gov.my'),
    (SELECT id FROM users WHERE email = 'peneraju@moe.gov.my'),
    (SELECT id FROM departments WHERE code = 'BTP')
),
(
    'Program Literasi Awal Kanak-kanak',
    'Pembangunan program literasi komprehensif untuk murid tahun 1-3 yang merangkumi kemahiran membaca, menulis dan bercerita dalam bahasa Malaysia dan bahasa Inggeris.',
    'sederhana',
    'mata_pelajaran',
    '2026-01-15',
    '2025-12-15',
    (SELECT id FROM users WHERE email = 'peneraju@moe.gov.my'),
    (SELECT id FROM users WHERE email = 'peneraju@moe.gov.my'),
    (SELECT id FROM departments WHERE code = 'BPR')
);

-- Insert sample syor for JPN (updated with required fields)
INSERT INTO syor (title, description, priority, pemeriksaan_type, due_date, response_deadline, created_by, assigned_by, assigned_to_jpn) VALUES
(
    'Audit Infrastruktur Sekolah Selangor',
    'Menjalankan audit menyeluruh terhadap infrastruktur sekolah di negeri Selangor termasuk kemudahan asas seperti makmal sains, perpustakaan, dan kemudahan sukan.',
    'tinggi',
    'infrastruktur',
    '2025-12-01',
    '2025-11-01',
    (SELECT id FROM users WHERE email = 'peneraju@moe.gov.my'),
    (SELECT id FROM users WHERE email = 'peneraju@moe.gov.my'),
    (SELECT id FROM jpn WHERE state = 'Selangor')
),
(
    'Peningkatan Kualiti Guru di Johor',
    'Program peningkatan kemahiran dan kualiti guru melalui kursus professional development dan pembangunan kepimpinan untuk guru-guru di negeri Johor.',
    'sederhana',
    'kualiti_guru',
    '2026-02-28',
    '2026-01-28',
    (SELECT id FROM users WHERE email = 'peneraju@moe.gov.my'),
    (SELECT id FROM users WHERE email = 'peneraju@moe.gov.my'),
    (SELECT id FROM jpn WHERE state = 'Johor')
);

-- Insert initial status tracking
INSERT INTO status_tracking (syor_id, department_id, status, updated_by, comments) VALUES
(
    (SELECT id FROM syor WHERE title = 'Penambahbaikan Kurikulum Matematik Tingkatan 4'),
    (SELECT id FROM departments WHERE code = 'BPK'),
    'dalam_tindakan',
    (SELECT id FROM users WHERE email = 'raj.kumar@moe.gov.my'),
    'Telah memulakan kajian awal dan perbincangan dengan pakar kurikulum.'
),
(
    (SELECT id FROM syor WHERE title = 'Pelaksanaan Sistem Pembelajaran Digital'),
    (SELECT id FROM departments WHERE code = 'BTP'),
    'belum_selesai',
    (SELECT id FROM users WHERE email = 'admin@moe.gov.my'),
    'Menunggu kelulusan budget dan pemilihan vendor teknologi.'
),
(
    (SELECT id FROM syor WHERE title = 'Program Literasi Awal Kanak-kanak'),
    (SELECT id FROM departments WHERE code = 'BPR'),
    'belum_selesai',
    (SELECT id FROM users WHERE email = 'siti.aminah@moe.gov.my'),
    'Dalam proses pembentukan jawatankuasa projek.'
);

-- Insert status tracking for JPN assignments
INSERT INTO status_tracking (syor_id, jpn_id, status, updated_by, comments) VALUES
(
    (SELECT id FROM syor WHERE title = 'Audit Infrastruktur Sekolah Selangor'),
    (SELECT id FROM jpn WHERE state = 'Selangor'),
    'dalam_tindakan',
    (SELECT id FROM users WHERE email = 'jpn.selangor@moe.gov.my'),
    'Tim audit telah dibentuk dan jadual lawatan sekolah sedang disediakan.'
),
(
    (SELECT id FROM syor WHERE title = 'Peningkatan Kualiti Guru di Johor'),
    (SELECT id FROM jpn WHERE state = 'Johor'),
    'belum_selesai',
    (SELECT id FROM users WHERE email = 'admin@moe.gov.my'),
    'Menunggu pengesahan dari JPN Johor untuk memulakan program.'
);

-- Insert sample notifications  
INSERT INTO notifications (user_id, title, message, type, syor_id) VALUES
(
    (SELECT id FROM users WHERE email = 'raj.kumar@moe.gov.my'),
    'Syor Baharu Diterima',
    'Anda telah menerima syor baharu: Penambahbaikan Kurikulum Matematik Tingkatan 4',
    'new_syor',
    (SELECT id FROM syor WHERE title = 'Penambahbaikan Kurikulum Matematik Tingkatan 4')
),
(
    (SELECT id FROM users WHERE email = 'admin@moe.gov.my'),
    'Deadline Menghampiri',
    'Syor "Pelaksanaan Sistem Pembelajaran Digital" akan tamat tempoh dalam 30 hari',
    'deadline',
    (SELECT id FROM syor WHERE title = 'Pelaksanaan Sistem Pembelajaran Digital')
),
(
    (SELECT id FROM users WHERE email = 'siti.aminah@moe.gov.my'),
    'Status Dikemas Kini',
    'Status syor "Program Literasi Awal Kanak-kanak" telah dikemas kini',
    'status_update',
    (SELECT id FROM syor WHERE title = 'Program Literasi Awal Kanak-kanak')
);

-- Insert sample audit logs
INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values) VALUES
(
    (SELECT id FROM users WHERE email = 'peneraju@moe.gov.my'),
    'INSERT',
    'syor',
    (SELECT id FROM syor WHERE title = 'Penambahbaikan Kurikulum Matematik Tingkatan 4'),
    '{"title": "Penambahbaikan Kurikulum Matematik Tingkatan 4", "priority": "tinggi"}'
),
(
    (SELECT id FROM users WHERE email = 'raj.kumar@moe.gov.my'),
    'UPDATE',
    'status_tracking',
    (SELECT id FROM status_tracking WHERE syor_id = (SELECT id FROM syor WHERE title = 'Penambahbaikan Kurikulum Matematik Tingkatan 4')),
    '{"status": "dalam_tindakan", "weight": 0.5}'
);