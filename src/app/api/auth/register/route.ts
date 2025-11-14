import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { email, name, password, confirmPassword, department_id, jpn_id } = await request.json()

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

    // Check if email already exists using admin client
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'Email ini telah berdaftar. Sila gunakan email lain.' }, { status: 400 })
    }

    // Insert new user with pending status using service role (bypasses RLS)
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        name,
        role: null, // No default role - admin must assign during approval
        password_hash: `hashed_${password}`,
        password_plain: password,
        department_id: department_id && department_id.trim() !== '' ? department_id : null,
        jpn_id: jpn_id && jpn_id.trim() !== '' ? jpn_id : null,
        email_verified: false,
        is_active: false,
        is_approved: false
      })

    if (insertError) {
      console.error('Registration error:', insertError)
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