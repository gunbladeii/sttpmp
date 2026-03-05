// Secure Authentication Middleware for API Routes
// Uses cookie-based session validation (not headers)

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { ApiErrors } from './api-response'
import type { Database } from '@/types/database.types'

export type UserRole = 'admin' | 'peneraju_pemeriksaan' | 'penyelaras_bahagian' | 'penyelaras_jpn' | 'penyelaras_jnn' | 'pemantau'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  department_id: string | null
  jpn_id: string | null
  sector: string | null
  is_active: boolean
  is_approved: boolean
}

/**
 * Get authenticated user from request (cookie-based, secure)
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Get Supabase client with service key for server-side
    const supabase = createServerSupabaseClient(process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    // Get auth header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the JWT token
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !authUser) {
      console.error('Auth verification error:', authError)
      return null
    }

    // Get user profile from database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profileError || !userProfile) {
      console.error('User profile error:', profileError)
      return null
    }

    return {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      role: userProfile.role as UserRole,
      department_id: userProfile.department_id,
      jpn_id: userProfile.jpn_id,
      sector: userProfile.sector,
      is_active: userProfile.is_active,
      is_approved: userProfile.is_approved,
    }
  } catch (error) {
    console.error('getAuthUser error:', error)
    return null
  }
}

/**
 * Require authentication for API route
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getAuthUser(request)
  
  if (!user) {
    throw ApiErrors.unauthorized()
  }
  
  if (!user.is_active) {
    throw ApiErrors.accountInactive()
  }
  
  if (!user.is_approved) {
    throw ApiErrors.accountNotApproved()
  }
  
  return user
}

/**
 * Require specific role(s) for API route
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole | UserRole[]
): Promise<AuthUser> {
  const user = await requireAuth(request)
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  
  if (!roles.includes(user.role)) {
    throw ApiErrors.insufficientPermissions(
      `Peranan diperlukan: ${roles.join(', ')}`
    )
  }
  
  return user
}

/**
 * Require admin role
 */
export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
  return requireRole(request, 'admin')
}

/**
 * Check if user has specific role (without throwing)
 */
export function hasRole(user: AuthUser, roles: UserRole | UserRole[]): boolean {
  const roleArray = Array.isArray(roles) ? roles : [roles]
  return roleArray.includes(user.role)
}

/**
 * Check if user can manage a specific syor
 */
export async function canManageSyor(
  user: AuthUser,
  syorId: string
): Promise<boolean> {
  // Admin can manage all
  if (user.role === 'admin') {
    return true
  }
  
  // Peneraju can manage syor they created
  if (user.role === 'peneraju_pemeriksaan') {
    const supabase = createServerSupabaseClient(process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data: syor } = await supabase
      .from('syor')
      .select('created_by')
      .eq('id', syorId)
      .single()
    
    return syor?.created_by === user.id
  }
  
  return false
}

/**
 * Check if user can view a specific syor
 */
export async function canViewSyor(
  user: AuthUser,
  syorId: string
): Promise<boolean> {
  const supabase = createServerSupabaseClient(process.env.SUPABASE_SERVICE_ROLE_KEY)
  
  // Get syor details
  const { data: syor } = await supabase
    .from('syor')
    .select('created_by, assigned_to_department, assigned_to_jpn')
    .eq('id', syorId)
    .single()
  
  if (!syor) return false
  
  // Admin and Pemantau can view all
  if (user.role === 'admin' || user.role === 'pemantau') {
    return true
  }
  
  // Penyelaras Bahagian can view their department's syor
  if (user.role === 'penyelaras_bahagian') {
    return syor.assigned_to_department === user.department_id
  }
  
  // Penyelaras JPN/JNN can view their JPN's syor
  if (user.role === 'penyelaras_jpn' || user.role === 'penyelaras_jnn') {
    return syor.assigned_to_jpn === user.jpn_id
  }
  
  // Peneraju can view syor from their sector
  if (user.role === 'peneraju_pemeriksaan') {
    const { data: creator } = await supabase
      .from('users')
      .select('sector')
      .eq('id', syor.created_by)
      .single()
    
    return creator?.sector === user.sector
  }
  
  return false
}
