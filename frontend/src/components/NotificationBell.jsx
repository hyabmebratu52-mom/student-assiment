import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'

const TYPE_ICON = {
  assignment_created: '📝',
  grade_received:     '🏆',
  deadline_reminder:  '⏰',
  announcement:       '📢',
  comment:            '💬',
}

export default function NotificationBell() {
  const { count, notifications, open, toggle, setOpen, markRead, markAllRead } = useNotifications()
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [setOpen])

  function handleClick(notif) {
    if (!notif.read_at) markRead(notif.id)
    const d = notif.data || {}
    if (d.assignment_id) navigate(`/student/assignments/${d.assignment_id}/submit`)
    else if (d.submission_id) navigate(`/student/submissions/${d.submission_id}`)
    else if (d.course_id) navigate(`/student/courses/${d.course_id}/announcements`)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        aria-label="ማሳወቂያዎች">
        <span className="text-xl">🔔</span>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">ማሳወቂያዎች</h3>
            {count > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                ሁሉንም እንደተነበበ ምልክት አድርግ
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">ምንም ማሳወቂያ የለም</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} onClick={() => handleClick(n)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${!n.read_at ? 'bg-blue-50/60' : ''}`}>
                  <span className="text-xl shrink-0 mt-0.5">{TYPE_ICON[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.read_at ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.read_at && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-gray-100 text-center">
            <button onClick={() => { setOpen(false); navigate('/notifications') }}
              className="text-xs text-blue-600 hover:underline">
              ሁሉንም ማሳወቂያዎች ይመልከቱ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
