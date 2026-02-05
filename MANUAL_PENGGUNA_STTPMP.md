# 📚 MANUAL PENGGUNA SISTEM STTPMP
## Sistem Tahap Tindakan Perakuan Menteri Pendidikan

**Versi:** 1.0  
**Tarikh:** Januari 2026  
**Platform:** Web-based System  
**URL:** https://sttpmp.vercel.app

---

## 📑 Kandungan
1. [Pengenalan Sistem](#1-pengenalan-sistem)
2. [Peranan Pengguna & Akses](#2-peranan-pengguna--akses)
3. [Mekanisma Pendaftaran](#3-mekanisma-pendaftaran)
4. [Pengurusan Hebahan](#4-pengurusan-hebahan)
5. [Pengurusan Syor](#5-pengurusan-syor)
6. [Paparan Dashboard](#6-paparan-dashboard)
7. [Sistem Notifikasi](#7-sistem-notifikasi)

---

## 1. Pengenalan Sistem

### 1.1 Tujuan Sistem
STTPMP adalah sistem pemantauan digital yang direka khas untuk:
- Menjejak status tindakan terhadap perakuan/syor Menteri Pendidikan
- Memantau prestasi bahagian dan JPN dalam melaksanakan syor
- Memberikan paparan masa nyata (real-time) kepada pihak pengurusan
- Mengautomasikan notifikasi deadline dan amaran lewat

### 1.2 Teknologi Digunakan
- **Frontend:** Next.js 15 + React 19 + TypeScript
- **Backend:** Supabase (PostgreSQL + Real-time)
- **Keselamatan:** Bcrypt encryption, RLS policies, JWT tokens
- **Deployment:** Vercel Cloud Platform

### 1.3 Traffic Light System (Sistem Lampu Isyarat)
Sistem menggunakan kod warna untuk status syor:

| Status | Warna | Weight | Maksud |
|--------|-------|--------|--------|
| 🔴 **Belum Selesai** | Merah | 0 | Tiada tindakan diambil / Lewat |
| 🟡 **Dalam Tindakan** | Kuning | 0.5 | Sedang dalam proses |
| 🟢 **Selesai** | Hijau | 1 | Telah diselesaikan sepenuhnya |

**Kiraan Peratusan Pencapaian:**
```
% Selesai = (Jumlah Weight / Jumlah Syor) × 100
Contoh: (0 + 0.5 + 1 + 1) / 4 = 2.5/4 = 62.5%
```

---

## 2. Peranan Pengguna & Akses

### 2.1 Senarai Peranan

#### 🔴 **1. ADMIN (Pentadbir Sistem)**
**Tanggungjawab:**
- Menguruskan keseluruhan sistem
- Meluluskan permohonan pendaftaran pengguna baharu
- Mencipta dan menguruskan akaun pengguna
- Menguruskan hebahan sistem
- Melihat semua data dan laporan

**Akses Page:**
- ✅ Dashboard (akses penuh semua data)
- ✅ Syor (lihat & edit semua syor)
- ✅ Pengguna (`/admin`)
- ✅ Pengurusan Pengguna (`/admin/users`)
- ✅ Pengumuman (`/admin/announcements`)
- ✅ Laporan (`/admin/laporan`)
- ✅ Cipta Admin (`/admin/create-admin`)

**Keupayaan:**
- Cipta, edit, padam pengguna
- Luluskan/tolak permohonan pendaftaran
- Tukar peranan pengguna
- Cipta dan urus hebahan/pengumuman
- Eksport laporan
- Lihat audit logs

---

#### 🔵 **2. PENERAJU PEMERIKSAAN (Peneraju Sektor - JNIP)**
**Tanggungjawab:**
- Mencipta syor baharu dari laporan pemeriksaan
- Mengagihkan (assign) syor kepada Bahagian atau JPN
- Memantau syor dari sektor masing-masing (SPK, SPHEMK, SPIP)

**Akses Page:**
- ✅ Dashboard (lihat syor sektor sendiri sahaja)
- ✅ Syor (lihat syor yang dicipta oleh sektor sendiri)
- ✅ Cipta Syor (`/create-syor`)
- ✅ Detail Syor (dengan keupayaan edit)

**Keupayaan:**
- Cipta syor baharu dengan butiran lengkap
- Pilih assign ke Bahagian atau JPN
- Tetapkan priority dan deadline
- Upload dokumen sokongan (PDF, max 10MB)
- Edit syor yang dicipta sendiri
- Pantau status syor dari sektornya

**Had Akses:**
- ❌ Tidak boleh lihat syor sektor lain
- ❌ Tidak boleh approve pengguna
- ❌ Tidak boleh cipta hebahan

**Sektor yang boleh dipilih:**
- SDP - Sektor Dasar dan Perancangan
- SDTM - Sektor Data dan Teknologi Maklumat
- SSJK - Sektor Standard dan Jaminan Kualiti
- SPK - Sektor Penaziran Kurikulum
- SPHEMK - Sektor Penaziran Hal Ehwal Murid & Kokurikulum
- SPIP - Sektor Penaziran Institusi Pendidikan

---

#### 🟢 **3. PENYELARAS BAHAGIAN**
**Tanggungjawab:**
- Mengemaskini status syor yang diassign kepada bahagian
- Memberikan maklum balas dan komen
- Memantau prestasi bahagian sendiri

**Akses Page:**
- ✅ Dashboard (lihat data bahagian sendiri sahaja)
- ✅ Syor (hanya syor assigned to bahagian)
- ✅ Detail Syor (dengan keupayaan update status)

**Keupayaan:**
- Update status: Belum Selesai → Dalam Tindakan → Selesai
- Tambah komen/ulasan pada syor
- Upload dokumen maklum balas
- Lihat history status tracking

**Had Akses:**
- ❌ Tidak boleh lihat syor bahagian lain
- ❌ Tidak boleh cipta syor baharu
- ❌ Tidak boleh edit syor orang lain
- ❌ Tidak boleh assign syor ke bahagian lain

**Bahagian yang tersedia:** *(merujuk kepada struktur MOE)*
- Bahagian Pembangunan Kurikulum (BPK)
- Bahagian Perancangan dan Penyelidikan (BPP)
- Bahagian Pengurusan Sekolah Harian (BPSH)
- Dan lain-lain...

---

#### 🟢 **4. PENYELARAS JPN (Jabatan Pendidikan Negeri)**
**Tanggungjawab:**
- Mengemaskini status syor yang diassign kepada JPN negeri
- Memberikan maklum balas berkaitan pelaksanaan di peringkat negeri
- Koordinasi dengan sekolah/PPD

**Akses Page:**
- ✅ Dashboard (lihat data JPN sendiri sahaja)
- ✅ Syor (hanya syor assigned to JPN negeri)
- ✅ Detail Syor (dengan keupayaan update status)

**Keupayaan:**
- Update status syor JPN
- Tambah komen dan maklum balas
- Upload dokumen/bukti pelaksanaan
- Lihat history dan progress

**Had Akses:**
- ❌ Tidak boleh lihat syor JPN lain
- ❌ Tidak boleh cipta syor baharu
- ❌ Tidak boleh edit syor orang lain

**JPN yang boleh dipilih:** *(16 negeri)*
- JPN Johor, JPN Kedah, JPN Kelantan
- JPN Melaka, JPN Negeri Sembilan
- JPN Pahang, JPN Perak, JPN Perlis
- JPN Pulau Pinang, JPN Sabah, JPN Sarawak
- JPN Selangor, JPN Terengganu
- JPN Wilayah Persekutuan Kuala Lumpur
- JPN Wilayah Persekutuan Labuan
- JPN Wilayah Persekutuan Putrajaya

---

#### 🔵 **5. PENYELARAS JNN (Jemaah Nazir dan Jaminan Kualiti) - VIEW ONLY**
**Tanggungjawab:**
- Memantau dan melapor status pelaksanaan syor (read-only)
- Menyediakan analisis untuk tindakan susulan JNIP
- **PENTING:** Peranan ini hanya boleh MELIHAT sahaja, tidak boleh edit

**Akses Page:**
- ✅ Dashboard (lihat data JPN yang ditetapkan - READ ONLY)
- ✅ Syor (lihat syor JPN sahaja - READ ONLY)
- ✅ Detail Syor (lihat sahaja, TIDAK BOLEH edit)

**Keupayaan:**
- Lihat semua syor assigned to JPN tertentu
- Baca komen dan status tracking
- Download dokumen
- View analytics dan laporan

**Had Akses:**
- ❌ TIDAK BOLEH update status syor
- ❌ TIDAK BOLEH tambah komen
- ❌ TIDAK BOLEH upload dokumen
- ❌ TIDAK BOLEH cipta atau edit apa-apa
- ❌ View only untuk monitoring purpose

**Nota Penting:**
> ⚠️ Penyelaras JNN adalah peranan khas untuk pemantauan sahaja. Jika pengguna memerlukan keupayaan edit, gunakan peranan "Penyelaras JPN" atau "Pemantau".

---

#### 👁️ **6. PEMANTAU (Monitor/Viewer)**
**Tanggungjawab:**
- Memantau keseluruhan sistem (read-only)
- Melihat laporan dan analytics
- Tidak terlibat dalam operasi harian

**Akses Page:**
- ✅ Dashboard (lihat semua data - READ ONLY)
- ✅ Syor (lihat semua syor - READ ONLY)
- ✅ Detail Syor (lihat sahaja)

**Keupayaan:**
- Lihat semua syor tanpa sekatan
- Baca komen dan maklum balas
- View statistics dan charts
- Download reports

**Had Akses:**
- ❌ TIDAK BOLEH edit apa-apa
- ❌ TIDAK BOLEH cipta syor
- ❌ TIDAK BOLEH update status
- ❌ TIDAK BOLEH tambah komen

---

### 2.2 Ringkasan Akses Page

| Page/Feature | Admin | Peneraju | Penyelaras Bahagian | Penyelaras JPN | Penyelaras JNN | Pemantau |
|--------------|-------|----------|---------------------|----------------|----------------|----------|
| **Dashboard** | ✅ All | ✅ Sektor | ✅ Bahagian | ✅ JPN | 👁️ JPN | 👁️ All |
| **Syor List** | ✅ All | ✅ Sektor | ✅ Bahagian | ✅ JPN | 👁️ JPN | 👁️ All |
| **Create Syor** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Edit Syor** | ✅ | ✅ Own | ❌ | ❌ | ❌ | ❌ |
| **Update Status** | ✅ | ✅ | ✅ Assigned | ✅ Assigned | ❌ | ❌ |
| **Add Comments** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **User Management** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Announcements** | ✅ Create/Edit | 👁️ View | 👁️ View | 👁️ View | 👁️ View | 👁️ View |
| **Reports** | ✅ All | ✅ Sektor | ✅ Bahagian | ✅ JPN | 👁️ JPN | 👁️ All |

**Keterangan:**
- ✅ = Boleh access dan edit
- 👁️ = View only (tidak boleh edit)
- ❌ = Tidak boleh access

---

### 2.3 Carta Alir Hierarki Peranan

```
┌─────────────────────────────────────┐
│           👑 ADMIN                  │
│   (Full System Access & Control)   │
└─────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ↓                   ↓
┌──────────────────┐  ┌──────────────────┐
│  🔵 PENERAJU     │  │  👁️ PEMANTAU     │
│  PEMERIKSAAN     │  │  (View All Data) │
│  (Create Syor)   │  └──────────────────┘
└──────────────────┘
        │
        ├──→ Assign to →─┐
        │                ↓
        │         ┌─────────────────────┐
        │         │  🟢 PENYELARAS      │
        │         │     BAHAGIAN        │
        │         │  (Update Status)    │
        │         └─────────────────────┘
        │
        └──→ Assign to →─┐
                         ↓
                  ┌─────────────────────┐
                  │  🟢 PENYELARAS JPN  │
                  │   (Update Status)   │
                  └─────────────────────┘
                           │
                           │ (Monitored by)
                           ↓
                  ┌─────────────────────┐
                  │  🔵 PENYELARAS JNN  │
                  │   (VIEW ONLY)       │
                  └─────────────────────┘
```

---

## 3. Mekanisma Pendaftaran

### 3.1 Proses Pendaftaran Pengguna Baharu

#### **Langkah 1: Akses Page Pendaftaran**
1. Buka URL sistem: `https://sttpmp.vercel.app`
2. Klik butang **"Daftar Akaun Baharu"** di halaman login
3. Atau terus ke: `https://sttpmp.vercel.app/register`

#### **Langkah 2: Isi Borang Pendaftaran**
Lengkapkan maklumat berikut:

**Maklumat Asas:**
- **Email**: Mesti email rasmi @moe.gov.my
- **Nama Penuh**: Nama pengguna seperti dalam kad pengenalan
- **Password**: Minimum 8 karakter (huruf besar, kecil, nombor)
- **Confirm Password**: Ulang password untuk pengesahan

**Peranan yang Dipohon** *(Optional - untuk proses kelulusan):*
- Penyelaras Bahagian
- Penyelaras JPN
- Penyelaras JNN (View Only)
- Peneraju Pemeriksaan (Sektor JNIP)

**Validasi Email:**
- ✅ Email MESTI berakhir dengan **@moe.gov.my**
- ❌ Email lain tidak akan diterima (contoh: @gmail.com, @yahoo.com)

**Contoh Email yang SAH:**
```
✅ ahmad.bin.ali@moe.gov.my
✅ siti.nurhaliza@moe.gov.my
✅ jpn.johor@moe.gov.my
```

**Contoh Email TIDAK SAH:**
```
❌ ahmad@gmail.com
❌ siti.nurhaliza@yahoo.com
❌ user@outlook.com
```

#### **Langkah 3: Submit Permohonan**
1. Klik butang **"Daftar"**
2. Sistem akan validate semua input
3. Jika berjaya, akan terpapar mesej:
   ```
   ✅ Pendaftaran Berjaya
   Permohonan pendaftaran anda telah dihantar.
   Akaun anda menunggu kelulusan daripada administrator sistem.
   ```

#### **Langkah 4: Tunggu Kelulusan Admin**
**Status Permohonan:**
- 📝 **Pending**: Permohonan masih dalam review
- ✅ **Approved**: Akaun telah diluluskan (boleh login)
- ❌ **Rejected**: Permohonan ditolak

**Tempoh Kelulusan:**
- Biasanya dalam masa 1-2 hari bekerja
- Admin akan menerima notifikasi automatik
- Pengguna akan terima email bila akaun diluluskan

#### **Langkah 5: Login Selepas Diluluskan**
1. Terima email pemberitahuan kelulusan
2. Pergi ke halaman login: `https://sttpmp.vercel.app/login`
3. Masukkan email dan password yang didaftarkan
4. Klik **"Log Masuk"**
5. Sistem akan redirect ke Dashboard

---

### 3.2 Proses Kelulusan oleh Admin

#### **Langkah Admin Untuk Meluluskan Permohonan:**

**1. Login sebagai Admin**
- Pergi ke `/admin`
- Akan terpapar senarai "Permohonan Pendaftaran"

**2. Semak Permohonan**
Untuk setiap permohonan, admin akan nampak:
- 👤 Nama pengguna
- 📧 Email
- ⏱️ Tarikh permohonan
- 📅 Bilangan hari menunggu

**3. Tetapkan Peranan & Maklumat Tambahan**

**Jika Peranan: Penyelaras Bahagian**
- Pilih **Bahagian** dari dropdown
- Contoh: Bahagian Pembangunan Kurikulum (BPK)

**Jika Peranan: Penyelaras JPN**
- Pilih **JPN Negeri** dari dropdown
- Contoh: JPN Johor

**Jika Peranan: Penyelaras JNN (View Only)**
- Pilih **JPN Negeri** yang akan dipantau
- ⚠️ Pengguna HANYA boleh VIEW, tidak boleh edit

**Jika Peranan: Peneraju Pemeriksaan**
- Pilih **Sektor** dari dropdown:
  - SDP - Sektor Dasar dan Perancangan
  - SDTM - Sektor Data dan Teknologi Maklumat
  - SSJK - Sektor Standard dan Jaminan Kualiti
  - SPK - Sektor Penaziran Kurikulum
  - SPHEMK - Sektor Penaziran Hal Ehwal Murid & Kokurikulum
  - SPIP - Sektor Penaziran Institusi Pendidikan

**Jika Peranan: Pemantau**
- Tidak perlu pilih apa-apa (view-only access to all)

**4. Luluskan atau Tolak**
- Klik **"Luluskan"** untuk approve
- Atau klik **"Tolak"** untuk reject (dengan sebab)

**5. Notifikasi Automatik**
Sistem akan auto-hantar:
- ✅ Email pemberitahuan kepada pengguna
- ✅ Notifikasi dalam sistem
- ✅ Update status account ke "Active"

---

### 3.3 Alternatif: Admin Cipta Akaun Terus

#### **Admin boleh cipta akaun pengguna terus tanpa proses registration:**

**Pergi ke `/admin/create-admin` atau `/admin/users`**

**Isi maklumat:**
1. **Email** (@moe.gov.my)
2. **Nama Penuh**
3. **Password** (temporary - pengguna boleh tukar kemudian)
4. **Peranan**:
   - Admin
   - Peneraju Pemeriksaan → Pilih Sektor
   - Penyelaras Bahagian → Pilih Bahagian
   - Penyelaras JPN → Pilih JPN
   - Penyelaras JNN → Pilih JPN (View Only)
   - Pemantau

**Klik "Cipta Pengguna"**

**Akaun akan instantly active** dan pengguna boleh login terus.

---

### 3.4 Carta Alir Pendaftaran

```
┌─────────────────────────────┐
│   Pengguna Buka /register   │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│   Isi Borang Pendaftaran    │
│   - Email @moe.gov.my       │
│   - Nama, Password          │
│   - Pilih Peranan (optional)│
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│   Validate & Submit         │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ ✅ Permohonan Dihantar      │
│ Status: PENDING APPROVAL    │
└─────────────┬───────────────┘
              ↓
        ┌─────┴──────┐
        ↓            ↓
┌────────────┐  ┌────────────┐
│   Admin    │  │  Pengguna  │
│  Login to  │  │   Tunggu   │
│  /admin    │  │   Email    │
└─────┬──────┘  └────────────┘
      ↓
┌─────────────────────────────┐
│ Admin Semak Permohonan      │
│ - Verify details            │
│ - Set Role + Dept/JPN/Sektor│
└─────────────┬───────────────┘
              ↓
      ┌───────┴────────┐
      ↓                ↓
┌──────────┐     ┌──────────┐
│ LULUSKAN │     │  TOLAK   │
└────┬─────┘     └────┬─────┘
     ↓                ↓
┌──────────┐     ┌──────────┐
│ Account  │     │ Account  │
│ ACTIVE   │     │ REJECTED │
└────┬─────┘     └────┬─────┘
     ↓                ↓
┌──────────┐     ┌──────────┐
│ Email    │     │ Email    │
│ Approved │     │ Rejection│
└────┬─────┘     └──────────┘
     ↓
┌──────────┐
│ Pengguna │
│  LOGIN   │
└──────────┘
```

---

### 3.5 Troubleshooting Pendaftaran

#### **Masalah 1: Email tidak diterima sistem**
```
❌ Error: Email mesti berakhir dengan @moe.gov.my
```
**Penyelesaian:**
- Pastikan guna email rasmi MOE sahaja
- Format: nama@moe.gov.my

#### **Masalah 2: Email sudah wujud**
```
❌ Error: Email ini telah didaftarkan
```
**Penyelesaian:**
- Cuba login dengan akaun sedia ada
- Atau hubungi admin untuk reset password

#### **Masalah 3: Password terlalu lemah**
```
❌ Error: Password mesti minimum 8 karakter
```
**Penyelesaian:**
- Guna kombinasi huruf besar, kecil, nombor
- Contoh: `Moe2024!`

#### **Masalah 4: Permohonan lama pending**
**Penyelesaian:**
- Hubungi admin sistem melalui email rasmi
- Berikan maklumat: Nama, Email, Tarikh daftar

---

## 4. Pengurusan Hebahan

### 4.1 Apa itu Hebahan/Pengumuman?

**Hebahan** adalah pengumuman sistem yang dipaparkan di halaman utama untuk semua pengguna. Hebahan digunakan untuk:
- 📢 Notis penting dari pihak pengurusan
- 🔔 Pengumuman sistem maintenance
- 📋 Update polisi atau prosedur baharu
- 🎯 Reminder deadline penting

### 4.2 Akses Pengurusan Hebahan

**Hanya ADMIN sahaja** boleh cipta dan urus hebahan.

**URL:** `/admin/announcements`

**Menu Navigation:**
- Desktop: Klik **"Pengumuman"** di header (warna ungu)
- Mobile: Buka menu → Klik **"Pengumuman"**

---

### 4.3 Mencipta Hebahan Baharu

#### **Langkah 1: Akses Page Pengumuman**
1. Login sebagai Admin
2. Pergi ke `/admin/announcements`
3. Klik butang **"+ Cipta Pengumuman"**

#### **Langkah 2: Isi Borang Pengumuman**

**Field yang perlu diisi:**

**1. Tajuk Pengumuman** *(Required)*
```
Contoh:
- "Perhatian: Sistem Maintenance Pada 15 Januari 2026"
- "Deadline Kemasukan Maklum Balas - 31 Jan 2026"
- "Panduan Baharu Pengurusan Syor"
```

**2. Kandungan Pengumuman** *(Required)*
- Gunakan Rich Text Editor
- Boleh format:
  - **Bold** untuk penting
  - *Italic* untuk emphasis
  - Bullet points
  - Numbered lists
  - Headings (H1, H2, H3)
  - Pautan (links)

**3. Gambar/Image** *(Optional)*
- Upload gambar banner (max 5MB)
- Format: JPG, PNG, GIF
- Recommended size: 1200x600px
- Akan dipapar di atas pengumuman

**4. Status Publish** *(Required)*
- ☑️ **Published** - Hebahan akan dipaparkan serta-merta
- ☐ **Draft** - Simpan dulu, publish kemudian

#### **Langkah 3: Preview & Publish**
1. Klik **"Preview"** untuk lihat hasil
2. Jika OK, klik **"Publish"**
3. Hebahan akan muncul di dashboard semua pengguna

---

### 4.4 Mengedit Hebahan Sedia Ada

#### **Langkah untuk Edit:**
1. Pergi ke `/admin/announcements`
2. Cari hebahan yang ingin diedit
3. Klik icon ✏️ **"Edit"**
4. Buat perubahan
5. Klik **"Kemaskini"**

#### **Perubahan yang boleh dibuat:**
- ✅ Edit tajuk
- ✅ Edit kandungan
- ✅ Tukar gambar
- ✅ Unpublish (sembunyikan dari pengguna)
- ✅ Publish semula

---

### 4.5 Memadam Hebahan

#### **Langkah untuk Padam:**
1. Pergi ke `/admin/announcements`
2. Cari hebahan yang ingin dipadam
3. Klik icon 🗑️ **"Padam"**
4. Confirm **"Ya, Padam"**

⚠️ **AMARAN:** Tindakan ini tidak boleh di-undo!

---

### 4.6 Paparan Hebahan Untuk Pengguna

#### **Di Mana Hebahan Dipaparkan:**

**1. Homepage/Dashboard (Utama)**
- Terpapar di bahagian atas (marquee/carousel)
- Auto-scroll setiap 5 saat
- Design menarik dengan gradient background

**2. Announcement Box Component**
- Kotak pengumuman di dashboard
- Papar 5 hebahan terkini
- Boleh klik untuk baca penuh

**3. Detail View (Modal Popup)**
- Klik pada hebahan untuk baca penuh
- Full content dengan formatting
- Gambar dalam saiz penuh

#### **Cara Pengguna Baca Hebahan:**
1. Login ke sistem
2. Di dashboard, scroll ke bahagian "Pengumuman"
3. Klik pada mana-mana hebahan
4. Modal popup akan terbuka
5. Baca kandungan penuh
6. Klik X atau klik di luar untuk tutup

---

### 4.7 Best Practices untuk Hebahan

#### **✅ DO (Lakukan):**
- Gunakan tajuk yang jelas dan descriptive
- Tetapkan tarikh penting dalam tajuk
- Format kandungan dengan baik (headings, bullets)
- Tambah gambar untuk menarik perhatian
- Unpublish hebahan lama yang tidak relevan
- Update secara berkala

#### **❌ DON'T (Jangan):**
- Jangan guna ALL CAPS dalam tajuk
- Jangan publish hebahan yang terlalu panjang
- Jangan upload gambar bersaiz besar (slow loading)
- Jangan spam dengan hebahan tidak penting
- Jangan lupa unpublish selepas tarikh luput

#### **Contoh Hebahan yang BAIK:**
```markdown
📢 Tajuk: Perhatian: Deadline Kemasukan Maklum Balas - 31 Januari 2026

📝 Kandungan:
Assalamualaikum dan Salam Sejahtera,

Kepada semua Penyelaras Bahagian dan JPN,

Berikut adalah peringatan penting:

**Deadline Kemasukan:**
- Tarikh: 31 Januari 2026 (Jumaat)
- Masa: 5:00 PM

**Tindakan Diperlukan:**
1. Semak status syor yang ditugaskan
2. Kemaskini status terkini
3. Upload dokumen sokongan (jika ada)

Jika ada sebarang pertanyaan, sila hubungi:
📧 admin@sttpmp.moe.gov.my
📞 03-xxxx xxxx

Terima kasih atas kerjasama anda.

Sekian, terima kasih.
```

---

### 4.8 Cara Pengguna Lihat Pengumuman

#### **Di Dashboard:**
```
┌───────────────────────────────────────┐
│     📢 PENGUMUMAN TERKINI             │
├───────────────────────────────────────┤
│                                       │
│  [Image Banner]                       │
│                                       │
│  🔴 Perhatian: Sistem Maintenance     │
│     15 Januari 2026, 2:00 AM - 5:00 AM│
│                                       │
│     Sistem akan ditutup untuk...     │
│     [Lihat Selanjutnya →]            │
│                                       │
│  📅 14 Jan 2026                       │
├───────────────────────────────────────┤
│  [Pengumuman 2]                       │
│  [Pengumuman 3]                       │
│  ...                                  │
└───────────────────────────────────────┘
```

#### **Klik untuk Detail View:**
```
┌─────────────────────────────────────────┐
│  🔴 Perhatian: Sistem Maintenance    [X]│
├─────────────────────────────────────────┤
│                                         │
│  [Full Image Banner]                    │
│                                         │
│  Assalamualaikum dan Salam Sejahtera,  │
│                                         │
│  Sistem STTPMP akan menjalani          │
│  penyelenggaraan pada:                 │
│                                         │
│  📅 Tarikh: 15 Januari 2026            │
│  ⏰ Masa: 2:00 AM - 5:00 AM            │
│                                         │
│  Sepanjang tempoh ini, sistem tidak   │
│  boleh diakses. Sila plan kerja anda  │
│  dengan sewajarnya.                    │
│                                         │
│  Terima kasih.                         │
│                                         │
│  📅 Diterbitkan: 14 Jan 2026           │
└─────────────────────────────────────────┘
```

---

## 5. Pengurusan Syor

### 5.1 Apa itu Syor?

**Syor** adalah rekod rasmi perakuan/recommendation dari laporan pemeriksaan yang perlu ditindak lanjut oleh Bahagian atau JPN.

**Kandungan Syor:**
- 📋 Tajuk syor (dari laporan pemeriksaan)
- 📝 Kandungan/butiran syor
- 🏢 Diassign kepada: Bahagian atau JPN
- 📅 Deadline maklum balas & penyelesaian
- 🎯 Priority level
- 📊 Jenis pemeriksaan
- 📎 Dokumen sokongan (PDF)

---

### 5.2 Mencipta Syor Baharu (Peneraju Pemeriksaan)

**HANYA Peneraju Pemeriksaan boleh cipta syor baharu.**

#### **Langkah 1: Akses Page Create Syor**
1. Login sebagai Peneraju Pemeriksaan
2. Pergi ke Dashboard
3. Klik butang **"+ Cipta Syor Baharu"**
4. Atau pergi terus ke: `/create-syor`

#### **Langkah 2: Pilih Pemeriksaan (Auto-fetch dari API MOE)**

**Sistem akan auto-load senarai pemeriksaan terkini** dari API e-Nazir MOE:

**Cara Pilih:**
1. Klik pada field **"Cari Pemeriksaan"**
2. Type untuk cari (contoh: "Matematik", "Sekolah ABC")
3. Dropdown akan tunjuk senarai matching
4. Klik untuk pilih pemeriksaan

**Maklumat auto-fill:**
- ✅ Tajuk Syor → Nama Pemeriksaan
- ✅ Jenis Pemeriksaan → Kod Jenis Pemeriksaan

**Contoh Data dari API:**
```json
{
  "NamaPemeriksaan": "Pemeriksaan Matematik Tahun 4 - SK Taman Desa",
  "Tahun": "2026",
  "KodJenisPemeriksaan": "MP",
  "JenisPemeriksaan": "Mata Pelajaran"
}
```

#### **Langkah 3: Isi Butiran Syor**

**1. Kandungan Syor** *(Required)*
```
Contoh kandungan:
"Berdasarkan penemuan pemeriksaan, didapati tahap pencapaian 
murid dalam mata pelajaran Matematik masih rendah. Guru 
perlu mengadakan kelas tambahan dan menggunakan kaedah 
pengajaran yang lebih interaktif."
```

**2. Assign Kepada** *(Required - pilih SATU sahaja)*

**Pilihan A: Bahagian**
- Pilih dari dropdown senarai Bahagian MOE
- Contoh: Bahagian Pembangunan Kurikulum (BPK)

**ATAU**

**Pilihan B: JPN (Jabatan Pendidikan Negeri)**
- Pilih dari dropdown 16 JPN negeri
- Contoh: JPN Johor

⚠️ **PENTING:** Boleh assign ke Bahagian ATAU JPN sahaja, tidak boleh kedua-dua!

**3. Priority Level** *(Required)*
- 🟢 **Rendah** - Tidak urgent, boleh ambil masa
- 🟡 **Sederhana** - Normal priority (default)
- 🟠 **Tinggi** - Perlu tindakan segera
- 🔴 **Kritikal** - Sangat urgent, perlu immediate action

**4. Jenis Pemeriksaan** *(Auto-filled from API)*
- Mata Pelajaran
- Keciciran Murid
- Infrastruktur
- Kualiti Guru
- Kurikulum

**5. Deadline Maklum Balas** *(Required)*
- Pilih tarikh untuk Bahagian/JPN hantar maklum balas
- Format: DD/MM/YYYY
- Contoh: 31/01/2026

**6. Deadline Penyelesaian** *(Required)*
- Pilih tarikh untuk complete syor
- MESTI lebih lewat dari deadline maklum balas
- Format: DD/MM/YYYY
- Contoh: 28/02/2026

**7. Upload Dokumen** *(Optional)*
- Format: PDF sahaja
- Max size: 10MB
- Contoh: Laporan pemeriksaan lengkap

#### **Langkah 4: Submit Syor**
1. Review semua maklumat
2. Klik **"Cipta Syor"**
3. Sistem akan validate
4. Jika valid, syor dicipta dan:
   - ✅ Notifikasi dihantar ke Penyelaras assigned
   - ✅ Email notification
   - ✅ Status initial: **Belum Selesai** (🔴)

---

### 5.3 Melihat Senarai Syor

**Semua pengguna boleh lihat syor (dengan had akses masing-masing).**

#### **Akses Senarai Syor:**
- URL: `/syor`
- Menu: Klik **"Syor"** di navigation header

#### **Paparan Berdasarkan Peranan:**

**Admin:**
- Lihat SEMUA syor tanpa sekatan

**Peneraju Pemeriksaan:**
- Lihat syor dari SEKTOR sendiri sahaja
- Contoh: Peneraju SPK → Lihat syor cipta oleh SPK

**Penyelaras Bahagian:**
- Lihat syor yang DIASSIGN ke bahagian sendiri
- Contoh: Penyelaras BPK → Lihat syor assigned to BPK

**Penyelaras JPN:**
- Lihat syor yang DIASSIGN ke JPN negeri sendiri
- Contoh: Penyelaras JPN Johor → Lihat syor assigned to JPN Johor

**Penyelaras JNN:**
- Lihat syor JPN yang ditetapkan (VIEW ONLY)
- Tidak boleh edit atau update status

**Pemantau:**
- Lihat SEMUA syor (VIEW ONLY)

---

### 5.4 Filter Syor

**Di page senarai syor, ada filter tabs:**

#### **1. Semua**
- Papar semua syor (mengikut akses peranan)

#### **2. Belum Selesai** 🔴
- Syor dengan status: Belum Selesai
- Atau syor yang overdue/lewat

#### **3. Dalam Tindakan** 🟡
- Syor yang sedang dalam proses

#### **4. Selesai** 🟢
- Syor yang telah diselesaikan sepenuhnya

#### **5. Hampir Tamat** ⏰
- Syor dengan deadline dalam 7 hari
- Auto-highlight untuk perhatian

---

### 5.5 Melihat Detail Syor

#### **Cara Akses:**
1. Dari senarai syor
2. Klik pada mana-mana syor card
3. Sistem akan redirect ke: `/syor/[id]`

#### **Maklumat yang dipaparkan:**

**1. Header Section:**
- Tajuk syor (bold, besar)
- Badge priority (warna coded)
- Badge status (traffic light)

**2. Maklumat Asas:**
```
📋 Jenis Pemeriksaan: Mata Pelajaran
🏢 Assigned Kepada: Bahagian Pembangunan Kurikulum (BPK)
📅 Deadline Maklum Balas: 31 Jan 2026
📅 Deadline Penyelesaian: 28 Feb 2026
👤 Dicipta Oleh: Ahmad bin Ali (Sektor SPK)
📆 Tarikh Cipta: 15 Jan 2026
```

**3. Kandungan Syor:**
- Full text description
- Formatted dengan paragraphs

**4. Dokumen Sokongan:**
- 📎 Jika ada, papar link download
- Klik untuk download PDF

**5. Status Tracking History:**
- Timeline status changes
- Siapa update, bila update
- Komen/remarks dari penyelaras

**6. Action Buttons** (jika ada akses):
- 🔄 **Update Status** (untuk Penyelaras)
- ✏️ **Edit Syor** (untuk Peneraju/Admin)
- 🗑️ **Padam** (untuk Admin sahaja)

---

### 5.6 Mengemaskini Status Syor (Penyelaras)

**Penyelaras Bahagian/JPN boleh update status syor yang assigned to mereka.**

#### **Langkah 1: Akses Detail Syor**
1. Login sebagai Penyelaras
2. Pergi ke `/syor`
3. Klik pada syor yang assigned kepada anda
4. Klik butang **"🔄 Kemaskini Status"**

#### **Langkah 2: Pilih Status Baharu**

**Pilihan Status:**

**1. Belum Selesai** 🔴 (Weight: 0)
- Belum ada tindakan
- Atau stuck/pending
- **Gunakan jika:** Baru terima, belum mula

**2. Dalam Tindakan** 🟡 (Weight: 0.5)
- Sedang dalam proses
- Ada progress tetapi belum siap
- **Gunakan jika:** Sudah mula kerja, masih ongoing

**3. Selesai** 🟢 (Weight: 1)
- Sudah complete sepenuhnya
- Tiada lagi tindakan diperlukan
- **Gunakan jika:** 100% siap

#### **Langkah 3: Tambah Komen/Maklum Balas** *(Optional)*

**Contoh komen yang baik:**
```
✅ "Kelas tambahan telah diadakan setiap Rabu & Jumaat. 
Modul PdP baharu telah diedarkan kepada semua guru. 
Pencapaian murid menunjukkan peningkatan 15%."

✅ "Masih dalam proses. Telah mengadakan mesyuarat dengan 
guru. Target complete minggu depan. Upload bukti gambar 
di dokumen lampiran."

✅ "Telah complete. Sila semak dokumen laporan yang 
dilampirkan untuk bukti pelaksanaan."
```

#### **Langkah 4: Upload Dokumen (Optional)**
- Upload PDF sebagai bukti
- Contoh: Gambar aktiviti, laporan progress, minit mesyuarat
- Max 10MB

#### **Langkah 5: Submit Update**
1. Klik **"Kemaskini"**
2. Sistem akan:
   - ✅ Save status baharu
   - ✅ Record timestamp
   - ✅ Simpan komen
   - ✅ Upload dokumen
   - ✅ Hantar notifikasi ke Peneraju & Admin

---

### 5.7 Maklum Balas Syor (Responses)

**Penyelaras boleh hantar maklum balas formal untuk syor.**

#### **Cara Hantar Maklum Balas:**

**1. Pergi ke Detail Syor**
- Klik syor dari senarai

**2. Scroll ke Section "Maklum Balas"**

**3. Klik "Tambah Maklum Balas"**

**4. Isi Borang:**
- **Kandungan Maklum Balas** (text)
- **Upload Dokumen** (PDF - optional)

**5. Submit**

**Maklum balas akan:**
- ✅ Dipaparkan dalam timeline syor
- ✅ Visible to Peneraju, Admin, dan Pemantau
- ✅ Generate notification
- ✅ Email alert to relevant parties

---

### 5.8 Mengedit Syor

**Hanya Peneraju (creator) dan Admin boleh edit syor.**

#### **Langkah untuk Edit:**
1. Pergi ke detail syor
2. Klik butang **"✏️ Edit Syor"**
3. Modify fields yang perlu
4. Klik **"Kemaskini"**

**Field yang boleh diedit:**
- ✅ Tajuk
- ✅ Kandungan
- ✅ Priority
- ✅ Deadline (hanya jika belum lepas)
- ✅ Assignment (tukar bahagian/JPN)
- ✅ Upload dokumen tambahan

**Field yang TIDAK boleh edit:**
- ❌ Jenis Pemeriksaan (fixed)
- ❌ Creator (auto-recorded)
- ❌ Created date

---

### 5.9 Memadam Syor

**Hanya Admin boleh padam syor.**

#### **Langkah untuk Padam:**
1. Pergi ke detail syor
2. Klik butang **"🗑️ Padam Syor"**
3. Confirm **"Ya, Padam"**

⚠️ **AMARAN:** 
- Tindakan ini TIDAK BOLEH di-undo!
- Semua status tracking akan turut dipadam
- Notifikasi akan dihantar ke semua pihak terlibat

---

### 5.10 Carta Alir Lifecycle Syor

```
┌─────────────────────────────────────────┐
│  1️⃣ Peneraju Pemeriksaan Cipta Syor   │
│     - Pilih pemeriksaan dari API       │
│     - Isi butiran                      │
│     - Assign to Bahagian/JPN           │
│     - Set deadlines                    │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  2️⃣ Sistem Auto-Create Record          │
│     Status: 🔴 BELUM SELESAI (Weight 0)│
│     Notifikasi → Penyelaras assigned   │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  3️⃣ Penyelaras Terima Notifikasi       │
│     - Email alert                      │
│     - In-app notification              │
│     - Dashboard alert                  │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  4️⃣ Penyelaras Ambil Tindakan          │
│     - Update status: DALAM TINDAKAN    │
│     - Status: 🟡 (Weight 0.5)          │
│     - Tambah komen progress            │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  5️⃣ Penyelaras Submit Maklum Balas     │
│     - Hantar maklum balas formal       │
│     - Upload dokumen bukti             │
│     - Peneraju review                  │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  6️⃣ Complete Syor                      │
│     - Update status: SELESAI           │
│     - Status: 🟢 (Weight 1)            │
│     - Archive/Close case               │
└─────────────────────────────────────────┘
```

---

## 6. Paparan Dashboard

### 6.1 Tujuan Dashboard

Dashboard adalah **pusat pemantauan utama** sistem STTPMP. Tujuan:

🎯 **Pemantauan Real-time:**
- Status terkini semua syor
- Progress completion
- Overdue alerts

📊 **Analytics & Insights:**
- Traffic light distribution
- Completion percentage
- Trend analysis

⚡ **Quick Actions:**
- Shortcut to create syor
- Quick status update
- Fast navigation

---

### 6.2 Komponen Dashboard (Berbeza Ikut Peranan)

### **ADMIN Dashboard** (Full Access)

#### **1. Summary Cards (4 cards)**
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 🔴 BELUM    │ │ 🟡 DALAM    │ │ 🟢 SELESAI  │ │ 📊 JUMLAH   │
│   SELESAI   │ │   TINDAKAN  │ │             │ │    SYOR     │
│     25      │ │     18      │ │     47      │ │     90      │
│   (28%)     │ │   (20%)     │ │   (52%)     │ │  100% ✓     │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

**Penjelasan:**
- **Belum Selesai (🔴):** Jumlah syor status red
- **Dalam Tindakan (🟡):** Jumlah syor status yellow
- **Selesai (🟢):** Jumlah syor status green
- **Jumlah Syor:** Total semua syor dalam sistem

**Kiraan %:**
```
% = (Count / Total) × 100
```

#### **2. Progress Bar (Weighted Score)**
```
┌─────────────────────────────────────────────────────┐
│  📈 PENCAPAIAN KESELURUHAN                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ████████████████████████░░░░░░░░░░░░░░  67.2%    │
│                                                     │
│  Formula: (0×25 + 0.5×18 + 1×47) / 90 = 67.2%     │
└─────────────────────────────────────────────────────┘
```

**Warna Bar:**
- 🔴 **0-33%** → Merah (Lemah)
- 🟡 **34-66%** → Kuning (Sederhana)
- 🟢 **67-100%** → Hijau (Baik)

#### **3. Chart: Status Distribution (Pie Chart)**
```
        🟢 Selesai
           52%
         ◢████◣
    🔴  ███████ 🟡
   28%  ███████  20%
    Belum  ████
    Selesai
```

#### **4. Senarai Syor Terkini (Recent Syor)**
```
┌─────────────────────────────────────────────────────┐
│  📋 SYOR TERKINI (10 entries)                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🟡 Pemeriksaan Matematik Tahun 4                  │
│     Assigned to: BPK                               │
│     Deadline: 31 Jan 2026 (14 hari lagi)          │
│     [Lihat Detail →]                               │
│  ─────────────────────────────────────────────────  │
│  🔴 Pemeriksaan Infrastruktur SK ABC              │
│     Assigned to: JPN Johor                         │
│     Deadline: 20 Jan 2026 (⚠️ LEWAT 3 HARI!)      │
│     [Lihat Detail →]                               │
│  ─────────────────────────────────────────────────  │
│  🟢 Kursus Guru Sains                             │
│     Assigned to: BPP                               │
│     Status: Selesai ✓                              │
│     [Lihat Detail →]                               │
│                                                     │
│  [...7 more entries...]                            │
│                                                     │
│  [Lihat Semua Syor →]                             │
└─────────────────────────────────────────────────────┘
```

#### **5. Hebahan/Pengumuman Box**
```
┌─────────────────────────────────────────────────────┐
│  📢 PENGUMUMAN TERKINI                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Image Banner]                                     │
│                                                     │
│  🔴 Perhatian: Sistem Maintenance                  │
│     15 Januari 2026, 2:00 AM - 5:00 AM            │
│                                                     │
│     Sistem akan ditutup untuk penyelenggaraan...   │
│     [Lihat Selanjutnya →]                          │
│                                                     │
│  📅 14 Jan 2026                                    │
│  ─────────────────────────────────────────────────  │
│  [2 more announcements...]                         │
└─────────────────────────────────────────────────────┘
```

#### **6. Quick Actions (Admin Sahaja)**
```
┌─────────────────────────────────────────┐
│  ⚡ QUICK ACTIONS                       │
├─────────────────────────────────────────┤
│  [+ Cipta Syor]   [👥 Pengguna]       │
│  [📢 Hebahan]     [📊 Laporan]         │
└─────────────────────────────────────────┘
```

#### **7. Sistem Overdue Alerts**
```
┌─────────────────────────────────────────────────────┐
│  ⚠️ AMARAN: SYOR LEWAT DEADLINE                    │
├─────────────────────────────────────────────────────┤
│  • 3 syor lewat deadline maklum balas              │
│  • 1 syor lewat deadline penyelesaian              │
│  [Lihat Butiran →]                                 │
└─────────────────────────────────────────────────────┘
```

---

### **PENERAJU PEMERIKSAAN Dashboard** (Sector-Specific)

**Filtered by Sektor:**
```
┌─────────────────────────────────────────────────────┐
│  🎯 Dashboard untuk Sektor: SPK                    │
│     (Sektor Penaziran Kurikulum)                   │
└─────────────────────────────────────────────────────┘
```

**Komponen sama seperti Admin, tetapi data filtered:**
- ✅ Hanya syor yang dicipta oleh users dalam sektor SPK
- ✅ Summary cards untuk sektor sahaja
- ✅ Progress bar sektor
- ✅ Recent syor dari sektor
- ✅ Quick action: **"+ Cipta Syor Baharu"**

---

### **PENYELARAS BAHAGIAN Dashboard** (Department-Specific)

**Filtered by Bahagian:**
```
┌─────────────────────────────────────────────────────┐
│  🏢 Dashboard untuk Bahagian:                      │
│     Bahagian Pembangunan Kurikulum (BPK)          │
└─────────────────────────────────────────────────────┘
```

**Komponen:**
- ✅ Summary cards (hanya syor assigned to BPK)
- ✅ Progress bar bahagian
- ✅ Recent syor assigned to bahagian
- ✅ Hebahan
- ✅ Quick action: **"🔄 Kemaskini Status"**

---

### **PENYELARAS JPN Dashboard** (State-Specific)

**Filtered by JPN:**
```
┌─────────────────────────────────────────────────────┐
│  🏢 Dashboard untuk JPN: JPN Johor                 │
└─────────────────────────────────────────────────────┘
```

**Komponen:**
- ✅ Summary cards (hanya syor assigned to JPN Johor)
- ✅ Progress bar JPN
- ✅ Recent syor assigned to JPN
- ✅ Hebahan
- ✅ Quick action: **"🔄 Kemaskini Status"**

---

### **PENYELARAS JNN Dashboard** (VIEW ONLY)

**Filtered by JPN (Read-only):**
```
┌─────────────────────────────────────────────────────┐
│  🏢 Dashboard untuk JPN: JPN Johor                 │
│     ⚠️ (VIEW ONLY - Tidak boleh edit)              │
└─────────────────────────────────────────────────────┘
```

**Komponen:**
- 👁️ Summary cards (view only)
- 👁️ Progress bar
- 👁️ Recent syor list
- 👁️ Hebahan
- ❌ **TIADA quick actions** (cannot edit)

---

### **PEMANTAU Dashboard** (Full View, No Edit)

**Full Access - Read Only:**
```
┌─────────────────────────────────────────────────────┐
│  👁️ Dashboard Pemantau - Akses Lihat Semua Data   │
└─────────────────────────────────────────────────────┘
```

**Komponen:**
- 👁️ Summary cards (all data)
- 👁️ Progress bar overall
- 👁️ Recent syor dari semua bahagian/JPN
- 👁️ Hebahan
- ❌ **TIADA quick actions** (view only)

---

### 6.3 Real-time Updates

**Dashboard menggunakan Supabase Realtime subscriptions.**

**Auto-update apabila:**
- ✅ Syor baharu dicipta
- ✅ Status syor dikemaskini
- ✅ Maklum balas baharu ditambah
- ✅ Hebahan baharu diterbitkan

**Notifikasi Toast Popup:**
```
┌─────────────────────────────────┐
│  🔔 Syor Baharu Dicipta        │
│     "Pemeriksaan ABC"          │
│     [Lihat Sekarang →]         │
└─────────────────────────────────┘
```

**Tidak perlu refresh page!** Data auto-update in real-time.

---

### 6.4 Responsive Design

**Desktop View:**
- Grid layout 4 columns
- Full charts and graphs
- Sidebar navigation

**Tablet View:**
- Grid layout 2 columns
- Condensed charts
- Collapsible sidebar

**Mobile View:**
- Stack layout 1 column
- Swipeable cards
- Hamburger menu
- Touch-optimized

---

## 7. Sistem Notifikasi

### 7.1 Jenis Notifikasi

Sistem menggunakan **dual notification system**:
1. **In-app Notifications** (bell icon)
2. **Email Notifications** (via Brevo)

---

### 7.2 Trigger Notifikasi

**Notifikasi akan dihantar apabila:**

#### **1. Syor Baharu Dicipta** 📝
**Kepada:**
- Penyelaras assigned (Bahagian/JPN)
- Admin

**Kandungan:**
```
🔔 Syor Baharu Assigned

Anda telah ditugaskan syor baharu:

Tajuk: Pemeriksaan Matematik Tahun 4
Deadline: 31 Jan 2026
Priority: Tinggi

[Lihat Syor →]
```

**Email juga dihantar.**

---

#### **2. Status Syor Dikemaskini** ✅
**Kepada:**
- Peneraju (creator)
- Admin
- Pemantau

**Kandungan:**
```
🔔 Status Syor Dikemaskini

Syor "Pemeriksaan ABC" telah dikemaskini.

Status Baharu: 🟡 Dalam Tindakan
Dikemaskini oleh: Siti Nurhaliza (BPK)

Komen: "Kelas tambahan telah diadakan..."

[Lihat Detail →]
```

---

#### **3. Maklum Balas Baharu** 💬
**Kepada:**
- Peneraju (creator)
- Admin

**Kandungan:**
```
🔔 Maklum Balas Baharu

Maklum balas baharu untuk syor "Pemeriksaan ABC"

Dari: Penyelaras JPN Johor
Tarikh: 20 Jan 2026

[Baca Maklum Balas →]
```

---

#### **4. Deadline Reminder** ⏰
**System cron job check setiap hari.**

**Kepada:**
- Penyelaras assigned

**Trigger:**
- 7 hari sebelum deadline → Email reminder
- 3 hari sebelum deadline → Email + in-app alert
- 1 hari sebelum deadline → Urgent alert

**Kandungan:**
```
⚠️ AMARAN: Deadline Hampir

Syor "Pemeriksaan ABC" akan tamat dalam 3 HARI.

Deadline: 23 Jan 2026
Status Semasa: 🟡 Dalam Tindakan

Sila pastikan update status dengan segera.

[Kemaskini Status →]
```

---

#### **5. Overdue Alert** 🔴
**Kepada:**
- Penyelaras assigned
- Peneraju (creator)
- Admin

**Kandungan:**
```
🔴 SYOR LEWAT DEADLINE

Syor "Pemeriksaan ABC" telah LEWAT deadline.

Deadline: 20 Jan 2026
Lewat: 3 hari

Tindakan SEGERA diperlukan!

[Kemaskini Sekarang →]
```

---

#### **6. Permohonan Pendaftaran Baharu** 👤
**Kepada:**
- Admin sahaja

**Kandungan:**
```
🔔 Permohonan Pendaftaran Baharu

Pengguna baharu memohon akses:

Nama: Ahmad bin Ali
Email: ahmad@moe.gov.my
Peranan: Penyelaras JPN

[Semak & Luluskan →]
```

---

#### **7. Akaun Diluluskan** ✅
**Kepada:**
- Pengguna yang approved

**Kandungan:**
```
✅ Akaun Anda Telah Diluluskan

Tahniah! Akaun anda telah diaktifkan.

Peranan: Penyelaras JPN Johor
Email: ahmad@moe.gov.my

Anda kini boleh log masuk ke sistem.

[Log Masuk Sekarang →]
```

---

### 7.3 Notification Bell (In-app)

**Lokasi:** Header navigation bar (kanan atas)

**Badge Count:**
```
🔔 [5]  ← Red badge showing unread count
```

**Klik pada bell icon:**
```
┌─────────────────────────────────────────┐
│  🔔 NOTIFIKASI             [Tandakan  × │
│     5 belum dibaca         semua dibaca]│
├─────────────────────────────────────────┤
│                                         │
│  🔴 Syor Lewat Deadline                │
│     Syor "Pemeriksaan ABC"...          │
│     • 2 jam yang lalu                  │
│  ─────────────────────────────────────  │
│  🟡 Status Dikemaskini                 │
│     Syor "Kursus Guru"...              │
│     • 5 jam yang lalu                  │
│  ─────────────────────────────────────  │
│  📝 Syor Baharu Assigned               │
│     Anda ditugaskan syor...            │
│     • 1 hari yang lalu                 │
│  ─────────────────────────────────────  │
│  [...2 more...]                        │
│                                         │
│  [Lihat Semua Notifikasi →]           │
└─────────────────────────────────────────┘
```

**Features:**
- Auto-scroll list
- Click notifikasi → Navigate to syor detail
- Auto-mark as read bila klik
- "Tandakan semua dibaca" button
- Padam individual notifikasi

---

### 7.4 Email Notifications (via Brevo)

**System menggunakan Brevo API untuk email.**

**Template Email:**
```
Subject: [STTPMP] Syor Baharu Assigned - Action Required

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SISTEM STTPMP - NOTIFIKASI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Assalamualaikum dan Salam Sejahtera,

Anda telah ditugaskan syor baharu yang memerlukan tindakan:

📋 TAJUK: Pemeriksaan Matematik Tahun 4 - SK Taman Desa
🎯 PRIORITY: Tinggi
📅 DEADLINE MAKLUM BALAS: 31 Januari 2026
📅 DEADLINE PENYELESAIAN: 28 Februari 2026

🏢 ASSIGNED KEPADA: Bahagian Pembangunan Kurikulum (BPK)
👤 DICIPTA OLEH: Ahmad bin Ali (Sektor SPK)

📝 KANDUNGAN:
Berdasarkan penemuan pemeriksaan, didapati tahap 
pencapaian murid dalam mata pelajaran Matematik 
masih rendah...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 TINDAKAN DIPERLUKAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sila log masuk ke sistem untuk:
1. Semak butiran syor
2. Kemaskini status
3. Hantar maklum balas

[🔗 LIHAT SYOR SEKARANG]
   https://sttpmp.vercel.app/syor/abc123

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ PENTING: Sila kemaskini status syor dalam 
tempoh yang ditetapkan untuk mengelakkan amaran 
overdue.

Jika ada sebarang pertanyaan, sila hubungi:
📧 admin@sttpmp.moe.gov.my
📞 03-xxxx xxxx

Terima kasih.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
© 2026 STTPMP - Kementerian Pendidikan Malaysia
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 7.5 Notification Preferences (Future Feature)

**Coming Soon:** Pengguna boleh set preferences:
- ✅ Terima notifikasi email
- ✅ Terima notifikasi in-app
- ✅ Pilih jenis notifikasi
- ✅ Set frequency (immediate, daily digest)

---

### 7.6 Notification History

**Akses:** `/notifications`

**Papar:**
- Semua notifikasi lama (read & unread)
- Filter by type
- Search by keyword
- Sort by date
- Bulk mark as read
- Bulk delete

---

## 8. Soalan Lazim (FAQ)

### **Q1: Apa yang perlu saya lakukan jika lupa password?**
**A:** 
1. Klik "Lupa Password?" di page login
2. Masukkan email @moe.gov.my
3. Check email untuk reset link
4. Klik link dan set password baharu

---

### **Q2: Bolehkah saya tukar peranan saya sendiri?**
**A:** Tidak. Hanya Admin yang boleh tukar peranan pengguna. Sila hubungi admin jika perlu tukar role.

---

### **Q3: Saya Penyelaras Bahagian, kenapa saya tak nampak syor dari bahagian lain?**
**A:** Sistem menggunakan Row Level Security (RLS). Anda hanya boleh lihat syor yang assigned to bahagian anda sahaja untuk privasi dan keselamatan.

---

### **Q4: Berapa lama permohonan pendaftaran saya akan diluluskan?**
**A:** Biasanya dalam 1-2 hari bekerja. Admin akan menerima notifikasi automatik dan akan proses dengan segera.

---

### **Q5: Boleh saya assign syor kepada multiple bahagian?**
**A:** Tidak. Setiap syor hanya boleh assigned to SATU bahagian ATAU SATU JPN sahaja. Ini untuk kejelasan tanggungjawab.

---

### **Q6: Apa beza Penyelaras JPN dengan Penyelaras JNN?**
**A:** 
- **Penyelaras JPN:** Boleh UPDATE status syor (edit access)
- **Penyelaras JNN:** Hanya VIEW sahaja (read-only monitoring)

---

### **Q7: Boleh saya upload dokumen selain PDF?**
**A:** Tidak. Sistem hanya terima format PDF sahaja untuk keseragaman dan keselamatan. Max size 10MB.

---

### **Q8: Bagaimana kiraan peratusan completion?**
**A:** 
```
Formula: (Total Weight / Total Syor) × 100

Contoh:
- 3 syor Belum Selesai (weight 0 × 3 = 0)
- 2 syor Dalam Tindakan (weight 0.5 × 2 = 1)
- 5 syor Selesai (weight 1 × 5 = 5)
Total: (0 + 1 + 5) / 10 = 60%
```

---

### **Q9: Kenapa saya dapat email notification tapi tidak dapat in-app notification?**
**A:** Pastikan anda refresh browser atau clear cache. In-app notification menggunakan real-time subscription. Jika masih tidak dapat, check connection internet.

---

### **Q10: Boleh saya padam atau edit hebahan?**
**A:** Hanya Admin yang boleh create, edit, dan delete hebahan. Pengguna lain hanya boleh VIEW sahaja.

---

## 9. Sokongan & Bantuan

### 9.1 Hubungi Support

**Email:**
📧 admin@sttpmp.moe.gov.my

**Telefon:**
📞 03-xxxx xxxx

**Waktu Operasi:**
🕐 Isnin - Jumaat: 8:00 AM - 5:00 PM
🕐 Cuti Umum: Tutup

---

### 9.2 Laporkan Masalah

**Jika ada bug atau technical issue:**

1. Screenshot error message
2. Nyatakan:
   - Apa yang anda cuba buat
   - Error message yang muncul
   - Browser & device info
3. Email ke: admin@sttpmp.moe.gov.my

**Subject:** [BUG REPORT] - [Tajuk Masalah]

---

### 9.3 Cadangan Penambahbaikan

**Sila email cadangan anda dengan:**
- Feature yang dicadangkan
- Kenapa feature ini diperlukan
- Bagaimana feature ini akan membantu

Email ke: admin@sttpmp.moe.gov.my
**Subject:** [FEATURE REQUEST] - [Tajuk Cadangan]

---

## 10. Kesimpulan

STTPMP adalah sistem yang direka untuk **memudahkan pemantauan dan tindakan** terhadap perakuan Menteri Pendidikan.

**Manfaat Utama:**
✅ Real-time monitoring  
✅ Automated notifications  
✅ Transparent progress tracking  
✅ Efficient workflow  
✅ Better accountability  

**Dengan menggunakan sistem ini dengan betul, anda membantu meningkatkan kualiti pendidikan di Malaysia! 🇲🇾**

---

**🎓 Terima kasih kerana menggunakan STTPMP!**

---

**Versi Manual:** 1.0  
**Tarikh Kemaskini:** Januari 2026  
**Prepared by:** STTPMP Development Team  
**© 2026 Kementerian Pendidikan Malaysia**
