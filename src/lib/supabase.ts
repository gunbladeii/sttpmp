import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton browser client to avoid multiple instances
let browserClient: SupabaseClient<Database> | null = null

// Browser-side client for client components (singleton)
export const createBrowserSupabaseClient = () => {
  if (!browserClient) {
    browserClient = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      }
    })
  }
  return browserClient
}

// Server-side client for server components
export const createServerSupabaseClient = (serviceKey?: string) => {
  const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key
  )
}

// Default export for backward compatibility
export const supabase = createBrowserSupabaseClient()