import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendAdminNewRegistrationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    // Validation
    if (!email || !name) {
      return NextResponse.json({ error: 'Email dan nama diperlukan' }, { status: 400 })
    }

    if (!email.includes('@moe.gov.my')) {
      return NextResponse.json({ 
        error: 'Hanya email dengan domain @moe.gov.my yang dibenarkan' 
      }, { status: 400 })
    }

    // Check if user already exists in users table
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, is_approved, is_active')
      .eq('email', email)
      .single()

    if (existingUser) {
      if (existingUser.is_approved && existingUser.is_active) {
        return NextResponse.json({ 
          error: 'Akaun anda sudah diluluskan. Sila log masuk.' 
        }, { status: 400 })
      } else {
        return NextResponse.json({ 
          error: 'Permohonan anda sedang menunggu kelulusan admin.' 
        }, { status: 400 })
      }
    }

    // Get auth user ID from Supabase Auth (OAuth user)
    const { data: listUsersResult } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = (listUsersResult?.users as any[]).find((u: any) => u.email === email)

    if (!authUser) {
      return NextResponse.json({ 
        error: 'Pengguna tidak dijumpai dalam sistem auth. Sila log masuk semula.' 
      }, { status: 400 })
    }

    // Create user record for OAuth user
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.id, // Use OAuth user's auth ID
        email,
        name,
        role: 'pemantau', // Default role
        password_hash: '', // Empty for OAuth users
        email_verified: true, // OAuth users are already verified
        is_active: false,
        is_approved: false,
        requested_role: null // OAuth users don't specify role initially
      })

    if (insertError) {
      console.error('Access request error:', insertError)
      return NextResponse.json({ 
        error: `Gagal menyimpan permohonan: ${insertError.message}` 
      }, { status: 500 })
    }

    // Send notification to admins
    try {
      await sendAdminNewRegistrationEmail({
        userName: name,
        userEmail: email,
        requestedRole: null,
        registrationId: authUser.id
      })
      console.log('✅ Admin notification sent for OAuth access request')
    } catch (emailError) {
      console.error('❌ Error sending admin notification:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true,
      message: 'Permohonan capaian berjaya dihantar. Sila tunggu kelulusan dari admin.'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Ralat dalaman server' }, { status: 500 })
  }
}
