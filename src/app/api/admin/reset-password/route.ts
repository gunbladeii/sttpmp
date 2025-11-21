import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'

// Generate random password (temporary)
function generateTemporaryPassword(length = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'
  
  const allChars = uppercase + lowercase + numbers + symbols
  let password = ''
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    console.log('🔍 Reset Password Request - User ID:', userId)

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user details from our users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('email, name, id')
      .eq('id', userId)
      .single()

    console.log('📋 User data from database:', userData)
    console.log('❌ User error:', userError)

    if (userError || !userData) {
      console.error('Error finding user in users table:', userError)
      return NextResponse.json(
        { error: `User not found in database: ${userError?.message || 'Unknown error'}` },
        { status: 404 }
      )
    }

    console.log('✅ Found user in database:', userData.email)

    // Get auth user by email to get the auth user ID
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error listing auth users:', authError)
      return NextResponse.json(
        { error: 'Failed to access auth system' },
        { status: 500 }
      )
    }

    console.log('📊 Total auth users found:', authUser.users.length)

    // Find the auth user with matching email
    const matchedAuthUser = authUser.users.find(u => u.email === userData.email)

    console.log('🔍 Looking for auth user with email:', userData.email)
    console.log('✅ Matched auth user:', matchedAuthUser?.id)

    if (!matchedAuthUser) {
      console.error('Auth user not found for email:', userData.email)
      return NextResponse.json(
        { error: `User not found in authentication system for email: ${userData.email}` },
        { status: 404 }
      )
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword()

    console.log('🔑 Generated password, updating auth user:', matchedAuthUser.id)

    // Update user password in Supabase Auth using the auth user ID
    console.log('🔄 Attempting Supabase Auth password update for:', matchedAuthUser.id)
    const updateResult = await supabaseAdmin.auth.admin.updateUserById(
      matchedAuthUser.id,
      { password: temporaryPassword }
    )
    console.log('📝 Supabase Auth update response:', updateResult)
    if (updateResult.error) {
      console.error('❌ Error updating password:', updateResult.error)
      // Log full error object for debugging
      console.error('❌ Full error details:', JSON.stringify(updateResult.error, null, 2))
      return NextResponse.json(
        { error: 'Failed to reset password', details: updateResult.error },
        { status: 500 }
      )
    }

    // Send email with temporary password
    try {
      await sendEmail({
        to: userData.email,
        subject: 'Kata Laluan Baharu - Sistem STTPMP',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Kata Laluan Baharu</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a;">
            <div style="max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);">
              
              <!-- Header with Logo -->
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center; position: relative;">
                <div style="background: rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 20px; display: inline-block; backdrop-filter: blur(10px);">
                  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 200 200">
                    <defs>
                      <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#60a5fa;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <path d="M100 20 L170 50 L170 100 Q170 150 100 180 Q30 150 30 100 L30 50 Z" 
                          fill="url(#shieldGradient)" 
                          filter="url(#glow)" 
                          stroke="#1e40af" 
                          stroke-width="3"/>
                    <circle cx="100" cy="85" r="25" fill="#fbbf24" opacity="0.9"/>
                    <path d="M100 60 L100 95 M100 95 L115 110" 
                          stroke="#1e293b" 
                          stroke-width="6" 
                          stroke-linecap="round" 
                          fill="none"/>
                    <text x="100" y="145" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#fff" text-anchor="middle">JN</text>
                  </svg>
                </div>
                <h1 style="color: #ffffff; margin: 20px 0 0 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                  Sistem STTPMP
                </h1>
                <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 14px; letter-spacing: 0.5px;">
                  Sistem Tahap Tindakan Perakuan Menteri Pendidikan
                </p>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px;">
                <div style="background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                  <h2 style="color: #60a5fa; margin: 0 0 10px 0; font-size: 20px; font-weight: 600;">
                    🔐 Kata Laluan Sementara Anda
                  </h2>
                  <p style="color: #cbd5e1; margin: 0; font-size: 14px; line-height: 1.6;">
                    Admin telah menetapkan semula kata laluan anda.
                  </p>
                </div>

                <p style="color: #e2e8f0; font-size: 15px; line-height: 1.8; margin: 0 0 25px 0;">
                  Assalamualaikum <strong style="color: #60a5fa;">${userData.name}</strong>,
                </p>

                <p style="color: #cbd5e1; font-size: 14px; line-height: 1.8; margin: 0 0 25px 0;">
                  Kata laluan akaun anda untuk sistem STTPMP telah ditetapkan semula oleh pentadbir sistem. 
                  Sila gunakan kata laluan sementara di bawah untuk log masuk:
                </p>

                <!-- Temporary Password Box -->
                <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);">
                  <p style="color: #94a3b8; margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
                    Kata Laluan Sementara
                  </p>
                  <p style="color: #60a5fa; font-size: 24px; font-weight: 700; font-family: 'Courier New', monospace; margin: 0; letter-spacing: 2px; word-break: break-all;">
                    ${temporaryPassword}
                  </p>
                </div>

                <!-- Important Notice -->
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin: 25px 0;">
                  <p style="color: #fca5a5; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">
                    ⚠️ Penting:
                  </p>
                  <ul style="color: #fecaca; margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">
                    <li style="margin-bottom: 8px;">Anda <strong>MESTI</strong> menukar kata laluan ini selepas log masuk pertama</li>
                    <li style="margin-bottom: 8px;">Kata laluan ini adalah <strong>SEMENTARA</strong> dan hanya untuk kegunaan anda</li>
                    <li style="margin-bottom: 8px;">Jangan kongsikan kata laluan ini dengan sesiapa</li>
                    <li>Simpan kata laluan baharu anda di tempat yang selamat</li>
                  </ul>
                </div>

                <!-- Login Button -->
                <div style="text-align: center; margin: 35px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
                     style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3); transition: all 0.3s;">
                    🔐 Log Masuk Sekarang
                  </a>
                </div>

                <p style="color: #94a3b8; font-size: 13px; line-height: 1.8; margin: 25px 0 0 0; padding-top: 25px; border-top: 1px solid #334155;">
                  Jika anda tidak meminta penetapan semula kata laluan ini, sila hubungi pentadbir sistem dengan segera.
                </p>
              </div>

              <!-- Footer -->
              <div style="background: #0f172a; padding: 25px 30px; border-top: 1px solid #1e293b; text-align: center;">
                <p style="color: #64748b; font-size: 12px; margin: 0 0 8px 0;">
                  © ${new Date().getFullYear()} Kementerian Pendidikan Malaysia
                </p>
                <p style="color: #475569; font-size: 11px; margin: 0;">
                  Emel ini dijana secara automatik. Sila jangan balas.
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      })
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Continue even if email fails - password is already reset
    }

    return NextResponse.json({
      message: 'Password reset successfully',
      temporaryPassword, // Return to admin to display once
      email: userData.email
    })

  } catch (error) {
    console.error('Error in reset password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
