import { useEffect } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface SyorRealtimeHookProps {
  onInsert?: (payload: any) => void
  onUpdate?: (payload: any) => void
  onDelete?: (payload: any) => void
  enabled?: boolean
}

/**
 * Custom hook untuk subscribe kepada realtime changes pada table syor
 * 
 * @example
 * ```tsx
 * useSyorRealtime({
 *   onInsert: (payload) => {
 *     console.log('New syor created:', payload.new)
 *     // Refresh syor list
 *     fetchSyor()
 *   },
 *   onUpdate: (payload) => {
 *     console.log('Syor updated:', payload.new)
 *     // Update specific syor in state
 *   },
 *   onDelete: (payload) => {
 *     console.log('Syor deleted:', payload.old)
 *     // Remove from list
 *   }
 * })
 * ```
 */
export function useSyorRealtime({
  onInsert,
  onUpdate,
  onDelete,
  enabled = true
}: SyorRealtimeHookProps) {
  useEffect(() => {
    if (!enabled) return

    const supabase = createBrowserSupabaseClient()
    let channel: RealtimeChannel

    const setupRealtimeSubscription = async () => {
      // Create channel untuk syor table
      channel = supabase
        .channel('syor-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'syor'
          },
          (payload) => {
            console.log('🆕 Syor baru dicipta:', payload.new)
            onInsert?.(payload)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'syor'
          },
          (payload) => {
            console.log('📝 Syor dikemaskini:', payload.new)
            onUpdate?.(payload)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'syor'
          },
          (payload) => {
            console.log('🗑️ Syor dipadam:', payload.old)
            onDelete?.(payload)
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime subscription active untuk syor table')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Realtime subscription error')
          }
        })
    }

    setupRealtimeSubscription()

    // Cleanup subscription bila component unmount
    return () => {
      if (channel) {
        console.log('🔌 Unsubscribing from syor realtime')
        supabase.removeChannel(channel)
      }
    }
  }, [enabled, onInsert, onUpdate, onDelete])
}

/**
 * Hook untuk subscribe kepada changes pada syor tertentu sahaja (by ID)
 */
export function useSyorRealtimeById({
  syorId,
  onUpdate,
  enabled = true
}: {
  syorId: string
  onUpdate?: (payload: any) => void
  enabled?: boolean
}) {
  useEffect(() => {
    if (!enabled || !syorId) return

    const supabase = createBrowserSupabaseClient()
    let channel: RealtimeChannel

    const setupRealtimeSubscription = async () => {
      channel = supabase
        .channel(`syor-${syorId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'syor',
            filter: `id=eq.${syorId}`
          },
          (payload) => {
            console.log(`📝 Syor ${syorId} dikemaskini:`, payload.new)
            onUpdate?.(payload)
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`✅ Realtime active untuk syor ID: ${syorId}`)
          }
        })
    }

    setupRealtimeSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [syorId, enabled, onUpdate])
}
