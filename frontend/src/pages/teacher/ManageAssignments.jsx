import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const emptyForm = { title:'', description:'', type:'individual', deadline:'', allow_late:false, max_score:100 }

export default function ManageAssignments() {
  const { courseId }  = useParams()
  const [assignments, setAssignments] = useState([])
  const [course, setCourse]           = useState(null)
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState(emptyForm)
  const [file, setFile]               = useState(null)
  const [saving, setSaving]           = useState(false)
  const [editId, setEditId]           = useState(null)
  const [search, setSearch]           = useState('')
  const [filterType, setFilterType]   = useState('all')
  const [autoZeroing, setAutoZeroing] = useState(false)

  async function handleCourseAutoZero() {
    if (!confirm('ጊዜ ያለፈባቸው ምደባዎች ሁሉ — ያልቀረቡ ተማሪዎች 0 ነጥብ ይሰጣቸዋል። እርግጠኛ ነዎት?')) return
    setAutoZeroing(true)
    try {
      const { data } = await api.post(`/courses/${courseId}/auto-zero-all`)
      toast.success(data.message)
      if (data.details?.length) {
        data.details.forEach(d => {
          if (d.zeroed > 0) toast(`📝 ${d.assignment}: ${d.zeroed} ዜሮ`, { icon: '0️⃣' })
        })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'አልተሳካም')
    } finally { setAutoZeroing(false) }
  }

  useEffect(() => {
    Promise.all([
      api.get(`/courses/${courseId}`),
      api.get(`/courses/${courseId}/assignments`),
    ]).then(([c, a]) => { setCourse(c.data); setAssignments(a.data) }).finally(() => setLoading(false))
  }, [courseId])

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'allow_late') {
          fd.append(k, v ? '1' : '0')
        } else {
          fd.append(k, v)
        }
      })
      if (file) fd.append('attachment', file)

      if (editId) {
        const { data } = await api.put(`/assignments/${editId}`, form)
        setAssignments(assignments.map(a => a.id === editId ? data : a))
        toast.success('ምደባ ተዘምኗል')
      } else {
        const { data } = await api.post(`/courses/${courseId}/assignments`, fd, { headers:{ 'Content-Type':'multipart/form-data' } })
        setAssignments([...assignments, data])
        toast.success('ምደባ ተፈጥሯል')
      }
      setShowForm(false); setForm(emptyForm); setEditId(null); setFile(null)
    } catch (err) {
      const errs = err.response?.data?.errors
      toast.error(errs ? Object.values(errs)[0][0] : err.response?.data?.message || 'አልተሳካም')
    } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('ይህን ምደባ ይሰርዙ?')) return
    try { await api.delete(`/assignments/${id}`); setAssignments(assignments.filter(a => a.id !== id)); toast.success('ተሰርዟል') }
    catch { toast.error('መሰረዝ አልተሳካም') }
  }

  if (loading) return <Spinner />

  const filtered = assignments.filter(a =>
    (!search || a.title.toLowerCase().includes(search.toLowerCase())) &&
    (filterType === 'all' || a.type === filterType)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to={`/teacher/courses/${courseId}`} className="text-sm text-blue-600 hover:underline">← {course?.title}</Link>
          <h1 className="text-2xl font-bold mt-1">ምደባዎች</h1>
        </div>
        <div className="flex gap-2">
          <Link to={`/teacher/courses/${courseId}/analytics`}     className="btn-secondary">📊 ትንተና</Link>
          <Link to={`/teacher/courses/${courseId}/grade-report`}  className="btn-secondary">📋 Grade Report</Link>
          <Link to={`/teacher/courses/${courseId}/announcements`} className="btn-secondary">📢 ማሳወቂያዎች</Link>
          <button className="btn-warning" onClick={handleCourseAutoZero} disabled={autoZeroing}>
            {autoZeroing ? 'እየሰጠ…' : '0️⃣ ያልቀረቡ ሁሉ 0 ነጥብ'}
          </button>
          <button className="btn-primary" onClick={() => { setShowForm(true); setForm(emptyForm); setEditId(null) }}>
            + አዲስ ምደባ
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-5">{editId ? 'ምደባ አስተካክል' : 'አዲስ ምደባ ፍጠር'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">ርዕስ</label>
              <input className="input" value={form.title} onChange={e => setForm({...form,title:e.target.value})} required placeholder="የምደባ ርዕስ" />
            </div>
            <div>
              <label className="label">መመሪያ / ዝርዝር</label>
              <textarea className="input" rows={4} value={form.description} onChange={e => setForm({...form,description:e.target.value})} required placeholder="ለተማሪዎች መመሪያ ይጻፉ…" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">አይነት</label>
                <select className="input" value={form.type} onChange={e => setForm({...form,type:e.target.value})}>
                  <option value="individual">ግለሰብ</option>
                  <option value="group">ቡድን</option>
                </select>
              </div>
              <div>
                <label className="label">የጊዜ ገደብ</label>
                <input type="datetime-local" className="input" value={form.deadline} onChange={e => setForm({...form,deadline:e.target.value})} required />
              </div>
              <div>
                <label className="label">ከፍተኛ ነጥብ</label>
                <input type="number" className="input" min={1} max={1000} value={form.max_score} onChange={e => setForm({...form,max_score:e.target.value})} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="allow_late" checked={form.allow_late} onChange={e => setForm({...form,allow_late:e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
              <label htmlFor="allow_late" className="text-sm text-gray-700">ዘግይቶ ማቅረብ ይፍቀዱ</label>
            </div>
            {!editId && (
              <div>
                <label className="label">ፋይል አያይዝ <span className="text-gray-400">(አስፈላጊ ካልሆነ ይተው)</span></label>
                <input type="file" className="input py-1.5" onChange={e => setFile(e.target.files[0])} />
              </div>
            )}
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'እየተቀመጠ…' : editId ? 'አዘምን' : 'ፍጠር'}</button>
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditId(null) }}>ሰርዝ</button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filter */}
      {!showForm && (
        <div className="flex flex-wrap gap-2 items-center">
          <input className="input w-48 text-sm" placeholder="🔍 ምደባ ፈልግ…" value={search} onChange={e => setSearch(e.target.value)} />
          {[{v:'all',l:'ሁሉም'},{v:'individual',l:'ግለሰብ'},{v:'group',l:'ቡድን'}].map(t => (
            <button key={t.v} onClick={() => setFilterType(t.v)}
              className={`btn btn-sm ${filterType===t.v ? 'btn-primary' : 'btn-secondary'}`}>{t.l}</button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">ምንም ምደባ የለም።</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const isPast = new Date() > new Date(a.deadline)
            return (
              <div key={a.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={a.type==='group' ? 'badge-blue' : 'badge-gray'}>{a.type==='group'?'ቡድን':'ግለሰብ'}</span>
                      {isPast ? <span className="badge-red">ጊዜ አልፏል</span> : <span className="badge-green">ክፍት</span>}
                      {a.allow_late && <span className="badge-yellow">ዘግይቶ ይፈቀዳል</span>}
                    </div>
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{a.description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span>📅 {new Date(a.deadline).toLocaleString('am-ET')}</span>
                      <span>🏆 ከፍተኛ: {a.max_score} ነጥብ</span>
                      <span>📬 {a.submissions_count||0} ምላሾች</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Link to={`/teacher/assignments/${a.id}/submissions`} className="btn-primary btn-sm">ምላሾች</Link>
                    <Link to={`/teacher/assignments/${a.id}/rubric`}      className="btn-secondary btn-sm">📋 ሩብሪክ</Link>
                    <button onClick={() => { setForm({title:a.title,description:a.description,type:a.type,deadline:a.deadline?.replace('T',' ').slice(0,16),allow_late:a.allow_late,max_score:a.max_score}); setEditId(a.id); setShowForm(true) }} className="btn-secondary btn-sm">አስተካክል</button>
                    <button onClick={() => handleDelete(a.id)} className="btn-danger btn-sm">ሰርዝ</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Spinner() { return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div> }
