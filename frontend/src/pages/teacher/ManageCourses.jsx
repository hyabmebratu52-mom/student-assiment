import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const empty = { title: '', code: '', description: '' }

export default function ManageCourses() {
  const [courses, setCourses]     = useState([])
  const [archived, setArchived]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState('active')
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(empty)
  const [saving, setSaving]       = useState(false)
  const [editId, setEditId]       = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const [active, arch] = await Promise.all([
        api.get('/courses'),
        api.get('/courses/archived'),
      ])
      setCourses(active.data)
      setArchived(arch.data)
    } catch (_) {}
    finally { setLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true)
    try {
      if (editId) {
        const { data } = await api.put(`/courses/${editId}`, form)
        setCourses(courses.map(c => c.id===editId ? {...c,...data} : c))
        toast.success('ትምህርት ተዘምኗል')
      } else {
        const { data } = await api.post('/courses', form)
        setCourses([...courses, {...data, students_count:0, assignments_count:0}])
        toast.success('ትምህርት ተፈጥሯል')
      }
      setShowForm(false); setForm(empty); setEditId(null)
    } catch (err) { toast.error(err.response?.data?.message || 'አልተሳካም') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('ይህን ትምህርት ይሰርዙ? ሁሉም ምደባዎች ይጠፋሉ።')) return
    try {
      await api.delete(`/courses/${id}`)
      setCourses(courses.filter(c => c.id!==id))
      toast.success('ተሰርዟል')
    } catch { toast.error('መሰረዝ አልተሳካም') }
  }

  async function handleArchive(id) {
    if (!confirm('ይህን ትምህርት ያስቀምጡ (Archive)? ተማሪዎች አያዩትም።')) return
    try {
      await api.post(`/courses/${id}/archive`)
      const course = courses.find(c => c.id===id)
      setCourses(courses.filter(c => c.id!==id))
      setArchived([...archived, {...course, archived_at: new Date().toISOString()}])
      toast.success('ትምህርቱ archived ሆኗል')
    } catch { toast.error('አልተሳካም') }
  }

  async function handleUnarchive(id) {
    try {
      await api.post(`/courses/${id}/unarchive`)
      const course = archived.find(c => c.id===id)
      setArchived(archived.filter(c => c.id!==id))
      setCourses([...courses, {...course, archived_at: null, is_active: true}])
      toast.success('ትምህርቱ ወደ ንቁ ተመልሷል')
    } catch { toast.error('አልተሳካም') }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ትምህርት ክፍሎቼ</h1>
        <button className="btn-primary" onClick={() => { setShowForm(true); setForm(empty); setEditId(null) }}>
          + አዲስ ትምህርት
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{editId ? 'ትምህርት አስተካክል' : 'አዲስ ትምህርት ፍጠር'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">የትምህርት ስም</label>
                <input className="input" value={form.title}
                  onChange={e => setForm({...form, title:e.target.value})} required
                  placeholder="ለምሳሌ፦ Introduction to Programming" />
              </div>
              <div>
                <label className="label">የትምህርት ኮድ</label>
                <input className="input" value={form.code}
                  onChange={e => setForm({...form, code:e.target.value})} required
                  placeholder="ለምሳሌ፦ CS101" disabled={!!editId} />
              </div>
            </div>
            <div>
              <label className="label">መግለጫ</label>
              <textarea className="input" rows={3} value={form.description}
                onChange={e => setForm({...form, description:e.target.value})}
                placeholder="የትምህርቱ መግለጫ (አስፈላጊ ካልሆነ ይተው)" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'እየተቀመጠ…' : editId ? 'አዘምን' : 'ፍጠር'}
              </button>
              <button type="button" className="btn-secondary"
                onClick={() => { setShowForm(false); setEditId(null) }}>ሰርዝ</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { key:'active',   label:`ንቁ ትምህርቶች (${courses.length})` },
          { key:'archived', label:`የድሮ ትምህርቶች (${archived.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab===t.key ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Active courses */}
      {tab === 'active' && (
        courses.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">ምንም ትምህርት አልተፈጠረም። የመጀመሪያውን ይፍጠሩ!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map(course => (
              <div key={course.id} className="card flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="badge-blue">{course.code}</span>
                    <h3 className="font-semibold text-gray-900 mt-1">{course.title}</h3>
                    {course.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.description}</p>
                    )}
                  </div>
                  <span className="badge-green text-xs">ንቁ</span>
                </div>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>👨‍🎓 {course.students_count||0} ተማሪዎች</span>
                  <span>📝 {course.assignments_count||0} ምደባዎች</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                  <Link to={`/teacher/courses/${course.id}`}               className="btn-primary btn-sm">ይዩ</Link>
                  <Link to={`/teacher/courses/${course.id}/assignments`}   className="btn-secondary btn-sm">ምደባዎች</Link>
                  <Link to={`/teacher/courses/${course.id}/grade-report`}  className="btn-secondary btn-sm">📊 Report</Link>
                  <button onClick={() => {
                    setForm({title:course.title, code:course.code, description:course.description||''})
                    setEditId(course.id); setShowForm(true)
                  }} className="btn-secondary btn-sm">አስተካክል</button>
                  <button onClick={() => handleArchive(course.id)} className="btn-secondary btn-sm">
                    📦 Archive
                  </button>
                  <button onClick={() => handleDelete(course.id)} className="btn-danger btn-sm">ሰርዝ</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Archived courses */}
      {tab === 'archived' && (
        archived.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <p className="text-3xl mb-3">📦</p>
            <p>ምንም archived ትምህርት የለም።</p>
            <p className="text-sm mt-2">ትምህርት "Archive" ሲደረግ እዚህ ይታያል።</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {archived.map(course => (
              <div key={course.id} className="card flex flex-col gap-3 opacity-80">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="badge-gray">{course.code}</span>
                      <span className="badge-yellow text-xs">📦 Archived</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mt-1">{course.title}</h3>
                    {course.archived_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        Archived: {new Date(course.archived_at).toLocaleDateString('am-ET')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>👨‍🎓 {course.students_count||0} ተማሪዎች</span>
                  <span>📝 {course.assignments_count||0} ምደባዎች</span>
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <Link to={`/teacher/courses/${course.id}/grade-report`} className="btn-secondary btn-sm">
                    📊 ያለፈ Report
                  </Link>
                  <button onClick={() => handleUnarchive(course.id)} className="btn-success btn-sm">
                    ♻️ እንደገና ግፋ
                  </button>
                  <button onClick={() => handleDelete(course.id)} className="btn-danger btn-sm">
                    ሙሉ ሰርዝ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

function Spinner() {
  return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>
}
