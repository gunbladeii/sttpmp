import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { userId, newRole, sector, department_id, jpn_id } = await request.json()

    if (!userId || !newRole) {
      return NextResponse.json({ error: 'User ID dan role diperlukan' }, { status: 400 })
    }

    // Get user email from headers (sent by client)
    const userEmail = request.headers.get('x-user-email')
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized - No user email' }, { status: 401 })
    }

    // Verify user is admin
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role, is_active, is_approved')
      .eq('email', userEmail)
      .single()

    if (roleError || !userData || userData.role !== 'admin' || !userData.is_active || !userData.is_approved) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Validate role and required fields
    const allowedRoles = ['pemantau', 'penyelaras_bahagian', 'penyelaras_jpn', 'penyelaras_jnn', 'peneraju_pemeriksaan', 'admin']
    if (!allowedRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Role tidak sah' }, { status: 400 })
    }

    // Validate required fields based on role
    if (newRole === 'peneraju_pemeriksaan' && !sector) {
      return NextResponse.json({ error: 'Sektor diperlukan untuk Peneraju Pemeriksaan' }, { status: 400 })
    }
    if (newRole === 'penyelaras_bahagian' && !department_id) {
      return NextResponse.json({ error: 'Bahagian diperlukan untuk Penyelaras Bahagian' }, { status: 400 })
    }
    if ((newRole === 'penyelaras_jpn' || newRole === 'penyelaras_jnn') && !jpn_id) {
      return NextResponse.json({ error: 'JPN diperlukan untuk Penyelaras JPN/JNN' }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      role: newRole,
      sector: null,
      department_id: null,
      jpn_id: null
    }

    // Set appropriate fields based on role
    if (newRole === 'peneraju_pemeriksaan' && sector) {
      updateData.sector = sector
    } else if (newRole === 'penyelaras_bahagian' && department_id) {
      updateData.department_id = department_id
    } else if ((newRole === 'penyelaras_jpn' || newRole === 'penyelaras_jnn') && jpn_id) {
      updateData.jpn_id = jpn_id
    }

    // Update user with admin client
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user role:', updateError)
      return NextResponse.json({ error: 'Gagal mengemas kini role pengguna: ' + updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Role pengguna berjaya dikemas kini'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Ralat dalaman server' }, { status: 500 })
  }
}