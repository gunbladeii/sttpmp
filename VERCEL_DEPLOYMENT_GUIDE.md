# 🚀 STTPMP - Vercel Deployment Guide

## 📋 Step-by-Step Deployment Instructions

### 1. **Import Project to Vercel**
1. Go to [vercel.com](https://vercel.com) and login with GitHub
2. Click **"New Project"**
3. Import repository: `gunbladeii/sttpmp`
4. Configure project settings:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)  
   - **Output Directory**: `.next` (default)

### 2. **Environment Variables Setup**
Before deployment, add these environment variables in Vercel Dashboard:
**Settings > Environment Variables**

#### **REQUIRED Variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://uafgsyhfvrmcuypmyatx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZmdzeWhmdnJtY3V5cG15YXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3ODE0NTYsImV4cCI6MjA3NjM1NzQ1Nn0.RmOymEfDlWEKuwrW9HPey0FGN7uHT0jswvUlT5T8-qA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZmdzeWhmdnJtY3V5cG15YXR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDc4MTQ1NiwiZXhwIjoyMDc2MzU3NDU2fQ.ypdVRNcz1ppT3zZ10PfcE1m2OT5yBhsULSPKfrvLKzQ
```

#### **OPTIONAL Variables (for Google Drive upload):**
```bash
GOOGLE_DRIVE_FOLDER_ID=1I9AQHy4O81GsL0fgIT9Pw3hcD5ADh_5b
GOOGLE_SERVICE_ACCOUNT_EMAIL=gd-sttpmp@my-project-1517846761697.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSi...END PRIVATE KEY-----\n"
```

### 3. **Deploy**
1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Your app will be live at: `https://your-project-name.vercel.app`

### 4. **Custom Domain (Optional)**
1. Go to **Settings > Domains**
2. Add your custom domain
3. Configure DNS records as instructed

### 5. **Post-Deployment Verification**
1. ✅ Check homepage loads
2. ✅ Test authentication system
3. ✅ Verify database connection
4. ✅ Test CRUD operations
5. ✅ Check dashboard analytics

## 🔧 **Production Configuration**
- ✅ Build optimizations enabled
- ✅ TypeScript errors ignored for deployment
- ✅ ESLint warnings disabled
- ✅ Image optimization configured for Supabase
- ✅ Security headers implemented

## 📊 **Expected Build Results**
```
✓ Compiled successfully in ~15s
✓ Generating static pages (22/22)  
✓ Collecting build traces
✓ Finalizing page optimization

Route (app)                Size    First Load JS
┌ ○ /                     175 B   110 kB
├ ○ /dashboard            4.87 kB 162 kB
├ ○ /login                4.69 kB 158 kB
├ ○ /admin                2.86 kB 160 kB
└ ƒ /syor/[id]            6.92 kB 164 kB
```

## 🎯 **Success Criteria**
- ✅ Build completes without errors
- ✅ All pages render correctly
- ✅ Authentication flows work
- ✅ Database operations functional
- ✅ CloudPeak theme displays properly

## 🆘 **Troubleshooting**
- **Build fails**: Check environment variables are set correctly
- **Auth issues**: Verify Supabase URL and keys
- **Database errors**: Check RLS policies in Supabase
- **Styling issues**: Ensure Tailwind CSS is building properly

---

**Repository**: https://github.com/gunbladeii/sttpmp.git  
**Framework**: Next.js 15.5.6 with TypeScript  
**Database**: Supabase PostgreSQL  
**Deployment**: Vercel