import { useEffect, useState } from 'react'
import api from '../api/axios'
import { formatDistanceToNow } from 'date-fns'

const TYPE_ICON  = { assignment_created:'📝', grade_received:'🏆', deadline_reminder:'⏰', announcement:'📢', comment:'💬' }
const TYPE_LABEL = { assignment_created:'አዲስ ምደባ', grade_received:'ነጥብ ተሰጥቷል', deadline_reminder:'የጊዜ ገደብ', announcement:'ማሳወቂያ', comment:'አስተያየት' }

export default function NotificationsPage() {
  const [notifications, setNotifs] = useState([])
  const [loading, setLoading]      = useState(true)

  useEffect(() => {
    api.get('/notifications').then(r => setNotifs(r.data)).finally(() => setLoading(false))
  }, [])

  async function markRead(id) {
    await api.post(`/notifications/${id}/read`)
    setNotifs(n => n.map(x => x.id===id ? {...x, read_at:new Date().toISOString()} : x))
  }

  async function markAllRead() {
    await api.post('/notifications/read-all')
    setNotifs(n => n.map(x => ({...x, read_at: x.read_at ?? new Date().toISOString()})))
  }

  async function del(id) {
    await api.delete(`/notifications/${id}`)
    setNotifs(n => n.filter(x => x.id!==id))
  }

  if (loading) return <Spinner />

  const unread = notifications.filter(n => !n.read_at).length

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ማሳወቂያዎች</h1>
          {unread > 0 && <p className="text-sm text-gray-500">{unread} እንዳልተነበበ</p>}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn-secondary btn-sm">ሁሉንም እንደተነበበ ምልክት አድርግ</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-gray-400">ምንም ማሳወቂያ የለም</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} className={`card flex items-start gap-4 p-4 border ${!n.read_at ? 'ring-1 ring-blue-200 bg-blue-50/40' : 'bg-white'}`}>
              <span className="text-2xl shrink-0">{TYPE_ICON[n.type]||'🔔'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs text-blue-600 font-medium">{TYPE_LABEL[n.type]||n.type}</span>
                    <p className={`text-sm font-medium mt-0.5 ${!n.read_at?'text-gray-900':'text-gray-700'}`}>{n.title}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix:true })}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
                <div className="flex gap-3 mt-2">
                  {!n.read_at && <button onClick={() => markRead(n.id)} className="text-xs text-blue-600 hover:underline">እንደተነበበ ምልክት አድርግ</button>}
                  <button onClick={() => del(n.id)} className="text-xs text-red-400 hover:underline">ሰርዝ</button>
                </div>
              </div>
              {!n.read_at && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shrink-0 mt-1"/>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Spinner() { return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div> }
