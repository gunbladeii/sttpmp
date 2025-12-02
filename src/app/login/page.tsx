'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuthSimple'
import { LoginCredentials } from '@/types'
import BrandLogo from '@/components/BrandLogo'
import Script from 'next/script'

// Declare grecaptcha for TypeScript
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

export default function LoginPage() {
  const router = useRouter()
  const { login, loading, error, clearError } = useAuth()
  
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: ''
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recaptchaReady, setRecaptchaReady] = useState(false)
  const [recaptchaError, setRecaptchaError] = useState('')

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''

  // Wait for reCAPTCHA to load
  useEffect(() => {
    if (typeof window !== 'undefined' && window.grecaptcha) {
      window.grecaptcha.ready(() => {
        setRecaptchaReady(true)
      })
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (error) clearError()
    if (recaptchaError) setRecaptchaError('')
  }

  const verifyRecaptcha = async (): Promise<boolean> => {
    if (!recaptchaReady) {
      setRecaptchaError('Sistem keselamatan belum siap. Sila cuba lagi.')
      return false
    }

    try {
      // Get reCAPTCHA token
      const token = await window.grecaptcha.execute(siteKey, { action: 'login' })
      
      // Verify token with our API
      const response = await fetch('/api/verify-recaptcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!data.success) {
        setRecaptchaError(data.message || 'Verifikasi keselamatan gagal')
        return false
      }

      return true
    } catch (error) {
      console.error('reCAPTCHA error:', error)
      setRecaptchaError('Ralat semasa verifikasi keselamatan')
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting) return
    
    setIsSubmitting(true)
    setRecaptchaError('')

    // Verify reCAPTCHA first
    const isHuman = await verifyRecaptcha()
    
    if (!isHuman) {
      setIsSubmitting(false)
      return
    }
    
    const result = await login(formData)
    
    if (result.success) {
      router.push('/dashboard')
    }
    
    setIsSubmitting(false)
  }

  return (
    <>
      {/* Load reCAPTCHA script */}
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
        strategy="lazyOnload"
        onLoad={() => {
          if (window.grecaptcha) {
            window.grecaptcha.ready(() => {
              setRecaptchaReady(true)
            })
          }
        }}
      />

      <div className="min-h-screen flex items-center justify-center py-12 px-6 relative overflow-hidden">
        {/* Background Image with Dark Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/minister-bg.jpg')` }}
        >
          {/* Dark gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/90 to-slate-800/95"></div>
          
          {/* Subtle accent elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-96 h-96 bg-yellow-400 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl"></div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-md w-full space-y-8 relative z-10">
        <div>
          <BrandLogo variant="page" />
          <p className="mt-4 text-center text-slate-300">
            Log masuk ke sistem
          </p>
        </div>
        
        <div className="cloudpeak-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {recaptchaError && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 px-4 py-3 rounded-lg text-sm flex items-start">
                <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{recaptchaError}</span>
              </div>
            )}

            {/* Security Badge */}
            {!recaptchaReady && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-center text-sm text-blue-300">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-3"></div>
                <span>Memuatkan sistem keselamatan...</span>
              </div>
            )}

            {recaptchaReady && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center text-sm text-green-300">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>🔒 Perlindungan Bot Aktif (reCAPTCHA v3)</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-600 bg-slate-800/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="nama@moe.gov.my"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 border border-slate-600 bg-slate-800/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg
                    className="h-5 w-5 text-slate-400 hover:text-slate-300 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="cloudpeak-button w-full py-4 text-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Sedang Log Masuk...
                  </div>
                ) : (
                  'Log Masuk'
                )}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="text-center mt-2">
              <Link 
                href="/forgot-password" 
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                Lupa Kata Laluan?
              </Link>
            </div>

            {/* Links */}
            <div className="text-center space-y-3 mt-4">
              <Link 
                href="/register" 
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                Belum ada akaun? Daftar di sini
              </Link>
              <br />
              <Link 
                href="/" 
                className="text-slate-400 hover:text-slate-300 text-sm transition-colors"
              >
                ← Kembali ke laman utama
              </Link>
            </div>
          </form>

          {/* Information Section */}
          <div className="mt-8 space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-200 font-semibold mb-2">
                    Syarat-syarat Login:
                  </p>
                  <ul className="text-sm text-blue-300 list-disc list-inside space-y-1 leading-relaxed">
                    <li>Email dengan domain @moe.gov.my sahaja</li>
                    <li>Akaun mesti telah diluluskan oleh Administrator</li>
                    <li>Akaun mesti aktif dalam sistem</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-200 leading-relaxed">
                    <span className="font-semibold">Pengguna Baharu:</span><br />
                    Jika anda belum didaftarkan, sila daftarkan akaun baharu. Setelah mendaftar, akaun perlu 
                    diluluskan oleh Administrator sebelum boleh log masuk.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* reCAPTCHA Badge Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400">
              Laman ini dilindungi oleh reCAPTCHA dan tertakluk kepada{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                Dasar Privasi
              </a>{' '}
              dan{' '}
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                Terma Perkhidmatan
              </a>{' '}
              Google.
            </p>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}