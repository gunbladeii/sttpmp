# MANUAL PENGGUNA SISTEM STTPMP
## Sistem Tahap Tindakan Perakuan Menteri Pendidikan

**Versi:** 1.1  
**Tarikh Kemaskini:** Februari 2026  
**Platform:** Aplikasi web  
**URL:** `https://sttpmp.vercel.app`

---

## Kandungan
1. [Pengenalan Sistem](#1-pengenalan-sistem)
2. [Peranan Pengguna dan Capaian](#2-peranan-pengguna-dan-capaian)
3. [Aliran Kerja Utama Sistem](#3-aliran-kerja-utama-sistem)
4. [Pendaftaran Akaun dan Log Masuk](#4-pendaftaran-akaun-dan-log-masuk)
5. [Pengurusan Syor](#5-pengurusan-syor)
6. [Paparan Dashboard](#6-paparan-dashboard)
7. [Pengurusan Hebahan](#7-pengurusan-hebahan)
8. [Sistem Notifikasi](#8-sistem-notifikasi)
9. [Soalan Lazim](#9-soalan-lazim)
10. [Sokongan dan Bantuan](#10-sokongan-dan-bantuan)

---

## 1. Pengenalan Sistem

### 1.1 Tujuan STTPMP
STTPMP ialah sistem pemantauan digital untuk:
- merekod syor/perakuan susulan pemeriksaan;
- memantau tindakan Bahagian dan JPN terhadap syor;
- memudahkan pelaporan kemajuan secara berpusat;
- menghantar notifikasi tindakan dan peringatan tarikh akhir.

### 1.2 Konsep Status Syor
Sistem menggunakan tiga status utama:

| Status | Nilai Berat (Weight) | Maksud |
|---|---:|---|
| `belum_selesai` | 0 | Tindakan belum dimulakan atau belum dikemas kini |
| `dalam_tindakan` | 0.5 | Tindakan sedang dilaksanakan |
| `selesai` | 1 | Tindakan telah diselesaikan |

### 1.3 Formula Ringkas Pencapaian
Peratus pencapaian dikira seperti berikut:

```text
Peratus Selesai = (Jumlah Weight / Jumlah Syor) x 100
```

Contoh: jika 4 syor mempunyai weight `0, 0.5, 1, 1`, maka pencapaian ialah `62.5%`.

---

## 2. Peranan Pengguna dan Capaian

### 2.1 Ringkasan Peranan

1. **Admin (Pentadbir Sistem)**
- Mengurus pengguna, hebahan, dan pemantauan keseluruhan sistem.
- Boleh melihat semua data, mengedit, dan memadam syor.

2. **Peneraju Pemeriksaan**
- Mencipta syor baharu.
- Menentukan agihan syor kepada Bahagian atau JPN.
- Memantau syor berkaitan sektor sendiri.

3. **Penyelaras Bahagian**
- Melihat syor yang diagihkan kepada Bahagian sendiri.
- Mengemas kini status dan maklum balas syor yang ditugaskan.

4. **Penyelaras JPN**
- Melihat syor yang diagihkan kepada JPN sendiri.
- Mengemas kini status dan maklum balas syor yang ditugaskan.

5. **Penyelaras JNN (Lihat Sahaja)**
- Melihat syor bagi JPN yang ditetapkan.
- Tidak boleh mengemas kini, memuat naik dokumen, atau mengubah data.

6. **Pemantau (Lihat Sahaja)**
- Melihat data keseluruhan sistem.
- Tidak terlibat dalam operasi kemas kini syor.

### 2.2 Matriks Capaian Utama

| Fungsi | Admin | Peneraju Pemeriksaan | Penyelaras Bahagian | Penyelaras JPN | Penyelaras JNN | Pemantau |
|---|---|---|---|---|---|---|
| Dashboard | Semua data | Sektor sendiri | Bahagian sendiri | JPN sendiri | JPN sendiri (lihat sahaja) | Semua data (lihat sahaja) |
| Lihat senarai syor | Ya | Ya (ikut sektor) | Ya (ikut tugasan) | Ya (ikut tugasan) | Ya (ikut JPN) | Ya |
| Cipta syor baharu | Tidak | Ya | Tidak | Tidak | Tidak | Tidak |
| Edit maklumat asas syor | Ya | Ya | Tidak | Tidak | Tidak | Tidak |
| Kemas kini status/tindakan | Ya | Ya | Ya (jika ditugaskan) | Ya (jika ditugaskan) | Tidak | Tidak |
| Muat naik dokumen syor | Ya | Ya | Ya (jika ditugaskan) | Ya (jika ditugaskan) | Tidak | Tidak |
| Padam syor | Ya | Tidak | Tidak | Tidak | Tidak | Tidak |
| Kelulusan pendaftaran pengguna | Ya | Tidak | Tidak | Tidak | Tidak | Tidak |
| Pengurusan hebahan | Ya | Tidak | Tidak | Tidak | Tidak | Tidak |

---

## 3. Aliran Kerja Utama Sistem

Aliran kerja STTPMP secara ringkas:

1. Pengguna mendaftar akaun.
2. Admin menyemak dan meluluskan peranan pengguna.
3. Peneraju Pemeriksaan mencipta syor baharu.
4. Syor diagihkan kepada:
- satu atau lebih Bahagian, **atau**
- satu atau lebih JPN.
5. Penyelaras yang ditugaskan mengemas kini status, tindakan, dan dokumen.
6. Dashboard, notifikasi, dan laporan memaparkan kemajuan semasa.

**Nota penting agihan syor:**
- Satu syor boleh diagihkan kepada lebih daripada satu penerima.
- Dalam satu syor, agihan mesti dipilih dalam **satu kategori sahaja**:
- sama ada Bahagian sahaja; atau
- JPN sahaja.

---

## 4. Pendaftaran Akaun dan Log Masuk

### 4.1 Syarat Asas Pendaftaran
- E-mel rasmi mestilah berakhir dengan `@moe.gov.my`.
- Nama penuh diisi seperti rekod rasmi.
- Kata laluan minimum 8 aksara.
- Pengguna boleh memilih peranan yang dipohon (tertakluk kelulusan admin).

### 4.2 Langkah Pendaftaran
1. Buka halaman daftar: `https://sttpmp.vercel.app/register`.
2. Isi borang pendaftaran.
3. Klik butang daftar.
4. Sistem akan merekod permohonan sebagai menunggu kelulusan.

### 4.3 Semakan dan Kelulusan Oleh Admin
Admin akan:
1. Menyemak permohonan baharu.
2. Menetapkan peranan pengguna.
3. Menetapkan maklumat tambahan mengikut peranan:
- `department` untuk Penyelaras Bahagian;
- `jpn` untuk Penyelaras JPN/JNN;
- `sector` untuk Peneraju Pemeriksaan.
4. Meluluskan atau menolak permohonan.

### 4.4 Log Masuk
1. Buka halaman log masuk: `https://sttpmp.vercel.app/login`.
2. Masukkan e-mel dan kata laluan.
3. Akaun hanya boleh digunakan selepas diluluskan dan aktif.

### 4.5 Lupa Kata Laluan
1. Klik pautan **Lupa Kata Laluan** pada halaman log masuk.
2. Masukkan e-mel berdaftar.
3. Ikuti arahan tetapan semula kata laluan melalui e-mel.

---

## 5. Pengurusan Syor

### 5.1 Mencipta Syor (Peneraju Pemeriksaan)
Halaman: `/create-syor`

Maklumat utama yang perlu diisi:
- tajuk syor (berdasarkan senarai pemeriksaan);
- kandungan/penjelasan syor;
- keutamaan (`rendah`, `sederhana`, `tinggi`);
- tarikh akhir maklum balas;
- tarikh akhir tindakan;
- agihan kepada Bahagian atau JPN.

**Peraturan semasa mencipta syor:**
- sekurang-kurangnya satu penerima mesti dipilih;
- tidak boleh memilih Bahagian dan JPN serentak;
- tarikh akhir maklum balas mestilah pada atau sebelum tarikh akhir tindakan.

### 5.2 Senarai Syor
Halaman: `/syor`

Pengguna boleh:
- melihat senarai syor mengikut capaian peranan;
- menapis senarai mengikut status;
- meneliti syor yang hampir tamat tempoh.

### 5.3 Butiran Syor dan Kemas Kini
Halaman: `/syor/{id}`

Tindakan mengikut peranan:
- **Edit maklumat asas syor:** Admin dan Peneraju Pemeriksaan.
- **Kemas kini status/tindakan:** Admin, Peneraju Pemeriksaan, dan Penyelaras yang ditugaskan.
- **Lihat sahaja:** Penyelaras JNN dan Pemantau.

### 5.4 Muat Naik Dokumen
Dokumen sokongan boleh dimuat naik pada butiran syor dengan syarat:
- format fail: `PDF` sahaja;
- saiz maksimum: `10MB`.

Akses muat naik:
- Admin dan Peneraju Pemeriksaan;
- Penyelaras Bahagian/JPN yang ditugaskan pada syor tersebut.

### 5.5 Pemadaman Syor
- Hanya **Admin** boleh memadam syor.
- Pemadaman perlu dibuat dengan cermat kerana melibatkan rekod tindakan.

### 5.6 Sumber Data Pemeriksaan
- Tajuk pemeriksaan dimuatkan daripada API rakan sistem KPM.
- Jika senarai pemeriksaan gagal dimuatkan, cuba semula selepas beberapa minit.

---

## 6. Paparan Dashboard

Halaman: `/dashboard`

### 6.1 Komponen Umum Dashboard
Secara umum, dashboard memaparkan:
- ringkasan bilangan syor mengikut status;
- trend atau agihan status semasa;
- senarai syor terkini;
- hebahan terkini.

### 6.2 Paparan Mengikut Peranan
- **Admin/Pemantau:** paparan data keseluruhan.
- **Peneraju Pemeriksaan:** paparan mengikut sektor.
- **Penyelaras Bahagian:** paparan syor tugasan Bahagian.
- **Penyelaras JPN/JNN:** paparan syor tugasan JPN.

### 6.3 Kemaskini Masa Nyata
Dashboard dan modul syor menyokong kemaskini masa nyata. Perubahan status atau rekod baharu akan dipaparkan tanpa muat semula halaman dalam kebanyakan keadaan.

---

## 7. Pengurusan Hebahan

### 7.1 Tujuan Hebahan
Hebahan digunakan untuk menyampaikan makluman rasmi sistem kepada semua pengguna.

### 7.2 Capaian Hebahan
- **Admin:** cipta, kemas kini, terbit, dan padam hebahan.
- **Pengguna lain:** melihat hebahan yang telah diterbitkan.

### 7.3 Cadangan Penulisan Hebahan
- Gunakan tajuk ringkas dan jelas.
- Nyatakan tarikh kuat kuasa jika berkaitan.
- Elakkan teks terlalu panjang dalam satu perenggan.
- Sertakan tindakan susulan jika diperlukan.

---

## 8. Sistem Notifikasi

### 8.1 Saluran Notifikasi
Sistem menggunakan:
1. notifikasi dalam aplikasi (ikon loceng);
2. notifikasi e-mel.

### 8.2 Contoh Pencetus Notifikasi
Notifikasi lazim dihantar apabila:
- syor baharu diagihkan;
- status syor dikemas kini;
- maklum balas/tindakan baharu direkodkan;
- tarikh akhir semakin hampir atau telah melepasi tempoh;
- permohonan pendaftaran baharu diterima (untuk admin);
- akaun pengguna diluluskan.

### 8.3 Penggunaan Ikon Loceng
Pada bahagian atas sistem:
- nombor pada lencana menunjukkan bilangan notifikasi belum dibaca;
- klik notifikasi untuk membuka rekod berkaitan;
- pengguna boleh menandakan notifikasi sebagai telah dibaca.

---

## 9. Soalan Lazim

### 9.1 Saya tidak dapat melihat syor tertentu. Mengapa?
Capaian syor bergantung pada peranan dan tugasan anda. Jika perlu akses tambahan, hubungi admin.

### 9.2 Bolehkah saya menukar peranan sendiri?
Tidak. Perubahan peranan hanya boleh dibuat oleh admin.

### 9.3 Apakah perbezaan Penyelaras JPN dan Penyelaras JNN?
- Penyelaras JPN boleh mengemas kini status/tindakan syor tugasan.
- Penyelaras JNN hanya boleh melihat (read-only).

### 9.4 Bolehkah satu syor diagihkan kepada lebih daripada satu penerima?
Boleh. Syor boleh diagihkan kepada beberapa Bahagian atau beberapa JPN dalam syor yang sama.

### 9.5 Bolehkah saya memuat naik fail selain PDF?
Tidak. Sistem hanya menerima fail PDF dengan had saiz maksimum 10MB.

### 9.6 Apa perlu saya buat jika senarai pemeriksaan tidak keluar?
Semak sambungan internet dan cuba semula. Jika isu berterusan, laporkan kepada pentadbir sistem.

### 9.7 Mengapa akaun saya belum boleh digunakan selepas daftar?
Akaun memerlukan kelulusan admin dan status akaun mesti aktif.

---

## 10. Sokongan dan Bantuan

### 10.1 Saluran Sokongan
- E-mel: `admin@sttpmp.moe.gov.my`
- Telefon: `03-xxxx xxxx`

### 10.2 Maklumat Semasa Melaporkan Isu
Sertakan butiran berikut:
1. tindakan yang sedang dibuat;
2. mesej ralat yang dipaparkan;
3. tangkapan skrin (jika ada);
4. tarikh dan masa kejadian;
5. jenis pelayar/peranti.

### 10.3 Penutup
Penggunaan STTPMP secara konsisten membantu pemantauan tindakan syor yang lebih teratur, telus, dan berfokus kepada penambahbaikan berterusan.

---

**Versi Manual:** 1.1  
**Tarikh Kemaskini:** Februari 2026  
**Disediakan Oleh:** Pasukan STTPMP  
**Hak Cipta:** Kementerian Pendidikan Malaysia
