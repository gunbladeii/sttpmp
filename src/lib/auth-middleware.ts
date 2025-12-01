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
  // This function is deprecated as it relied on an insecure header.
  // The logic has been moved directly into the API routes that need it,
  // using a secure cookie-based approach with '@supabase/ssr'.
  // If you see this error, you need to refactor the calling code.
  console.error(
    "DEPRECATED: getAuthenticatedUser was called. This function is insecure. " +
    "Refactor the caller to use cookie-based auth directly in the API route. " +
    "Create a Supabase client with createRouteHandlerClient({ cookies }) " +
    "and get the user via supabase.auth.getUser()."
  );

  // Return null to ensure it fails safely if not caught.
  return null;
}

export function requireAdmin(user: AuthUser | null): boolean {
  return user?.role === 'admin'
}