import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Fix SSL issues in localhost development
import '@/lib/ssl-fix'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🗑️ DELETE API called for status ID:', params.id)
  
  try {
    const statusId = params.id

    if (!statusId) {
      console.error('❌ No status ID provided')
      return NextResponse.json(
        { error: 'Status ID is required' },
        { status: 400 }
      )
    }

    // Check environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase credentials')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('✅ Supabase client created')
    console.log('🗑️ Attempting to delete status_tracking ID:', statusId)

    // Service role can delete directly, bypassing RLS
    const { error: deleteError, data } = await supabase
      .from('status_tracking')
      .delete()
      .eq('id', statusId)
      .select()

    console.log('🗑️ Delete result:', { data, error: deleteError })

    if (deleteError) {
      console.error('❌ Delete error:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete status tracking' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      console.error('❌ No record found to delete')
      return NextResponse.json(
        { error: 'Status tracking record not found' },
        { status: 404 }
      )
    }

    console.log('✅ Status tracking deleted successfully:', data)

    return NextResponse.json(
      { 
        success: true,
        message: 'Status tracking deleted successfully',
        data: data[0]
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('❌ Unexpected error in DELETE API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    )
  }
}
