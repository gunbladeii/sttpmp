# 🚀 DEPLOYMENT CHECKLIST - STTPMP

## ✅ Pre-Deployment Security Fixes Completed

### 1. Password Security ✅
- [x] Implemented bcrypt password hashing
- [x] Removed plaintext password storage (`password_plain` column)
- [x] Updated registration API to use bcrypt
- [x] Updated login flow to use Supabase Auth only
- [x] Removed hardcoded password bypass

### 2. Database Security ✅
- [x] Created RLS migration script (`database/migrations/001_security_fixes.sql`)
- [x] Strengthened RLS policies for all tables
- [x] Implemented role-based access control in DB
- [x] Added security helper functions
- [x] Created indexes for auth lookups

### 3. API Security ✅
- [x] Created secure auth middleware (`src/lib/auth-secure.ts`)
- [x] Standardized API error handling (`src/lib/api-response.ts`)
- [x] Removed insecure header-based auth
- [x] Implemented proper JWT validation

### 4. File Storage ✅
- [x] Created Supabase Storage integration (`src/lib/storage.ts`)
- [x] Ready to migrate from local storage to cloud
- [x] Implemented file validation and signed URLs

### 5. Environment Validation ✅
- [x] Created env validation utility (`src/lib/env.ts`)
- [x] Added startup validation for required vars

---

## 📋 DEPLOYMENT STEPS

### Step 1: Database Migration (CRITICAL - Run First!)

```sql
-- Run this in Supabase SQL Editor:
-- File: database/migrations/001_security_fixes.sql

-- This will:
-- 1. Drop password_plain column
-- 2. Strengthen RLS policies
-- 3. Add security functions
-- 4. Create necessary indexes
```

**⚠️ WARNING:** This will drop the `password_plain` column. Ensure all users have been migrated to Supabase Auth first!

### Step 2: Initialize Supabase Storage

```typescript
// Run this once in a script or API endpoint:
import { initializeStorage } from '@/lib/storage'
await initializeStorage()

// This creates the 'syor-documents' bucket
```

### Step 3: Environment Variables

Ensure all required variables are set in Vercel:

**Required:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
BREVO_API_KEY=your_brevo_key
BREVO_FROM_EMAIL=noreply@sttpmp.com
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
```

**Optional (for full features):**
```env
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REFRESH_TOKEN=
RECAPTCHA_SECRET_KEY=
```

### Step 4: Update API Routes (Priority)

High priority API routes to update:

1. **Registration API** - ✅ Already updated with bcrypt
2. **Login Flow** - ✅ Already secured  
3. **Admin APIs** - ✅ Already updated
4. **Announcements API** - Need to update with new auth middleware
5. **Upload API** - Need to migrate to Supabase Storage

### Step 5: Migrate Existing Users

If you have existing users with plaintext passwords:

```sql
-- Before running migration, create auth users for all existing users
-- You'll need to run a script to:
-- 1. Create auth.users entry for each user
-- 2. Generate temporary passwords
-- 3. Email users their temporary passwords
-- 4. Then run the migration to drop password_plain
```

### Step 6: Deploy to Vercel

```bash
# Push to main branch
git add .
git commit -m "feat: implement security fixes for production"
git push origin main

# Vercel will auto-deploy
```

### Step 7: Post-Deployment Verification

1. **Test Authentication:**
   - [ ] User registration works
   - [ ] Login works with correct credentials
   - [ ] Login fails with wrong credentials
   - [ ] Admin approval flow works

2. **Test Authorization:**
   - [ ] Admin can access admin routes
   - [ ] Non-admin cannot access admin routes
   - [ ] Users can only view their assigned syor
   - [ ] Role-based filtering works

3. **Test File Upload:**
   - [ ] Can upload PDF files
   - [ ] Can download uploaded files
   - [ ] Can delete files
   - [ ] File size limits enforced

4. **Test RLS Policies:**
   - [ ] Users cannot view other users' data
   - [ ] Penyelaras can only update their own department/JPN
   - [ ] Notifications only visible to owner

---

## 🔧 RECOMMENDED UPDATES AFTER DEPLOYMENT

### Phase 1: Update High-Traffic API Routes

```typescript
// Example: Update announcements API
import { requireAuth, requireAdmin } from '@/lib/auth-secure'
import { ApiErrors, createSuccessResponse } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req) // New secure auth
    // ... rest of logic
    return createSuccessResponse(data) // Standardized response
  } catch (error) {
    if (error instanceof NextResponse) return error
    return ApiErrors.internal('Failed to fetch', error)
  }
}
```

### Phase 2: Migrate File Uploads

Update `src/app/api/upload-document/route.ts`:

```typescript
import { uploadFileToStorage } from '@/lib/storage'

// Replace uploadFileToLocalStorage with uploadFileToStorage
const result = await uploadFileToStorage(file, syorId, userId)
```

### Phase 3: Add Rate Limiting

Install and configure rate limiting:

```bash
npm install @upstash/ratelimit @upstash/redis
```

### Phase 4: Add Monitoring

- [ ] Setup Vercel Analytics
- [ ] Setup error tracking (Sentry)
- [ ] Setup uptime monitoring
- [ ] Setup log aggregation

---

## 🚨 ROLLBACK PLAN

If issues occur after deployment:

1. **Revert Database Migration:**
   ```sql
   -- Re-add password_plain column (temporary)
   ALTER TABLE users ADD COLUMN password_plain TEXT;
   
   -- Restore permissive RLS policies
   -- (Keep backup of old policies)
   ```

2. **Revert Code Changes:**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Contact Users:**
   - Inform users of temporary login issues
   - Provide support email/contact

---

## 📊 EXPECTED IMPROVEMENTS

After deployment, you should see:

✅ **Security:**
- No plaintext passwords in database
- Proper role-based access control
- Secure file storage in cloud
- Standardized error handling

✅ **Performance:**
- Faster auth lookups with indexes
- Better file delivery via CDN
- Reduced server storage needs

✅ **Reliability:**
- Environment validation prevents crashes
- Better error messages for debugging
- Consistent API responses

✅ **Scalability:**
- Cloud file storage scales automatically
- Database policies prevent unauthorized access
- Ready for horizontal scaling

---

## 📞 SUPPORT

If you encounter issues:

1. Check Vercel deployment logs
2. Check Supabase logs
3. Review error messages in browser console
4. Contact: [your-support-email]

---

**Last Updated:** December 1, 2025
**Migration Version:** 001_security_fixes
**Deployment Ready:** ✅ YES
