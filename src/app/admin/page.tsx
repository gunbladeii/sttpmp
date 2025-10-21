'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuthSimple'
import DashboardHeader from '@/components/DashboardHeader'
import BrandLogo from '@/components/BrandLogo'

interface RegistrationRequest {
  id: string
  email: string
  name: string
  department_name?: string
  jpn_name?: string
  requested_at: string
  days_waiting: number
}

export default function AdminManagementPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [registrations, setRegistrations] = useState<RegistrationRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Check if user is admin
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard')
      return
    }
  }, [user, loading, router])

  // Fetch pending registrations
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        if (!user?.email) {
          setError('Tiada emel pengguna tersedia')
          return
        }
        
        const response = await fetch('/api/admin/registrations', {
          headers: {
            'x-user-email': user.email
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          // Remove any test/dummy data for clean production state
          const cleanData = data.filter((reg: RegistrationRequest) => 
            !reg.name.toLowerCase().includes('test') && 
            !reg.name.toLowerCase().includes('dummy') &&
            !reg.email.toLowerCase().includes('test')
          )
          setRegistrations(cleanData)
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Gagal memuatkan pendaftaran')
        }
      } catch (err) {
        setError('Ralat semasa memuatkan pendaftaran')
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.role === 'admin') {
      fetchRegistrations()
    }
  }, [user])

  const handleApprove = async (requestId: string, assignedRole: string = 'pemantau') => {
    try {
      if (!user?.email) {
        setError('Tiada emel pengguna tersedia')
        return
      }

      const response = await fetch('/api/admin/approve-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email
        },
        body: JSON.stringify({ requestId, assignedRole }),
      })

      if (response.ok) {
        // Remove from list
        setRegistrations(prev => prev.filter(reg => reg.id !== requestId))
      } else {
        const error = await response.json()
        setError(error.error || 'Gagal meluluskan pendaftaran')
      }
    } catch (err) {
      setError('Ralat semasa meluluskan pendaftaran')
    }
  }

  const handleReject = async (requestId: string, reason: string = 'Pendaftaran ditolak oleh pentadbir') => {
    try {
      if (!user?.email) {
        setError('Tiada emel pengguna tersedia')
        return
      }

      const response = await fetch('/api/admin/reject-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email
        },
        body: JSON.stringify({ requestId, reason }),
      })

      if (response.ok) {
        // Remove from list
        setRegistrations(prev => prev.filter(reg => reg.id !== requestId))
      } else {
        const error = await response.json()
        setError(error.error || 'Gagal menolak pendaftaran')
      }
    } catch (err) {
      setError('Ralat semasa menolak pendaftaran')
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-300 text-lg">Memuatkan panel pentadbir...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%)' }}>
      <DashboardHeader />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="cloudpeak-title">Pengurusan Pentadbir</h1>
          <p className="mt-3 text-slate-300 text-lg">Urusan pendaftaran pengguna dan akses sistem</p>
        </div>

        {error && (
          <div className="mb-8 bg-red-500/20 border border-red-500/30 text-red-300 px-6 py-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="cloudpeak-card p-8">
            <h3 className="text-sm font-medium text-slate-400">Pendaftaran Tertunda</h3>
            <p className="text-3xl font-bold text-blue-400">{registrations.length}</p>
          </div>
          <div className="cloudpeak-card p-8">
            <h3 className="text-sm font-medium text-slate-400">Tempoh Menunggu</h3>
            <p className="text-3xl font-bold text-orange-400">
              {registrations.length > 0 ? Math.max(...registrations.map(r => r.days_waiting)) : 0} hari
            </p>
          </div>
          <div className="cloudpeak-card p-8">
            <h3 className="text-sm font-medium text-slate-400">Pengguna Domain MOE</h3>
            <p className="text-3xl font-bold text-green-400">
              {registrations.filter(r => r.email.includes('@moe.gov.my')).length}
            </p>
          </div>
          <div className="cloudpeak-card p-8">
            <h3 className="text-sm font-medium text-slate-400">Bahagian/JPN</h3>
            <p className="text-3xl font-bold text-purple-400">
              {registrations.filter(r => r.department_name || r.jpn_name).length}
            </p>
          </div>
        </div>

        {/* Pending Registrations Table */}
        <div className="cloudpeak-card">
          <div className="px-8 py-6 border-b border-slate-700/30">
            <h2 className="text-xl font-medium text-white">Pendaftaran Pengguna Tertunda</h2>
          </div>
          
          {registrations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 opacity-50">
                <svg fill="currentColor" className="w-full h-full text-slate-400" viewBox="0 0 24 24">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21A2 2 0 0 0 5 23H19A2 2 0 0 0 21 21V9M19 9H14V4H5V21H19V9Z" />
                </svg>
              </div>
              <p className="text-slate-400 text-lg mb-2">Tiada pendaftaran tertunda</p>
              <p className="text-slate-500 text-sm">Semua pendaftaran pengguna telah diuruskan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700/30">
                <thead className="bg-slate-800/30">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Butiran Pengguna
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Organisasi
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Tempoh Menunggu
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Tindakan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {registrations.map((registration) => (
                    <tr key={registration.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {registration.name}
                          </div>
                          <div className="text-sm text-slate-400">
                            {registration.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {registration.department_name || registration.jpn_name || 'Tiada organisasi'}
                        </div>
                        <div className="text-sm text-slate-400">
                          {registration.department_name ? 'Bahagian' : 
                           registration.jpn_name ? 'JPN' : 'Individu'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`cloudpeak-badge inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          registration.days_waiting > 7 
                            ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                            : registration.days_waiting > 3
                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                            : 'bg-green-500/20 text-green-300 border-green-500/30'
                        }`}>
                          {registration.days_waiting} hari
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleApprove(registration.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-all transform hover:scale-105"
                          >
                            Luluskan
                          </button>
                          <button
                            onClick={() => handleReject(registration.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-all transform hover:scale-105"
                          >
                            Tolak
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 cloudpeak-card p-8">
          <h2 className="text-xl font-medium text-white mb-6">Tindakan Pantas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => router.push('/admin/users')}
              className="cloudpeak-button px-6 py-3 rounded-lg transition-all transform hover:scale-105"
            >
              Urus Semua Pengguna
            </button>
            <button
              onClick={() => router.push('/admin/create-admin')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-all transform hover:scale-105"
            >
              Cipta Pengguna Admin
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-3 rounded-lg transition-all transform hover:scale-105"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}