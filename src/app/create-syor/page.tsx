'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuthSimple'
import { supabase } from '@/lib/supabase'
import DashboardHeader from '@/components/DashboardHeader'

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

interface Pemeriksaan {
  NamaPemeriksaan: string
  Tahun: string
  KodJenisPemeriksaan: string
}

interface JenisPemeriksaan {
  KodPemeriksaan: string
  Pemeriksaan: string
}

export default function CreateSyorPage() {
  const router = useRouter()
  const { user } = useAuth()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [jpns, setJpns] = useState<JPN[]>([])
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([])
  const [filteredJpns, setFilteredJpns] = useState<JPN[]>([])
  const [departmentSearch, setDepartmentSearch] = useState('')
  const [jpnSearch, setJpnSearch] = useState('')
  const [pemeriksaanList, setPemeriksaanList] = useState<Pemeriksaan[]>([])
  const [filteredPemeriksaan, setFilteredPemeriksaan] = useState<Pemeriksaan[]>([])
  const [pemeriksaanSearch, setPemeriksaanSearch] = useState('')
  const [showPemeriksaanDropdown, setShowPemeriksaanDropdown] = useState(false)
  const [jenisPemeriksaanList, setJenisPemeriksaanList] = useState<JenisPemeriksaan[]>([])
  const [selectedJenisPemeriksaan, setSelectedJenisPemeriksaan] = useState<string>('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    syor_content: '',
    assigned_to_departments: [] as string[], // Changed to array for multiple selections
    assigned_to_jpns: [] as string[], // Changed to array for multiple selections
    priority: 'sederhana' as const,
    pemeriksaan_type: 'mata_pelajaran' as const,
    due_date: '',
    response_deadline: ''
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (user.role !== 'peneraju_pemeriksaan') {
      router.push('/dashboard')
      return
    }
  }, [user, router])

  useEffect(() => {
    async function fetchOptions() {
      try {
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('id, name, code')
          .order('name')

        if (deptError) throw deptError

        const { data: jpnData, error: jpnError } = await supabase
          .from('jpn')
          .select('id, name, state')
          .order('name')

        if (jpnError) throw jpnError

        setDepartments(deptData || [])
        setFilteredDepartments(deptData || [])
        setJpns(jpnData || [])
        setFilteredJpns(jpnData || [])

        // Fetch pemeriksaan data from MOE API
        try {
          // Fetch both APIs in parallel
          const [pemeriksaanResponse, jenisPemeriksaanResponse] = await Promise.all([
            fetch('https://enazir.moe.gov.my/APIcall.php/tknamapemeriksaan'),
            fetch('https://enazir.moe.gov.my/APIcall.php/tkjenispemeriksaan')
          ])
          
          if (!pemeriksaanResponse.ok || !jenisPemeriksaanResponse.ok) {
            throw new Error('Failed to fetch pemeriksaan data')
          }

          const pemeriksaanData = await pemeriksaanResponse.json()
          const jenisPemeriksaanData = await jenisPemeriksaanResponse.json()
          
          // Debug: Check API data structure
          console.log('Pemeriksaan Data Sample:', pemeriksaanData[0])
          console.log('Jenis Pemeriksaan Data Sample:', jenisPemeriksaanData[0])
          
          // Filter by current year + 1 year back (e.g., 2026 + 2025)
          const currentYear = new Date().getFullYear()
          const previousYear = currentYear - 1
          const filteredData = pemeriksaanData.filter((item: Pemeriksaan) => {
            const tahun = parseInt(item.Tahun)
            return tahun === currentYear || tahun === previousYear
          })
          
          setPemeriksaanList(filteredData)
          setFilteredPemeriksaan(filteredData)
          setJenisPemeriksaanList(jenisPemeriksaanData)
        } catch (apiError) {
          console.error('Error fetching pemeriksaan:', apiError)
          // Don't block the form if API fails, just show warning
          setError('Gagal memuat senarai pemeriksaan dari API MOE. Sila cuba sebentar lagi.')
        }
      } catch (err) {
        console.error('Error fetching options:', err)
        setError('Gagal memuat senarai bahagian dan JPN')
      }
    }

    fetchOptions()
  }, [])

  // Filter pemeriksaan based on search
  useEffect(() => {
    if (!pemeriksaanSearch.trim()) {
      setFilteredPemeriksaan(pemeriksaanList)
    } else {
      const filtered = pemeriksaanList.filter(item =>
        item.NamaPemeriksaan.toLowerCase().includes(pemeriksaanSearch.toLowerCase())
      )
      setFilteredPemeriksaan(filtered)
    }
  }, [pemeriksaanSearch, pemeriksaanList])

  // Filter departments based on search
  useEffect(() => {
    if (!departmentSearch.trim()) {
      setFilteredDepartments(departments)
    } else {
      const filtered = departments.filter(dept =>
        dept.name.toLowerCase().includes(departmentSearch.toLowerCase()) ||
        dept.code.toLowerCase().includes(departmentSearch.toLowerCase())
      )
      setFilteredDepartments(filtered)
    }
  }, [departmentSearch, departments])

  // Filter JPNs based on search
  useEffect(() => {
    if (!jpnSearch.trim()) {
      setFilteredJpns(jpns)
    } else {
      const filtered = jpns.filter(jpn =>
        jpn.name.toLowerCase().includes(jpnSearch.toLowerCase()) ||
        jpn.state.toLowerCase().includes(jpnSearch.toLowerCase())
      )
      setFilteredJpns(filtered)
    }
  }, [jpnSearch, jpns])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPemeriksaanDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handlePemeriksaanSelect = (pemeriksaan: Pemeriksaan) => {
    setFormData({ ...formData, title: pemeriksaan.NamaPemeriksaan })
    setPemeriksaanSearch(pemeriksaan.NamaPemeriksaan)
    setShowPemeriksaanDropdown(false)
    
    // Debug: Check selected pemeriksaan and mapping
    console.log('Selected Pemeriksaan:', pemeriksaan)
    console.log('KodJenisPemeriksaan:', pemeriksaan.KodJenisPemeriksaan)
    console.log('Jenis Pemeriksaan List:', jenisPemeriksaanList)
    
    // Auto-fill Jenis Pemeriksaan based on KodJenisPemeriksaan
    const jenisPemeriksaan = jenisPemeriksaanList.find(
      jp => jp.KodPemeriksaan === pemeriksaan.KodJenisPemeriksaan
    )
    
    console.log('Found Jenis Pemeriksaan:', jenisPemeriksaan)
    
    if (jenisPemeriksaan) {
      setSelectedJenisPemeriksaan(jenisPemeriksaan.Pemeriksaan)
    } else {
      setSelectedJenisPemeriksaan('Tidak diketahui')
    }
  }

  // Handler for multiple department/JPN checkbox selection
  const handleDepartmentToggle = (deptId: string) => {
    setFormData(prev => {
      const isSelected = prev.assigned_to_departments.includes(deptId)
      return {
        ...prev,
        assigned_to_departments: isSelected 
          ? prev.assigned_to_departments.filter(id => id !== deptId)
          : [...prev.assigned_to_departments, deptId],
        assigned_to_jpns: [] // Clear JPN selection when selecting departments
      }
    })
  }

  const handleJPNToggle = (jpnId: string) => {
    setFormData(prev => {
      const isSelected = prev.assigned_to_jpns.includes(jpnId)
      return {
        ...prev,
        assigned_to_jpns: isSelected 
          ? prev.assigned_to_jpns.filter(id => id !== jpnId)
          : [...prev.assigned_to_jpns, jpnId],
        assigned_to_departments: [] // Clear department selection when selecting JPNs
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (!formData.title.trim()) {
        throw new Error('Tajuk syor diperlukan')
      }
      
      if (!formData.syor_content.trim()) {
        throw new Error('Kandungan Perakuan Menteri diperlukan')
      }
      
      // Updated validation for multiple assignments
      if (formData.assigned_to_departments.length === 0 && formData.assigned_to_jpns.length === 0) {
        throw new Error('Sila pilih sekurang-kurangnya satu Bahagian atau JPN')
      }
      if (formData.assigned_to_departments.length > 0 && formData.assigned_to_jpns.length > 0) {
        throw new Error('Sila pilih sama ada Bahagian atau JPN sahaja, bukan kedua-duanya')
      }
      if (!formData.due_date) {
        throw new Error('Tarikh akhir diperlukan')
      }
      if (!formData.response_deadline) {
        throw new Error('Tarikh akhir maklum balas diperlukan')
      }
      
      // Validate date constraint: response_deadline <= due_date
      if (new Date(formData.response_deadline) > new Date(formData.due_date)) {
        throw new Error('Tarikh akhir maklum balas mestilah pada atau sebelum tarikh akhir syor')
      }

      const syorData = {
        title: formData.title.trim(),
        description: formData.syor_content.trim(),
        priority: formData.priority,
        pemeriksaan_type: formData.pemeriksaan_type,
        due_date: formData.due_date,
        response_deadline: formData.response_deadline,
        created_by: user.id,
        assigned_by: user.id,
        assigned_to_department: null, // Deprecated - using status_tracking now
        assigned_to_jpn: null, // Deprecated - using status_tracking now
        endorsement_date: new Date().toISOString().split('T')[0]
      }

      console.log('Inserting syor data:', syorData)
      
      const { data: newSyor, error: syorError } = await supabase
        .from('syor')
        .insert([syorData])
        .select()
        .single()

      if (syorError) {
        console.error('Syor insert error:', syorError)
        throw new Error(`Gagal cipta syor: ${syorError.message}`)
      }

      // Create multiple status_tracking records for each assignment
      const statusRecords = []
      
      // Create records for departments
      if (formData.assigned_to_departments.length > 0) {
        for (const deptId of formData.assigned_to_departments) {
          statusRecords.push({
            syor_id: newSyor.id,
            department_id: deptId,
            jpn_id: null,
            status: 'belum_selesai' as const,
            weight: 0.0,
            comments: 'Syor baharu telah dicipta dan menunggu tindakan.',
            updated_by: user.id
          })
        }
      }
      
      // Create records for JPNs
      if (formData.assigned_to_jpns.length > 0) {
        for (const jpnId of formData.assigned_to_jpns) {
          statusRecords.push({
            syor_id: newSyor.id,
            department_id: null,
            jpn_id: jpnId,
            status: 'belum_selesai' as const,
            weight: 0.0,
            comments: 'Syor baharu telah dicipta dan menunggu tindakan.',
            updated_by: user.id
          })
        }
      }

      console.log('Inserting status records:', statusRecords)

      const { error: statusError } = await supabase
        .from('status_tracking')
        .insert(statusRecords)

      if (statusError) {
        console.error('Status insert error:', statusError)
        throw new Error(`Gagal cipta status: ${statusError.message}`)
      }

      setSuccess(`Syor berjaya dicipta dan dihantar kepada ${statusRecords.length} pihak!`)

      // Send email notifications to assigned penyelaras (fire-and-forget, don't block UI)
      fetch('/api/syor/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'new_syor',
          syorId: newSyor.id,
          creatorName: user.name,
        }),
      }).catch((err) => console.warn('⚠️ Email notify failed (non-blocking):', err))

      // Reset form
      setFormData({
        title: '',
        syor_content: '',
        assigned_to_departments: [],
        assigned_to_jpns: [],
        priority: 'sederhana',
        pemeriksaan_type: 'mata_pelajaran',
        due_date: '',
        response_deadline: ''
      })
      
      // Clear all search fields
      setPemeriksaanSearch('')
      setDepartmentSearch('')
      setJpnSearch('')
      setSelectedJenisPemeriksaan('')

      setTimeout(() => {
        router.push('/syor')
      }, 2000)

    } catch (err: unknown) {
      console.error('Create syor full error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Ralat tidak diketahui';
      setError(errorMessage);
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%)' }}>
      <DashboardHeader />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Senarai Syor
          </button>
        </div>

        <div className="mb-8">
          <h1 className="cloudpeak-title">Cipta Perakuan Menteri Baharu</h1>
          <p className="mt-3 text-slate-300 text-lg">Cipta Perakuan Menteri untuk bahagian atau JPN</p>
        </div>

        <div className="cloudpeak-card">
          <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 border-b border-slate-700 border-opacity-30">
            <h2 className="text-xl font-medium text-white">Maklumat Perakuan Menteri</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
            {error && (
              <div className="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 text-red-300 px-6 py-4 rounded-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="bg-green-500 bg-opacity-20 border border-green-500 border-opacity-30 text-green-300 px-6 py-4 rounded-lg">
                <p className="text-sm">{success}</p>
              </div>
            )}

            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Tajuk Pemeriksaan <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={pemeriksaanSearch}
                  onChange={(e) => {
                    setPemeriksaanSearch(e.target.value)
                    setShowPemeriksaanDropdown(true)
                  }}
                  onFocus={() => setShowPemeriksaanDropdown(true)}
                  className="w-full px-4 py-3 border border-slate-600 bg-slate-800 bg-opacity-50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Cari nama pemeriksaan..."
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              {showPemeriksaanDropdown && filteredPemeriksaan.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                  {filteredPemeriksaan.map((item, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handlePemeriksaanSelect(item)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors text-white border-b border-slate-700 last:border-b-0"
                    >
                      <div className="font-medium">{item.NamaPemeriksaan}</div>
                      <div className="text-xs text-slate-400 mt-1">Tahun: {item.Tahun}</div>
                    </button>
                  ))}
                </div>
              )}
              
              {showPemeriksaanDropdown && filteredPemeriksaan.length === 0 && pemeriksaanSearch && (
                <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-4">
                  <p className="text-slate-400 text-sm">Tiada pemeriksaan dijumpai untuk &quot;{pemeriksaanSearch}&quot;</p>
                </div>
              )}
              
              <p className="text-xs text-slate-400 mt-2">
                📋 Senarai pemeriksaan untuk tahun {new Date().getFullYear()} dan {new Date().getFullYear() - 1} dari sistem MOE
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Nama Bahagian {formData.assigned_to_departments.length > 0 && (
                    <span className="text-blue-400 ml-2">({formData.assigned_to_departments.length} dipilih)</span>
                  )}
                </label>
                <div className="border border-slate-600 bg-slate-800 bg-opacity-50 rounded-lg overflow-hidden">
                  {/* Search input */}
                  <div className="p-3 border-b border-slate-600 bg-slate-900 bg-opacity-30">
                    <div className="relative">
                      <input
                        type="text"
                        value={departmentSearch}
                        onChange={(e) => setDepartmentSearch(e.target.value)}
                        placeholder="🔍 Cari bahagian..."
                        disabled={formData.assigned_to_jpns.length > 0}
                        className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      {departmentSearch && (
                        <button
                          type="button"
                          onClick={() => setDepartmentSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Checkbox list */}
                  <div className="max-h-56 overflow-y-auto p-4 space-y-2">
                    {filteredDepartments.length === 0 ? (
                      <p className="text-slate-400 text-sm">
                        {departmentSearch ? `Tiada bahagian dijumpai untuk "${departmentSearch}"` : 'Tiada bahagian tersedia'}
                      </p>
                    ) : (
                      filteredDepartments.map((dept) => (
                        <label 
                          key={dept.id} 
                          className="flex items-center gap-3 p-2 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.assigned_to_departments.includes(dept.id)}
                            onChange={() => handleDepartmentToggle(dept.id)}
                            disabled={formData.assigned_to_jpns.length > 0}
                            className="w-4 h-4 text-blue-500 bg-slate-700 border-slate-500 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span className={`text-sm ${formData.assigned_to_jpns.length > 0 ? 'text-slate-500' : 'text-white'}`}>
                            {dept.name} ({dept.code})
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Nama JPN {formData.assigned_to_jpns.length > 0 && (
                    <span className="text-blue-400 ml-2">({formData.assigned_to_jpns.length} dipilih)</span>
                  )}
                </label>
                <div className="border border-slate-600 bg-slate-800 bg-opacity-50 rounded-lg overflow-hidden">
                  {/* Search input */}
                  <div className="p-3 border-b border-slate-600 bg-slate-900 bg-opacity-30">
                    <div className="relative">
                      <input
                        type="text"
                        value={jpnSearch}
                        onChange={(e) => setJpnSearch(e.target.value)}
                        placeholder="🔍 Cari JPN..."
                        disabled={formData.assigned_to_departments.length > 0}
                        className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      {jpnSearch && (
                        <button
                          type="button"
                          onClick={() => setJpnSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Checkbox list */}
                  <div className="max-h-56 overflow-y-auto p-4 space-y-2">
                    {filteredJpns.length === 0 ? (
                      <p className="text-slate-400 text-sm">
                        {jpnSearch ? `Tiada JPN dijumpai untuk "${jpnSearch}"` : 'Tiada JPN tersedia'}
                      </p>
                    ) : (
                      filteredJpns.map((jpn) => (
                        <label 
                          key={jpn.id} 
                          className="flex items-center gap-3 p-2 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.assigned_to_jpns.includes(jpn.id)}
                            onChange={() => handleJPNToggle(jpn.id)}
                            disabled={formData.assigned_to_departments.length > 0}
                            className="w-4 h-4 text-blue-500 bg-slate-700 border-slate-500 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span className={`text-sm ${formData.assigned_to_departments.length > 0 ? 'text-slate-500' : 'text-white'}`}>
                            {jpn.name} ({jpn.state})
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-30 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-200 font-semibold mb-1">Nota:</p>
                  <p className="text-sm text-blue-300">Anda boleh pilih <strong>MULTIPLE (lebih daripada satu)</strong> Bahagian atau JPN untuk Perakuan Menteri ini. Pilih sama ada Bahagian ATAU JPN sahaja, bukan kedua-duanya.</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Syor (Perakuan Menteri) <span className="text-red-400">*</span>
              </label>
              <textarea
                name="syor_content"
                value={formData.syor_content}
                onChange={handleInputChange}
                rows={8}
                className="w-full px-4 py-3 border border-slate-600 bg-slate-800 bg-opacity-50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-vertical"
                placeholder="Masukkan kandungan lengkap Perakuan Menteri yang akan dihantar kepada bahagian/JPN yang dipilih..."
                required
              />
              <p className="text-xs text-slate-400 mt-2">
                Masukkan kandungan lengkap Perakuan Menteri yang akan dihantar kepada bahagian/JPN yang dipilih.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Keutamaan
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-600 bg-slate-800 bg-opacity-50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="rendah">Rendah</option>
                  <option value="sederhana">Sederhana</option>
                  <option value="tinggi">Tinggi</option>
                  <option value="kritikal">Kritikal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Jenis Pemeriksaan
                </label>
                <div className="w-full px-4 py-3 border border-slate-600 bg-slate-700 bg-opacity-50 rounded-lg text-slate-300">
                  {selectedJenisPemeriksaan || <span className="text-slate-500">Pilih tajuk pemeriksaan dahulu...</span>}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  📝 Jenis pemeriksaan akan auto-diisi berdasarkan tajuk pemeriksaan yang dipilih
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Jangkaan Tarikh Akhir Tindakan <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-600 bg-slate-800 bg-opacity-50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Tarikh Akhir Maklum Balas <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  name="response_deadline"
                  value={formData.response_deadline}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-600 bg-slate-800 bg-opacity-50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-200 font-semibold">Tarikh Syor:</p>
                  <p className="text-sm text-yellow-300">{new Date().toLocaleDateString('ms-MY')} (Hari ini)</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-8 border-t border-slate-700 border-opacity-30">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 hover:bg-opacity-30 transition-all transform hover:scale-105"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="cloudpeak-button px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Mencipta...
                  </div>
                ) : (
                  'Cipta Perakuan Menteri'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
