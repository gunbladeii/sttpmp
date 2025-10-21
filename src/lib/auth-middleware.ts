import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  department_id?: string
  jpn_id?: string
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Get authorization header or session info
    const authHeader = request.headers.get('authorization')
    const userEmail = request.headers.get('x-user-email') // Custom header for our auth system
    
    if (!userEmail) {
      return null
    }

    // Get user from database
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .eq('is_active', true)
      .eq('is_approved', true)
      .single()

    if (error || !userData) {
      return null
    }

    return userData as AuthUser
  } catch (error) {
    console.error('Auth middleware error:', error)
    return null
  }
}

export function requireAdmin(user: AuthUser | null): boolean {
  return user?.role === 'admin'
}