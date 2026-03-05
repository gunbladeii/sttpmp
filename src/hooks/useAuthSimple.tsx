'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { User, LoginCredentials, RegisterData, RoleType } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  requestAccess: (email: string, name: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  clearError: () => void
  hasRole: (roles: RoleType | RoleType[]) => boolean
  canAssignSyor: () => boolean
  canUpdateStatus: () => boolean
  canViewAllSyor: () => boolean
  supabaseUser?: any
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [supabaseUser, setSupabaseUser] = useState<any>(null)
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    checkAuthState()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event)
      
      if (session?.user) {
        setSupabaseUser(session.user)
        try {
          await fetchUserProfile(session.user.email!)
        } catch (err) {
          console.error('Error fetching profile after auth change:', err)
          setUser(null)
        }
      } else {
        setUser(null)
        setSupabaseUser(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const checkAuthState = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth session error:', error)
        setError('Session authentication error')
        return
      }

      if (session?.user) {
        await fetchUserProfile(session.user.email!)
      }
    } catch (err) {
      console.error('Auth check error:', err)
      setError('Authentication check failed')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProfile = async (email: string) => {
    try {
      console.log('🔍 Fetching profile for:', email);
      
      // Fetch user profile via API route (bypasses RLS using service role)
      const profileResponse = await fetch('/api/auth/get-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      console.log('📡 Profile response status:', profileResponse.status);
      
      const profileData = await profileResponse.json();
      console.log('📦 Profile data:', {
        success: profileData.success,
        hasUser: !!profileData.user,
        message: profileData.message,
        debug: profileData.debug
      });

      if (!profileData.success || !profileData.user) {
        const errorMessage = profileData.message || 'User profile not found or not approved';
        console.error('❌ Profile fetch failed:', errorMessage, profileData.debug);
        throw new Error(errorMessage)
      }

      console.log('✅ Profile loaded successfully for:', profileData.user.email);
      setUser(profileData.user as unknown as User)
    } catch (err) {
      console.error('💥 Error fetching user profile:', err)
      await supabase.auth.signOut()
      throw err
    }
  }

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true)
      setError('')

      const allowedDomains = ['@moe.gov.my', '@ipgm.edu.my']
      if (!allowedDomains.some((d) => credentials.email.toLowerCase().includes(d))) {
        throw new Error('Hanya email dengan domain @moe.gov.my atau @ipgm.edu.my yang dibenarkan')
      }

      console.log('🔐 Attempting login for:', credentials.email)

      // Use Supabase Auth for secure login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (authError) {
        console.error('❌ Auth error:', authError)
        
        // Provide more specific error messages
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Email atau password tidak betul. Pastikan anda menggunakan password yang betul.')
        } else if (authError.message.includes('Email not confirmed')) {
          throw new Error('Email belum disahkan. Sila hubungi admin untuk reset password.')
        } else if (authError.message.includes('User not found')) {
          throw new Error('Akaun tidak wujud. Sila daftar terlebih dahulu.')
        } else {
          throw new Error(`Login gagal: ${authError.message}`)
        }
      }

      console.log('✅ Auth successful for user ID:', authData.user.id)

      // Fetch user profile via API route (bypasses RLS using service role)
      const profileResponse = await fetch('/api/auth/get-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: credentials.email })
      });

      const profileData = await profileResponse.json();

      if (!profileData.success || !profileData.user) {
        await supabase.auth.signOut()
        throw new Error('Profil pengguna tidak dijumpai')
      }

      const userData = profileData.user;

      if (!userData.is_active) {
        await supabase.auth.signOut()
        throw new Error('Akaun telah dinyahaktifkan. Sila hubungi admin.')
      }

      if (!userData.is_approved) {
        await supabase.auth.signOut()
        throw new Error('Akaun belum diluluskan oleh admin. Sila tunggu kelulusan.')
      }

      console.log('✅ Login successful for:', userData.email)
      setUser(userData as unknown as User)
      return { success: true }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ralat tidak diketahui berlaku'
      console.error('❌ Login error:', errorMessage)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mendaftar')
      }

      return { success: true }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ralat tidak diketahui berlaku'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const requestAccess = async (email: string, name: string) => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/access-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Gagal menghantar permohonan')
      }

      return { success: true }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ralat tidak diketahui berlaku'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Supabase signout error:', error)
      }
      
      setUser(null)
      setError('')
      
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => setError('')

  const hasRole = (roles: RoleType | RoleType[]) => {
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }

  const canAssignSyor = () => {
    return hasRole('peneraju_pemeriksaan')
  }

  const canUpdateStatus = () => {
    return hasRole(['penyelaras_bahagian', 'penyelaras_jpn', 'penyelaras_jnn', 'admin'])
  }

  const canViewAllSyor = () => {
    return hasRole(['admin', 'peneraju_pemeriksaan'])
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        requestAccess,
        logout,
        clearError,
        hasRole,
        canAssignSyor,
        canUpdateStatus,
        canViewAllSyor,
        supabaseUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
