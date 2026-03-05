'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuthSimple'
import { RegisterData } from '@/types'
import BrandLogo from '@/components/BrandLogo'

export default function RegisterPage() {
  const router = useRouter()
  const { register, loading, error, clearError } = useAuth()
  
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    department_id: undefined,
    jpn_id: undefined
  })
  
  const [requestedRole, setRequestedRole] = useState<string>('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (error) clearError()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    // Include requestedRole in registration data
    const registrationData = {
      ...formData,
      requestedRole
    }
    
    const result = await register(registrationData)
    
    if (result.success) {
      setSuccess(true)
    }
    
    setIsSubmitting(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
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
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Pendaftaran Berjaya
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Permohonan pendaftaran anda telah dihantar
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    Permohonan Dihantar
                  </h3>
                  <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                    <p>Akaun anda menunggu kelulusan daripada administrator sistem.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Didaftarkan:</label>
                <p className="text-gray-900 dark:text-white font-mono">{formData.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Penuh:</label>
                <p className="text-gray-900 dark:text-white">{formData.name}</p>
              </div>

              {requestedRole && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Peranan Dipohon:</label>
                  <p className="text-gray-900 dark:text-white">
                    {requestedRole === 'penyelaras_bahagian' && 'Penyelaras Bahagian'}
                    {requestedRole === 'penyelaras_jpn' && 'Penyelaras JPN'}
                    {requestedRole === 'penyelaras_jnn' && 'Penyelaras JNN'}
                    {requestedRole === 'peneraju_pemeriksaan' && 'Peneraju Sektor (JNIP)'}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Langkah Seterusnya:
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 list-disc list-inside space-y-1">
                <li>Administrator akan menyemak permohonan anda</li>
                <li>Anda akan menerima email pemberitahuan setelah akaun diluluskan</li>
                <li>Selepas kelulusan, anda boleh log masuk menggunakan email dan password yang didaftarkan</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Pergi ke Halaman Login
              </button>
              
              <button
                onClick={() => router.push('/')}
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Kembali ke Laman Utama
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
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
            Daftar akaun baharu
          </p>
        </div>
        
        <div className="cloudpeak-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-600/20 border-2 border-red-500 text-white px-4 py-3 rounded-md text-sm font-medium shadow-lg">
                {error.split('\n').map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email MOE <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="nama@moe.gov.my atau nama@ipgm.edu.my"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Hanya email dengan domain @moe.gov.my atau @ipgm.edu.my yang dibenarkan
              </p>
            </div>

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nama Penuh <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Nama penuh anda"
              />
            </div>

            {/* Requested Role Field */}
            <div>
              <label htmlFor="requestedRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Peranan Dipohon <span className="text-red-500">*</span>
              </label>
              <select
                id="requestedRole"
                name="requestedRole"
                required
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-slate-700 text-white"
              >
                <option value="" className="bg-slate-700 text-slate-400">-- Pilih Peranan --</option>
                <option value="penyelaras_bahagian" className="bg-slate-700 text-white">Penyelaras Bahagian</option>
                <option value="penyelaras_jpn" className="bg-slate-700 text-white">Penyelaras JPN</option>
                <option value="penyelaras_jnn" className="bg-slate-700 text-white">Penyelaras JNN</option>
                <option value="peneraju_pemeriksaan" className="bg-slate-700 text-white">Peneraju Sektor (JNIP)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Pilih peranan yang sesuai untuk rujukan admin
              </p>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg
                    className="h-5 w-5 text-gray-400"
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
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Minimum 8 aksara, mengandungi huruf besar, huruf kecil, nombor dan simbol
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pengesahan Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Masukkan semula password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {showConfirmPassword ? (
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
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Menghantar Permohonan...
                  </div>
                ) : (
                  'Daftar Akaun'
                )}
              </button>
            </div>

            {/* Links */}
            <div className="text-center space-y-2">
              <Link 
                href="/login" 
                className="text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm font-medium"
              >
                Sudah ada akaun? Log masuk di sini
              </Link>
              <br />
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-500 dark:text-gray-400 text-sm"
              >
                ← Kembali ke laman utama
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}