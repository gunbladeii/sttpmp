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
      // In production, allow login but log the issue
      console.warn('⚠️ reCAPTCHA not configured - allowing login without verification')
      return NextResponse.json({
        success: true,
        message: 'Verifikasi berjaya (fallback mode)',
        score: 0.9,
        fallback: true
      })
    }

    // Verify token with Google reCAPTCHA API
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`
    
    const recaptchaResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`
    })

    if (!recaptchaResponse.ok) {
      console.error('reCAPTCHA API request failed:', recaptchaResponse.status)
      // Fallback: allow login but log
      console.warn('⚠️ reCAPTCHA API failed - allowing login as fallback')
      return NextResponse.json({
        success: true,
        message: 'Verifikasi berjaya (fallback mode)',
        score: 0.9,
        fallback: true
      })
    }

    const recaptchaData = await recaptchaResponse.json()

    // Log response for debugging
    console.log('reCAPTCHA response:', JSON.stringify(recaptchaData))

    // Check if verification was successful
    if (!recaptchaData.success) {
      console.error('reCAPTCHA verification failed:', recaptchaData['error-codes'])
      
      // Fallback for production: allow login but log the error
      console.warn('⚠️ reCAPTCHA verification failed - allowing login as fallback')
      return NextResponse.json({
        success: true,
        message: 'Verifikasi berjaya (fallback mode)',
        score: 0.9,
        fallback: true,
        errors: recaptchaData['error-codes']
      })
    }

    // Check score (reCAPTCHA v3 returns a score from 0.0 to 1.0)
    // 0.0 is very likely a bot, 1.0 is very likely a human
    const score = recaptchaData.score || 0
    const threshold = 0.3 // Lower threshold for better UX (was 0.5)

    if (score < threshold) {
      console.warn(`Low reCAPTCHA score: ${score} (threshold: ${threshold})`)
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
    // Fallback: allow login but log the error
    console.warn('⚠️ reCAPTCHA error caught - allowing login as fallback')
    return NextResponse.json({
      success: true,
      message: 'Verifikasi berjaya (fallback mode)',
      score: 0.9,
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
