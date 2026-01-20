/**
 * Test login flow manually
 * Run: node scripts/test-login-flow.js
 */

// Disable SSL verification for localhost testing
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const email = process.argv[2] || 'fisha.hafiz@moe.gov.my';
const password = process.argv[3] || 'Test123456!';

console.log('\n🧪 Testing Login Flow...\n');
console.log('📧 Email:', email);
console.log('🔑 Password:', password.replace(/./g, '*'));
console.log('');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  try {
    // Step 1: Login with Supabase Auth
    console.log('1️⃣ Attempting Supabase Auth login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('❌ Auth login failed:', authError.message);
      return;
    }

    console.log('✅ Auth login successful!');
    console.log('   - User ID:', authData.user.id);
    console.log('   - Email:', authData.user.email);
    console.log('   - Session:', authData.session ? 'Created' : 'None');
    console.log('');

    // Step 2: Fetch user profile via API
    console.log('2️⃣ Fetching user profile via API...');
    
    // Simulate API call (we can't actually call localhost API from script)
    console.log('   This step would call: POST /api/auth/get-profile');
    console.log('   With body:', JSON.stringify({ email }, null, 2));
    console.log('');

    // Step 3: Direct database check
    console.log('3️⃣ Direct database check (using service role)...');
    const supabaseAdmin = createClient(
      supabaseUrl, 
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        name,
        role,
        is_approved,
        is_active,
        department_id,
        jpn_id
      `)
      .eq('email', email)
      .single();

    if (userError) {
      console.error('❌ Profile fetch failed:', userError.message);
      return;
    }

    console.log('✅ Profile fetched successfully!');
    console.log('   - Name:', userData.name);
    console.log('   - Role:', userData.role);
    console.log('   - Approved:', userData.is_approved ? '✓' : '✗ BLOCKED');
    console.log('   - Active:', userData.is_active ? '✓' : '✗ BLOCKED');
    console.log('');

    // Final verdict
    console.log('🎯 FINAL VERDICT:');
    if (userData.is_approved && userData.is_active) {
      console.log('✅ LOGIN SHOULD WORK!');
      console.log('');
      console.log('If login fails in browser:');
      console.log('1. Check browser console (F12) for errors');
      console.log('2. Check Network tab for failed API calls');
      console.log('3. Try clearing browser cache');
      console.log('4. Try incognito mode');
    } else {
      console.log('❌ LOGIN WILL FAIL:');
      if (!userData.is_approved) console.log('   - User not approved');
      if (!userData.is_active) console.log('   - User not active');
    }

    // Cleanup
    await supabase.auth.signOut();
    console.log('');
    console.log('✅ Test complete!\n');

  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

testLogin();
