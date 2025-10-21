# 🚀 STTPMP Quick Testing Guide

## Magic Link vs Development Login

### ❌ **Masalah Magic Link:**
- Perlu email sebenar (admin@moe.gov.my tidak wujud)
- Kena setup SMTP atau email service
- Susah untuk development testing

### ✅ **Penyelesaian: Development Login**
- **Bypass email verification** untuk testing
- Login terus dengan sample users
- Simpan session dalam localStorage

## 🧪 Testing Steps:

### 1. Buka Login Page
```
http://localhost:3003/login
```

### 2. Pilih Sample User untuk Test:
- **Admin**: `admin@moe.gov.my` 
- **Peneraju**: `peneraju@moe.gov.my`
- **Penyelaras**: `ahmad.hassan@moe.gov.my`

### 3. Login Method Options:

#### Option A: Development Login (Recommended)
1. Masukkan email: `admin@moe.gov.my`
2. Click: **"Login Terus (Bypass Email)"** (yellow button)
3. ✅ Akan login terus tanpa perlu email

#### Option B: Magic Link (Perlu Setup Email)
1. Masukkan email anda sendiri
2. Update database dengan email anda:
   ```sql
   UPDATE users SET email = 'your-email@gmail.com' WHERE email = 'admin@moe.gov.my';
   ```
3. Click: "Hantar Link Masuk ke Email"
4. Check email anda untuk magic link

## 🎯 Test Results Expected:

### Development Login Success:
- ✅ Green message: "Login berjaya! Mengalihkan ke dashboard..."
- ✅ Redirect to: `/dashboard`
- ✅ User data saved in session

### Magic Link Success:
- ✅ Blue message: "Link masuk telah dihantar ke email anda..."
- ✅ Check email for magic link
- ✅ Click link → redirect to dashboard

## 📊 Sample Users Available:

| Email | Role | Department | Status |
|-------|------|------------|--------|
| admin@moe.gov.my | admin | - | ✅ Active |
| peneraju@moe.gov.my | peneraju_pemeriksaan | - | ✅ Active |
| ahmad.hassan@moe.gov.my | penyelaras_bahagian | BPM | ✅ Active |
| siti.aminah@moe.gov.my | penyelaras_bahagian | BPR | ✅ Active |

## 🛠️ Troubleshooting:

### Error: "User not found in system"
- Sample data belum diinsert
- Run: `database/sample-data.sql` di Supabase SQL Editor

### Error: "Account not approved or inactive"  
- User `is_approved = false` atau `is_active = false`
- Check database dan update status

### Development Login tidak berfungsi
- Check browser console (F12) untuk errors
- Pastikan server running di port 3003