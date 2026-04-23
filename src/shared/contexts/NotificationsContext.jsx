import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useUser } from './UserContext'

const NotificationsContext = createContext(null)

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/torcida-api/api'

export function NotificationsProvider({ children }) {
  const { user, isLoggedIn } = useUser()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])

  const token = user?.token

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.count || 0)
      }
    } catch {}
  }, [token])

  // Fetch all notifications
  const fetchNotifications = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.notifications?.filter(n => !n.read).length || 0)
      }
    } catch {}
  }, [token])

  // Mark as read
  const markAsRead = useCallback(async (id) => {
    if (!token) return
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }, [token])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!token) return
    try {
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {}
  }, [token])

  // Poll unread count every 30 seconds
  useEffect(() => {
    if (!isLoggedIn || !token) return
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [isLoggedIn, token, fetchUnreadCount])

  return (
    <NotificationsContext.Provider value={{
      unreadCount, notifications,
      fetchNotifications, fetchUnreadCount,
      markAsRead, markAllAsRead,
    }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationsProvider>')
  return ctx
}
