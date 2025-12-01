'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuthSimple'
import DashboardHeader from '@/components/DashboardHeader'
import { supabase } from '@/lib/supabase'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'

// Types for our analytics data
interface StatusByDepartment {
  name: string
  selesai: number
  dalam_tindakan: number
  belum_selesai: number
}

interface StatusByJPN {
  name: string
  selesai: number
  dalam_tindakan: number
  belum_selesai: number
}

interface TopDelayedSyor {
  id: string
  title: string
  daysOverdue: number
  assignedTo: string
  priority: string
}

interface SectorIssues {
  sector: string
  count: number
  percentage: number
}

interface DimensionData {
  dimension: string
  count: number
  fullMark: number
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

export default function DashboardLaporan() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Analytics data states
  const [statusByDepartment, setStatusByDepartment] = useState<StatusByDepartment[]>([])
  const [statusByJPN, setStatusByJPN] = useState<StatusByJPN[]>([])
  const [topDelayedSyor, setTopDelayedSyor] = useState<TopDelayedSyor[]>([])
  const [sectorIssues, setSectorIssues] = useState<SectorIssues[]>([])
  const [dimensionData, setDimensionData] = useState<DimensionData[]>([])

  // Check authentication and admin access
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  // Fetch analytics data
  useEffect(() => {
    async function fetchAnalyticsData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch all syor with related data
        const { data: syorData, error: syorError } = await supabase
          .from('syor')
          .select(`
            *,
            creator:created_by(name, sector),
            department:assigned_to_department(name, code, sector),
            jpn:assigned_to_jpn(name, state),
            status_tracking(
              id,
              status,
              updated_at
            )
          `)

        if (syorError) throw syorError

        // Process data for analytics
        processStatusByDepartment(syorData || [])
        processStatusByJPN(syorData || [])
        processTopDelayedSyor(syorData || [])
        processSectorIssues(syorData || [])
        processDimensionData(syorData || [])

      } catch (err) {
        console.error('Analytics data fetch error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (user?.role === 'admin') {
      fetchAnalyticsData()
    }
  }, [user])

  // Data processing functions
  const processStatusByDepartment = (syorData: any[]) => {
    const departmentStats: { [key: string]: StatusByDepartment } = {}

    syorData.forEach(syor => {
      if (!syor.department) return

      const deptName = syor.department.name
      if (!departmentStats[deptName]) {
        departmentStats[deptName] = {
          name: deptName,
          selesai: 0,
          dalam_tindakan: 0,
          belum_selesai: 0
        }
      }

      // Get latest status
      const sortedStatus = syor.status_tracking?.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      const latestStatus = sortedStatus?.[0]?.status || 'belum_selesai'

      departmentStats[deptName][latestStatus as keyof Omit<StatusByDepartment, 'name'>]++
    })

    setStatusByDepartment(Object.values(departmentStats))
  }

  const processStatusByJPN = (syorData: any[]) => {
    const jpnStats: { [key: string]: StatusByJPN } = {}

    syorData.forEach(syor => {
      if (!syor.jpn) return

      const jpnName = syor.jpn.name
      if (!jpnStats[jpnName]) {
        jpnStats[jpnName] = {
          name: jpnName,
          selesai: 0,
          dalam_tindakan: 0,
          belum_selesai: 0
        }
      }

      // Get latest status
      const sortedStatus = syor.status_tracking?.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      const latestStatus = sortedStatus?.[0]?.status || 'belum_selesai'

      jpnStats[jpnName][latestStatus as keyof Omit<StatusByJPN, 'name'>]++
    })

    setStatusByJPN(Object.values(jpnStats))
  }

