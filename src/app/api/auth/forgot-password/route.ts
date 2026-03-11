import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateEmail } from '@/lib/auth-utils'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

    if (!normalizedEmail || !validateEmail(normalizedEmail)) {
      return NextResponse.json({ success: false, message: 'Email tidak sah.' }, { status: 400 })
    }

    // Use service role client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .ilike('email', normalizedEmail)
      .eq('is_active', true)
      .single()

    if (userError || !userData) {
      // Don't reveal if user exists (security best practice)
      return NextResponse.json({ 
        success: true, 
        message: 'Jika email wujud dalam sistem, arahan reset akan dihantar.' 
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Store token in database
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: userData.id,
        token: resetToken,
        expires_at: resetExpiry.toISOString()
      })

    if (tokenError) {
      console.error('Token creation error:', tokenError)
      return NextResponse.json({ 
        success: false, 
        message: 'Ralat mencipta token reset.' 
      }, { status: 500 })
    }

    // Send email via Brevo
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`

    console.log('📧 Attempting to send reset email to:', userData.email)
    console.log('🔗 Reset URL:', resetUrl)

    try {
      const result = await sendEmail({
        to: [{ email: userData.email, name: userData.name }],
        subject: 'Reset Kata Laluan - STTPMP',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Reset Kata Laluan STTPMP</h2>
            <p>Hai ${userData.name},</p>
            <p>Anda telah meminta untuk reset kata laluan akaun STTPMP anda.</p>
            <p>Sila klik butang di bawah untuk menetapkan kata laluan baharu:</p>
            <div style="margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Kata Laluan
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Atau copy link ini ke browser anda:<br>
              <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              Link ini akan tamat tempoh dalam 1 jam.
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              Jika anda tidak meminta reset kata laluan, sila abaikan email ini.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #9ca3af; font-size: 12px;">
              STTPMP - Sistem Tahap Tindakan Perakuan Menteri Pendidikan
            </p>
          </div>
        `
      })
      
      console.log('✅ Email sent successfully! Result:', result)
      
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError)
      // Log detailed error information
      if (emailError instanceof Error) {
        console.error('Error message:', emailError.message)
        console.error('Error stack:', emailError.stack)
      }

      // Cleanup token if email failed so users don't collect unusable reset tokens.
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('token', resetToken)

      // Return generic service message (does not disclose whether user exists).
      return NextResponse.json({ 
        success: false,
        message: 'Perkhidmatan emel sedang tergendala. Sila cuba semula sebentar lagi.'
      }, { status: 503 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Arahan reset kata laluan telah dihantar ke email anda. Sila semak inbox atau spam folder.' 
    })

  } catch (error) {
    console.error('Forgot password API error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Ralat pelayan. Sila cuba lagi.' 
    }, { status: 500 })
  }
}
