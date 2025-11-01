'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuthSimple'
import DashboardHeader from '@/components/DashboardHeader'
import { supabase } from '@/lib/supabase'

// Type definitions
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

// Sector options
const sectorOptions = [
  { value: 'SDP', label: 'SDP - Sektor Dasar dan Perancangan' },
  { value: 'SDTM', label: 'SDTM - Sektor Data dan Teknologi Maklumat' },
  { value: 'SSJK', label: 'SSJK - Sektor Standard dan Jaminan Kualiti' },
  { value: 'SPK', label: 'SPK - Sektor Penaziran Kurikulum' },
  { value: 'SPHEMK', label: 'SPHEMK - Sektor Penaziran Hal Ehwal Murid & Kokurikulum' },
  { value: 'SPIP', label: 'SPIP - Sektor Penaziran Institusi Pendidikan' }
]

export default function CreateAdminPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
    department_id: '',
    jpn_id: '',
    sector: ''
  })
  const [departments, setDepartments] = useState<Department[]>([])
  const [jpnList, setJpnList] = useState<JPN[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch departments and JPN data
  useEffect(() => {
    fetchDepartments()
    fetchJPN()
  }, [])

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, code')
      .order('name')

    if (!error) {
      setDepartments(data || [])
    }
  }

  const fetchJPN = async () => {
    const { data, error } = await supabase
      .from('jpn')
      .select('id, name, state')
      .order('name')

    if (!error) {
      setJpnList(data || [])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      }
      
      // Reset dependent fields when role changes
      if (name === 'role') {
        updated.department_id = ''
        updated.jpn_id = ''
        updated.sector = ''
      }
      
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Kata laluan tidak sepadan')
      return
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('Kata laluan mestilah sekurang-kurangnya 6 aksara')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || ''
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          department_id: formData.department_id || null,
          jpn_id: formData.jpn_id || null,
          sector: formData.sector || null
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess('Pengguna admin berjaya dicipta!')
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'admin',
          department_id: '',
          jpn_id: '',
          sector: ''
        })
      } else {
        setError(result.error || 'Gagal mencipta pengguna admin')
      }
    } catch (err) {
      setError('Ralat semasa mencipta pengguna admin')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%)' }}>
      <DashboardHeader />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="cloudpeak-title">Cipta Pengguna Admin</h1>
          <p className="mt-3 text-slate-300 text-lg">Tambah pengguna admin baharu ke dalam sistem</p>
        </div>

        <div className="cloudpeak-card max-w-2xl">
          <div className="px-8 py-6 border-b border-slate-700/30">
            <h2 className="text-xl font-medium text-white">Maklumat Pengguna Admin</h2>
          </div>
          
          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-500/20 border border-red-500/30 text-red-300 px-6 py-4 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-500/20 border border-green-500/30 text-green-300 px-6 py-4 rounded-lg">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Nama Penuh
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400"
                  placeholder="Masukkan nama penuh"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Alamat Emel
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400"
                  placeholder="contoh@moe.gov.my"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Peranan
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                >
                  <option value="admin">Admin</option>
                  <option value="peneraju_pemeriksaan">Peneraju Pemeriksaan</option>
                  <option value="penyelaras_bahagian">Penyelaras Bahagian</option>
                  <option value="penyelaras_jpn">Penyelaras JPN</option>
                  <option value="pemantau">Pemantau</option>
                </select>
              </div>

              {/* Dynamic dropdown based on role */}
              {formData.role === 'penyelaras_bahagian' && (
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Bahagian
                  </label>
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  >
                    <option value="">Pilih Bahagian</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.role === 'penyelaras_jpn' && (
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    JPN
                  </label>
                  <select
                    name="jpn_id"
                    value={formData.jpn_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  >
                    <option value="">Pilih JPN</option>
                    {jpnList.map(jpn => (
                      <option key={jpn.id} value={jpn.id}>
                        {jpn.name} ({jpn.state})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.role === 'peneraju_pemeriksaan' && (
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Sektor
                  </label>
                  <select
                    name="sector"
                    value={formData.sector}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  >
                    <option value="">Pilih Sektor</option>
                    {sectorOptions.map(sector => (
                      <option key={sector.value} value={sector.value}>
                        {sector.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Kata Laluan
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400"
                    placeholder="Minimum 6 aksara"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Sahkan Kata Laluan
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400"
                    placeholder="Ulang kata laluan"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-all transform hover:scale-105"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isLoading ? 'Mencipta...' : 'Cipta Pengguna Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}