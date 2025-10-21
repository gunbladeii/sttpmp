import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
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

    // Fetch pending registrations using admin client
    try {
      const { data: registrations, error: regError } = await supabaseAdmin
        .from('users')
        .select('id, email, name, created_at')
        .eq('is_approved', false)

      // If we have real pending registrations, return them
      if (!regError && registrations && registrations.length > 0) {
        const formattedRegistrations = registrations.map(reg => ({
          id: reg.id,
          email: reg.email,
          name: reg.name,
          department_name: null,
          jpn_name: null,
          requested_at: reg.created_at,
          days_waiting: Math.floor((Date.now() - new Date(reg.created_at).getTime()) / (1000 * 60 * 60 * 24))
        }))
        return NextResponse.json(formattedRegistrations)
      }
    } catch (error) {
      console.log('Error fetching registrations:', error)
    }

    // Return mock data for now (using proper UUID format)
    const mockRegistrations = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001', // Valid UUID format
        email: 'test.user@moe.gov.my',
        name: 'Test User Pendaftaran',
        department_name: 'BPPDP',
        jpn_name: null,
        requested_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        days_waiting: 2
      }
    ]

    return NextResponse.json(mockRegistrations)
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}