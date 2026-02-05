#!/usr/bin/env node

/**
 * Test Password Reset Flow
 * 
 * This script tests the complete password reset flow:
 * 1. Request password reset
 * 2. Get reset token from database
 * 3. Reset password with token
 * 4. Verify password was updated correctly
 * 5. Test login with new password
 */

const TEST_EMAIL = 'jn.datasdtm@moe.gov.my'; // 👈 Change this to test user
const TEST_NEW_PASSWORD = 'TestPassword123!';
const API_BASE_URL = 'http://localhost:3000';

console.log('🧪 PASSWORD RESET FLOW TEST');
console.log('='.repeat(50));
console.log(`Testing email: ${TEST_EMAIL}`);
console.log(`API URL: ${API_BASE_URL}`);
console.log('='.repeat(50));
console.log('');

async function testPasswordReset() {
  try {
    // STEP 1: Request password reset
    console.log('📧 Step 1: Requesting password reset...');
    const resetResponse = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: TEST_EMAIL }),
    });

    const resetData = await resetResponse.json();
    console.log('Response:', resetData);

    if (!resetData.success) {
      throw new Error('Failed to request password reset');
    }

    console.log('✅ Password reset email sent (check your email for token)');
    console.log('');

    // STEP 2: Get token from database (in real scenario, user gets this from email)
    console.log('🔑 Step 2: Getting reset token from database...');
    console.log('⚠️ In production, user would get this from email');
    console.log('');
    console.log('📋 To get the token, run this SQL query in Supabase:');
    console.log('');
    console.log(`SELECT token, expires_at FROM password_reset_tokens`);
    console.log(`WHERE user_id = (SELECT id FROM users WHERE email = '${TEST_EMAIL}')`);
    console.log(`AND used = false`);
    console.log(`ORDER BY created_at DESC LIMIT 1;`);
    console.log('');
    console.log('Copy the token and paste it below when prompted.');
    console.log('');
    
    // Since we can't directly query DB from here, we'll need manual input
    console.log('⏸️ Test paused - Manual intervention required:');
    console.log('');
    console.log('To continue testing:');
    console.log('1. Check your email for reset link');
    console.log('2. OR get token from Supabase SQL query above');
    console.log('3. Use the token to test reset API:');
    console.log('');
    console.log(`curl -X POST ${API_BASE_URL}/api/auth/reset-password \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"token":"YOUR_TOKEN_HERE","password":"${TEST_NEW_PASSWORD}"}'`);
    console.log('');
    console.log('4. Then test login:');
    console.log('');
    console.log(`curl -X POST ${API_BASE_URL}/api/auth/login \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"email":"${TEST_EMAIL}","password":"${TEST_NEW_PASSWORD}"}'`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Make sure dev server is running (npm run dev)');
    console.error('2. Check if Supabase is accessible');
    console.error('3. Verify email exists in users table');
    console.error('4. Check Brevo email settings');
  }
}

// Run the test
testPasswordReset();
