import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token reCAPTCHA diperlukan' },
        { status: 400 }
      )
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY

    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY not configured')
      return NextResponse.json(
        { success: false, message: 'Konfigurasi reCAPTCHA tidak lengkap' },
        { status: 500 }
      )
    }

    // Verify token with Google reCAPTCHA API
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`
    
    const recaptchaResponse = await fetch(verifyUrl, {
      method: 'POST',
    })

    const recaptchaData = await recaptchaResponse.json()

    // Check if verification was successful
    if (!recaptchaData.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Verifikasi reCAPTCHA gagal',
          errors: recaptchaData['error-codes'] 
        },
        { status: 400 }
      )
    }

    // Check score (reCAPTCHA v3 returns a score from 0.0 to 1.0)
    // 0.0 is very likely a bot, 1.0 is very likely a human
    const score = recaptchaData.score || 0
    const threshold = 0.5 // Minimum score to consider human

    if (score < threshold) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Aktiviti mencurigakan dikesan. Sila cuba lagi.',
          score 
        },
        { status: 403 }
      )
    }

    // Success - human verified
    return NextResponse.json({
      success: true,
      message: 'Verifikasi berjaya',
      score,
    })

  } catch (error) {
    console.error('reCAPTCHA verification error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Ralat semasa verifikasi keselamatan' 
      },
      { status: 500 }
    )
  }
}
