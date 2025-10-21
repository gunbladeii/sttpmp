'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuthSimple'
import DashboardHeader from '@/components/DashboardHeader'
import type { Syor, StatusTracking, DashboardStats } from '@/types'
import { getStatusColor, getStatusText } from '@/lib/utils'

// Modal component for showing syor list by status
interface SyorModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  syorList: any[]
  status: string
}

function SyorModal({ isOpen, onClose, title, syorList, status }: SyorModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {syorList.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Tiada syor dengan status ini</p>
          ) : (
            <div className="space-y-4">
              {syorList.map((syor) => {
                const sortedStatusTracking = syor.status_tracking
                  ?.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                const latestStatus = sortedStatusTracking?.[0]
                
                return (
                  <div 
                    key={syor.id} 
                    className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 hover:bg-slate-600/30 transition-colors cursor-pointer"
                    onClick={() => {
                      onClose(); // Close modal first
                      window.location.href = `/syor/${syor.id}`; // Same tab navigation
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-2">{syor.title}</h3>
                        <p className="text-sm text-slate-300 mb-2">
                          Penyelaras: {syor.department?.name || syor.jpn?.name || 'Tidak ditetapkan'}
                        </p>
                        <p className="text-xs text-slate-400">
                          Tarikh Akhir: {new Date(syor.due_date).toLocaleDateString('ms-MY')}
                        </p>
                        {latestStatus?.comments && (
                          <p className="text-xs text-slate-400 mt-2">
                            Maklum Balas: {latestStatus.comments}
                          </p>
                        )}
                      </div>
                      <span className={`cloudpeak-badge ${
                        status === 'all' 
                          ? getStatusColor((latestStatus?.status || 'belum_selesai') as 'belum_selesai' | 'dalam_tindakan' | 'selesai')
                          : getStatusColor(status as 'belum_selesai' | 'dalam_tindakan' | 'selesai')
                      }`}>
                        {status === 'all' 
                          ? getStatusText((latestStatus?.status || 'belum_selesai') as 'belum_selesai' | 'dalam_tindakan' | 'selesai')
                          : getStatusText(status as 'belum_selesai' | 'dalam_tindakan' | 'selesai')
                        }
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [syorList, setSyorList] = useState<Record<string, unknown>[]>([]) // Temporary fix for types
  const [recentSyor, setRecentSyor] = useState<any[]>([]) // Recent syor for dashboard
  const [allSyor, setAllSyor] = useState<any[]>([]) // Store all syor for filtering
  const [userDetails, setUserDetails] = useState<any>(null) // Store user with department/JPN details
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    syorList: [],
    status: ''
  })

  // Function to handle score card clicks
  const handleScoreCardClick = (status: string, title: string) => {
    let filteredSyor;
    
    if (status === 'all') {
      filteredSyor = allSyor
    } else {
      filteredSyor = allSyor.filter(syor => {
        const sortedStatusTracking = syor.status_tracking
          ?.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        const latestStatus = sortedStatusTracking?.[0]
        const statusType = latestStatus?.status || 'belum_selesai'
        return statusType === status
      })
    }

    setModalState({
      isOpen: true,
      title,
      syorList: filteredSyor,
      status
    })
  }

  // Function to close modal
  const closeModal = () => {
    setModalState({
      isOpen: false,
      title: '',
      syorList: [],
      status: ''
    })
  }

  // Function to handle syor item click
  const handleSyorClick = (syorId: string) => {
    router.push(`/syor/${syorId}`)
  }

  // Check authentication only after auth loading is complete
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)
        setError(null)

        // First, fetch user details with department/JPN information
        if (user?.id) {
          const { data: userWithDetails, error: userError } = await supabase
            .from('users')
            .select(`
              *,
              department:department_id(id, name, code, sector),
              jpn:jpn_id(id, name, state)
            `)
            .eq('id', user.id)
            .single()

          if (userError) {
            console.error('Error fetching user details:', userError)
          } else {
            setUserDetails(userWithDetails)
          }
        }

        // Build query based on user's role for syor
        let syorQuery = supabase
          .from('syor')
          .select(`
            *,
            creator:created_by(name, sector),
            department:assigned_to_department(name, code, sector),
            jpn:assigned_to_jpn(name, state),
            status_tracking(*)
          `)

        // Apply role-based filtering for syor
        if (user?.role === 'penyelaras_bahagian' && user?.department_id) {
          syorQuery = syorQuery.eq('assigned_to_department', user.department_id)
        } else if (user?.role === 'penyelaras_jpn' && user?.jpn_id) {
          syorQuery = syorQuery.eq('assigned_to_jpn', user.jpn_id)
        } else if (user?.role === 'peneraju_pemeriksaan' && user?.sector) {
          // Peneraju Pemeriksaan: only see syor assigned to departments in their sector
          const { data: departmentsInSector } = await supabase
            .from('departments')
            .select('id')
            .eq('sector', user.sector)
          
          if (departmentsInSector && departmentsInSector.length > 0) {
            const departmentIds = departmentsInSector.map(dept => dept.id)
            syorQuery = syorQuery.in('assigned_to_department', departmentIds)
          } else {
            // If no departments in their sector, show no syor
            syorQuery = syorQuery.eq('id', 'no-match-uuid')
          }
        }

        const { data: syorData, error: syorError } = await syorQuery
          .order('created_at', { ascending: false })
          .limit(10)

        if (syorError) throw syorError

        // Also fetch ALL syor data for modal (without limit)
        let allSyorQuery = supabase
          .from('syor')
          .select(`
            *,
            creator:created_by(name, sector),
            department:assigned_to_department(name, code, sector),
            jpn:assigned_to_jpn(name, state),
            status_tracking(*)
          `)

        // Apply same role-based filtering for all syor
        if (user?.role === 'penyelaras_bahagian' && user?.department_id) {
          allSyorQuery = allSyorQuery.eq('assigned_to_department', user.department_id)
        } else if (user?.role === 'penyelaras_jpn' && user?.jpn_id) {
          allSyorQuery = allSyorQuery.eq('assigned_to_jpn', user.jpn_id)
        } else if (user?.role === 'peneraju_pemeriksaan' && user?.sector) {
          // Reuse the same department filtering logic
          const { data: departmentsInSector } = await supabase
            .from('departments')
            .select('id')
            .eq('sector', user.sector)
          
          if (departmentsInSector && departmentsInSector.length > 0) {
            const departmentIds = departmentsInSector.map(dept => dept.id)
            allSyorQuery = allSyorQuery.in('assigned_to_department', departmentIds)
          } else {
            allSyorQuery = allSyorQuery.eq('id', 'no-match-uuid')
          }
        }

        const { data: allSyorData, error: allSyorError } = await allSyorQuery.order('created_at', { ascending: false })

        if (allSyorError) throw allSyorError

        // Calculate dashboard statistics from allSyorData (which includes status_tracking)
        const totalSyor = allSyorData?.length || 0
        const statusCounts = { belum_selesai: 0, dalam_tindakan: 0, selesai: 0 }
        let totalWeight = 0
        let weightCount = 0

        // Calculate stats from each syor's latest status
        allSyorData?.forEach((syor) => {
          // Sort status_tracking by updated_at descending to get latest status
          const sortedStatusTracking = syor.status_tracking
            ?.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          
          const latestStatus = sortedStatusTracking?.[0]
          const status = latestStatus?.status || 'belum_selesai'
          
          // Count latest status for this syor
          if (status in statusCounts) {
            statusCounts[status as keyof typeof statusCounts]++
          }
          
          // Add weight for average calculation
          if (latestStatus?.weight !== undefined) {
            totalWeight += latestStatus.weight
            weightCount++
          }
        })

        const avgWeight = weightCount > 0 ? totalWeight / weightCount : 0

        const calculatedStats: DashboardStats = {
          total_syor: totalSyor,
          selesai: statusCounts.selesai,
          dalam_tindakan: statusCounts.dalam_tindakan,
          belum_selesai: statusCounts.belum_selesai,
          overdue: 0, // Calculate based on due dates
          avg_completion_time: avgWeight,
          department_performance: []
        }

        setStats(calculatedStats)
        setRecentSyor(syorData || [])
        setAllSyor(allSyorData || []) // Store all syor for modal filtering
      } catch (err) {
        console.error('Dashboard data fetch error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  // Show loading if either auth is loading or data is loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-300 text-lg">
            {authLoading ? 'Mengesahkan pengguna...' : 'Memuat data papan pemuka...'}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%)' }}>
        <div className="max-w-md mx-auto cloudpeak-card p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Ralat Memuat Papan Pemuka</h3>
            <p className="text-slate-300 mb-6">Ralat: {error}</p>
            <Link 
              href="/" 
              className="cloudpeak-button px-6 py-3 rounded-lg transition-all"
            >
              Kembali ke Halaman Utama
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const completionPercentage = stats 
    ? Math.round((stats.avg_completion_time * 100)) 
    : 0

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%)' }}>
      <DashboardHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold cloudpeak-title mb-3">Dashboard STTPMP</h1>
          <div className="mt-2 space-y-1">
            <p className="text-slate-300 text-lg">Dashboard sistem pemantauan syor dan maklum balas syor</p>
            {user?.role === 'penyelaras_bahagian' && userDetails?.department && (
              <p className="text-sm text-blue-400 font-medium bg-blue-500/10 px-3 py-1 rounded-full inline-block">
                📋 Dashboard untuk Bahagian: <span className="font-bold">{userDetails.department.name}</span>
              </p>
            )}
            {user?.role === 'penyelaras_jpn' && userDetails?.jpn && (
              <p className="text-sm text-green-400 font-medium bg-green-500/10 px-3 py-1 rounded-full inline-block">
                🏢 Dashboard untuk JPN: <span className="font-bold">{userDetails.jpn.name}, {userDetails.jpn.state}</span>
              </p>
            )}
            {user?.role === 'peneraju_pemeriksaan' && userDetails?.sector && (
              <p className="text-sm text-purple-400 font-medium bg-purple-500/10 px-3 py-1 rounded-full inline-block">
                🎯 Dashboard untuk Sektor: <span className="font-bold">{userDetails.sector}</span>
              </p>
            )}
            {user?.role === 'admin' && (
              <p className="text-sm text-red-400 font-medium bg-red-500/10 px-3 py-1 rounded-full inline-block">
                👑 Dashboard Admin - Akses Penuh Semua Data
              </p>
            )}
            {user?.role === 'pemantau' && (
              <p className="text-sm text-slate-400 font-medium bg-slate-500/10 px-3 py-1 rounded-full inline-block">
                👁️ Dashboard Pemantau - Akses Lihat Semua Data
              </p>
            )}
            {user?.role === 'peneraju_pemeriksaan' && (!userDetails?.sector) && (
              <p className="text-sm text-orange-400 font-medium bg-orange-500/10 px-3 py-1 rounded-full inline-block">
                ⚠️ Sektor belum ditetapkan - Hubungi admin untuk penetapan sektor
              </p>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div 
              className="cloudpeak-card p-6 cursor-pointer hover:bg-slate-700/30 transition-colors"
              onClick={() => handleScoreCardClick('all', 'Semua Syor')}
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">Total Syor</p>
                  <p className="text-3xl font-bold text-white">{stats.total_syor}</p>
                  <p className="text-xs text-slate-500 mt-1">Klik untuk lihat semua</p>
                </div>
              </div>
            </div>

            <div 
              className="cloudpeak-card p-6 cursor-pointer hover:bg-slate-700/30 transition-colors"
              onClick={() => handleScoreCardClick('selesai', 'Senarai Syor Selesai')}
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">Selesai</p>
                  <p className="text-3xl font-bold text-white">{stats.selesai}</p>
                  <p className="text-xs text-slate-500 mt-1">Klik untuk lihat senarai</p>
                </div>
              </div>
            </div>

            <div 
              className="cloudpeak-card p-6 cursor-pointer hover:bg-slate-700/30 transition-colors"
              onClick={() => handleScoreCardClick('dalam_tindakan', 'Senarai Syor Dalam Tindakan')}
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">Dalam Tindakan</p>
                  <p className="text-3xl font-bold text-white">{stats.dalam_tindakan}</p>
                  <p className="text-xs text-slate-500 mt-1">Klik untuk lihat senarai</p>
                </div>
              </div>
            </div>

            <div 
              className="cloudpeak-card p-6 cursor-pointer hover:bg-slate-700/30 transition-colors"
              onClick={() => handleScoreCardClick('belum_selesai', 'Senarai Syor Belum Selesai')}
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">Belum Selesai</p>
                  <p className="text-3xl font-bold text-white">{stats.belum_selesai}</p>
                  <p className="text-xs text-slate-500 mt-1">Klik untuk lihat senarai</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Overview */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Kemajuan Keseluruhan */}
          <div className="lg:col-span-1">
            <div className="cloudpeak-card p-6">
              <h3 className="text-xl font-bold text-white mb-6">Kemajuan Keseluruhan</h3>
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-600"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className={completionPercentage > 66 ? "text-green-400" : completionPercentage > 33 ? "text-yellow-400" : "text-red-400"}
                      strokeDasharray={`${completionPercentage}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">{completionPercentage}%</span>
                  </div>
                </div>
                <p className="text-slate-400 font-medium">Purata Selesai</p>
              </div>
            </div>
          </div>

          {/* Syor Terkini */}
          <div className="lg:col-span-2">
            <div className="cloudpeak-card">
              <div className="px-6 py-4 border-b border-slate-600">
                <h3 className="text-xl font-bold text-white">Syor Terkini</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentSyor.slice(0, 5).map((syor) => {
                    // Sort status_tracking by updated_at descending to get the latest status
                    const sortedStatusTracking = syor.status_tracking
                      ?.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                    const latestStatus = sortedStatusTracking?.[0]
                    const statusType = latestStatus?.status || 'belum_selesai'
                    
                    return (
                      <div 
                        key={syor.id} 
                        className="flex items-center justify-between p-4 bg-slate-700/30 border border-slate-600 rounded-xl hover:bg-slate-600/30 transition-colors cursor-pointer"
                        onClick={() => handleSyorClick(syor.id)}
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-2">{syor.title}</h4>
                          <p className="text-sm text-slate-300 mb-1">
                            Ditugaskan kepada: {syor.department?.name || syor.jpn?.name || 'Tidak ditetapkan'}
                          </p>
                          <p className="text-xs text-slate-400">
                            Tarikh Akhir: {new Date(syor.due_date).toLocaleDateString('ms-MY')}
                          </p>
                          <p className="text-xs text-blue-400 mt-1">
                            👆 Klik untuk lihat butiran lengkap
                          </p>
                        </div>
                        <div className="ml-4">
                          <span className={`cloudpeak-badge ${getStatusColor(statusType as 'belum_selesai' | 'dalam_tindakan' | 'selesai')}`}>
                            {getStatusText(statusType as 'belum_selesai' | 'dalam_tindakan' | 'selesai')}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {recentSyor.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-slate-300 mb-2">
                      {user?.role === 'penyelaras_bahagian' 
                        ? 'No syor assigned to your department yet.'
                        : user?.role === 'penyelaras_jpn'
                        ? 'No syor assigned to your JPN yet.'
                        : 'No syor found.'
                      }
                    </p>
                    {(user?.role === 'penyelaras_bahagian' || user?.role === 'penyelaras_jpn') && (
                      <p className="text-xs text-slate-400">
                        You can only view syor assigned to your {user.role === 'penyelaras_bahagian' ? 'department' : 'JPN'}.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for showing syor by status */}
      <SyorModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        syorList={modalState.syorList}
        status={modalState.status}
      />
    </div>
  )
}