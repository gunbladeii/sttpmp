export type StatusType = 'belum_selesai' | 'dalam_tindakan' | 'selesai'
export type PriorityType = 'rendah' | 'sederhana' | 'tinggi' | 'kritikal'
export type RoleType = 'admin' | 'peneraju_pemeriksaan' | 'penyelaras_bahagian' | 'penyelaras_jpn' | 'pemantau'
export type PemeriksaanType = 'mata_pelajaran' | 'keciciran_murid' | 'infrastruktur' | 'kualiti_guru' | 'kurikulum'

export interface User {
  id: string
  email: string
  name: string
  role: RoleType
  department_id?: string
  jpn_id?: string
  password_hash?: string
  password_plain?: string // For admin reference only
  email_verified: boolean
  is_active: boolean
  is_approved: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

export interface RegistrationRequest {
  id: string
  email: string
  name: string
  password_hash: string
  password_plain: string // For admin reference
  department_id?: string
  jpn_id?: string
  requested_at: string
  approved_at?: string
  rejected_at?: string
  approved_by?: string
  rejection_reason?: string
  verification_token?: string
  email_verified: boolean
  created_at: string
  updated_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  name: string
  password: string
  confirmPassword: string
  department_id?: string
  jpn_id?: string
}

export interface Department {
  id: string
  name: string
  code: string
  contact_person: string
  email: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface JPN {
  id: string
  name: string
  state: string
  contact_person: string
  email: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface Syor {
  id: string
  title: string
  description: string
  priority: PriorityType
  pemeriksaan_type: PemeriksaanType
  due_date: string
  response_deadline: string
  created_by: string
  assigned_by?: string
  assigned_to_department?: string
  assigned_to_jpn?: string
  document_url?: string
  endorsement_date?: string
  is_overdue: boolean
  created_at: string
  updated_at: string
  
  // Relations
  creator?: User
  assigner?: User
  department?: Department
  jpn?: JPN
  status_tracking?: StatusTracking[]
}

export interface StatusTracking {
  id: string
  syor_id: string
  department_id?: string
  jpn_id?: string
  status: StatusType
  weight: number
  comments?: string
  updated_by: string
  created_at: string
  updated_at: string
  
  // Relations
  syor?: Syor
  department?: Department
  jpn?: JPN
  updater?: User
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'deadline' | 'status_update' | 'new_syor' | 'system'
  read: boolean
  syor_id?: string
  created_at: string
  
  // Relations
  user?: User
  syor?: Syor
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  table_name: string
  record_id: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  created_at: string
  
  // Relations
  user?: User
}

// Dashboard Analytics Types
export interface DashboardStats {
  total_syor: number
  selesai: number
  dalam_tindakan: number
  belum_selesai: number
  overdue: number
  avg_completion_time: number
  department_performance: DepartmentPerformance[]
}

export interface DepartmentPerformance {
  department_id: string
  department_name: string
  total_syor: number
  completed: number
  completion_rate: number
  avg_weight: number
}