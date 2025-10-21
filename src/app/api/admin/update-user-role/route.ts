import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { userId, newRole } = await request.json()

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

    // Validate role
    const allowedRoles = ['pemantau', 'penyelaras_bahagian', 'penyelaras_jpn', 'peneraju_pemeriksaan', 'admin']
    if (!allowedRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Role tidak sah' }, { status: 400 })
    }

    // Simple role update - just update the role field
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        role: newRole,
        department_id: null, // Clear department assignment for flexibility
        jpn_id: null // Clear JPN assignment for flexibility
      })
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