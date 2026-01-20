/**
 * Script to check if user exists in Supabase database
 * Run: node scripts/check-user-exists.js
 */

// Disable SSL verification for localhost testing (not recommended for production)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Found' : '✗ Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓ Found' : '✗ Missing');
  process.exit(1);
}

// Get email from command line or use default
const emailToCheck = process.argv[2] || 'fisha.hafiz@moe.gov.my';

console.log('\n🔍 Checking user in database...');
console.log('📧 Email:', emailToCheck);
console.log('🌐 Supabase URL:', supabaseUrl);
console.log('');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUser() {
  try {
    // Check auth.users
    console.log('1️⃣ Checking auth.users table...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error checking auth.users:', authError.message);
    } else {
      const authUser = authUsers.users.find(u => u.email === emailToCheck);
      if (authUser) {
        console.log('✅ User exists in auth.users');
        console.log('   - ID:', authUser.id);
        console.log('   - Email:', authUser.email);
        console.log('   - Email Confirmed:', authUser.email_confirmed_at ? '✓ Yes' : '✗ No');
        console.log('   - Created:', authUser.created_at);
      } else {
        console.log('❌ User NOT found in auth.users');
        console.log('   Available users:', authUsers.users.map(u => u.email).join(', '));
      }
    }

    console.log('');

    // Check users table
    console.log('2️⃣ Checking users table...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        role,
        is_approved,
        is_active,
        department_id,
        jpn_id,
        created_at
      `)
      .eq('email', emailToCheck)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        console.log('❌ User NOT found in users table');
        
        // Show all users
        const { data: allUsers } = await supabase
          .from('users')
          .select('email, name, role, is_approved')
          .limit(10);
        
        if (allUsers && allUsers.length > 0) {
          console.log('\n📋 Available users in database:');
          allUsers.forEach(u => {
            console.log(`   - ${u.email} (${u.name}) [${u.role}] ${u.is_approved ? '✓ Approved' : '⏳ Pending'}`);
          });
        } else {
          console.log('\n⚠️  No users found in database at all!');
          console.log('   Run the SQL script to create test users.');
        }
      } else {
        console.error('❌ Database error:', userError);
      }
    } else {
      console.log('✅ User exists in users table');
      console.log('   - ID:', userData.id);
      console.log('   - Name:', userData.name);
      console.log('   - Role:', userData.role);
      console.log('   - Approved:', userData.is_approved ? '✓ Yes' : '✗ No (BLOCKED)');
      console.log('   - Active:', userData.is_active ? '✓ Yes' : '✗ No (BLOCKED)');
      console.log('   - Department ID:', userData.department_id || 'None');
      console.log('   - JPN ID:', userData.jpn_id || 'None');
      console.log('   - Created:', userData.created_at);

      // Additional checks
      console.log('');
      console.log('🔐 Login Status:');
      if (!userData.is_approved) {
        console.log('❌ CANNOT LOGIN - User not approved');
      } else if (!userData.is_active) {
        console.log('❌ CANNOT LOGIN - User not active');
      } else {
        console.log('✅ CAN LOGIN - User is approved and active');
      }
    }

    console.log('');
    console.log('✅ Check complete!\n');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkUser();
