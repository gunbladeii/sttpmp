import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, name, password, confirmPassword, department_id, jpn_id, requestedRole } = await request.json()

    // Validation
    if (!email || !name || !password || !confirmPassword) {
      return NextResponse.json({ error: 'Semua field diperlukan' }, { status: 400 })
    }

    if (!email.includes('@moe.gov.my')) {
      return NextResponse.json({ error: 'Hanya email dengan domain @moe.gov.my yang dibenarkan' }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Password dan pengesahan password tidak sama' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password mesti sekurang-kurangnya 8 aksara' }, { status: 400 })
    }

    // Check if email already exists in users table
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'Email ini telah berdaftar. Sila gunakan email lain.' }, { status: 400 })
    }

    // Check if email already exists in Supabase Auth
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const authUserExists = users.some(u => u.email === email)
    
    if (authUserExists) {
      return NextResponse.json({ error: 'Email ini telah berdaftar dalam sistem auth.' }, { status: 400 })
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user in Supabase Auth first
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Will be confirmed upon admin approval
      user_metadata: {
        name,
        requested_role: requestedRole
      }
    })

    if (authError || !authUser) {
      console.error('Auth user creation error:', authError)
      return NextResponse.json({ 
        error: `Gagal membuat akaun auth: ${authError?.message || 'Unknown error'}` 
      }, { status: 500 })
    }

    // Insert user record in users table with auth user id
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id, // Use same ID as auth user
        email,
        name,
        role: 'pemantau', // Default role until admin approves
        password_hash: passwordHash,
        department_id: department_id && department_id.trim() !== '' ? department_id : null,
        jpn_id: jpn_id && jpn_id.trim() !== '' ? jpn_id : null,
        requested_role: requestedRole || null,
        email_verified: false,
        is_active: false,
        is_approved: false
      })

    if (insertError) {
      console.error('Registration error:', insertError)
      // Rollback auth user creation
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ 
        error: `Gagal menyimpan permohonan pendaftaran: ${insertError.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Permohonan pendaftaran berjaya dihantar. Sila tunggu kelulusan dari admin.'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Ralat dalaman server' }, { status: 500 })
  }
}