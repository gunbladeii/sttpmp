'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuthSimple'
import DashboardHeader from '@/components/DashboardHeader'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  name: string
  role: string
  sector: string | null
  department_id: string | null
  jpn_id: string | null
  is_active: boolean
  is_approved: boolean
  requested_role: string | null
  created_at: string
  department?: {
    id: string
    name: string
    code: string
  }
  jpn?: {
    id: string
    name: string
    state: string
  }
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

const getRoleLabel = (role: string) => {
  const roleOption = roleOptions.find(r => r.value === role)
  return roleOption ? roleOption.label : role
}

const getSectorLabel = (sector: string | null) => {
  if (!sector) return 'Tidak ditetapkan'
  const sectorOption = sectorOptions.find(s => s.value === sector)
  return sectorOption ? sectorOption.label : sector
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin': return 'bg-red-500/20 text-red-300 border-red-500/30'
    case 'peneraju_pemeriksaan': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    case 'penyelaras_bahagian': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'penyelaras_jpn': return 'bg-green-500/20 text-green-300 border-green-500/30'
    case 'penyelaras_jnn': return 'bg-teal-500/20 text-teal-300 border-teal-500/30'
    case 'pemantau': return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
  }
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [jpnList, setJpnList] = useState<JPN[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    role: '',
    sector: '',
    department_id: '',
    jpn_id: ''
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState<string | null>(null) // Track which user is being toggled
  
  // Reset Password states
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  
  // Pagination and search states
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Check authentication and admin access
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAllData()
    }
  }, [user])

  const fetchAllData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([
        fetchUsers(),
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

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        department:department_id(id, name, code),
        jpn:jpn_id(id, name, state)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    setUsers((data as unknown as User[]) || [])
  }

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, code')
      .order('name')

    if (error) throw error
    setDepartments(data || [])
  }

  const fetchJPN = async () => {
    const { data, error } = await supabase
      .from('jpn')
      .select('id, name, state')
      .order('name')

    if (error) throw error
    setJpnList(data || [])
  }



  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      // Confirm action
      const action = !currentStatus ? 'mengaktifkan' : 'menyahaktifkan'
      if (!confirm(`Adakah anda pasti untuk ${action} pengguna ini?`)) {
        return
      }

      setIsTogglingStatus(userId) // Set loading state

      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Sila log masuk semula')
        return
      }

      // Call API to toggle status
      const response = await fetch('/api/admin/toggle-user-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: userId,
          is_active: !currentStatus
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengemas kini status')
      }

      alert(result.message)
      await fetchUsers()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Ralat mengemas kini status pengguna: ${errorMessage}`)
      console.error('Toggle status error:', error)
    } finally {
      setIsTogglingStatus(null) // Clear loading state
    }
  }

  const handleEditUser = (userToEdit: User) => {
    setEditingUser(userToEdit)
    setFormData({
      role: userToEdit.role,
      sector: userToEdit.sector || '',
      department_id: userToEdit.department_id || '',
      jpn_id: userToEdit.jpn_id || ''
    })
  }

  const handleUpdateUser = async () => {
    if (!editingUser || !user?.email) return

    try {
      setIsUpdating(true)
      
      // Prepare update data based on role
      const updateData: any = { 
        userId: editingUser.id,
        newRole: formData.role,
        sector: null,
        department_id: null,
        jpn_id: null
      }

      // Set appropriate fields based on role
      if (formData.role === 'peneraju_pemeriksaan') {
        updateData.sector = formData.sector || null
      } else if (formData.role === 'penyelaras_bahagian') {
        updateData.department_id = formData.department_id || null
      } else if (formData.role === 'penyelaras_jpn' || formData.role === 'penyelaras_jnn') {
        updateData.jpn_id = formData.jpn_id || null
      }

      // Call API endpoint with admin access
      const response = await fetch('/api/admin/update-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengemas kini pengguna')
      }

      await fetchUsers()
      setEditingUser(null)
      setFormData({ role: '', sector: '', department_id: '', jpn_id: '' })
      alert('Role pengguna berjaya dikemas kini!')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Ralat mengemas kini pengguna: ${errorMessage}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingUser(null)
    setFormData({ role: '', sector: '', department_id: '', jpn_id: '' })
  }

  const handleResetPassword = async (userToReset: User) => {
    const confirmed = confirm(
      `Adakah anda pasti ingin menetapkan semula kata laluan untuk ${userToReset.name}?\n\n` +
      `Kata laluan sementara baharu akan dijana dan dihantar ke ${userToReset.email}`
    )

    if (!confirmed) return

    try {
      setIsResettingPassword(true)
      setResetPasswordUser(userToReset)

      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: userToReset.id })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Gagal menetapkan semula kata laluan')
      }

      // Show temporary password in modal
      setTemporaryPassword(result.temporaryPassword)
      setShowPasswordModal(true)

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Ralat menetapkan semula kata laluan: ${errorMessage}`)
      setResetPasswordUser(null)
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false)
    setTemporaryPassword(null)
    setResetPasswordUser(null)
  }

  const copyPasswordToClipboard = () => {
    if (temporaryPassword) {
      navigator.clipboard.writeText(temporaryPassword)
      alert('Kata laluan telah disalin ke clipboard!')
    }
  }

  // Filter and pagination logic
  const filteredUsers = users.filter(u => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    const matchesName = u.name.toLowerCase().includes(query)
    const matchesEmail = u.email.toLowerCase().includes(query)
    const matchesRole = getRoleLabel(u.role).toLowerCase().includes(query)
    const matchesDepartment = u.department?.name.toLowerCase().includes(query)
    const matchesJPN = u.jpn?.name.toLowerCase().includes(query)
    const matchesSector = u.sector?.toLowerCase().includes(query)
    
    return matchesName || matchesEmail || matchesRole || matchesDepartment || matchesJPN || matchesSector
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Show loading if either auth is loading or data is loading
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-300 text-lg">
            {authLoading ? 'Mengesahkan pengguna...' : 'Memuatkan pengurusan pengguna...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%)' }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="cloudpeak-title">Pengurusan Pengguna</h1>
          <p className="mt-3 text-slate-300 text-lg">Urus akaun pengguna sistem STRiKe</p>
        </div>

        {/* Users Table */}
        <div className="cloudpeak-card">
          <div className="px-8 py-6 border-b border-slate-700/30">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium text-white">Senarai Pengguna Sistem</h2>
              
              {/* Search Bar */}
              <div className="relative w-96">
                <input
                  type="text"
                  placeholder="Cari pengguna (nama/emel/peranan)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400"
                />
                <svg
                  className="absolute left-3 top-3 h-5 w-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {/* Results count */}
            <div className="mt-4 text-sm text-slate-400">
              Menunjukkan {paginatedUsers.length} daripada {filteredUsers.length} pengguna
              {searchQuery && ` (ditapis daripada ${users.length} jumlah pengguna)`}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700/30">
              <thead className="bg-slate-800/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Pengguna
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Peranan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Sektor/Bahagian/JPN
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Tarikh Daftar
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Tindakan
                  </th>
                </tr>
              </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="text-slate-400">
                          {searchQuery ? (
                            <>
                              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              <p>Tiada pengguna dijumpai untuk "{searchQuery}"</p>
                            </>
                          ) : (
                            <>
                              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 4a4 4 0 014 4 4 4 0 01-4 4 4 4 0 01-4-4 4 4 0 014-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z" />
                              </svg>
                              <p>Tiada pengguna dalam sistem</p>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user, index) => (
                    <tr key={user.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-slate-400">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`cloudpeak-badge inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                          {!user.is_approved && user.requested_role && (
                            <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/30">
                              📋 Mohon: {getRoleLabel(user.requested_role)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-300">
                          {user.role === 'peneraju_pemeriksaan' && user.sector && (
                            <span className="text-purple-300">{getSectorLabel(user.sector)}</span>
                          )}
                          {user.role === 'penyelaras_bahagian' && user.department && (
                            <span className="text-blue-300">{user.department.name}</span>
                          )}
                          {(user.role === 'penyelaras_jpn' || user.role === 'penyelaras_jnn') && user.jpn && (
                            <span className={user.role === 'penyelaras_jnn' ? 'text-teal-300' : 'text-green-300'}>
                              {user.jpn.name}
                              {user.role === 'penyelaras_jnn' && <span className="text-xs ml-2">(View Only)</span>}
                            </span>
                          )}
                          {!user.sector && !user.department && !user.jpn && (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`cloudpeak-badge inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          user.is_active && user.is_approved
                            ? 'bg-green-500/20 text-green-300 border-green-500/30'
                            : 'bg-red-500/20 text-red-300 border-red-500/30'
                        }`}>
                          {user.is_active && user.is_approved ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {new Date(user.created_at).toLocaleDateString('ms-MY')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {/* Edit Role Icon */}
                          <button
                            onClick={() => handleEditUser(user)}
                            title="Edit Role"
                            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all transform hover:scale-110 shadow-lg"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          
                          {/* Reset Password Icon */}
                          <button
                            onClick={() => handleResetPassword(user)}
                            title="Reset Password"
                            disabled={isResettingPassword}
                            className="p-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition-all transform hover:scale-110 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                          </button>
                          
                          {/* Toggle Active/Inactive Icon */}
                          <button
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                            title={user.is_active ? 'Nyahaktifkan' : 'Aktifkan'}
                            disabled={isTogglingStatus === user.id}
                            className={`p-2 rounded-lg transition-all transform hover:scale-110 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                              user.is_active 
                                ? 'bg-red-600 hover:bg-red-500 text-white' 
                                : 'bg-green-600 hover:bg-green-500 text-white'
                            }`}
                          >
                            {isTogglingStatus === user.id ? (
                              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : user.is_active ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {filteredUsers.length > itemsPerPage && (
              <div className="px-8 py-6 border-t border-slate-700/30">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-400">
                    Halaman {currentPage} daripada {totalPages}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Sebelum
                    </button>
                    
                    {/* Page numbers */}
                    <div className="flex space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-4 py-2 rounded-lg transition-all ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-700 hover:bg-slate-600 text-white'
                              }`}
                            >
                              {page}
                            </button>
                          )
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return <span key={page} className="px-2 py-2 text-slate-400">...</span>
                        }
                        return null
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Seterusnya →
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="cloudpeak-card p-8 max-w-lg w-full mx-4 shadow-2xl">
              <h3 className="text-xl font-semibold mb-6 text-white">
                Edit Pengguna: {editingUser.name}
              </h3>
              
              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-3">
                  Peranan
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    role: e.target.value,
                    // Reset other fields when role changes
                    sector: '',
                    department_id: '',
                    jpn_id: ''
                  }))}
                >
                  <option value="">Pilih Peranan</option>
                  {roleOptions.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              {/* Sector Selection for Peneraju */}
              {formData.role === 'peneraju_pemeriksaan' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-white mb-3">
                    Sektor
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    value={formData.sector}
                    onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                  >
                    <option value="">Pilih Sektor</option>
                    {sectorOptions.map(sector => (
                      <option key={sector.value} value={sector.value}>{sector.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Department Selection for Penyelaras Bahagian */}
              {formData.role === 'penyelaras_bahagian' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-white mb-3">
                    Bahagian
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    value={formData.department_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, department_id: e.target.value }))}
                  >
                    <option value="">Pilih Bahagian</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* JPN Selection for Penyelaras JPN and Penyelaras JNN */}
              {(formData.role === 'penyelaras_jpn' || formData.role === 'penyelaras_jnn') && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-white mb-3">
                    JPN
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    value={formData.jpn_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, jpn_id: e.target.value }))}
                  >
                    <option value="">Pilih JPN</option>
                    {jpnList.map(jpn => (
                      <option key={jpn.id} value={jpn.id}>{jpn.name} ({jpn.state})</option>
                    ))}
                  </select>
                  {formData.role === 'penyelaras_jnn' && (
                    <p className="mt-2 text-xs text-teal-400">
                      ℹ️ Penyelaras JNN mempunyai akses VIEW SAHAJA (read-only)
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleUpdateUser}
                  disabled={isUpdating || !formData.role || 
                    (formData.role === 'peneraju_pemeriksaan' && !formData.sector) ||
                    (formData.role === 'penyelaras_bahagian' && !formData.department_id) ||
                    ((formData.role === 'penyelaras_jpn' || formData.role === 'penyelaras_jnn') && !formData.jpn_id)
                  }
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isUpdating ? 'Mengemas kini...' : 'Kemas kini'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Password Reset Modal */}
        {showPasswordModal && resetPasswordUser && temporaryPassword && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-700">
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-600 to-orange-600 px-8 py-6 rounded-t-2xl">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Kata Laluan Baharu</h3>
                    <p className="text-yellow-100 text-sm mt-1">Password telah berjaya ditetapkan semula</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                {/* User Info */}
                <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                      <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 4a4 4 0 014 4 4 4 0 01-4 4 4 4 0 01-4-4 4 4 0 014-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-semibold">{resetPasswordUser.name}</p>
                      <p className="text-slate-400 text-sm">{resetPasswordUser.email}</p>
                    </div>
                  </div>
                </div>

                {/* Temporary Password Display */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Kata Laluan Sementara
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={temporaryPassword}
                      readOnly
                      className="w-full px-4 py-4 bg-slate-900 border-2 border-yellow-500/50 rounded-lg text-yellow-400 font-mono text-lg tracking-wider focus:outline-none focus:border-yellow-500 pr-12"
                    />
                    <button
                      onClick={copyPasswordToClipboard}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition-all"
                      title="Salin ke Clipboard"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-400 flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Klik butang untuk salin password</span>
                  </p>
                </div>

                {/* Important Notice */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-red-400 font-semibold mb-2">Penting!</h4>
                      <ul className="text-sm text-red-300 space-y-1">
                        <li>• Kata laluan ini hanya dipaparkan SEKALI sahaja</li>
                        <li>• Emel telah dihantar ke pengguna dengan kata laluan yang sama</li>
                        <li>• Pengguna MESTI menukar password selepas log masuk pertama</li>
                        <li>• Simpan password ini dengan selamat jika pengguna memerlukannya</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Email Confirmation */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-green-300 text-sm">
                      ✅ Emel pengesahan telah dihantar ke <span className="font-semibold">{resetPasswordUser.email}</span>
                    </p>
                  </div>
                </div>

                {/* Close Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleClosePasswordModal}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg transition-all transform hover:scale-105 shadow-lg font-semibold"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}