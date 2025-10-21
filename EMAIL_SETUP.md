# Magic Link Development Setup

## Issue: Real Email Not Available for Testing

### Problem:
- Magic Link sends actual email to admin@moe.gov.my
- You don't have access to that email
- Can't click the magic link

## Solution Options:

### Option 1: Use Test Email Services (Recommended)

#### A) Mailtrap.io (Free)
1. Go to https://mailtrap.io
2. Sign up for free account
3. Get SMTP credentials
4. Configure Supabase to use Mailtrap SMTP

#### B) Temp Mail Services
Use temporary email for testing:
- https://temp-mail.org
- https://10minutemail.com
- Create temp email like: test123@10minutemail.com

### Option 2: Use Your Own Email for Testing

#### Update Sample Data with Your Email:
```sql
-- Run this in Supabase SQL Editor
UPDATE users 
SET email = 'your-actual-email@gmail.com' 
WHERE email = 'admin@moe.gov.my';
```

### Option 3: Development Mode - Skip Email Verification

#### Create Direct Login (Bypass Magic Link):
We can create a development login that skips email verification.

### Option 4: Console Link Development Mode

Supabase can show magic links in console instead of sending email.

## Quick Fix for Testing:

### Step 1: Use Your Real Email
```sql
-- Replace with your actual email
UPDATE users SET email = 'your-email@gmail.com' WHERE role = 'admin';
```

### Step 2: Test Magic Link
- Use your real email instead of admin@moe.gov.my
- Check your email for magic link
- Click the link

### Step 3: Alternative - Development Login

Create a simple password login for development only.