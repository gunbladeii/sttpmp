import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token tidak sah' },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Kata laluan mestilah sekurang-kurangnya 8 aksara' },
        { status: 400 }
      );
    }

    // Use service role client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify token
    const { data: resetData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !resetData) {
      return NextResponse.json(
        { success: false, message: 'Token tidak sah atau telah tamat tempoh' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password in users table
    // Also auto-approve legacy users who are resetting password
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: hashedPassword,
        password_reset_required: false,
        is_active: true,
        is_approved: true, // Auto-approve on password reset
        updated_at: new Date().toISOString()
      })
      .eq('id', resetData.user_id);

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json(
        { success: false, message: 'Ralat mengemaskini kata laluan' },
        { status: 500 }
      );
    }

    // Get user email for auth account creation
    const { data: user } = await supabase
      .from('users')
      .select('email, id')
      .eq('id', resetData.user_id)
      .single();

    if (!user) {
      console.error('❌ User not found in users table');
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak dijumpai' },
        { status: 404 }
      );
    }

    console.log('🔄 Syncing password for user:', user.email, 'ID:', user.id);

    // CRITICAL FIX: Find the ACTUAL auth user by email (not by ID)
    // This ensures we update the correct auth account
    try {
      const { data: allAuthUsers } = await supabase.auth.admin.listUsers();
      const authUser = allAuthUsers.users.find(u => u.email === user.email);

      if (authUser) {
        // Auth user exists - update password using the CORRECT auth ID
        console.log('✅ Found auth user:', authUser.id, '(Email:', authUser.email, ')');
        
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          authUser.id, // Use the ACTUAL auth user ID, not users.id
          { password: password }
        );

        if (updateError) {
          console.error('❌ Failed to update auth password:', updateError);
          throw new Error('Gagal mengemaskini password dalam auth.users');
        }

        // SYNC CHECK: If auth.users ID differs from users.id, update users.id
        if (authUser.id !== user.id) {
          console.log('⚠️ ID mismatch detected!');
          console.log('   - users.id:', user.id);
          console.log('   - auth.users.id:', authUser.id);
          console.log('🔧 Updating users.id to match auth.users.id...');
          
          await supabase
            .from('users')
            .update({ id: authUser.id })
            .eq('email', user.email);
          
          console.log('✅ ID synchronized successfully');
        }

        console.log('✅ Auth password updated successfully for:', authUser.email);
      } else {
        // No auth user exists - create new auth account
        console.log('📝 No auth account found, creating new auth user...');
        
        // Use the users.id as the auth user ID for consistency
        const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
          id: user.id,
          email: user.email,
          password: password,
          email_confirm: true,
          user_metadata: { migrated_from_legacy: true }
        });

        if (createError) {
          console.error('❌ Failed to create auth user:', createError);
          throw new Error('Gagal mencipta auth account');
        }

        console.log('✅ Auth account created successfully:', newAuthUser.user.id);
      }
    } catch (err) {
      console.error('💥 Critical error during auth sync:', err);
      // Don't fail the request - password in users table is already updated
      // User can still contact admin if auth login fails
    }

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token', token);

    return NextResponse.json({
      success: true,
      message: 'Kata laluan berjaya dikemaskini'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, message: 'Ralat pelayan' },
      { status: 500 }
    );
  }
}
