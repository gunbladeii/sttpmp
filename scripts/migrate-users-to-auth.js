#!/usr/bin/env node

/**
 * Post-Security-Fix Migration Script
 * Run this after deploying security fixes to migrate existing users
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function migrateExistingUsers() {
  console.log('🚀 Starting user migration...\n')

  try {
    // 1. Get all users from database
    console.log('📋 Fetching users from database...')
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true })

    if (fetchError) {
      throw new Error(`Failed to fetch users: ${fetchError.message}`)
    }

    console.log(`✅ Found ${users.length} users\n`)

    // 2. Check which users already have auth accounts
    console.log('🔍 Checking existing auth accounts...')
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers()
    const authEmails = new Set(authUsers.map(u => u.email))
    
    const usersNeedingAuth = users.filter(u => !authEmails.has(u.email))
    console.log(`📊 ${authEmails.size} users already have auth accounts`)
    console.log(`📊 ${usersNeedingAuth.length} users need auth accounts\n`)

    if (usersNeedingAuth.length === 0) {
      console.log('✅ All users already have auth accounts!')
      return
    }

    // 3. Create auth accounts for users without them
    console.log('🔐 Creating auth accounts...\n')
    
    let successCount = 0
    let failCount = 0
    const failedUsers = []

    for (const user of usersNeedingAuth) {
      try {
        // Generate temporary password
        const tempPassword = generateTempPassword()
        
        // Create auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: tempPassword,
          email_confirm: user.is_approved, // Auto-confirm if already approved
          user_metadata: {
            name: user.name,
            migrated_from_legacy: true
          }
        })

        if (authError) {
          throw authError
        }

        // Update user record with auth ID
        const { error: updateError } = await supabase
          .from('users')
          .update({ id: authUser.user.id })
          .eq('email', user.email)

        if (updateError) {
          // If update fails, delete the auth user we just created
          await supabase.auth.admin.deleteUser(authUser.user.id)
          throw updateError
        }

        successCount++
        console.log(`✅ ${user.email} - Auth account created (temp password: ${tempPassword})`)
        
        // Store temp password for email notification
        // In production, you'd send this via email
        
      } catch (error) {
        failCount++
        failedUsers.push({ email: user.email, error: error.message })
        console.error(`❌ ${user.email} - Failed: ${error.message}`)
      }
    }

    console.log('\n📊 Migration Summary:')
    console.log(`✅ Success: ${successCount}`)
    console.log(`❌ Failed: ${failCount}`)
    
    if (failedUsers.length > 0) {
      console.log('\n❌ Failed Users:')
      failedUsers.forEach(f => console.log(`   - ${f.email}: ${f.error}`))
    }

    console.log('\n⚠️  IMPORTANT: Send temporary passwords to users via email!')
    console.log('    Users will need to reset their passwords on first login.\n')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

function generateTempPassword(length = 16) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Run migration
migrateExistingUsers()
  .then(() => {
    console.log('✅ Migration completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration error:', error)
    process.exit(1)
  })
