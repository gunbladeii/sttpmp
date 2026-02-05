/**
 * DEBUG SCRIPT FOR PASSWORD RESET ISSUE
 * 
 * This script helps diagnose why temporary passwords fail to login
 * Run with: node DEBUG_PASSWORD_RESET.js
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uafgsyhfvrmcuypmyatx.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZmdzeWhmdnJtY3V5cG15YXR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDc4MTQ1NiwiZXhwIjoyMDc2MzU3NDU2fQ.ypdVRNcz1ppT3zZ10PfcE1m2OT5yBhsULSPKfrvLKzQ'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const TEST_EMAIL = 'jn.datasdtm@moe.gov.my'

async function debugPasswordReset() {
  console.log('🔍 Starting Password Reset Diagnosis...\n')

  // Step 1: Check users table
  console.log('📋 Step 1: Checking users table...')
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', TEST_EMAIL)
    .single()

  if (userError) {
    console.error('❌ Error fetching user:', userError)
    return
  }

  console.log('✅ User found in database:')
  console.log(`   - ID: ${userData.id}`)
  console.log(`   - Email: ${userData.email}`)
  console.log(`   - Name: ${userData.name}`)
  console.log(`   - Role: ${userData.role}`)
  console.log(`   - Active: ${userData.is_active}`)

  // Step 2: Check auth.users
  console.log('\n🔐 Step 2: Checking auth.users...')
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('❌ Error listing auth users:', authError)
    return
  }

  const authUser = authData.users.find(u => u.email === TEST_EMAIL)

  if (!authUser) {
    console.error('❌ Auth user NOT FOUND!')
    console.log('\n🔧 SOLUTION: Create auth user first')
    console.log('   Run this in Supabase SQL Editor:')
    console.log(`   
      -- Create auth user
      INSERT INTO auth.users (
        id,
        email,
        email_confirmed_at,
        encrypted_password,
        created_at,
        updated_at
      ) VALUES (
        '${userData.id}',
        '${userData.email}',
        NOW(),
        crypt('TEMPORARY_PASSWORD_HERE', gen_salt('bf')),
        NOW(),
        NOW()
      );
    `)
    return
  }

  console.log('✅ Auth user found:')
  console.log(`   - Auth ID: ${authUser.id}`)
  console.log(`   - Email: ${authUser.email}`)
  console.log(`   - Email Confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`)
  console.log(`   - Created: ${authUser.created_at}`)
  console.log(`   - Last Sign In: ${authUser.last_sign_in_at || 'Never'}`)

  // Step 3: Test password reset
  console.log('\n🔄 Step 3: Testing password reset...')
  const testPassword = 'TestPass123!@#'
  
  const { data: resetData, error: resetError } = await supabase.auth.admin.updateUserById(
    authUser.id,
    { password: testPassword }
  )

  if (resetError) {
    console.error('❌ Password reset FAILED:', resetError)
    return
  }

  console.log('✅ Password reset successful!')
  console.log(`   Test password: ${testPassword}`)

  // Step 4: Test login
  console.log('\n🔑 Step 4: Testing login with new password...')
  
  // Create a new client for testing login (without service role)
  const testClient = createClient(
    supabaseUrl,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZmdzeWhmdnJtY3V5cG15YXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3ODE0NTYsImV4cCI6MjA3NjM1NzQ1Nn0.RmOymEfDlWEKuwrW9HPey0FGN7uHT0jswvUlT5T8-qA'
  )

  const { data: loginData, error: loginError } = await testClient.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: testPassword
  })

  if (loginError) {
    console.error('❌ Login FAILED:', loginError)
    console.log('\n🔍 Possible issues:')
    console.log('   1. Email not confirmed (email_confirmed_at is NULL)')
    console.log('   2. User is disabled')
    console.log('   3. Password not properly hashed')
    console.log('   4. Auth policies blocking access')
    return
  }

  console.log('✅ Login SUCCESS!')
  console.log(`   - User ID: ${loginData.user.id}`)
  console.log(`   - Email: ${loginData.user.email}`)
  console.log(`   - Session: ${loginData.session ? 'Active' : 'None'}`)

  // Cleanup
  await testClient.auth.signOut()

  console.log('\n' + '='.repeat(60))
  console.log('✅ DIAGNOSIS COMPLETE')
  console.log('='.repeat(60))
  console.log('\n📝 Summary:')
  console.log('   - User exists in database: ✅')
  console.log('   - Auth user exists: ✅')
  console.log('   - Password can be reset: ✅')
  console.log('   - Login works: ✅')
  console.log('\n💡 If login still fails in the app, check:')
  console.log('   1. Browser cache/cookies')
  console.log('   2. CORS settings')
  console.log('   3. RLS policies')
  console.log('   4. Network tab for API errors')
}

// Run the diagnosis
debugPasswordReset().catch(console.error)
