export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'peneraju_pemeriksaan' | 'penyelaras_bahagian' | 'penyelaras_jpn' | 'pemantau'
          department_id: string | null
          jpn_id: string | null
          sector: 'SPK' | 'SPHEMK' | 'SPIP' | null
          is_active: boolean
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: 'admin' | 'peneraju_pemeriksaan' | 'penyelaras_bahagian' | 'penyelaras_jpn' | 'pemantau'
          department_id?: string | null
          jpn_id?: string | null
          sector?: 'SPK' | 'SPHEMK' | 'SPIP' | null
          is_active?: boolean
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'peneraju_pemeriksaan' | 'penyelaras_bahagian' | 'penyelaras_jpn' | 'pemantau'
          department_id?: string | null
          jpn_id?: string | null
          sector?: 'SPK' | 'SPHEMK' | 'SPIP' | null
          is_active?: boolean
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_jpn_id_fkey"
            columns: ["jpn_id"]
            isOneToOne: false
            referencedRelation: "jpn"
            referencedColumns: ["id"]
          }
        ]
      }
      departments: {
        Row: {
          id: string
          name: string
          code: string
          contact_person: string
          email: string
          phone: string | null
          sector: 'SPK' | 'SPHEMK' | 'SPIP' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          contact_person: string
          email: string
          phone?: string | null
          sector?: 'SPK' | 'SPHEMK' | 'SPIP' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          contact_person?: string
          email?: string
          phone?: string | null
          sector?: 'SPK' | 'SPHEMK' | 'SPIP' | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      jpn: {
        Row: {
          id: string
          name: string
          state: string
          contact_person: string
          email: string
          phone: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          state: string
          contact_person: string
          email: string
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          state?: string
          contact_person?: string
          email?: string
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      syor: {
        Row: {
          id: string
          title: string
          description: string
          priority: 'rendah' | 'sederhana' | 'tinggi' | 'kritikal'
          due_date: string
          created_by: string
          assigned_to_department: string | null
          assigned_to_jpn: string | null
          document_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          priority: 'rendah' | 'sederhana' | 'tinggi' | 'kritikal'
          due_date: string
          created_by: string
          assigned_to_department?: string | null
          assigned_to_jpn?: string | null
          document_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          priority?: 'rendah' | 'sederhana' | 'tinggi' | 'kritikal'
          due_date?: string
          created_by?: string
          assigned_to_department?: string | null
          assigned_to_jpn?: string | null
          document_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "syor_assigned_to_department_fkey"
            columns: ["assigned_to_department"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syor_assigned_to_jpn_fkey"
            columns: ["assigned_to_jpn"]
            isOneToOne: false
            referencedRelation: "jpn"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syor_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      status_tracking: {
        Row: {
          id: string
          syor_id: string
          department_id: string | null
          jpn_id: string | null
          status: 'belum_selesai' | 'dalam_tindakan' | 'selesai'
          weight: number
          comments: string | null
          updated_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          syor_id: string
          department_id?: string | null
          jpn_id?: string | null
          status: 'belum_selesai' | 'dalam_tindakan' | 'selesai'
          weight: number
          comments?: string | null
          updated_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          syor_id?: string
          department_id?: string | null
          jpn_id?: string | null
          status?: 'belum_selesai' | 'dalam_tindakan' | 'selesai'
          weight?: number
          comments?: string | null
          updated_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_tracking_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_tracking_jpn_id_fkey"
            columns: ["jpn_id"]
            isOneToOne: false
            referencedRelation: "jpn"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_tracking_syor_id_fkey"
            columns: ["syor_id"]
            isOneToOne: false
            referencedRelation: "syor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_tracking_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'deadline' | 'status_update' | 'new_syor' | 'system'
          read: boolean
          syor_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'deadline' | 'status_update' | 'new_syor' | 'system'
          read?: boolean
          syor_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'deadline' | 'status_update' | 'new_syor' | 'system'
          read?: boolean
          syor_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_syor_id_fkey"
            columns: ["syor_id"]
            isOneToOne: false
            referencedRelation: "syor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_values: Json | null
          new_values: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_values?: Json | null
          new_values?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          table_name?: string
          record_id?: string
          old_values?: Json | null
          new_values?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}