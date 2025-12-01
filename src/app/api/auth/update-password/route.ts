import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Kata laluan mestilah sekurang-kurangnya 8 aksara' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak dijumpai' },
        { status: 401 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use service role client to update password fields
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Update password_hash in users table using admin client (bypasses RLS)
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        password_hash: hashedPassword,
        password_reset_required: false 
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update password error:', updateError);
      return NextResponse.json(
        { success: false, message: 'Ralat mengemaskini kata laluan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Kata laluan berjaya dikemaskini'
    });

  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json(
      { success: false, message: 'Ralat pelayan' },
      { status: 500 }
    );
  }
}
