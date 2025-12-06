# STTPMP - Sistem Tahap Tindakan Perakuan Menteri Pendidikan

**A comprehensive government tracking system for monitoring feedback and recommendations from education departments and state education departments (JPN).**

## 🔒 Security Status

**✅ PRODUCTION READY - Security Patched**

- **CVE-2025-55182 Mitigated** - Critical React Server Components vulnerability fixed
- **Next.js**: 15.5.7 (Latest security patch)
- **React**: 19.1.2 (Security hardened)
- **Security Audit**: 0 vulnerabilities
- **Last Security Update**: December 7, 2025

See [SECURITY_UPGRADE_CVE-2025-55182.md](SECURITY_UPGRADE_CVE-2025-55182.md) for full security details.

## 🏛️ About STTPMP

STTPMP is designed to streamline the management and tracking of ministerial approval recommendations from various education departments and state education departments (JPN). The system features a real-time traffic light monitoring system to track the completion status of recommendations.

## ✨ Features

### Core Features
- **Real-time Dashboard** - Live updates and monitoring
- **Traffic Light System** - Visual status tracking with weighted scoring
  - 🔴 Belum Selesai (0) - Not Started/Overdue
  - 🟡 Dalam Tindakan (0.5) - In Progress  
  - 🟢 Selesai (1) - Completed
- **Multi-device Access** - Responsive design for all devices
- **Role-based Access Control** - Different permission levels
- **🛡️ Enhanced Security** - Input validation, rate limiting, XSS protection

### Advanced Features
- **Dashboard Analytics** - Performance metrics and insights
- **Notification System** - Real-time alerts and deadline reminders
- **Document Management** - File upload and attachment support (PDF, max 10MB)
- **Audit Trail** - Complete activity logging
- **Report Generation** - Export status reports
- **Deadline Management** - Due date tracking and alerts

## 🚀 Tech Stack

- **Frontend**: Next.js 15.5.7 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Deployment**: Vercel
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **Validation**: Zod schema validation
- **Security**: Enhanced headers, rate limiting, input sanitization

## 📊 Database Schema

The system includes the following main entities:
- **Users** - System users with role-based access
- **Departments** - Ministry departments (Bahagian)
- **JPN** - State education departments
- **Syor** - Recommendations/feedback items
- **Status Tracking** - Progress monitoring with weighted scores
- **Notifications** - Real-time alerts and updates
- **Audit Logs** - Complete activity tracking

## 🛠️ Setup Instructions

### 1. Clone and Install
```bash
git clone <repository-url>
cd STTPMP
npm install
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Update with your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
1. Create a new Supabase project
2. Run the SQL schema: `/database/schema.sql`
3. Load sample data: `/database/sample-data.sql`

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
STTPMP/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable UI components
│   │   └── ui/             # Base UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and configurations
│   ├── types/              # TypeScript type definitions
└── database/               # Database schema and migrations
    ├── schema.sql          # Main database schema
    └── sample-data.sql     # Sample data for testing
```

## 🔐 User Roles

- **Admin** - Full system access and user management
- **Department Head** - Manage department assignments and staff
- **Staff** - Update status and manage assigned recommendations
- **Viewer** - Read-only access to reports and dashboards

## 📈 Traffic Light Scoring System

The system uses a weighted scoring mechanism:
- **Weight 0** - Belum Selesai (Not completed)
- **Weight 0.5** - Dalam Tindakan (In progress)
- **Weight 1** - Selesai (Completed)

Overall completion percentage is calculated based on the average weight across all tracked items.

## 🔒 Security Updates (December 1, 2025)

**MAJOR SECURITY FIXES IMPLEMENTED** - System is now production-ready!

✅ Bcrypt password hashing (no more plaintext)  
✅ Role-based RLS policies (proper access control)  
✅ JWT token authentication (secure API routes)  
✅ Supabase Storage integration (scalable file uploads)  
✅ Environment validation (fail-fast on missing vars)  

**📚 See full details:**
- `SECURITY_FIXES_SUMMARY.md` - Complete security overview
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step deployment guide
- `FIXES_QUICK_REFERENCE.md` - Quick reference for developers

## 🚀 Deployment

### Pre-Deployment Steps (CRITICAL!)

1. **Run Database Migration**
   ```sql
   -- In Supabase SQL Editor, execute:
   database/migrations/001_security_fixes.sql
   ```

2. **Initialize Storage Bucket**
   ```typescript
   // Run once via API endpoint or script:
   import { initializeStorage } from '@/lib/storage'
   await initializeStorage()
   ```

3. **Setup Environment Variables**
   ```bash
   cp .env.example .env.local
   # Fill in all required values
   ```

### Vercel Deployment

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Add ALL environment variables from `.env.example`
4. Deploy automatically on push to main branch

### Required Environment Variables

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (Required)
BREVO_API_KEY=your-brevo-api-key
BREVO_FROM_EMAIL=noreply@sttpmp.com

# App Config (Required)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
```

See `.env.example` for complete list including optional variables.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For technical support or questions:
- Email: support@moe.gov.my
- Documentation: [Internal Wiki]
- Issues: [GitHub Issues]

## 📄 License

This project is developed for the Malaysian Ministry of Education (MOE) and is intended for internal government use only.

---

**Developed for Kementerian Pendidikan Malaysia (MOE)** 🇲🇾
