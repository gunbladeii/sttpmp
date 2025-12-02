import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendRejectionEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { requestId, reason = 'Registration rejected by administrator' } = await request.json()

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
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

    // Handle mock data (if requestId is the mock UUID, just return success)
    if (requestId === '550e8400-e29b-41d4-a716-446655440001') {
      return NextResponse.json({
        success: true,
        message: 'Mock registration rejected successfully',
        requestId,
        reason
      })
    }

    // Get user info before deletion for email
    const { data: userToReject } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('id', requestId)
      .single()

    // Delete the rejected user from the users table
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', requestId)

    if (deleteError) {
      console.error('Error rejecting registration:', deleteError)
      return NextResponse.json({ error: 'Failed to reject registration' }, { status: 500 })
    }

    // Delete from auth.users to prevent memory leak
    try {
      await supabaseAdmin.auth.admin.deleteUser(requestId)
      console.log('✅ Auth user deleted:', requestId)
    } catch (authError) {
      console.error('❌ Error deleting auth user:', authError)
      // Continue even if auth deletion fails
    }

    // Send rejection email to user
    if (userToReject) {
      try {
        await sendRejectionEmail({
          to: userToReject.email,
          userName: userToReject.name || userToReject.email,
          reason
        })
        console.log('✅ Rejection email sent to:', userToReject.email)
      } catch (emailError) {
        console.error('❌ Error sending rejection email:', emailError)
        // Don't fail the rejection if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Registration rejected successfully',
      requestId,
      reason
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}