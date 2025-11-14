'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuthSimple'
import DashboardHeader from '@/components/DashboardHeader'
import { supabase } from '@/lib/supabase'

interface RegistrationRequest {
  id: string
  email: string
  name: string
  department_name?: string
  jpn_name?: string
  department_id?: string
  jpn_id?: string
  requested_at: string
  days_waiting: number
}

interface Department {
  id: string
  name: string
  code: string
}

interface JPN {
  id: string
  name: string
  state: string
}

const roleOptions = [
  { value: 'pemantau', label: 'Pemantau' },
  { value: 'penyelaras_bahagian', label: 'Penyelaras Bahagian' },
  { value: 'penyelaras_jpn', label: 'Penyelaras JPN' },
  { value: 'penyelaras_jnn', label: 'Penyelaras JNN (Read-Only)' },
  { value: 'peneraju_pemeriksaan', label: 'Peneraju Pemeriksaan' },
  { value: 'admin', label: 'Admin' }
]

const sectorOptions = [
  { value: 'SDP', label: 'SDP - Sektor Dasar dan Perancangan' },
  { value: 'SDTM', label: 'SDTM - Sektor Data dan Teknologi Maklumat' },
  { value: 'SSJK', label: 'SSJK - Sektor Standard dan Jaminan Kualiti' },
  { value: 'SPK', label: 'SPK - Sektor Penaziran Kurikulum' },
  { value: 'SPHEMK', label: 'SPHEMK - Sektor Penaziran Hal Ehwal Murid & Kokurikulum' },
  { value: 'SPIP', label: 'SPIP - Sektor Penaziran Institusi Pendidikan' }
]

