# 🗑️ Panduan Mudah: Padam Syor (Admin Sahaja)

## ✨ Feature Baru: Admin Boleh Padam Syor

### 🎯 Tujuan
Hanya **admin** boleh memadam syor secara kekal dari sistem, termasuk semua data berkaitan.

---

## 📍 Cara Guna

### Langkah 1: Login sebagai Admin
- Pastikan anda login dengan akaun **role = admin**
- Bukan admin tidak akan nampak butang delete

### Langkah 2: Pergi ke Detail Syor
- Navigate ke `/syor/[id]` (mana-mana syor)
- Atau klik syor dari senarai syor

### Langkah 3: Klik Butang "Padam Syor"
- Butang merah 🗑️ di sebelah butang "Edit Syor"
- **Hanya admin nampak butang ini!**

### Langkah 4: Confirm Deletion
- Modal akan keluar dengan maklumat:
  - ⚠️ Amaran: Tindakan tidak boleh dibatalkan
  - Tajuk syor yang akan dipadam
  - List data berkaitan yang akan dipadam
- Klik **"Ya, Padam"** untuk proceed
- Klik **"Batal"** untuk cancel

### Langkah 5: Wait & Redirect
- System akan delete syor + semua data berkaitan
- Success message akan muncul
- Auto redirect ke `/syor` (senarai syor)

---

## ⚠️ Apa yang Akan Dipadam?

Apabila admin delete syor, sistem akan delete:

1. **Syor itu sendiri** ✅
2. **Semua sejarah tindakan** (status_tracking) ✅
3. **Semua notifikasi** berkaitan syor ✅
4. **Semua dokumen** yang di-upload ✅

**⚠️ PENTING: Tindakan ini TIDAK BOLEH dibatalkan!**

---

## 🔐 Siapa Boleh Delete?

| Role | Boleh Delete? | Nampak Butang? |
|------|---------------|----------------|
| **Admin** | ✅ Ya | ✅ Ya |
| Pemantau | ❌ Tidak | ❌ Tidak |
| Peneraju Pemeriksaan | ❌ Tidak | ❌ Tidak |
| Penyelaras Bahagian | ❌ Tidak | ❌ Tidak |
| Penyelaras JPN | ❌ Tidak | ❌ Tidak |
| Penyelaras JNN | ❌ Tidak | ❌ Tidak |

---

## 🎨 Screenshot Reference

### Lokasi Butang (Admin View):
```
┌─────────────────────────────────────┐
│  Butiran Syor                       │
│  Dicipta pada 01/12/2024 oleh User  │
│                                      │
│  [Edit Syor]  [🗑️ Padam Syor]      │  ← Butang Delete (merah)
└─────────────────────────────────────┘
```

### Modal Confirmation:
```
┌─────────────────────────────────────┐
│  ⚠️  Padam Syor?                    │
│                                      │
│  Adakah anda pasti untuk memadam    │
│  syor ini?                          │
│                                      │
│  ⚠️ Tindakan ini tidak boleh        │
│     dibatalkan!                     │
│                                      │
│  Syor yang akan dipadam:            │
│  ┌──────────────────────────┐      │
│  │ [Tajuk Syor]             │      │
│  └──────────────────────────┘      │
│                                      │
│  Data yang akan dipadam:            │
│  • Syor ini                         │
│  • Semua sejarah tindakan           │
│  • Semua notifikasi berkaitan       │
│  • Semua dokumen berkaitan          │
│                                      │
│  [Batal]    [🗑️ Ya, Padam]         │
└─────────────────────────────────────┘
```

---

## 🔍 Audit Trail

Setiap kali admin delete syor, sistem akan:
- ✅ Simpan record dalam `audit_logs` table
- ✅ Log siapa yang delete (admin ID + name)
- ✅ Log apa yang di-delete (syor details)
- ✅ Log bila delete (timestamp)

Ini untuk security dan accountability.

---

## ⚡ Technical Details

### API Endpoint:
```
DELETE /api/syor/[id]
```

### Files Modified:
1. **Backend**: `src/app/api/syor/[id]/route.ts` (NEW)
2. **Frontend**: `src/app/syor/[id]/page.tsx` (Updated)

### Error Handling:
- ❌ 401: Not logged in
- ❌ 403: Not admin
- ❌ 404: Syor not found
- ❌ 500: Server error

---

## 🧪 Testing Steps

### Test 1: Admin Can Delete
1. Login as admin
2. Go to any syor detail
3. Click "Padam Syor" button
4. Confirm deletion
5. ✅ Should redirect to /syor
6. ✅ Syor should be deleted from database

### Test 2: Non-Admin Cannot Delete
1. Login as non-admin (e.g., penyelaras)
2. Go to any syor detail
3. ✅ Should NOT see "Padam Syor" button

### Test 3: API Authorization
1. Try calling `DELETE /api/syor/[id]` as non-admin
2. ✅ Should return 403 Forbidden

---

## 🚨 Common Issues & Solutions

### Issue: Butang delete tidak muncul
**Solution**: Check user role. Only admin can see delete button.

### Issue: Error 403 Forbidden
**Solution**: User bukan admin. Only admin boleh delete.

### Issue: Error 404 Not Found
**Solution**: Syor ID tidak wujud atau sudah dipadam.

### Issue: Modal tidak close
**Solution**: Klik "Batal" atau tekan ESC key.

---

## 📝 Changelog

**Version 1.0** (Dec 7, 2024)
- ✅ Initial implementation
- ✅ Admin-only delete syor
- ✅ Confirmation modal
- ✅ Cascade delete related data
- ✅ Audit logging
- ✅ Auto redirect after deletion

---

## 🎯 Next Steps

Untuk gunakan feature ini:
1. ✅ Feature sudah siap (code completed)
2. ⏳ Test dengan admin account
3. ⏳ Verify data deleted properly
4. ⏳ Check audit logs created

---

**Status**: ✅ **SIAP & READY TO USE**  
**Last Updated**: December 7, 2024
