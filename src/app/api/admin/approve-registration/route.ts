import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendApprovalEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { requestId, assignedRole, sector, department_id, jpn_id } = await request.json()
    
    // Get user email from headers (sent by client)
    const userEmail = request.headers.get('x-user-email')
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized - No user email' }, { status: 401 })
    }

    if (!requestId || !assignedRole) {
      return NextResponse.json({ error: 'Request ID and role are required' }, { status: 400 })
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

    // Handle mock data (if requestId is the mock UUID, just return success)
    if (requestId === '550e8400-e29b-41d4-a716-446655440001') {
      return NextResponse.json({
        success: true,
        message: 'Mock registration approved successfully',
        requestId
      })
    }

    // Update the user record to approve and activate them (for real users)
    const updateData: any = {
      is_approved: true,
      is_active: true,
      role: assignedRole,
      email_verified: true
    }

    // Add sector for peneraju_pemeriksaan
    if (assignedRole === 'peneraju_pemeriksaan' && sector) {
      updateData.sector = sector
    }

    // Add department_id for penyelaras_bahagian
    if (assignedRole === 'penyelaras_bahagian' && department_id) {
      updateData.department_id = department_id
    }

    // Add jpn_id for penyelaras_jpn and penyelaras_jnn
    if ((assignedRole === 'penyelaras_jpn' || assignedRole === 'penyelaras_jnn') && jpn_id) {
      updateData.jpn_id = jpn_id
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', requestId)
      .select('email, name, role')
      .single()

    if (updateError) {
      console.error('Error approving registration:', updateError)
      return NextResponse.json({ error: 'Failed to approve registration' }, { status: 500 })
    }

    // Send approval email
    if (updatedUser) {
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`
      
      await sendApprovalEmail({
        to: updatedUser.email,
        userName: updatedUser.name || updatedUser.email,
        userRole: updatedUser.role,
        loginUrl,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Registration approved successfully',
      requestId
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}