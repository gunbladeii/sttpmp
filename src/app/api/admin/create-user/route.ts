import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'
import { sendApprovalEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    // Check if the requester is an admin
    const userEmail = req.headers.get('x-user-email')
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: requester } = await supabase
      .from('users')
      .select('role')
      .eq('email', userEmail)
      .single()

    if (!requester || requester.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { name, email, password, role, department_id, jpn_id, sector } = body

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json({ 
        error: 'Nama, email, kata laluan, dan peranan diperlukan' 
      }, { status: 400 })
    }

    // Validate role-specific requirements
    if (role === 'penyelaras_bahagian' && !department_id) {
      return NextResponse.json({ 
        error: 'Bahagian diperlukan untuk Penyelaras Bahagian' 
      }, { status: 400 })
    }

    if (role === 'penyelaras_jpn' && !jpn_id) {
      return NextResponse.json({ 
        error: 'JPN diperlukan untuk Penyelaras JPN' 
      }, { status: 400 })
    }

    if (role === 'peneraju_pemeriksaan' && !sector) {
      return NextResponse.json({ 
        error: 'Sektor diperlukan untuk Peneraju Pemeriksaan' 
      }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Pengguna dengan email ini sudah wujud' 
      }, { status: 400 })
    }

    // Create user in auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) {
      return NextResponse.json({ 
        error: `Ralat mencipta akaun: ${authError.message}` 
      }, { status: 400 })
    }

    // Create user in public.users table
    const userData: any = {
      id: authUser.user.id,
      email,
      name,
      role,
      is_active: true,
      is_approved: true,
      email_verified: true,
      created_at: new Date().toISOString()
    }

    // Add role-specific fields
    if (role === 'penyelaras_bahagian') {
      userData.department_id = department_id
    } else if (role === 'penyelaras_jpn') {
      userData.jpn_id = jpn_id
    } else if (role === 'peneraju_pemeriksaan') {
      userData.sector = sector
    }

    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert([userData])

    if (userError) {
      // If user creation fails, delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ 
        error: `Ralat menyimpan maklumat pengguna: ${userError.message}` 
      }, { status: 400 })
    }

    // Send approval email notification
    try {
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`
      
      await sendApprovalEmail({
        to: email,
        userName: name || email,
        userRole: role,
        loginUrl,
      })
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Don't fail the request if email fails, just log it
    }

    return NextResponse.json({ 
      message: 'Pengguna admin berjaya dicipta',
      user: userData
    })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ 
      error: 'Ralat dalaman server' 
    }, { status: 500 })
  }
}