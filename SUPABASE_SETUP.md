## Supabase Configuration Checklist

### 1. Authentication Settings
- [ ] Go to Supabase Dashboard → Authentication → Settings
- [ ] Site URL: `http://localhost:3003`
- [ ] Redirect URLs: `http://localhost:3003/auth/callback`
- [ ] Additional Redirect URLs: `http://localhost:3003/**`

### 2. Email Provider
- [ ] Go to Authentication → Providers
- [ ] Email should be enabled (toggle ON)

### 3. Users Table Check
Run this in Supabase SQL Editor:

```sql
-- Check if sample users exist and are approved
SELECT email, is_active, is_approved, role 
FROM users 
WHERE email IN ('admin@moe.gov.my', 'peneraju@moe.gov.my');
```

Should return:
```
admin@moe.gov.my     | true      | true         | admin
peneraju@moe.gov.my  | true      | true         | peneraju_pemeriksaan
```

### 4. If Users Don't Exist, Run Sample Data:
```sql
-- Re-insert sample data if needed
\i database/sample-data.sql
```

### 5. Test Magic Link Flow:
1. Email: admin@moe.gov.my
2. Click "Send Magic Link"
3. Check browser console for errors
4. Check Supabase Dashboard → Authentication → Users (should see new auth user)

### 6. Common Error Solutions:

**Error: "Invalid login credentials"**
- User doesn't exist in auth.users table
- Solution: Magic Link will create the auth user automatically

**Error: "User not registered in the system"**  
- User exists in auth.users but not in your users table
- Solution: Make sure sample-data.sql was run

**Error: "Account pending approval"**
- User exists but is_approved = false
- Solution: Update user: `UPDATE users SET is_approved = true WHERE email = 'admin@moe.gov.my'`

**Error: Nothing happens**
- Site URL not configured
- Solution: Add http://localhost:3003 to Supabase settings