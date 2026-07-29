import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export default function SubmissionComments({ submissionId }) {
  const { user }      = useAuth()
  const [comments, setComments] = useState([])
  const [body, setBody]         = useState('')
  const [loading, setLoading]   = useState(true)
  const [posting, setPosting]   = useState(false)

  useEffect(() => {
    api.get(`/submissions/${submissionId}/comments`)
      .then(r => setComments(r.data))
      .finally(() => setLoading(false))
  }, [submissionId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!body.trim()) return
    setPosting(true)
    try {
      const { data } = await api.post(`/submissions/${submissionId}/comments`, { body })
      setComments(c => [...c, data])
      setBody('')
    } catch { toast.error('አስተያየት መላክ አልተሳካም') }
    finally { setPosting(false) }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/comments/${id}`)
      setComments(c => c.filter(x => x.id !== id))
    } catch { toast.error('መሰረዝ አልተሳካም') }
  }

  if (loading) return <p className="text-sm text-gray-400">አስተያየቶች እየተጫኑ ነው…</p>

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">💬 ውይይት</h3>

      <div className="space-y-3">
        {comments.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4">ምንም አስተያየት የለም። ውይይቱን ይጀምሩ።</p>
        )}
        {comments.map(c => {
          const isMe = c.user_id === user.id || c.user?.id === user.id
          return (
            <div key={c.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                c.user?.role === 'teacher' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {c.user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className={`flex-1 max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                  isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                }`}>
                  {c.body}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">
                    {c.user?.role === 'teacher' ? '👩‍🏫 ' : '👨‍🎓 '}{c.user?.name}
                    {' · '}{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                  {isMe && (
                    <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:text-red-600">
                      ሰርዝ
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
        <input className="input flex-1 text-sm" placeholder="አስተያየት ይጻፉ…"
          value={body} onChange={e => setBody(e.target.value)} disabled={posting} />
        <button type="submit" disabled={posting || !body.trim()} className="btn-primary btn-sm px-4">
          {posting ? '…' : 'ላክ'}
        </button>
      </form>
    </div>
  )
}
