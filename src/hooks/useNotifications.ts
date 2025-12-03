'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuthSimple'

export interface Notification {
  id: string
  user_id: string
  syor_id: string | null
  notification_type: 'deadline' | 'status_update' | 'new_syor' | 'system' | 'overdue'
  title: string
  message: string
  read: boolean
  created_at: string
  created_by: string | null
  metadata: Record<string, unknown> | null
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const isFetchingRef = useRef(false)

  // Fetch notifications with memoization
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      console.log('useNotifications: No user found, skipping fetch')
      return
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log('useNotifications: Already fetching, skipping')
      return
    }

    isFetchingRef.current = true
    console.log('useNotifications: Fetching notifications for user:', user.id)

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, syor_id, type, title, message, read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('useNotifications: Supabase error:', error)
        throw error
      }

      // Map database fields to interface
      const mappedData = data?.map(n => ({
        ...n,
        notification_type: n.type,
        created_by: null,
        metadata: null
      })) || []

      console.log('useNotifications: Fetched notifications:', mappedData)
      console.log('useNotifications: Unread count:', mappedData.filter(n => !n.read).length)

      setNotifications(mappedData)
      setUnreadCount(mappedData.filter(n => !n.read).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [user])

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) throw error

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId)
        return notification && !notification.read ? Math.max(0, prev - 1) : prev
      })
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return

    fetchNotifications()

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const dbNotification = payload.new as Record<string, unknown>
          const newNotification: Notification = {
            ...dbNotification,
            notification_type: dbNotification.type as Notification['notification_type'],
            created_by: null,
            metadata: null
          } as Notification
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)
          
          // Show browser notification if permission granted (check if Notification API exists)
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/logoJN.svg',
              badge: '/logoJN.svg'
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const dbNotification = payload.new as Record<string, unknown>
          const updatedNotification: Notification = {
            ...dbNotification,
            notification_type: dbNotification.type as Notification['notification_type'],
            created_by: null,
            metadata: null
          } as Notification
          setNotifications(prev =>
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          )
          if (updatedNotification.read) {
            setUnreadCount(prev => Math.max(0, prev - 1))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const deletedNotification = payload.old as Notification
          setNotifications(prev => prev.filter(n => n.id !== deletedNotification.id))
          if (!deletedNotification.read) {
            setUnreadCount(prev => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    // Request browser notification permission (check if Notification API exists)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications
  }
}
