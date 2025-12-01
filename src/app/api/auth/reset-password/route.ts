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
      .select('email')
      .eq('id', resetData.user_id)
      .single();

    // Check if auth.users account exists first
    if (user) {
      try {
        // Try to update existing auth.users password first
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
          resetData.user_id,
          { password: password }
        );

        if (authUpdateError) {
          // If user_not_found, try to create new auth account
          if (authUpdateError.message?.includes('User not found') || 
              authUpdateError.message?.includes('not found')) {
            console.log('📝 Creating auth account for legacy user with existing ID...');
            
            const { error: createError } = await supabase.auth.admin.createUser({
              id: resetData.user_id,
              email: user.email,
              password: password,
              email_confirm: true,
              user_metadata: { migrated_from_legacy: true }
            });

            if (createError) {
              // If error is "email already registered", try deleting old auth account first
              if (createError.message?.includes('already been registered')) {
                console.log('⚠️ Auth email already exists, attempting to update by email...');
                
                // Find existing auth user by email
                const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
                const authUser = existingAuthUser.users.find(u => u.email === user.email);
                
                if (authUser) {
                  // Update the existing auth user's password
                  await supabase.auth.admin.updateUserById(authUser.id, { password: password });
                  console.log('✅ Updated existing auth account password');
                }
              } else {
                console.error('❌ Failed to create auth user:', createError);
              }
            } else {
              console.log('✅ Auth account created successfully');
            }
          } else {
            console.error('❌ Auth update error:', authUpdateError);
          }
        } else {
          console.log('✅ Auth password updated successfully');
        }
      } catch (err) {
        console.log('⚠️ Auth error:', err);
      }
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
