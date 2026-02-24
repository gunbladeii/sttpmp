'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuthSimple'
import { useSyorRealtime } from '@/hooks/useSyorRealtime'
import DashboardHeader from '@/components/DashboardHeader'
import type { Syor } from '@/types'
import { getStatusColor, formatDate, getStatusText, capitalizeWords } from '@/lib/utils'

export default function SyorList() {
  const { user, loading: authLoading } = useAuth()
  const [syor, setSyor] = useState<Record<string, unknown>[]>([])
  const [userDetails, setUserDetails] = useState<Record<string, unknown> | null>(null) // Store user with department/JPN details
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'belum_selesai' | 'dalam_tindakan' | 'selesai' | 'hampir_tamat'>('all')

  // Check authentication only after auth loading is complete
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login'
    }
  }, [user, authLoading])

  // Fetch syor data - extracted as separate function for reuse
  const fetchSyor = async () => {
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

      // Build query based on user's role
      let query = supabase
        .from('syor')
        .select(`
          *,
          creator:created_by(name, sector),
          department:assigned_to_department(name, code, sector),
          jpn:assigned_to_jpn(name, state),
          status_tracking(
            id,
            status,
            weight,
            comments,
            updated_at,
            assigned_department:department_id(id, name, code),
            assigned_jpn:jpn_id(id, name, state),
            updater:updated_by(name)
          )
        `)

      // Apply role-based filtering
      if (user?.role === 'penyelaras_bahagian' && user?.department_id) {
        // Penyelaras Bahagian: only see syor assigned to their department
        // Filter via status_tracking.department_id
        const { data: syorIds } = await supabase
          .from('status_tracking')
          .select('syor_id')
          .eq('department_id', user.department_id)
        
        if (syorIds && syorIds.length > 0) {
          const ids = syorIds.map(s => s.syor_id)
          query = query.in('id', ids)
        } else {
          // No assignments - return empty array instead of querying
          setSyor([])
          setLoading(false)
          return
        }
      } else if ((user?.role === 'penyelaras_jpn' || user?.role === 'penyelaras_jnn') && user?.jpn_id) {
        // Penyelaras JPN & JNN: only see syor assigned to their JPN
        // Filter via status_tracking.jpn_id
        const { data: syorIds } = await supabase
          .from('status_tracking')
          .select('syor_id')
          .eq('jpn_id', user.jpn_id)
        
        if (syorIds && syorIds.length > 0) {
          const ids = syorIds.map(s => s.syor_id)
          query = query.in('id', ids)
        } else {
          // No assignments - return empty array instead of querying
          setSyor([])
          setLoading(false)
          return
        }
      } else if (user?.role === 'peneraju_pemeriksaan' && user?.sector) {
        // Peneraju Pemeriksaan: see syor created by users in their sector
        // Filter by created_by users who have the same sector
        
        // Get users in their sector (both peneraju and other roles)
        const { data: usersInSector } = await supabase
          .from('users')
          .select('id')
          .eq('sector', user.sector)
        
        if (usersInSector && usersInSector.length > 0) {
          const userIds = usersInSector.map(u => u.id)
          // Show syor created by users in their sector
          query = query.in('created_by', userIds)
        } else {
          // No users in sector - return empty array instead of querying
          setSyor([])
          setLoading(false)
          return
        }
      }
      // Admin and pemantau can see all syor (no filter)

      const { data, error: fetchError } = await query.order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setSyor(data || [])
    } catch (err) {
      console.error('Error fetching syor:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchSyor()
    }
  }, [user])

  // 🔴 REALTIME SUBSCRIPTION - Auto update when syor changes
  useSyorRealtime({
    onInsert: (payload) => {
      console.log('🆕 Syor baru dicipta:', payload.new)
      // Refresh syor list to get new syor with all relations
      if (user) {
        // Re-fetch to get complete data with joins
        fetchSyor()
      }
    },
    onUpdate: (payload) => {
      console.log('📝 Syor dikemaskini:', payload.new)
      // Update the specific syor in the list
      setSyor(prev => prev.map(s => 
        s.id === payload.new.id 
          ? { ...s, ...payload.new } // Merge update
          : s
      ))
    },
    onDelete: (payload) => {
      console.log('🗑️ Syor dipadam:', payload.old)
      // Remove from list
      setSyor(prev => prev.filter(s => s.id !== payload.old.id))
    },
    enabled: !!user // Only enable when user is logged in
  })

  const filteredSyor = filter === 'all' 
    ? syor 
    : filter === 'hampir_tamat'
    ? syor.filter(item => {
        const today = new Date()
        const responseDeadline = new Date(item.response_deadline || item.due_date)
        const daysUntilDeadline = Math.ceil((responseDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        // Show syor that are due within 7 days and not yet completed
        const sortedStatusTracking = item.status_tracking
          ?.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        const latestStatus = sortedStatusTracking?.[0]?.status || 'belum_selesai'
        
        return daysUntilDeadline <= 7 && daysUntilDeadline >= 0 && latestStatus !== 'selesai'
      })
    : syor.filter(item => {
        // Sort status_tracking to get the latest status
        const sortedStatusTracking = item.status_tracking
          ?.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        const latestStatus = sortedStatusTracking?.[0]?.status || 'belum_selesai'
        return latestStatus === filter
      })

  // Show loading if either auth is loading or data is loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-300 text-lg">
            {authLoading ? 'Mengesahkan pengguna...' : 'Memuat data syor...'}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%)' }}>
        <div className="max-w-md mx-auto cloudpeak-card p-6 sm:p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Ralat Memuat Syor</h3>
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

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%)' }}>
      <DashboardHeader />
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold cloudpeak-title mb-3">Pengurusan Perakuan Menteri</h1>
              <div className="mt-2 space-y-2">
                <p className="text-slate-300 text-sm sm:text-base md:text-lg">Urus saranan dan maklum balas</p>
                {user?.role === 'penyelaras_bahagian' && userDetails?.department && (
                  <p className="text-sm text-blue-400 font-medium bg-blue-500/10 px-3 py-1 rounded-full inline-block">
                    📋 Melihat Perakuan Menteri untuk Bahagian: <span className="font-bold">{userDetails.department.name}</span>
                  </p>
                )}
                {user?.role === 'penyelaras_jpn' && userDetails?.jpn && (
                  <p className="text-sm text-green-400 font-medium bg-green-500/10 px-3 py-1 rounded-full inline-block">
                    🏢 Melihat Perakuan Menteri untuk JPN: <span className="font-bold">{userDetails.jpn.name}, {userDetails.jpn.state}</span>
                  </p>
                )}
                {user?.role === 'penyelaras_jnn' && userDetails?.jpn && (
                  <p className="text-sm text-teal-400 font-medium bg-teal-500/10 px-3 py-1 rounded-full inline-block">
                    🏢 Melihat Perakuan Menteri untuk JPN: <span className="font-bold">{userDetails.jpn.name}, {userDetails.jpn.state}</span>
                    <span className="ml-2 text-xs">(VIEW ONLY)</span>
                  </p>
                )}
                {user?.role === 'peneraju_pemeriksaan' && userDetails?.sector && (
                  <p className="text-sm text-purple-400 font-medium bg-purple-500/10 px-3 py-1 rounded-full inline-block">
                    🎯 Melihat Perakuan Menteri untuk Sektor: <span className="font-bold">{userDetails.sector}</span>
                  </p>
                )}
                {user?.role === 'admin' && (
                  <p className="text-sm text-red-400 font-medium bg-red-500/10 px-3 py-1 rounded-full inline-block">
                    👑 Akses Admin - Melihat semua Perakuan Menteri
                  </p>
                )}
                {user?.role === 'pemantau' && (
                  <p className="text-sm text-slate-400 font-medium bg-slate-500/10 px-3 py-1 rounded-full inline-block">
                    👁️ Akses Pemantau - Melihat semua syor
                  </p>
                )}
                {user?.role === 'peneraju_pemeriksaan' && (!userDetails?.sector) && (
                  <p className="text-sm text-orange-400 font-medium bg-orange-500/10 px-3 py-1 rounded-full inline-block">
                    ⚠️ Sektor belum ditetapkan - Hubungi admin
                  </p>
                )}
              </div>
            </div>
            {user?.role === 'peneraju_pemeriksaan' && (
              <Link
                href="/create-syor"
                className="cloudpeak-button px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105"
              >
                + Syor Baharu
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all transform hover:scale-105 ${
                filter === 'all' 
                  ? 'cloudpeak-button bg-gradient-to-r from-blue-500 to-blue-600' 
                  : 'cloudpeak-card text-slate-300 hover:text-white border border-slate-600 hover:border-blue-500/50'
              }`}
            >
              All ({syor.length})
            </button>
            <button
              onClick={() => setFilter('belum_selesai')}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all transform hover:scale-105 ${
                filter === 'belum_selesai' 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border border-red-500/30' 
                  : 'cloudpeak-card text-slate-300 hover:text-white border border-slate-600 hover:border-red-500/50'
              }`}
            >
              Belum Selesai
            </button>
            <button
              onClick={() => setFilter('dalam_tindakan')}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all transform hover:scale-105 ${
                filter === 'dalam_tindakan' 
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border border-yellow-500/30' 
                  : 'cloudpeak-card text-slate-300 hover:text-white border border-slate-600 hover:border-yellow-500/50'
              }`}
            >
              Dalam Tindakan
            </button>
            <button
              onClick={() => setFilter('selesai')}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all transform hover:scale-105 ${
                filter === 'selesai' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border border-green-500/30' 
                  : 'cloudpeak-card text-slate-300 hover:text-white border border-slate-600 hover:border-green-500/50'
              }`}
            >
              Selesai
            </button>
            <button
              onClick={() => setFilter('hampir_tamat')}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all transform hover:scale-105 ${
                filter === 'hampir_tamat' 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border border-orange-500/30 animate-pulse' 
                  : 'cloudpeak-card text-slate-300 hover:text-white border border-slate-600 hover:border-orange-500/50'
              }`}
            >
              ⏰ Hampir Tamat Tempoh
            </button>
          </div>
        </div>

        {/* Syor List */}
        <div className="cloudpeak-card rounded-xl overflow-hidden">
          {filteredSyor.length > 0 ? (
            <div className="divide-y divide-slate-600">
              {filteredSyor.map((item) => {
                // Sort status_tracking to get the latest status first
                const sortedStatusTracking = item.status_tracking
                  ?.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                const latestStatus = sortedStatusTracking?.[0]
                const statusType = latestStatus?.status || 'belum_selesai'
                
                // Extract assigned departments and JPNs from status_tracking
                const assignedDepartments = item.status_tracking
                  ?.filter((st: any) => st.assigned_department)
                  .map((st: any) => st.assigned_department)
                  .filter((dept: any, index: number, self: any[]) => 
                    index === self.findIndex((d: any) => d?.id === dept?.id)
                  ) || [];
                
                const assignedJPNs = item.status_tracking
                  ?.filter((st: any) => st.assigned_jpn)
                  .map((st: any) => st.assigned_jpn)
                  .filter((jpn: any, index: number, self: any[]) => 
                    index === self.findIndex((j: any) => j?.id === jpn?.id)
                  ) || [];
                
                const hasAssignments = assignedDepartments.length > 0 || assignedJPNs.length > 0;
                
                // Calculate deadline status
                const today = new Date()
                const responseDeadline = new Date(item.response_deadline || item.due_date)
                const daysUntilDeadline = Math.ceil((responseDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                
                const isOverdue = daysUntilDeadline < 0 && statusType !== 'selesai'
                const isUrgent = daysUntilDeadline <= 3 && daysUntilDeadline >= 0 && statusType !== 'selesai'
                const isApproaching = daysUntilDeadline <= 7 && daysUntilDeadline > 3 && statusType !== 'selesai'
                
                return (
                  <div 
                    key={item.id} 
                    className={`p-4 sm:p-6 md:p-8 transition-all ${
                      isOverdue ? 'bg-red-500/10 border-l-4 border-red-500 hover:bg-red-500/20' :
                      isUrgent ? 'bg-orange-500/10 border-l-4 border-orange-500 hover:bg-orange-500/20' :
                      isApproaching ? 'bg-yellow-500/5 border-l-4 border-yellow-500/50 hover:bg-yellow-500/10' :
                      'hover:bg-slate-600/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
                          <h3 className="text-lg sm:text-xl font-bold text-white">{item.title}</h3>
                          {isOverdue && (
                            <span className="px-3 py-1.5 bg-red-500/30 text-red-200 text-xs font-bold rounded-full border-2 border-red-500 animate-pulse shadow-lg shadow-red-500/50">
                              🔴 TERTUNGGAK ({Math.abs(daysUntilDeadline)} hari lepas)
                            </span>
                          )}
                          {isUrgent && !isOverdue && (
                            <span className="px-3 py-1.5 bg-orange-500/30 text-orange-200 text-xs font-bold rounded-full border-2 border-orange-500 animate-pulse shadow-lg shadow-orange-500/50">
                              ⚠️ SEGERA ({daysUntilDeadline} hari lagi)
                            </span>
                          )}
                          {isApproaching && !isUrgent && !isOverdue && (
                            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded-full border border-yellow-500/30">
                              ⏰ {daysUntilDeadline} hari lagi
                            </span>
                          )}
                        </div>
                        
                        {/* Content */}
                        {item.description ? (
                          <div 
                            className="mb-4 rich-text-content leading-relaxed"
                            style={{ color: '#cbd5e1 !important' }}
                            dangerouslySetInnerHTML={{ __html: item.description }}
                          />
                        ) : (
                          <p className="text-slate-400 mb-4 italic">Tiada kandungan syor</p>
                        )}
                        
                        <div className="flex flex-wrap gap-6 text-sm">
                          {item.response_deadline && (
                            <div className={`flex items-center gap-2 ${
                              isOverdue ? 'text-red-400 font-bold' :
                              isUrgent ? 'text-orange-400 font-bold' :
                              isApproaching ? 'text-yellow-400' :
                              'text-slate-400'
                            }`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-white font-medium">Tarikh Maklum Balas:</span> 
                              <span className={isOverdue || isUrgent ? 'font-bold' : ''}>{formatDate(item.response_deadline)}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-white font-medium">Tarikh Akhir:</span> {formatDate(item.due_date)}
                          </div>
                          
                          <div className="flex items-center gap-2 text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-12 0H3m2 0h2M9 7h6m-6 4h6m-6 4h6" />
                            </svg>
                            <span className="text-white font-medium">Assigned to:</span>
                            {hasAssignments ? (
                              <div className="flex flex-wrap gap-1">
                                {assignedDepartments.map((dept: any, idx: number) => (
                                  <span key={`dept-${dept.id || idx}`} className="text-blue-300">
                                    {dept.name}{idx < assignedDepartments.length - 1 || assignedJPNs.length > 0 ? ',' : ''}
                                  </span>
                                ))}
                                {assignedJPNs.map((jpn: any, idx: number) => (
                                  <span key={`jpn-${jpn.id || idx}`} className="text-green-300">
                                    {jpn.name}{idx < assignedJPNs.length - 1 ? ',' : ''}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">Unassigned</span>
                            )}
                          </div>

                          {item.creator && (
                            <div className="flex items-center gap-2 text-slate-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="text-white font-medium">Created by:</span> 
                              <span className="text-blue-300">{item.creator.name}</span>
                              {item.creator.sector && (
                                <span className="text-slate-400">({item.creator.sector})</span>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 3v11a2 2 0 002 2h8a2 2 0 002-2V7M9 7h6M9 11h6m-6 4h6" />
                            </svg>
                            <span className="text-white font-medium">Priority:</span>
                            <span className={`cloudpeak-badge px-3 py-1 rounded-full text-xs font-medium ${
                              item.priority === 'kritikal' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                              item.priority === 'tinggi' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                              item.priority === 'sederhana' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                              'bg-green-500/20 text-green-300 border-green-500/30'
                            }`}>
                              {capitalizeWords(item.priority)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-8 text-right space-y-3">
                        <span className={`cloudpeak-badge inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(statusType as 'belum_selesai' | 'dalam_tindakan' | 'selesai')}`}>
                          <div className={`w-2 h-2 rounded-full ${
                            statusType === 'selesai' ? 'bg-green-400' :
                            statusType === 'dalam_tindakan' ? 'bg-yellow-400' :
                            'bg-red-400'
                          }`}></div>
                          {getStatusText(statusType as 'belum_selesai' | 'dalam_tindakan' | 'selesai')}
                        </span>
                        
                        {latestStatus && (
                          <div className="text-xs text-slate-400">
                            Wajaran: <span className="text-white font-medium">{latestStatus.weight}</span>
                          </div>
                        )}
                        
                        <Link 
                          href={`/syor/${item.id}`}
                          className="cloudpeak-button inline-block px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105"
                        >
                          Lihat Perincian →
                        </Link>
                      </div>
                    </div>
                    
                    {latestStatus?.comments && (
                      <div className="mt-6 p-4 bg-slate-700/30 rounded-xl border border-slate-600">
                        <p className="text-sm text-slate-300">
                          <span className="font-semibold text-white">Respon Terkini:</span> {latestStatus.comments}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-600/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Tiada Perakuan Menteri dijumpai</h3>
              <p className="text-slate-300 mb-6">
                {user?.role === 'penyelaras_bahagian' && userDetails?.department
                  ? `Tiada Perakuan Menteri yang ditetapkan kepada ${userDetails.department.name} lagi.`
                  : user?.role === 'penyelaras_jpn' && userDetails?.jpn
                  ? `Tiada Perakuan Menteri yang ditetapkan kepada ${userDetails.jpn.name} lagi.`
                  : user?.role === 'peneraju_pemeriksaan' && userDetails?.sector
                  ? `Tiada Perakuan Menteri untuk sektor ${userDetails.sector} lagi.`
                  : 'Tiada Perakuan Menteri yang sepadan dengan penapis semasa.'
                }
              </p>
              {(user?.role === 'penyelaras_bahagian' || user?.role === 'penyelaras_jpn' || user?.role === 'peneraju_pemeriksaan') && (
                <div className="cloudpeak-card p-6 max-w-lg mx-auto">
                  <p className="text-sm text-blue-300">
                    💡 <strong>Nota:</strong> Anda hanya dapat melihat Perakuan Menteri yang ditetapkan kepada {
                      user.role === 'penyelaras_bahagian' && userDetails?.department ? userDetails.department.name :
                      user.role === 'penyelaras_jpn' && userDetails?.jpn ? `${userDetails.jpn.name}, ${userDetails.jpn.state}` :
                      user.role === 'peneraju_pemeriksaan' && userDetails?.sector ? `sektor ${userDetails.sector}` :
                      'unit anda'
                    }. 
                    Hubungi admin jika anda memerlukan akses kepada Perakuan Menteri lain.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}