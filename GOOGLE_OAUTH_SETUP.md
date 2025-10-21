# STTPMP - Google OAuth SSO Setup Guide 🚀

## ✅ Google OAuth Implementation Complete!

Sistem STTPMP sekarang menggunakan **Google Single Sign-On (SSO)** untuk domain `@moe.gov.my` sahaja. Ini lebih sesuai kerana MOE menggunakan Google Workspace.

---

## 🔧 Setup Requirements

### 1. **Google Cloud Console Setup**

Perlu setup Google OAuth credentials di Google Cloud Console:

```
1. Go to: https://console.cloud.google.com/
2. Create new project atau guna existing: "STTPMP-MOE"
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized origins: http://localhost:3001, https://yourdomain.com  
   - Authorized redirect URIs: 
     * http://localhost:3001/auth/callback
     * https://yourdomain.com/auth/callback
```

### 2. **Environment Variables**

Add dalam `.env.local`:

```env
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth (new)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. **Supabase Auth Configuration**

Dalam Supabase Dashboard → Authentication → Providers:

```
✅ Enable Google provider
📧 Client ID: (from Google Console)
🔑 Client Secret: (from Google Console)  
🏢 Hosted Domain: moe.gov.my (restrict to MOE domain only)
🔄 Redirect URL: https://your-project.supabase.co/auth/v1/callback
```

---

## 🚀 How It Works Now

### **Login Flow:**
```
1. User click "Masuk dengan Google Workspace" 
2. Redirect to Google OAuth (restricted to @moe.gov.my)
3. Google authenticate user
4. Callback to /auth/callback  
5. Check user exists in database
6. Redirect to /dashboard (success) or /login (error)
```

### **Authentication States:**
- ✅ **Success**: User exists, active, approved → Dashboard
- ❌ **Invalid Domain**: Not @moe.gov.my → Error message
- ❌ **Not Registered**: Email not in users table → Contact admin
- ❌ **Inactive Account**: User not approved → Contact admin

---

## 👥 User Management (Admin Only)

### **Admin Panel**: `/admin/users`
- ➕ **Create users** with email + temporary password
- 🔄 **Activate/deactivate** accounts  
- 👁️ **View all users** and roles
- ⚙️ **Manage permissions**

### **User Roles & Access:**
| Role | Can Create Users | Assign Syor | Update Status | View All |
|------|-----------------|-------------|---------------|----------|
| **admin** | ✅ | ✅ | ✅ | ✅ |
| **peneraju_pemeriksaan** | ❌ | ✅ | ✅ | ✅ |
| **penyelaras_bahagian** | ❌ | ❌ | ✅ (assigned) | ❌ |
| **penyelaras_jpn** | ❌ | ❌ | ✅ (assigned) | ❌ |
| **pemantau** | ❌ | ❌ | ❌ | ✅ (read-only) |

---

## 🔐 Security Features

### **Domain Restriction:**
```typescript
// Only @moe.gov.my emails allowed
queryParams: {
  hd: 'moe.gov.my' // Google Hosted Domain restriction
}
```

### **Database Validation:**
```sql
-- Email domain check constraint
CONSTRAINT check_moe_email CHECK (email LIKE '%@moe.gov.my')

-- Role-based assignment rules
CONSTRAINT check_role_assignment CHECK (
  (role = 'admin' AND department_id IS NULL AND jpn_id IS NULL) OR
  (role = 'penyelaras_bahagian' AND department_id IS NOT NULL) OR
  ...
)
```

### **Row Level Security (RLS):**
- Users can only see data based on their role
- Department coordinators see department-assigned syor only  
- JPN coordinators see JPN-assigned syor only
- Admins and monitors see all data

---

## 🧪 Testing the System

### **1. Start Development Server:**
```bash
npm run dev
# Server: http://localhost:3001
```

### **2. Create Test Users** (via Supabase or admin panel):

**Admin User:**
```
Email: admin@moe.gov.my
Role: admin  
Department: NULL
JPN: NULL
```

**Peneraju Pemeriksaan:**
```
Email: peneraju@moe.gov.my
Role: peneraju_pemeriksaan
Department: NULL  
JPN: NULL
```

**Penyelaras Bahagian:**
```
Email: ahmad.ibrahim@moe.gov.my
Role: penyelaras_bahagian
Department: "Bahagian Pembangunan Kurikulum"
JPN: NULL
```

### **3. Test Pages:**
- 🏠 **Homepage**: http://localhost:3001 (Google sign-in button)
- 🔐 **Login**: http://localhost:3001/login (Google OAuth)
- 📊 **Dashboard**: http://localhost:3001/dashboard (after login)
- 👥 **Admin Users**: http://localhost:3001/admin/users (admin only)

---

## 📋 Next Steps

### **Ready to Implement:**
1. **Real-time Dashboard** with traffic light analytics
2. **Syor Assignment Workflow** for peneraju pemeriksaan  
3. **Status Updates** with notifications
4. **Report Generation** for monitoring
5. **Mobile Responsive** design improvements

### **Deployment:**
1. Setup production Google OAuth credentials
2. Configure Vercel deployment  
3. Setup production Supabase instance
4. Add SSL certificate for domain

---

## 🎯 Key Benefits of Google SSO

✅ **No Password Management** - Google handles authentication  
✅ **MOE Domain Security** - Restricted to @moe.gov.my only  
✅ **Single Sign-On** - Same credentials as other MOE systems  
✅ **Centralized Access** - IT admin controls via Google Workspace  
✅ **Better Security** - Google's enterprise-grade authentication  

**Sistem sekarang siap untuk production dengan Google OAuth SSO! 🎉**