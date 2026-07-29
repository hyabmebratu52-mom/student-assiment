import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

export default function StudentDashboard() {
  const { user }  = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/courses').then(r => setCourses(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const totalAssignments = courses.reduce((s, c) => s + (c.assignments_count || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">እንኳን ደህና መጡ، {user.name} 👋</h1>
        <p className="text-gray-500 mt-1">
          {user.student_id && <span className="font-medium text-blue-600">መ.ቁ: {user.student_id} · </span>}
          የምዝገባ ትምህርት ክፍሎችዎ
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">{courses.length}</p>
          <p className="text-sm text-gray-500 mt-1">የተመዘገቡ ትምህርቶች</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">{totalAssignments}</p>
          <p className="text-sm text-gray-500 mt-1">ጠቅላላ ምደባዎች</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/student/courses"  className="card hover:border-blue-200 hover:shadow transition-all text-center">
          <p className="text-2xl mb-2">📚</p>
          <p className="font-semibold">ትምህርቶችን ሁሉ ይዩ</p>
          <p className="text-xs text-gray-400 mt-1">ያግኙ እና ይቀላቀሉ</p>
        </Link>
        <Link to="/student/grades"   className="card hover:border-blue-200 hover:shadow transition-all text-center">
          <p className="text-2xl mb-2">🏆</p>
          <p className="font-semibold">ውጤቶቼ</p>
          <p className="text-xs text-gray-400 mt-1">ነጥብ እና አስተያየት ይመልከቱ</p>
        </Link>
        <Link to="/student/calendar" className="card hover:border-blue-200 hover:shadow transition-all text-center">
          <p className="text-2xl mb-2">📅</p>
          <p className="font-semibold">የቀን መቁጠሪያ</p>
          <p className="text-xs text-gray-400 mt-1">ሁሉም የጊዜ ገደቦች</p>
        </Link>
      </div>

      {/* Enrolled courses */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">ትምህርት ክፍሎቼ</h2>
        {courses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">ምንም ትምህርት አልተመዘገቡም።</p>
            <Link to="/student/courses" className="btn-primary">ትምህርቶችን ሁሉ ይዩ</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map(c => (
              <div key={c.id} className="border border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge-blue">{c.code}</span>
                </div>
                <p className="font-semibold text-gray-900">{c.title}</p>
                <p className="text-xs text-gray-400 mt-1">አስተማሪ: {c.teacher?.name || '—'}</p>
                <p className="text-xs text-gray-400">{c.assignments_count || 0} ምደባዎች</p>
                <Link to={`/student/courses/${c.id}/assignments`} className="btn-primary btn-sm mt-3 inline-flex">
                  ምደባዎችን ይመልከቱ
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Spinner() { return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div> }
