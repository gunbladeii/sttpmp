import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Fix SSL issues in localhost development
import '@/lib/ssl-fix';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    console.log('🔍 GET-PROFILE API: Searching for user:', email);

    if (!email) {
      console.error('❌ GET-PROFILE API: No email provided');
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Check environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ GET-PROFILE API: Missing Supabase credentials');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Server configuration error',
          debug: 'Missing SUPABASE_URL or SERVICE_ROLE_KEY'
        },
        { status: 500 }
      );
    }

    console.log('📡 GET-PROFILE API: Connecting to Supabase:', supabaseUrl);

    // Use service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Fetch user profile with department and JPN details
    console.log('🔎 GET-PROFILE API: Querying users table...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        department:department_id(id, name, code, sector),
        jpn:jpn_id(id, name, state)
      `)
      .eq('email', email)
      .single();

    if (userError) {
      console.error('❌ GET-PROFILE API: Database error:', userError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Profil pengguna tidak dijumpai dalam database',
          debug: {
            error: userError.message,
            code: userError.code,
            details: userError.details,
            hint: userError.hint
          }
        },
        { status: 404 }
      );
    }

    if (!userData) {
      console.error('❌ GET-PROFILE API: No user data returned for:', email);
      return NextResponse.json(
        { 
          success: false, 
          message: `Akaun dengan email ${email} tidak wujud dalam sistem. Sila daftar terlebih dahulu.`,
          debug: 'User record not found in users table'
        },
        { status: 404 }
      );
    }

    // Check approval status
    if (!userData.is_approved) {
      console.warn('⚠️ GET-PROFILE API: User not approved:', email);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Akaun belum diluluskan oleh admin. Sila tunggu kelulusan.',
          debug: `is_approved = ${userData.is_approved}`
        },
        { status: 403 }
      );
    }

    // Check active status
    if (!userData.is_active) {
      console.warn('⚠️ GET-PROFILE API: User not active:', email);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Akaun telah dinyahaktifkan. Sila hubungi admin.',
          debug: `is_active = ${userData.is_active}`
        },
        { status: 403 }
      );
    }

    console.log('✅ GET-PROFILE API: User found and approved:', {
      email: userData.email,
      name: userData.name,
      role: userData.role,
      is_approved: userData.is_approved,
      is_active: userData.is_active
    });

    return NextResponse.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('💥 GET-PROFILE API: Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Ralat sistem. Sila cuba lagi.',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
