import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function StudentCourses() {
  const [enrolled, setEnrolled]   = useState([])
  const [available, setAvailable] = useState([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState('enrolled')

  useEffect(() => {
    Promise.all([api.get('/courses'), api.get('/courses/browse')])
      .then(([eRes, aRes]) => {
        setEnrolled(eRes.data)
        const ids = new Set(eRes.data.map(c => c.id))
        setAvailable(aRes.data.filter(c => !ids.has(c.id)))
      }).finally(() => setLoading(false))
  }, [])

  async function handleEnroll(courseId) {
    try {
      await api.post(`/courses/${courseId}/enroll`)
      toast.success('በትምህርቱ ተመዘገቡ!')
      const course = available.find(c => c.id === courseId)
      setEnrolled(prev => [...prev, { ...course, assignments_count: 0 }])
      setAvailable(prev => prev.filter(c => c.id !== courseId))
    } catch (err) { toast.error(err.response?.data?.message || 'ምዝገባ አልተሳካም') }
  }

  async function handleUnenroll(courseId) {
    if (!confirm('ከዚህ ትምህርት ምዝገባ ይሰርዙ?')) return
    try {
      await api.post(`/courses/${courseId}/unenroll`)
      toast.success('ምዝገባ ተሰርዟል')
      const course = enrolled.find(c => c.id === courseId)
      setEnrolled(prev => prev.filter(c => c.id !== courseId))
      setAvailable(prev => [...prev, course])
    } catch { toast.error('አልተሳካም') }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ትምህርት ክፍሎች</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { key:'enrolled',  label:`ትምህርቶቼ (${enrolled.length})` },
          { key:'available', label:`ያሉ ትምህርቶች (${available.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab===t.key ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'enrolled' && (
        enrolled.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400 mb-4">ምንም ትምህርት አልተመዘገቡም።</p>
            <button onClick={() => setTab('available')} className="btn-primary">ያሉ ትምህርቶችን ይዩ</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrolled.map(c => (
              <div key={c.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="badge-blue">{c.code}</span>
                    <h3 className="font-semibold text-gray-900 mt-1">{c.title}</h3>
                    <p className="text-xs text-gray-400">አስተማሪ: {c.teacher?.name}</p>
                  </div>
                  <span className="badge-green">ተመዝጋቢ</span>
                </div>
                {c.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{c.description}</p>}
                <div className="flex gap-2 flex-wrap">
                  <Link to={`/student/courses/${c.id}/assignments`}  className="btn-primary btn-sm">ምደባዎች</Link>
                  <Link to={`/student/courses/${c.id}/groups`}       className="btn-secondary btn-sm">👥 ቡድኖች</Link>
                  <Link to={`/student/courses/${c.id}/announcements`} className="btn-secondary btn-sm">📢</Link>
                  <button onClick={() => handleUnenroll(c.id)} className="btn-danger btn-sm ml-auto">ምዝገባ ሰርዝ</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'available' && (
        available.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">ሌላ ትምህርት አልተገኘም።</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {available.map(c => (
              <div key={c.id} className="card">
                <span className="badge-blue">{c.code}</span>
                <h3 className="font-semibold text-gray-900 mt-1">{c.title}</h3>
                <p className="text-xs text-gray-400 mb-2">አስተማሪ: {c.teacher?.name}</p>
                {c.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{c.description}</p>}
                <button onClick={() => handleEnroll(c.id)} className="btn-primary btn-sm">ተመዝገብ</button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

function Spinner() { return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div> }
