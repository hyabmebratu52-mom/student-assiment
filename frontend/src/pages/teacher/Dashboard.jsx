import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/courses').then(r => setCourses(r.data)).finally(() => setLoading(false))
  }, [])

  const totalStudents    = courses.reduce((s, c) => s + (c.students_count || 0), 0)
  const totalAssignments = courses.reduce((s, c) => s + (c.assignments_count || 0), 0)

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">እንኳን ደህና መጡ، {user.name} 👋</h1>
        <p className="text-gray-500 mt-1">የትምህርት ክፍሎችዎ አጠቃላይ እይታ</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="ጠቅላላ ትምህርቶች"   value={courses.length}   color="blue"   icon="📚" />
        <StatCard label="ጠቅላላ ተማሪዎች"    value={totalStudents}   color="green"  icon="👨‍🎓" />
        <StatCard label="ጠቅላላ ምደባዎች"    value={totalAssignments} color="purple" icon="📝" />
      </div>

      {/* Courses */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">ትምህርት ክፍሎቼ</h2>
          <Link to="/teacher/courses" className="btn-primary btn-sm">+ አዲስ ትምህርት</Link>
        </div>

        {courses.length === 0 ? (
          <p className="text-gray-400 text-center py-8">ምንም ትምህርት አልተፈጠረም።</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {courses.map(course => (
              <div key={course.id} className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{course.title}</p>
                  <p className="text-sm text-gray-500">
                    {course.code} · {course.students_count || 0} ተማሪዎች · {course.assignments_count || 0} ምደባዎች
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/teacher/courses/${course.id}/assignments`} className="btn-secondary btn-sm">ምደባዎች</Link>
                  <Link to={`/teacher/courses/${course.id}`}            className="btn-primary btn-sm">ይመልከቱ</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color, icon }) {
  const colors = { blue:'bg-blue-50 text-blue-600', green:'bg-green-50 text-green-600', purple:'bg-purple-50 text-purple-600' }
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors[color]}`}>{icon}</div>
      <div><p className="text-2xl font-bold text-gray-900">{value}</p><p className="text-sm text-gray-500">{label}</p></div>
    </div>
  )
}
function Spinner() { return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div> }
