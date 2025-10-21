# 🚨 Google OAuth Redirect URI Fix

## Error yang Berlaku:
```
Error 400: redirect_uri_mismatch
STTPMP sent an invalid request
```

## 🔧 Punca Masalah:
1. Server running di `localhost:3004` tapi OAuth config untuk port lain
2. Google Cloud Console redirect URI tidak matching
3. Supabase Site URL tidak updated

## ✅ Langkah Penyelesaian:

### 1. **Update Supabase Configuration**

**Pergi ke:** https://supabase.com/dashboard/project/uafgsyhfvrmcuypmyatx

**Authentication → Settings → URL Configuration:**
- **Site URL**: `http://localhost:3004` ✅
- **Redirect URLs**: 
  - `http://localhost:3004/auth/callback` ✅
  - `http://localhost:3000/auth/callback` (backup) ✅

### 2. **Update Google Cloud Console**

**Pergi ke:** https://console.cloud.google.com/

**APIs & Services → Credentials → OAuth 2.0 Client ID:**

**Authorized redirect URIs - ADD:**
```
https://uafgsyhfvrmcuypmyatx.supabase.co/auth/v1/callback
```

### 3. **Enable Google Provider dalam Supabase**

**Authentication → Providers → Google:**
- ✅ Enable Google provider
- Add Client ID dari Google Cloud Console
- Add Client Secret dari Google Cloud Console

### 4. **Test Again**
1. Pergi: `http://localhost:3004/login`
2. Click: "Masuk dengan Google Workspace"
3. Should work without redirect_uri_mismatch error

## 🎯 URLs yang Betul:

### Development URLs:
- **Application**: `http://localhost:3004`
- **Login Page**: `http://localhost:3004/login`
- **Callback**: `http://localhost:3004/auth/callback`

### Supabase URLs:
- **Project**: `https://uafgsyhfvrmcuypmyatx.supabase.co`
- **OAuth Callback**: `https://uafgsyhfvrmcuypmyatx.supabase.co/auth/v1/callback`

## ⚠️ Important Notes:

1. **Supabase Site URL** mesti exact sama dengan application URL
2. **Google Cloud redirect URI** mesti exact sama dengan Supabase OAuth callback
3. After update configuration, tunggu 1-2 minit untuk changes take effect
4. Clear browser cache/cookies kalau masih ada issue

## 🧪 Test Flow:
1. Update both configurations ✅
2. Wait 2 minutes ⏱️
3. Clear browser cache 🧹
4. Test login again 🚀