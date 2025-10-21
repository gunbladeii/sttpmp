import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin

  console.log('🔄 Auth callback received:')
  console.log('  - URL:', requestUrl.toString())
  console.log('  - Code:', !!code)
  console.log('  - Error:', error)
  console.log('  - Error Description:', errorDescription)
  console.log('  - All params:', Object.fromEntries(requestUrl.searchParams.entries()))

  if (code) {
    try {
      const supabase = createServerSupabaseClient()
      
      // Exchange the OAuth code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      console.log('🔑 Exchange result:', !!data.session, !!error)
      
      if (!error && data.user) {
        console.log('✅ User authenticated:', data.user.email)
        
        // Check if user email is from MOE domain
        if (!data.user.email?.endsWith('@moe.gov.my')) {
          console.log('❌ Invalid domain:', data.user.email)
          return Response.redirect(`${origin}/login?error=invalid_domain`)
        }

        // Check if user exists in our system
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('email', data.user.email)
          .single()

        console.log('👤 Profile lookup:', !!profile, !!profileError)

        if (profileError || !profile) {
          // User not registered - redirect to access request page
          console.log('❌ User not found in database')
          return Response.redirect(`${origin}/access-request`)
        }

        if (!profile.is_active || !profile.is_approved) {
          console.log('❌ User not active/approved:', profile.is_active, profile.is_approved)
          return Response.redirect(`${origin}/access-request`)
        }

        console.log('✅ User authorized, redirecting to dashboard')
        return Response.redirect(`${origin}/dashboard`)
      }
    } catch (err) {
      console.error('❌ Auth callback error:', err)
    }
  }

  // If there was an error, redirect to login with error
  console.log('❌ Auth failed, redirecting to login')
  return Response.redirect(`${origin}/login?error=auth_failed`)
}