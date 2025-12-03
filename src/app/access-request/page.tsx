'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuthSimple'
import { useRouter } from 'next/navigation'

export default function AccessRequestPage() {
  const { user, supabaseUser, error, requestAccess, loading } = useAuth()
  const [isRequesting, setIsRequesting] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const [requestError, setRequestError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // If user is already authenticated and has access, redirect to dashboard
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleRequestAccess = async () => {
    if (!supabaseUser?.email || !supabaseUser?.user_metadata?.full_name) {
      setRequestError('Data pengguna tidak lengkap. Sila log masuk semula.')
      return
    }

    setIsRequesting(true)
    setRequestError('')

    const result = await requestAccess(
      supabaseUser.email,
      supabaseUser.user_metadata.full_name
    )

    if (result.success) {
      setRequestSent(true)
    } else {
      setRequestError(result.error || 'Ralat semasa menghantar permohonan')
    }

    setIsRequesting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (requestSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Permohonan Dihantar
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Permohonan capaian anda telah dihantar kepada admin sistem. Anda akan menerima notifikasi melalui emel apabila akaun anda telah diluluskan.
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Status:</strong> Menunggu kelulusan admin
              </p>
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Emel: {supabaseUser?.email}</p>
              <p>Nama: {supabaseUser?.user_metadata?.full_name}</p>
            </div>
          </div>
          
          <button
            onClick={() => router.push('/login')}
            className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Capaian Dinafikan
          </h1>
          
          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm mb-4">
              {error}
            </p>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Data Pengguna
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <p><strong>Emel:</strong> {supabaseUser?.email}</p>
              <p><strong>Nama:</strong> {supabaseUser?.user_metadata?.full_name || 'Tidak tersedia'}</p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Langkah Seterusnya
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Untuk mendapat capaian ke sistem STRiKe, klik butang di bawah untuk menghantar permohonan kepada admin sistem.
            </p>
          </div>

          {requestError && (
            <div className="bg-red-50 dark:bg-red-900 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{requestError}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleRequestAccess}
              disabled={isRequesting || !supabaseUser?.email}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isRequesting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menghantar Permohonan...
                </>
              ) : (
                'Hantar Permohonan Capaian'
              )}
            </button>

            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Kembali ke Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}