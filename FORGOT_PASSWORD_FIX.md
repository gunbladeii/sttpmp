# ⚠️ Forgot Password Not Working - Email Configuration Required

## Root Cause
Supabase Auth's `resetPasswordForEmail()` requires email service to be configured in Supabase Dashboard.

## Quick Fix Options

### Option 1: Configure Supabase Email (RECOMMENDED for Production)

1. Go to Supabase Dashboard → Authentication → Email Templates
2. Enable "Reset Password" email template
3. Customize template if needed
4. Test reset password flow

**This is required for production deployment!**

### Option 2: Use Custom Email with Brevo (Development Alternative)

Instead of Supabase's built-in email, use Brevo directly:

```typescript
// Modified forgot-password API
import { sendEmail } from '@/lib/email'

// Generate reset token manually
const resetToken = crypto.randomBytes(32).toString('hex')
const resetExpiry = new Date(Date.now() + 3600000) // 1 hour

// Store token in database
await supabase
  .from('password_reset_tokens')
  .insert({
    user_id: user.id,
    token: resetToken,
    expires_at: resetExpiry
  })

// Send email via Brevo
await sendEmail({
  to: email,
  subject: 'Reset Kata Laluan STTPMP',
  html: `
    <p>Klik link di bawah untuk reset kata laluan:</p>
    <a href="${appUrl}/reset-password?token=${resetToken}">
      Reset Password
    </a>
  `
})
```

## Temporary Solution for Testing

For local testing WITHOUT email, you can:

1. **Get reset link from Supabase logs:**
   - Check browser console (Network tab)
   - Look for the reset link in response

2. **Or skip email verification:**
   - Allow users to reset via admin panel
   - Admin manually resets user passwords

## Current Status

✅ Reset password page created  
✅ API routes created  
❌ Email service not configured  
⏳ Need to choose Option 1 or 2

## Recommended Next Steps

**For immediate deployment:**
1. Configure Supabase Email Templates (5 minutes)
2. Test forgot password flow
3. Deploy

**For custom solution:**
1. Create `password_reset_tokens` table
2. Implement custom token generation
3. Use Brevo for emails (already configured)
4. More control but more complex

---

**Which option do you prefer?**
- Option 1: Quick (use Supabase email) ⚡
- Option 2: Custom (use Brevo, more control) 🔧
