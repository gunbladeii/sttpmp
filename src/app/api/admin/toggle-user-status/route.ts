import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    // Get the auth token from the request
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Tiada token pengesahan' },
        { status: 401 }
      )
    }

    // Create a regular Supabase client to verify the requesting user
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Verify the token and get user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token tidak sah' },
        { status: 401 }
      )
    }

    // Check if requesting user is admin
    const { data: requestingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single()

    if (userError || !requestingUser) {
      return NextResponse.json(
        { error: 'Pengguna tidak dijumpai' },
        { status: 404 }
      )
    }

    if (requestingUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Hanya admin boleh mengubah status pengguna' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { userId, is_active } = body

    if (!userId || typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'Parameter tidak lengkap' },
        { status: 400 }
      )
    }

    // Update user status using admin client
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ 
        is_active: is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user status:', error)
      return NextResponse.json(
        { error: 'Gagal mengemas kini status pengguna: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: is_active ? 'Pengguna telah diaktifkan' : 'Pengguna telah dinyahaktifkan',
      user: data
    })

  } catch (error) {
    console.error('Toggle user status error:', error)
    return NextResponse.json(
      { error: 'Ralat pelayan dalaman' },
      { status: 500 }
    )
  }
}
