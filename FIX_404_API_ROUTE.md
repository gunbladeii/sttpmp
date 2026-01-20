# 🔧 FIX: API Route 404 Error di Localhost

## 🐛 Masalah yang Dijumpai

**API route `/api/auth/get-profile` return 404 di localhost** tetapi berfungsi di production (Vercel).

### Punca Masalah:
- ✅ Password BETUL (Auth berjaya - nampak "SIGNED_IN" dalam console)
- ❌ API route `/api/auth/get-profile` tidak dijumpai (404 error)
- 🔍 Kemungkinan besar: **Turbopack caching issue**

## ✅ Penyelesaian yang Telah Dilakukan

1. ✅ **Disabled Turbopack** - Changed `npm run dev` to use standard compiler
2. ✅ **Cleared .next cache** - Deleted build cache
3. ✅ **Restarted server** - Fresh start dengan compiler standard
4. ✅ **Added better logging** - Console logs untuk debugging

## 🚀 Langkah-langkah untuk Test

### 1. Pastikan Server Running (SUDAH DILAKUKAN)
Server sudah running di: http://localhost:3000

### 2. Hard Refresh Browser
- Press **Ctrl + Shift + R** (Windows) 
- Atau **Cmd + Shift + R** (Mac)
- Atau clear browser cache

### 3. Test Login Lagi
1. Buka http://localhost:3000/login
2. Enter credentials:
   - Email: fisha.hafiz@moe.gov.my
   - Password: (password yang sama dengan production)
3. **Buka Browser Console (F12)** untuk tengok logs
4. Click "Log Masuk"

### 4. Check Console Logs

Anda sepatutnya nampak:
```
🔍 Fetching profile for: fisha.hafiz@moe.gov.my
📡 Profile response status: 200
📦 Profile data: { success: true, ... }
✅ Profile loaded successfully
```

Kalau masih nampak **404 error**, continue ke Step 5.

### 5. Manual Test API Route

Buka URL ini TERUS dalam browser:
```
http://localhost:3000/api/auth/get-profile
```

**Expected:** Error message "Email is required" (ini OK - bermakna API route wujud!)
**If 404:** API route tidak load - proceed to Step 6

### 6. Restart Server Manually

```bash
# Stop current server (Ctrl+C)
# Then run:
npm run dev
```

Wait until you see:
```
✓ Ready in X.Xs
✓ Compiled /login
```

Then try login again.

## 🔍 Alternative: Check Server Logs

Ketika anda login, tengok terminal di mana `npm run dev` running. Anda sepatutnya nampak:

```
POST /api/auth/get-profile 200 in XXXms
🔍 GET-PROFILE API: Searching for user: fisha.hafiz@moe.gov.my
✅ GET-PROFILE API: User found and approved
```

Kalau nampak **404** atau **API not found**, ini bermakna Next.js belum load API route.

## 💡 Quick Fix Summary

**Jika masih 404 selepas semua langkah di atas:**

### Option A: Use Production URL Temporarily
Sambung terus dengan production: https://sttpmp.vercel.app

### Option B: Force Recompile
```bash
# 1. Stop server
# 2. Delete these folders:
rm -rf .next
rm -rf node_modules/.cache

# 3. Start server
npm run dev

# 4. Wait for "Ready"
# 5. Hard refresh browser (Ctrl+Shift+R)
# 6. Try login
```

### Option C: Check Port Conflict
```powershell
# Check if another process using port 3000
Get-NetTCPConnection -LocalPort 3000

# If found, kill it:
Stop-Process -Id <PID> -Force

# Then restart:
npm run dev
```

## 📝 What Changed

File yang telah diubah:
1. ✅ [package.json](package.json) - Changed `dev` script to NOT use turbopack
2. ✅ [src/app/api/auth/get-profile/route.ts](src/app/api/auth/get-profile/route.ts) - Added extensive logging
3. ✅ [src/hooks/useAuthSimple.tsx](src/hooks/useAuthSimple.tsx) - Added debugging logs

## 🆘 If Still Not Working

Bagitahu saya result dari:
1. Browser console logs (F12 > Console)
2. Terminal server logs (where `npm run dev` is running)
3. Result from: http://localhost:3000/api/auth/get-profile

---

**Current Status:**
- ✅ Server: Running on http://localhost:3000
- ✅ Turbopack: Disabled
- ✅ Cache: Cleared
- ⏳ Next: Test login in browser with hard refresh
