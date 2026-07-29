import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/axios'
import { formatDistanceToNow } from 'date-fns'

export default function StudentAnnouncements() {
  const { courseId } = useParams()
  const [items, setItems]     = useState([])
  const [course, setCourse]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get(`/courses/${courseId}`), api.get(`/courses/${courseId}/announcements`)])
      .then(([c, a]) => { setCourse(c.data); setItems(a.data) }).finally(() => setLoading(false))
  }, [courseId])

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      <div>
        <Link to={`/student/courses/${courseId}/assignments`} className="text-sm text-blue-600 hover:underline">← {course?.title}</Link>
        <h1 className="text-2xl font-bold mt-1">ማሳወቂያዎች</h1>
      </div>
      {items.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">ምንም ማሳወቂያ የለም።</div>
      ) : (
        <div className="space-y-4">
          {items.map(a => (
            <div key={a.id} className={`card border-l-4 ${a.is_pinned ? 'border-l-yellow-400 bg-yellow-50/30' : 'border-l-blue-400'}`}>
              <div className="flex items-center gap-2 mb-2">
                {a.is_pinned && <span className="badge-yellow">📌 ቆርቁሮ</span>}
                <h3 className="font-semibold text-gray-900 text-lg">{a.title}</h3>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{a.body}</p>
              <p className="text-xs text-gray-400 mt-3">
                በ {a.creator?.name} · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Spinner() { return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div> }
