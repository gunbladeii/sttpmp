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
    assigned_to_department: '',
    assigned_to_jpn: '',
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
        setJpns(jpnData || [])

        // Fetch pemeriksaan data from MOE API
        try {
          const currentYear = new Date().getFullYear().toString()
          
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
          
          // Filter by current year
          const currentYearData = pemeriksaanData.filter((item: Pemeriksaan) => item.Tahun === currentYear)
          
          setPemeriksaanList(currentYearData)
          setFilteredPemeriksaan(currentYearData)
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
        throw new Error('Kandungan syor diperlukan')
      }
      
      if (!formData.assigned_to_department && !formData.assigned_to_jpn) {
        throw new Error('Sila pilih sama ada Bahagian atau JPN')
      }
      if (formData.assigned_to_department && formData.assigned_to_jpn) {
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
        assigned_to_department: formData.assigned_to_department || null,
        assigned_to_jpn: formData.assigned_to_jpn || null,
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

      const statusData = {
        syor_id: newSyor.id,
        department_id: formData.assigned_to_department || null,
        jpn_id: formData.assigned_to_jpn || null,
        status: 'belum_selesai' as const,
        weight: 0.0,
        comments: 'Syor baharu telah dicipta dan menunggu tindakan.',
        updated_by: user.id
      }

      console.log('Inserting status data:', statusData)

      const { error: statusError } = await supabase
        .from('status_tracking')
        .insert([statusData])

      if (statusError) {
        console.error('Status insert error:', statusError)
        throw new Error(`Gagal cipta status: ${statusError.message}`)
      }

      setSuccess('Syor berjaya dicipta!')
      
      setFormData({
        title: '',
        syor_content: '',
        assigned_to_department: '',
        assigned_to_jpn: '',
        priority: 'sederhana',
        pemeriksaan_type: 'mata_pelajaran',
        due_date: '',
        response_deadline: ''
      })

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

    if (name === 'assigned_to_department' && value) {
      setFormData(prev => ({ ...prev, assigned_to_jpn: '' }))
    } else if (name === 'assigned_to_jpn' && value) {
      setFormData(prev => ({ ...prev, assigned_to_department: '' }))
    }
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
          <h1 className="cloudpeak-title">Cipta Syor Baharu</h1>
          <p className="mt-3 text-slate-300 text-lg">Cipta syor perakuan menteri untuk bahagian atau JPN</p>
        </div>

        <div className="cloudpeak-card">
          <div className="px-8 py-6 border-b border-slate-700 border-opacity-30">
            <h2 className="text-xl font-medium text-white">Maklumat Syor</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
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
                📋 Senarai pemeriksaan untuk tahun {new Date().getFullYear()} dari sistem MOE
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Nama Bahagian
                </label>
                <select
                  name="assigned_to_department"
                  value={formData.assigned_to_department}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-600 bg-slate-800 bg-opacity-50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Pilih Bahagian</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Nama JPN
                </label>
                <select
                  name="assigned_to_jpn"
                  value={formData.assigned_to_jpn}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-600 bg-slate-800 bg-opacity-50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Pilih JPN</option>
                  {jpns.map((jpn) => (
                    <option key={jpn.id} value={jpn.id}>
                      {jpn.name} ({jpn.state})
                    </option>
                  ))}
                </select>
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
                  <p className="text-sm text-blue-300">Pilih sama ada Bahagian atau JPN untuk syor ini. Anda tidak boleh pilih kedua-duanya.</p>
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
                placeholder="Masukkan kandungan lengkap syor yang akan dihantar kepada bahagian/JPN yang dipilih..."
                required
              />
              <p className="text-xs text-slate-400 mt-2">
                Masukkan kandungan lengkap syor yang akan dihantar kepada bahagian/JPN yang dipilih.
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
                className="cloudpeak-button px-8 py-3 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Mencipta...
                  </div>
                ) : (
                  'Cipta Syor'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