export default function AdminManagementPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [registrations, setRegistrations] = useState<RegistrationRequest[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [jpnList, setJpnList] = useState<JPN[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedSector, setSelectedSector] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedJPN, setSelectedJPN] = useState('')
  const [isApproving, setIsApproving] = useState(false)

  // Check if user is admin
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard')
      return
    }
  }, [user, loading, router])

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true)
        await Promise.all([
          fetchRegistrations(),
          fetchDepartments(),
          fetchJPN()
        ])
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Ralat memuat data')
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.role === 'admin') {
      fetchAllData()
    }
  }, [user])

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
    } catch (error) {
      console.error(error)
      setError('Ralat semasa memuatkan pendaftaran')
    }
  }

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, code')
      .order('name')

    if (error) {
      console.error('Error fetching departments:', error)
    } else {
      setDepartments(data || [])
    }
  }

  const fetchJPN = async () => {
    const { data, error } = await supabase
      .from('jpn')
      .select('id, name, state')
      .order('name')

    if (error) {
      console.error('Error fetching JPN:', error)
    } else {
      setJpnList(data || [])
    }
  }

  const handleOpenApprovalModal = (registration: RegistrationRequest) => {
    setSelectedRequest(registration)
    setSelectedRole('')
    setSelectedSector('')
    // Pre-fill if user already selected department/JPN during registration
    setSelectedDepartment(registration.department_id || '')
    setSelectedJPN(registration.jpn_id || '')
  }

  const handleCloseApprovalModal = () => {
    setSelectedRequest(null)
    setSelectedRole('')
    setSelectedSector('')
    setSelectedDepartment('')
    setSelectedJPN('')
  }

  const handleConfirmApproval = async () => {
    if (!selectedRequest || !user?.email || !selectedRole) return

    try {
      setIsApproving(true)

      // Prepare data based on role
      const approvalData: any = {
        requestId: selectedRequest.id,
        assignedRole: selectedRole,
        sector: null,
        department_id: null,
        jpn_id: null
      }

      // Set appropriate fields based on role
      if (selectedRole === 'peneraju_pemeriksaan') {
        approvalData.sector = selectedSector || null
      } else if (selectedRole === 'penyelaras_bahagian') {
        approvalData.department_id = selectedDepartment || null
      } else if (selectedRole === 'penyelaras_jpn' || selectedRole === 'penyelaras_jnn') {
        approvalData.jpn_id = selectedJPN || null
      }

      const response = await fetch('/api/admin/approve-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email
        },
        body: JSON.stringify(approvalData),
      })

      if (response.ok) {
        // Remove from list
        setRegistrations(prev => prev.filter(reg => reg.id !== selectedRequest.id))
        handleCloseApprovalModal()
        alert('Pendaftaran berjaya diluluskan!')
      } else {
        const error = await response.json()
        setError(error.error || 'Gagal meluluskan pendaftaran')
      }
    } catch (error) {
      console.error(error)
      setError('Ralat semasa meluluskan pendaftaran')
    } finally {
      setIsApproving(false)
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
    } catch (error) {
      console.error(error)
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
                            onClick={() => handleOpenApprovalModal(registration)}
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

      {/* Approval Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4">
          <div className="cloudpeak-card p-8 max-w-2xl w-full shadow-2xl">
            <h3 className="text-2xl font-semibold mb-6 text-white">
              Luluskan Pendaftaran
            </h3>
            
            {/* User Info */}
            <div className="mb-6 bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Maklumat Pengguna</h4>
              <p className="text-white font-semibold">{selectedRequest.name}</p>
              <p className="text-slate-400 text-sm">{selectedRequest.email}</p>
              {(selectedRequest.department_name || selectedRequest.jpn_name) && (
                <p className="text-slate-300 text-sm mt-2">
                  {selectedRequest.department_name || selectedRequest.jpn_name}
                </p>
              )}
            </div>

            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-3">
                Peranan <span className="text-red-400">*</span>
              </label>
              <select
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value)
                  // Reset other fields when role changes
                  setSelectedSector('')
                  setSelectedDepartment('')
                  setSelectedJPN('')
                }}
              >
                <option value="">Pilih Peranan</option>
                {roleOptions.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            {/* Sector Selection for Peneraju */}
            {selectedRole === 'peneraju_pemeriksaan' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-3">
                  Sektor <span className="text-red-400">*</span>
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                >
                  <option value="">Pilih Sektor</option>
                  {sectorOptions.map(sector => (
                    <option key={sector.value} value={sector.value}>{sector.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Department Selection for Penyelaras Bahagian */}
            {selectedRole === 'penyelaras_bahagian' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-3">
                  Bahagian <span className="text-red-400">*</span>
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <option value="">Pilih Bahagian</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                  ))}
                </select>
              </div>
            )}

            {/* JPN Selection for Penyelaras JPN and Penyelaras JNN */}
            {(selectedRole === 'penyelaras_jpn' || selectedRole === 'penyelaras_jnn') && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-3">
                  JPN <span className="text-red-400">*</span>
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  value={selectedJPN}
                  onChange={(e) => setSelectedJPN(e.target.value)}
                >
                  <option value="">Pilih JPN</option>
                  {jpnList.map(jpn => (
                    <option key={jpn.id} value={jpn.id}>{jpn.name} ({jpn.state})</option>
                  ))}
                </select>
                {selectedRole === 'penyelaras_jnn' && (
                  <p className="mt-2 text-xs text-slate-400">
                    ℹ️ Penyelaras JNN mempunyai akses VIEW SAHAJA (read-only)
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-slate-700">
              <button
                type="button"
                onClick={handleCloseApprovalModal}
                disabled={isApproving}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                disabled={isApproving || !selectedRole || 
                  (selectedRole === 'peneraju_pemeriksaan' && !selectedSector) ||
                  (selectedRole === 'penyelaras_bahagian' && !selectedDepartment) ||
                  ((selectedRole === 'penyelaras_jpn' || selectedRole === 'penyelaras_jnn') && !selectedJPN)
                }
                className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isApproving ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Meluluskan...
                  </div>
                ) : (
                  'Sahkan & Luluskan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
