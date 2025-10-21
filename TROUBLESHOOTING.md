# Magic Link Troubleshooting Guide

## Common Issues and Solutions

### 1. Magic Link Not Working - Configuration Checklist

#### Supabase Dashboard Settings Required:

1. **Authentication Settings**
   - Go to Supabase Dashboard > Authentication > Settings
   - Enable "Enable email confirmations" ✓
   - Site URL: `http://localhost:3003` (for development)
   - Redirect URLs: `http://localhost:3003/auth/callback`

2. **Email Templates**
   - Go to Authentication > Email Templates
   - Make sure "Magic Link" template is enabled
   - Default template should work for testing

3. **Users Must Exist in Database**
   - Magic Link will only work for users that exist in your `users` table
   - Use sample users from `sample-data.sql`:
     - `admin@moe.gov.my`
     - `peneraju@moe.gov.my`
     - `ahmad.hassan@moe.gov.my`
     - etc.

### 2. Step-by-Step Testing

1. **Test with Sample User**
   ```
   Email: admin@moe.gov.my
   ```

2. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for any JavaScript errors
   - Check Network tab for failed requests

3. **Check Email (if using real email service)**
   - Magic Link will be sent to email
   - Click the link in email to authenticate

### 3. Alternative Testing Method

If Magic Link doesn't work immediately, you can test with direct database insertion:

```sql
-- Insert a test auth user directly (use in Supabase SQL Editor)
INSERT INTO auth.users (
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'test@moe.gov.my',
  now(),
  now(),
  now()
);
```

### 4. Common Error Messages

- **"Invalid login credentials"** = Email doesn't exist in auth.users table
- **"User not registered in the system"** = Email exists in auth but not in your users table
- **"Account pending approval"** = User exists but `is_approved = false`
- **"Signup not allowed"** = Email authentication disabled or domain restriction

### 5. Development vs Production

**Development (localhost:3003):**
- Site URL: `http://localhost:3003`
- Redirect URL: `http://localhost:3003/auth/callback`

**Production:**
- Update Site URL to your actual domain
- Update Redirect URLs accordingly

### 6. Quick Fix Commands

If you need to enable a test user quickly:

```sql
-- Enable admin user for testing
UPDATE users SET is_approved = true, is_active = true 
WHERE email = 'admin@moe.gov.my';

-- Check if user exists
SELECT * FROM users WHERE email = 'admin@moe.gov.my';
```