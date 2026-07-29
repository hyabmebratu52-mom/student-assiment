import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

export default function TeacherAnnouncements() {
  const { courseId } = useParams()
  const [items, setItems]     = useState([])
  const [course, setCourse]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]   = useState(null)
  const [form, setForm]       = useState({ title:'', body:'', is_pinned:false })
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    Promise.all([api.get(`/courses/${courseId}`), api.get(`/courses/${courseId}/announcements`)])
      .then(([c, a]) => { setCourse(c.data); setItems(a.data) }).finally(() => setLoading(false))
  }, [courseId])

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true)
    try {
      if (editId) {
        const { data } = await api.put(`/announcements/${editId}`, form)
        setItems(items.map(x => x.id===editId ? data : x)); toast.success('ተዘምኗል')
      } else {
        const { data } = await api.post(`/courses/${courseId}/announcements`, form)
        setItems([data, ...items]); toast.success('ማሳወቂያ ተልኳል! ተማሪዎች ተነግሯቸዋል።')
      }
      setShowForm(false); setEditId(null); setForm({ title:'', body:'', is_pinned:false })
    } catch(err) { toast.error(err.response?.data?.message || 'አልተሳካም') }
    finally { setSaving(false) }
  }

  async function del(id) {
    if (!confirm('ይህን ማሳወቂያ ይሰርዙ?')) return
    try { await api.delete(`/announcements/${id}`); setItems(items.filter(x => x.id!==id)); toast.success('ተሰርዟል') }
    catch { toast.error('አልተሳካም') }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to={`/teacher/courses/${courseId}`} className="text-sm text-blue-600 hover:underline">← {course?.title}</Link>
          <h1 className="text-2xl font-bold mt-1">ማሳወቂያዎች</h1>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditId(null); setForm({title:'',body:'',is_pinned:false}) }}>
          + ማሳወቂያ ለጥፍ
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="font-semibold mb-4">{editId ? 'ማሳወቂያ አስተካክል' : 'አዲስ ማሳወቂያ'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">ርዕስ</label>
              <input className="input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required placeholder="ለምሳሌ፦ የፈተና ቀን ተቀይሯል" />
            </div>
            <div>
              <label className="label">መልዕክት</label>
              <textarea className="input" rows={4} value={form.body} onChange={e=>setForm({...form,body:e.target.value})} required placeholder="ማሳወቂያዎን ይጻፉ…" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="pin" checked={form.is_pinned} onChange={e=>setForm({...form,is_pinned:e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
              <label htmlFor="pin" className="text-sm text-gray-700">📌 ይህን ማሳወቂያ ቆርቁሩ</label>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving?'እየተለጠፈ…':editId?'አዘምን':'ለጥፍ'}</button>
              <button type="button" className="btn-secondary" onClick={()=>{setShowForm(false);setEditId(null)}}>ሰርዝ</button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">ምንም ማሳወቂያ አልተለጠፈም።</div>
      ) : (
        <div className="space-y-4">
          {items.map(a => (
            <div key={a.id} className={`card border-l-4 ${a.is_pinned ? 'border-l-yellow-400' : 'border-l-blue-400'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {a.is_pinned && <span className="badge-yellow">📌 ቆርቁሮ</span>}
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{a.body}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    በ {a.creator?.name} · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => { setEditId(a.id); setForm({title:a.title,body:a.body,is_pinned:a.is_pinned}); setShowForm(true) }} className="btn-secondary btn-sm">አስተካክል</button>
                  <button onClick={() => del(a.id)} className="btn-danger btn-sm">ሰርዝ</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Spinner() { return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div> }