  const processTopDelayedSyor = (syorData: any[]) => {
    const now = new Date()
    const delayedSyor = syorData
      .filter(syor => {
        const sortedStatus = syor.status_tracking?.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
        const latestStatus = sortedStatus?.[0]?.status || 'belum_selesai'
        
        // Check if not completed AND response_deadline has passed
        // Use response_deadline (Tarikh Akhir Maklum Balas) instead of due_date
        const responseDeadline = syor.response_deadline ? new Date(syor.response_deadline) : new Date(syor.due_date)
        return latestStatus !== 'selesai' && responseDeadline < now
      })
      .map(syor => {
        // Calculate days overdue based on response_deadline
        const responseDeadline = syor.response_deadline ? new Date(syor.response_deadline) : new Date(syor.due_date)
        const daysOverdue = Math.floor((now.getTime() - responseDeadline.getTime()) / (1000 * 60 * 60 * 24))
        return {
          id: syor.id,
          title: syor.title,
          daysOverdue,
          assignedTo: syor.department?.name || syor.jpn?.name || 'Tidak ditetapkan',
          priority: syor.priority
        }
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue)
      .slice(0, 3)

    setTopDelayedSyor(delayedSyor)
  }

  const processSectorIssues = (syorData: any[]) => {
    // Fallback mapping for departments without sector field
    const departmentToSector: { [key: string]: string } = {
      'BPM': 'SPK',     // Bahagian Pendidikan Menengah
      'BPR': 'SPK',     // Bahagian Pendidikan Rendah
      'BPK': 'SPHEMK',  // Bahagian Pembangunan Kurikulum
      'BTP': 'SPIP'     // Bahagian Teknologi Pendidikan
    }

    const sectorCounts: { [key: string]: number } = {
      'SPK': 0,
      'SPHEMK': 0,
      'SPIP': 0
    }

    syorData.forEach(syor => {
      // Try to get sector from database first, then fallback to manual mapping
      const sectorFromCreator = syor.creator?.sector
      const sectorFromDepartment = syor.department?.sector
      const sectorFromMapping = syor.department?.code ? departmentToSector[syor.department.code] : null
      
      const sector = sectorFromCreator || sectorFromDepartment || sectorFromMapping
      
      if (sector && sectorCounts.hasOwnProperty(sector)) {
        sectorCounts[sector]++
      }
    })

    const total = Object.values(sectorCounts).reduce((sum, count) => sum + count, 0)
    const sectorData = Object.entries(sectorCounts).map(([sector, count]) => ({
      sector,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }))

    setSectorIssues(sectorData)
  }

  const processDimensionData = (syorData: any[]) => {
    const dimensionKeywords = {
      'Keselamatan': ['keselamatan', 'selamat', 'bahaya', 'risiko', 'kemalangan'],
      'Kepimpinan': ['kepimpinan', 'pengurusan', 'pentadbiran', 'penyeliaan'],
      'Pencapaian Murid': ['pencapaian', 'prestasi', 'keputusan', 'markah', 'gred'],
      'Infrastruktur': ['infrastruktur', 'bangunan', 'kemudahan', 'peralatan'],
      'Kurikulum': ['kurikulum', 'silibus', 'pengajaran', 'pembelajaran'],
      'Kualiti Guru': ['guru', 'pengajar', 'kemahiran', 'latihan']
    }

    const dimensionCounts: { [key: string]: number } = {}
    Object.keys(dimensionKeywords).forEach(dim => {
      dimensionCounts[dim] = 0
    })

    syorData.forEach(syor => {
      const text = (syor.title + ' ' + syor.description).toLowerCase()
      
      Object.entries(dimensionKeywords).forEach(([dimension, keywords]) => {
        const hasKeyword = keywords.some(keyword => text.includes(keyword))
        if (hasKeyword) {
          dimensionCounts[dimension]++
        }
      })
    })

    const maxCount = Math.max(...Object.values(dimensionCounts), 1)
    const dimensionData = Object.entries(dimensionCounts).map(([dimension, count]) => ({
      dimension,
      count,
      fullMark: maxCount
    }))

    setDimensionData(dimensionData)
  }

  // Show loading if either auth is loading or data is loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-300 text-lg">
            {authLoading ? 'Mengesahkan pengguna...' : 'Memuat data laporan...'}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Ralat Memuat Data</h3>
            <p className="text-slate-300 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="cloudpeak-button px-6 py-3 rounded-lg transition-all"
            >
              Cuba Lagi
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%)' }}>
      {/* <DashboardHeader /> */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="cloudpeak-title">Dashboard Laporan</h1>
          <p className="mt-3 text-slate-300 text-lg">Analisis komprehensif data syor dan tindakan</p>
        </div>

        {/* Bar Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Status by Department */}
          <div className="cloudpeak-card p-6">
            <h2 className="text-xl font-bold text-white mb-6">Status Mengikut Bahagian</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusByDepartment}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc'
                  }} 
                />
                <Legend />
                <Bar dataKey="selesai" stackId="a" fill="#10B981" name="Selesai" />
                <Bar dataKey="dalam_tindakan" stackId="a" fill="#F59E0B" name="Dalam Tindakan" />
                <Bar dataKey="belum_selesai" stackId="a" fill="#EF4444" name="Belum Selesai" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status by JPN */}
          <div className="cloudpeak-card p-6">
            <h2 className="text-xl font-bold text-white mb-6">Status Mengikut JPN</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusByJPN}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc'
                  }} 
                />
                <Legend />
                <Bar dataKey="selesai" stackId="a" fill="#10B981" name="Selesai" />
                <Bar dataKey="dalam_tindakan" stackId="a" fill="#F59E0B" name="Dalam Tindakan" />
                <Bar dataKey="belum_selesai" stackId="a" fill="#EF4444" name="Belum Selesai" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Delayed Syor Scorecard */}
        <div className="cloudpeak-card p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Top 3 Syor Paling Lama Tertunda</h2>
          {topDelayedSyor.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topDelayedSyor.map((syor, index) => (
                <div 
                  key={syor.id} 
                  onClick={() => router.push(`/syor/${syor.id}`)}
                  className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-6 cursor-pointer hover:bg-slate-700/40 hover:border-red-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/20"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-red-400">#{index + 1}</span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      syor.priority === 'kritikal' ? 'bg-red-500/20 text-red-300' :
                      syor.priority === 'tinggi' ? 'bg-orange-500/20 text-orange-300' :
                      syor.priority === 'sederhana' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-green-500/20 text-green-300'
                    }`}>
                      {syor.priority}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold mb-2 text-sm leading-tight" style={{ 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>{syor.title}</h3>
                  <p className="text-slate-300 text-sm mb-2">{syor.assignedTo}</p>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-400">{syor.daysOverdue}</p>
                    <p className="text-xs text-slate-400">hari tertunda</p>
                  </div>
                  <p className="text-xs text-blue-400 mt-4 text-center">
                    👆 Klik untuk lihat butiran lengkap
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-slate-300">Tiada syor yang tertunda ketika ini</p>
              <p className="text-slate-400 text-sm mt-2">Semua syor dalam keadaan baik</p>
            </div>
          )}
        </div>

        {/* Pie Chart and Spider Web Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sector Issues Pie Chart */}
          <div className="cloudpeak-card p-6">
            <h2 className="text-xl font-bold text-white mb-6">Isu Mengikut Sektor Peneraju</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sectorIssues}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ sector, percentage }) => `${sector}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {sectorIssues.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              {sectorIssues.map((sector, index) => (
                <div key={sector.sector} className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div 
                      className="w-4 h-4 rounded-full mr-2" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm text-white font-medium">{sector.sector}</span>
                  </div>
                  <p className="text-lg font-bold text-slate-300">{sector.count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dimension Spider Web Chart */}
          <div className="cloudpeak-card p-6">
            <h2 className="text-xl font-bold text-white mb-6">Dimensi Tumpuan Syor</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={dimensionData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 'dataMax']} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                />
                <Radar
                  name="Bilangan Syor"
                  dataKey="count"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc'
                  }} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}