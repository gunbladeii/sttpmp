'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuthSimple'
import DashboardHeader from '@/components/DashboardHeader'
import DocumentUpload from '@/components/DocumentUpload'
import DocumentList from '@/components/DocumentList'
import { getStatusColor, formatDate, getStatusText, capitalizeWords } from '@/lib/utils'

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
}

interface Document {
  id: string
  fileName: string
  fileSize: number
  googleDriveLink: string
  uploadedAt: string
  uploader?: {
    name: string
  }
}

interface SyorDetail {
  id: string
  title: string
  description: string
  priority: string
  pemeriksaan_type?: string
  due_date?: string
  response_deadline?: string
  created_by?: string
  assigned_to_department?: string | null
  assigned_to_jpn?: string | null
  created_at?: string
  creator?: { name?: string }
  department?: { name?: string; code?: string } | null
  jpn?: { name?: string; state?: string } | null
  departments?: Array<{ id?: string; name?: string; code?: string }>
  jpns?: Array<{ id?: string; name?: string; state?: string }>
  status_tracking?: Array<{
    id?: string
    status?: string
    weight?: number
    comments?: string
    updated_at?: string
    updater?: { name?: string }
  }>
}

export default function SyorDetailsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const syorId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : ''

  const [syor, setSyor] = useState<SyorDetail | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [jpns, setJpns] = useState<JPN[]>([])
  const [pemeriksaanList, setPemeriksaanList] = useState<Pemeriksaan[]>([])
  const [filteredPemeriksaan, setFilteredPemeriksaan] = useState<Pemeriksaan[]>([])
  const [pemeriksaanSearch, setPemeriksaanSearch] = useState('')
  const [showPemeriksaanDropdown, setShowPemeriksaanDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form data for editing
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: '',
    pemeriksaan_type: '',
    due_date: '',
    response_deadline: '',
    assigned_to_department: '',
    assigned_to_jpn: '',
    tindakan_comments: '',
    tindakan_status: 'belum_selesai'
  })

  // Fetch syor details
  useEffect(() => {
    async function fetchSyorDetails() {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('syor')
          .select(`
            *,
            creator:created_by(name),
            department:assigned_to_department(name, code),
            jpn:assigned_to_jpn(name, state),
            status_tracking(
              id,
              status,
              weight,
              comments,
              updated_at,
              assigned_department:department_id(id, name, code),
              assigned_jpn:jpn_id(id, name, state),
              updater:updated_by(
                name,
                department:department_id(name, code),
                jpn:jpn_id(name, state),
                sector
              )
            )
          `)
          .eq('id', syorId)
          .maybeSingle()

        if (fetchError) {
          console.error('Syor fetch error:', fetchError, 'Data:', data, 'SyorId:', syorId)
          throw new Error(fetchError?.message || 'Syor tidak dijumpai atau data tidak lengkap')
        }
        if (!data) {
          setSyor(null);
          setError('Syor tidak dijumpai. Data mungkin telah dipadam atau tidak lengkap.');
          return;
        }

        // Sort status_tracking to get the latest first
        const sortedStatusTracking = Array.isArray(data.status_tracking)
          ? data.status_tracking.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())
          : [];

        const latestStatusData = sortedStatusTracking?.[0] || {};

        // Extract assigned departments and JPNs from status_tracking (NEW - support multiple assignments)
        const assignedDepartments = sortedStatusTracking
          .filter((st: any) => st.assigned_department)
          .map((st: any) => st.assigned_department)
          .filter((dept: any, index: number, self: any[]) => 
            index === self.findIndex((d: any) => d?.id === dept?.id)
          ); // Remove duplicates

        const assignedJPNs = sortedStatusTracking
          .filter((st: any) => st.assigned_jpn)
          .map((st: any) => st.assigned_jpn)
          .filter((jpn: any, index: number, self: any[]) => 
            index === self.findIndex((j: any) => j?.id === jpn?.id)
          ); // Remove duplicates

        setSyor({
          ...data,
          title: data.title || '-',
          description: data.description || '-',
          priority: data.priority || '-',
          pemeriksaan_type: data.pemeriksaan_type || '-',
          due_date: data.due_date || '-',
          response_deadline: data.response_deadline || '-',
          assigned_to_department: data.assigned_to_department || '-',
          assigned_to_jpn: data.assigned_to_jpn || '-',
          creator: data.creator || { name: '-' },
          // Use first assigned department/JPN for backward compatibility with single-value display
          department: assignedDepartments[0] || { name: '-', code: '-' },
          jpn: assignedJPNs[0] || { name: '-', state: '-' },
          // Store multiple assignments for new multi-display
          departments: assignedDepartments,
          jpns: assignedJPNs,
          status_tracking: sortedStatusTracking
        });
        setFormData({
          title: data.title || '',
          description: data.description || '',
          priority: data.priority || '',
          pemeriksaan_type: data.pemeriksaan_type || '',
          due_date: data.due_date || '',
          response_deadline: data.response_deadline || '',
          assigned_to_department: assignedDepartments[0]?.id || '',
          assigned_to_jpn: assignedJPNs[0]?.id || '',
          tindakan_comments: latestStatusData?.comments || '',
          tindakan_status: latestStatusData?.status || ''
        });
        setPemeriksaanSearch(data.title || '-')

      } catch (err) {
        console.error('Error fetching syor details:', err)
        setError(err instanceof Error ? err.message : 'Ralat memuat syor: ' + String(err))
      } finally {
        setLoading(false)
      }
    }

    if (syorId) {
      fetchSyorDetails()
      fetchDocuments()
    }
  }, [syorId])

  // Fetch documents for this syor
  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/syor/${syorId}/documents`);
      const result = await response.json();

      // Always set documents even if response not ok (API returns empty array on error)
      setDocuments(result.documents || [])

    } catch (error) {
      console.error('Error fetching documents:', error)
      setDocuments([]) // Set empty array on fetch failure
    }
  }

  // Fetch departments and JPNs for editing
  useEffect(() => {
    async function fetchOptions() {
      try {
        // Fetch departments
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('id, name, code')
          .order('name')

        if (deptError) throw deptError
        setDepartments(deptData || [])

        // Fetch JPNs
        const { data: jpnData, error: jpnError } = await supabase
          .from('jpn')
          .select('id, name, state')
          .order('name')

        if (jpnError) throw jpnError
        setJpns(jpnData || [])

        // Fetch pemeriksaan data from MOE API
        try {
          const currentYear = new Date().getFullYear().toString()
          const response = await fetch('https://enazir.moe.gov.my/APIcall.php/tknamapemeriksaan')
          
          if (!response.ok) {
            throw new Error('Failed to fetch pemeriksaan data')
          }

          const data = await response.json()
          
          // Filter by current year
          const currentYearData = data.filter((item: Pemeriksaan) => item.Tahun === currentYear)
          
          setPemeriksaanList(currentYearData)
          setFilteredPemeriksaan(currentYearData)
        } catch (apiError) {
          console.error('Error fetching pemeriksaan:', apiError)
        }

      } catch (error) {
        console.error('Error fetching options:', error)
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

  const handlePemeriksaanSelect = (namaPemeriksaan: string) => {
    setFormData({ ...formData, title: namaPemeriksaan })
    setPemeriksaanSearch(namaPemeriksaan)
    setShowPemeriksaanDropdown(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear the other assignment field when one is selected
    if (name === 'assigned_to_department' && value) {
      setFormData(prev => ({ ...prev, assigned_to_jpn: '' }))
    } else if (name === 'assigned_to_jpn' && value) {
      setFormData(prev => ({ ...prev, assigned_to_department: '' }))
    }
  }

  const handleRichTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML
    setFormData(prev => ({ ...prev, description: content }))
  }

  const handleSave = async () => {
    if (!user || !syor) return

    setSaving(true)
    setError(null)
    setSuccess('')

    try {
      console.log('🔄 Starting save process...', { user: user.email, role: user.role });

      // Validate required fields
      if (!formData.title?.trim()) {
        throw new Error('Tajuk syor tidak boleh kosong');
      }
      if (!formData.description?.trim()) {
        throw new Error('Huraian syor tidak boleh kosong');
      }
      if (!formData.priority) {
        throw new Error('Prioriti mesti dipilih');
      }
      if (!formData.pemeriksaan_type) {
        throw new Error('Nama pemeriksaan mesti dipilih');
      }
      if (!formData.due_date) {
        throw new Error('Tarikh akhir tindakan mesti diisi');
      }
      if (!formData.response_deadline) {
        throw new Error('Tarikh maklum balas mesti diisi');
      }
      // Check if syor has assignments (via status_tracking)
      if (!syor.departments?.length && !syor.jpns?.length) {
        throw new Error('Syor mesti diassign kepada Bahagian atau JPN');
      }

      // Check permissions - use the canEdit constant defined earlier
      // (already fixed to check departments/jpns arrays)
      if (!canEdit && !canEditTindakan) {
        throw new Error('Anda tidak mempunyai kebenaran untuk mengedit syor ini')
      }

      console.log('✅ Permission check passed');

      // Date validation
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset to start of day for fair comparison
      
      const dueDate = new Date(formData.due_date)
      const responseDeadline = new Date(formData.response_deadline)
      dueDate.setHours(0, 0, 0, 0)
      responseDeadline.setHours(0, 0, 0, 0)

      // Validate response_deadline <= due_date
      if (responseDeadline > dueDate) {
        setError('Tarikh maklum balas mesti sebelum atau sama dengan tarikh akhir tindakan.');
        setSaving(false);
        return;
      }

      // Only non-admins are blocked from editing if dates are in the past
      if (user.role !== 'admin' && user.role !== 'peneraju_pemeriksaan') {
        if (dueDate < today || responseDeadline < today) {
          setError('Tarikh akhir tindakan atau tarikh maklum balas sudah lepas. Sila hubungi admin untuk ubah tarikh.');
          setSaving(false);
          return;
        }
      }

      // Admin and peneraju can edit even if dates are in the past, but we warn them
      if ((user.role === 'admin' || user.role === 'peneraju_pemeriksaan') && (dueDate < today || responseDeadline < today)) {
        console.warn('⚠️ Admin editing past dates:', {
          due_date: formData.due_date,
          response_deadline: formData.response_deadline
        });
      }

      // Update syor basic info (only admin/peneraju can edit)
      if (user.role === 'admin' || user.role === 'peneraju_pemeriksaan') {
        console.log('📝 Updating syor data...', {
          title: formData.title.substring(0, 50),
          pemeriksaan_type: formData.pemeriksaan_type,
          due_date: formData.due_date,
          response_deadline: formData.response_deadline
        });

        const syorData = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          priority: formData.priority,
          pemeriksaan_type: formData.pemeriksaan_type,
          due_date: formData.due_date,
          response_deadline: formData.response_deadline,
          // Keep deprecated columns as NULL (assignments now in status_tracking)
          assigned_to_department: null,
          assigned_to_jpn: null,
          updated_at: new Date().toISOString()
        }

        const { error: syorError, data: syorResult } = await supabase
          .from('syor')
          .update(syorData)
          .eq('id', syorId)
          .select()

        if (syorError) {
          console.error('❌ Syor update error:', syorError);
          throw new Error(`Ralat update syor: ${syorError.message}. ${syorError.hint || ''}`);
        }

        console.log('✅ Syor updated successfully:', syorResult);
      }

      // Update status tracking (only penyelaras can update)
      if (canEditTindakan && formData.tindakan_comments.trim()) {
        const statusEnum = ['belum_selesai', 'dalam_tindakan', 'selesai']
        const safeStatus = statusEnum.includes(formData.tindakan_status) ? formData.tindakan_status : 'belum_selesai'

        const statusData = {
          status: safeStatus,
          weight: safeStatus === 'belum_selesai' ? 0 : safeStatus === 'dalam_tindakan' ? 0.5 : 1,
          comments: formData.tindakan_comments.trim(),
          updated_by: user.id,
          updated_at: new Date().toISOString()
        }

        // Always INSERT a new record to preserve full history trail
        const { error: statusError } = await supabase
          .from('status_tracking')
          .insert([{
            syor_id: syorId,
            department_id: user.role === 'penyelaras_bahagian' ? user.department_id : null,
            jpn_id: user.role === 'penyelaras_jpn' ? user.jpn_id : null,
            ...statusData
          }])

        if (statusError) throw statusError
      }

      setSuccess('Syor berjaya dikemas kini!')
      setError(null)
      setIsEditing(false)
      
      console.log('✅ Save completed successfully');

      // Refresh data
      setTimeout(() => {
        window.location.reload();
      }, 1000)

    } catch (err) {
      console.error('💥 Save error (raw):', err);
      console.error('💥 Error type:', typeof err);
      console.error('💥 Error constructor:', err?.constructor?.name);
      console.error('💥 Error keys:', err ? Object.keys(err) : 'null');
      console.error('💥 Error stringified:', JSON.stringify(err, null, 2));
      
      let errorMessage = 'Ralat tidak diketahui';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object') {
        // Handle Supabase errors or other object errors
        const errObj = err as any;
        if (errObj.message) {
          errorMessage = errObj.message;
        } else if (errObj.error) {
          errorMessage = typeof errObj.error === 'string' ? errObj.error : JSON.stringify(errObj.error);
        } else if (errObj.details) {
          errorMessage = errObj.details;
        } else {
          errorMessage = JSON.stringify(err);
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else {
        errorMessage = String(err);
      }
      
      setError('Ralat menyimpan: ' + errorMessage);
      setSuccess('');
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteHistory = async (statusId: string) => {
    if (!user || !canDeleteHistory) return
    
    if (!confirm('Adakah anda pasti untuk memadam rekod sejarah tindakan ini?')) {
      return
    }

    setDeleting(statusId)
    console.log('🗑️ Attempting to delete status_tracking record:', statusId)
    console.log('🔐 User role:', user.role)
    console.log('🔐 User ID:', user.id)
    
    try {
      // Call API route to delete (service role bypasses RLS)
      const response = await fetch(`/api/status-tracking/${statusId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      console.log('🗑️ Delete API response:', { 
        status: response.status, 
        ok: response.ok,
        result 
      })

      if (!response.ok) {
        console.error('❌ Delete failed:', result)
        throw new Error(result.error || 'Gagal memadam rekod sejarah tindakan')
      }

      console.log('✅ Status tracking deleted successfully')
      setSuccess('Rekod sejarah tindakan berjaya dipadam!')
      
      // Refresh data after short delay
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (err) {
      console.error('❌ Delete error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Ralat tidak diketahui'
      setError(`Ralat memadam rekod: ${errorMessage}`)
    } finally {
      setDeleting(null)
    }
  }

  // Document upload handlers
  const handleDocumentUpload = (document: Document) => {
    setDocuments(prev => [document, ...prev])
    setSuccess('Dokumen berjaya dimuat naik!')
  }

  const handleDocumentDeleted = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId))
    setSuccess('Dokumen berjaya dipadam!')
  }

  // Delete syor handler (admin-only)
  const handleDeleteSyor = async () => {
    if (!user || !syor || user.role !== 'admin') {
      setError('Hanya admin boleh memadam Perakuan Menteri')
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      console.log('🗑️ Deleting syor:', syorId)

      const response = await fetch(`/api/syor/${syorId}?userEmail=${encodeURIComponent(user.email)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ Delete failed:', result)
        throw new Error(result.error || 'Gagal memadam Perakuan Menteri')
      }

      console.log('✅ Syor deleted successfully:', result)
      
      // Redirect to syor list page after successful deletion
      setSuccess('Perakuan Menteri berjaya dipadam! Mengalihkan ke senarai Perakuan Menteri...')
      setTimeout(() => {
        router.push('/syor')
      }, 1500)

    } catch (err) {
      console.error('❌ Delete syor error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Ralat tidak diketahui'
      setError(`Ralat memadam Perakuan Menteri: ${errorMessage}`)
      setShowDeleteConfirm(false)
      setIsDeleting(false)
    }
  }

  const canEdit = Boolean(
    user && syor && (
      user.role === 'admin' ||
      user.role === 'peneraju_pemeriksaan' ||
      (user.role === 'penyelaras_bahagian' && syor.departments?.some(dept => dept?.id === user.department_id)) ||
      (user.role === 'penyelaras_jpn' && syor.jpns?.some(jpn => jpn?.id === user.jpn_id))
    )
  )

  const canEditBasicInfo = Boolean(user && (user.role === 'admin' || user.role === 'peneraju_pemeriksaan'))

  const canEditTindakan = Boolean(
    user && syor && (
      user.role === 'admin' ||
      user.role === 'peneraju_pemeriksaan' ||
      (user.role === 'penyelaras_bahagian' && syor.departments?.some(dept => dept?.id === user.department_id)) ||
      (user.role === 'penyelaras_jpn' && syor.jpns?.some(jpn => jpn?.id === user.jpn_id))
    )
  )

  const canUploadDocuments = Boolean(
    user && syor && (
      user.role === 'admin' ||
      user.role === 'peneraju_pemeriksaan' ||
      (user.role === 'penyelaras_bahagian' && syor.departments?.some(dept => dept?.id === user.department_id)) ||
      (user.role === 'penyelaras_jpn' && syor.jpns?.some(jpn => jpn?.id === user.jpn_id))
    )
  )

  const canDeleteHistory = Boolean(user && (user.role === 'admin' || user.role === 'peneraju_pemeriksaan'))

  // Read-only indicator for penyelaras_jnn
  // Removed unused variable isReadOnly

  // Check authentication - redirect if no user
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('Redirecting to login - no user found')
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Show loading if either auth is loading or data is loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-300 text-lg">
            {authLoading ? 'Mengesahkan pengguna...' : 'Memuat butiran Perakuan Menteri...'}
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
            <h3 className="text-xl font-bold text-white mb-3">Ralat Memuat Syor</h3>
            <p className="text-slate-300 mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="cloudpeak-button px-6 py-3 rounded-lg transition-all"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!syor) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%)' }}>
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-4">Syor Tidak Dijumpai</h3>
          <button
            onClick={() => router.back()}
            className="cloudpeak-button px-6 py-3 rounded-lg transition-all"
          >
            Kembali
          </button>
        </div>
      </div>
    )
  }

  // Get the latest status by sorting by updated_at descending
  const latestStatus = Array.isArray(syor.status_tracking)
    ? [...syor.status_tracking].sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())[0]
    : undefined

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%)' }}>
      <DashboardHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="mb-6 text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Kembali ke Senarai Perakuan Menteri
              </button>
              <h1 className="text-4xl font-bold cloudpeak-title mb-3">Butiran Perakuan Menteri</h1>
              <p className="text-slate-300 text-lg">
                Dicipta pada {formatDate(syor.created_at)} oleh {syor.creator?.name}
              </p>
            </div>
            
            {canEdit && (
              <div className="flex gap-3">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="cloudpeak-button px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105"
                    >
                      Edit Perakuan Menteri
                    </button>
                    {/* Admin-only delete button */}
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all transform hover:scale-105"
                        title="Hanya admin boleh memadam Perakuan Menteri"
                      >
                        🗑️ Padam Perakuan Menteri
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 border border-slate-500 text-slate-300 rounded-lg hover:bg-slate-600/30 transition-all font-medium"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="cloudpeak-button px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 transition-all transform hover:scale-105"
                    >
                      {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-green-300 text-sm">{success}</p>
            </div>
          )}

          {/* Main Content */}
          <div className="cloudpeak-card rounded-xl overflow-hidden">
            {/* Status Header */}
            <div className="px-8 py-6 bg-slate-700/30 border-b border-slate-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span 
                    className={`cloudpeak-badge px-4 py-2 text-sm font-medium rounded-full ${getStatusColor(latestStatus?.status || 'belum_selesai')}`}
                  >
                    {getStatusText(latestStatus?.status || 'belum_selesai')}
                  </span>
                  <span className="text-sm text-slate-400">
                    Wajaran: <span className="text-white font-medium">{latestStatus?.weight || 0}</span>
                  </span>
                </div>
                <div className="text-sm text-slate-400">
                  ID: <span className="text-white font-mono">{syor.id}</span>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Nama Pemeriksaan
                </label>
                {isEditing && canEditBasicInfo ? (
                  <div className="relative">
                    <input
                      type="text"
                      value={pemeriksaanSearch}
                      onChange={(e) => {
                        setPemeriksaanSearch(e.target.value)
                        setShowPemeriksaanDropdown(true)
                      }}
                      onFocus={() => setShowPemeriksaanDropdown(true)}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400"
                      placeholder="Cari nama pemeriksaan..."
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    
                    {showPemeriksaanDropdown && filteredPemeriksaan.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                        {filteredPemeriksaan.map((item, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handlePemeriksaanSelect(item.NamaPemeriksaan)}
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
                  </div>
                ) : (
                  <h2 className="text-2xl font-bold text-white">{!syor.title || syor.title === '-' ? 'Tidak Berkaitan' : syor.title}</h2>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Kandungan Syor (Perakuan Menteri)
                </label>
                {isEditing && canEditBasicInfo ? (
                  <textarea
                    name="description"
                    value={formData.description.replace(/<[^>]+>/g, '')}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full min-h-32 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white focus:outline-none rich-text-content"
                    placeholder="Masukkan kandungan syor..."
                  />
                ) : (
                  <div 
                    className="rich-text-content bg-slate-700/30 p-6 rounded-lg leading-relaxed"
                    style={{ color: '#cbd5e1 !important' }}
                    dangerouslySetInnerHTML={{ __html: (!syor.description || syor.description === '-' || syor.description === '<p>-</p>' || syor.description === '<p></p>' || syor.description.trim() === '') ? '<p>Tidak Berkaitan</p>' : syor.description }}
                  />
                )}
              </div>

              {/* Assignment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Bahagian
                  </label>
                  {isEditing && canEditBasicInfo ? (
                    <select
                      name="assigned_to_department"
                      value={formData.assigned_to_department}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    >
                      <option value="">Pilih Bahagian</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-slate-300 text-lg">
                      {syor.departments && syor.departments.length > 0 ? (
                        <div className="space-y-2">
                          {syor.departments.map((dept: any, index: number) => (
                            <div key={dept.id || index} className="flex items-center gap-2">
                              <span className="text-blue-400">•</span>
                              <span>{dept.name} ({dept.code})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>Tidak Berkaitan</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    JPN
                  </label>
                  {isEditing && canEditBasicInfo ? (
                    <select
                      name="assigned_to_jpn"
                      value={formData.assigned_to_jpn}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    >
                      <option value="">Pilih JPN</option>
                      {jpns.map((jpn) => (
                        <option key={jpn.id} value={jpn.id}>
                          {jpn.name} ({jpn.state})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-slate-300 text-lg">
                      {syor.jpns && syor.jpns.length > 0 ? (
                        <div className="space-y-2">
                          {syor.jpns.map((jpn: any, index: number) => (
                            <div key={jpn.id || index} className="flex items-center gap-2">
                              <span className="text-blue-400">•</span>
                              <span>{jpn.name} ({jpn.state})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>Tidak Berkaitan</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Priority and Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Keutamaan
                  </label>
                  {isEditing && canEditBasicInfo ? (
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    >
                      <option value="rendah">Rendah</option>
                      <option value="sederhana">Sederhana</option>
                      <option value="tinggi">Tinggi</option>
                      <option value="kritikal">Kritikal</option>
                    </select>
                  ) : (
                    <span className={`cloudpeak-badge px-4 py-2 text-sm font-medium rounded-full ${
                      syor.priority === 'kritikal' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                      syor.priority === 'tinggi' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                      syor.priority === 'sederhana' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                      'bg-green-500/20 text-green-300 border-green-500/30'
                    }`}>
                      {!syor.priority || syor.priority === '-' ? 'Tidak Berkaitan' : capitalizeWords(syor.priority)}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Jenis Pemeriksaan
                  </label>
                  {isEditing && canEditBasicInfo ? (
                    <select
                      name="pemeriksaan_type"
                      value={formData.pemeriksaan_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    >
                      <option value="mata_pelajaran">Mata Pelajaran</option>
                      <option value="keciciran_murid">Keciciran Murid</option>
                      <option value="infrastruktur">Infrastruktur</option>
                      <option value="kualiti_guru">Kualiti Guru</option>
                      <option value="kurikulum">Kurikulum</option>
                    </select>
                  ) : (
                    <p className="text-slate-300 text-lg">
                      {!syor.pemeriksaan_type || syor.pemeriksaan_type === '-' ? 'Tidak Berkaitan' : capitalizeWords(syor.pemeriksaan_type.replace('_', ' '))}
                    </p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Jangkaan Tarikh Akhir Tindakan
                  </label>
                  {isEditing && canEditBasicInfo ? (
                    <input
                      type="date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    />
                  ) : (
                    <p className="text-slate-300 text-lg">{!syor.due_date || syor.due_date === '-' ? 'Tidak Berkaitan' : formatDate(syor.due_date)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Tarikh Akhir Maklum Balas
                  </label>
                  {isEditing && canEditBasicInfo ? (
                    <input
                      type="date"
                      name="response_deadline"
                      value={formData.response_deadline}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    />
                  ) : (
                    <p className="text-slate-300 text-lg">{!syor.response_deadline || syor.response_deadline === '-' ? 'Tidak Berkaitan' : formatDate(syor.response_deadline)}</p>
                  )}
                </div>
              </div>

              {/* Action Section - For Penyelaras */}
              {(canEdit || canEditTindakan) && (
                <div className="border-t border-slate-700/30 pt-8">
                  <h3 className="text-xl font-semibold text-white mb-6">
                    Tindakan & Maklum Balas
                    {!canEditTindakan && (
                      <span className="ml-2 text-sm text-slate-400 font-normal">
                        (Hanya Penyelaras boleh mengedit)
                      </span>
                    )}
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Status Selection */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-3">
                        Status Tindakan
                      </label>
                      {isEditing && canEditTindakan ? (
                        <select
                          name="tindakan_status"
                          value={formData.tindakan_status}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                        >
                          <option value="belum_selesai">Belum Selesai</option>
                          <option value="dalam_tindakan">Dalam Tindakan</option>
                          <option value="selesai">Selesai</option>
                        </select>
                      ) : (
                        <span 
                          className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(latestStatus?.status || 'belum_selesai')}`}
                        >
                          {getStatusText(latestStatus?.status || 'belum_selesai')}
                        </span>
                      )}
                    </div>

                    {/* Comments */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-3">
                        Maklum Balas Tindakan
                      </label>
                      {isEditing && canEditTindakan ? (
                        <textarea
                          name="tindakan_comments"
                          value={formData.tindakan_comments}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400"
                          placeholder="Masukkan maklum balas tindakan yang telah diambil..."
                        />
                      ) : (
                        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/30">
                          <p className="text-slate-200">
                            {!latestStatus?.comments || latestStatus.comments === '-' ? 'Tidak Berkaitan' : latestStatus.comments}
                          </p>
                          {latestStatus?.updated_at && (
                            <p className="text-sm text-slate-400 mt-2">
                              Dikemas kini pada {formatDate(latestStatus.updated_at)} oleh {latestStatus.updater?.name}
                            </p>
                          )}
                        </div>
                      )}
                      {!canEditTindakan && (
                        <p className="text-xs text-amber-300 mt-1">
                          💡 Hanya penyelaras bahagian/JPN yang ditugaskan boleh mengedit maklum balas tindakan
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Document Section */}
              <div className="border-t border-slate-700/30 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    Dokumen Sokongan
                  </h3>
                  {canUploadDocuments && !isEditing && (
                    <span className="text-sm text-blue-400">
                      Boleh muat naik dokumen PDF
                    </span>
                  )}
                </div>

                {/* Upload section for penyelaras */}
                {canUploadDocuments && (
                  <div className="mb-6">
                    <DocumentUpload
                      syorId={syorId}
                      onUploadSuccess={handleDocumentUpload}
                      disabled={isEditing}
                    />
                  </div>
                )}

                {/* Document list */}
                <DocumentList
                  documents={documents}
                  onDocumentDeleted={handleDocumentDeleted}
                  canDelete={user?.role === 'admin'}
                />
              </div>

              {/* Status History */}
              {syor.status_tracking && syor.status_tracking.length > 0 && (
                <div className="border-t border-slate-700/30 pt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">Sejarah Tindakan</h3>
                    {canDeleteHistory && (
                      <p className="text-xs text-slate-400">
                        Klik ikon 🗑️ untuk memadam rekod
                      </p>
                    )}
                  </div>
                  <div className="space-y-4">
                    {syor.status_tracking.map((status) => (
                      <div key={status.id} className="flex items-start gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
                        <div className="flex-shrink-0">
                          <span 
                            className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(status.status)}`}
                          >
                            {getStatusText(status.status)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-200">{status.comments}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDate(status.updated_at)} oleh {status.updater?.name}
                            {(() => {
                              if (status.updater?.department) {
                                return ` dari ${status.updater.department.name} (${status.updater.department.code})`
                              }
                              if (status.updater?.jpn) {
                                return ` dari ${status.updater.jpn.name}`
                              }
                              if (status.updater?.sector) {
                                return ` dari ${status.updater.sector}`
                              }
                              return ''
                            })()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-gray-500">
                            Wajaran: {status.weight}
                          </div>
                          {canDeleteHistory && (
                            <button
                              onClick={() => handleDeleteHistory(status.id)}
                              disabled={deleting === status.id}
                              className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded"
                              title="Padam rekod sejarah"
                            >
                              {deleting === status.id ? (
                                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/20 rounded-full">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Padam Syor?</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-slate-300 mb-2">
                Adakah anda pasti untuk memadam Perakuan Menteri ini?
              </p>
              <p className="text-sm text-red-400 font-medium">
                ⚠️ Tindakan ini tidak boleh dibatalkan!
              </p>
              <div className="mt-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                <p className="text-sm text-slate-400">Perakuan Menteri yang akan dipadam:</p>
                <p className="text-white font-medium mt-1">{syor?.title}</p>
              </div>
              <div className="mt-3 text-xs text-slate-400">
                <p>Data yang akan dipadam:</p>
                <ul className="list-disc list-inside ml-2 mt-1">
                  <li>Perakuan Menteri ini</li>
                  <li>Semua sejarah tindakan</li>
                  <li>Semua notifikasi berkaitan</li>
                  <li>Semua dokumen berkaitan</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 border border-slate-500 text-slate-300 rounded-lg hover:bg-slate-600/30 transition-all font-medium disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteSyor}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Memadam...
                  </>
                ) : (
                  <>
                    🗑️ Ya, Padam
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}