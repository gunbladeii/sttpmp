import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { validateEmail } from '@/lib/auth-utils'

export async function POST(request: Request) {
  const { email } = await request.json()

  if (!email || !validateEmail(email)) {
    return NextResponse.json({ success: false, message: 'Email tidak sah.' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  // Supabase password reset
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: process.env.NEXT_PUBLIC_APP_URL + '/reset-password'
  })

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Arahan reset kata laluan telah dihantar ke email anda.' })
}
