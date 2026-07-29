import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

export function useNotifications() {
  const [count, setCount]         = useState(0)
  const [notifications, setNotifs] = useState([])
  const [open, setOpen]           = useState(false)

  const fetchCount = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/unread-count')
      setCount(data.count)
    } catch (_) {}
  }, [])

  const fetchAll = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications')
      setNotifs(data)
    } catch (_) {}
  }, [])

  useEffect(() => {
    fetchCount()
    // Poll every 30 seconds
    const timer = setInterval(fetchCount, 30000)
    return () => clearInterval(timer)
  }, [fetchCount])

  async function markRead(id) {
    await api.post(`/notifications/${id}/read`)
    setNotifs(n => n.map(x => x.id === id ? { ...x, read_at: new Date().toISOString() } : x))
    setCount(c => Math.max(0, c - 1))
  }

  async function markAllRead() {
    await api.post('/notifications/read-all')
    setNotifs(n => n.map(x => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })))
    setCount(0)
  }

  async function deleteNotif(id) {
    await api.delete(`/notifications/${id}`)
    setNotifs(n => n.filter(x => x.id !== id))
  }

  function toggle() {
    if (!open) fetchAll()
    setOpen(o => !o)
  }

  return { count, notifications, open, toggle, setOpen, markRead, markAllRead, deleteNotif }
}
