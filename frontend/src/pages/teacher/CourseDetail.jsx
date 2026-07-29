import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/axios'

export default function CourseDetail() {
  const { courseId } = useParams()
  const [course, setCourse]     = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/courses/${courseId}`),
      api.get(`/courses/${courseId}/students`),
    ]).then(([cRes, sRes]) => {
      setCourse(cRes.data)
      setStudents(sRes.data)
    }).finally(() => setLoading(false))
  }, [courseId])

  if (loading) return <Spinner />
  if (!course)  return <p className="text-red-500">ትምህርቱ አልተገኘም።</p>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-blue">{course.code}</span>
            {course.is_active
              ? <span className="badge-green">ንቁ</span>
              : <span className="badge-gray">ንቁ አይደለም</span>}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
          {course.description && <p className="text-gray-500 mt-1">{course.description}</p>}
        </div>
        <Link to={`/teacher/courses/${courseId}/assignments`} className="btn-primary">
          ምደባዎች ያስተዳድሩ
        </Link>
      </div>

      {/* Quick action buttons */}
      <div className="flex flex-wrap gap-2">
        <Link to={`/teacher/courses/${courseId}/assignments`}  className="btn-secondary btn-sm">📝 ምደባዎች</Link>
        <Link to={`/teacher/courses/${courseId}/grade-report`} className="btn-secondary btn-sm">📊 Grade Report</Link>
        <Link to={`/teacher/courses/${courseId}/analytics`}    className="btn-secondary btn-sm">📈 ትንተና</Link>
        <Link to={`/teacher/courses/${courseId}/announcements`} className="btn-secondary btn-sm">📢 ማሳወቂያዎች</Link>
      </div>

      {/* Students enrolled */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">
          የተመዘገቡ ተማሪዎች ({students.length})
        </h2>
        {students.length === 0 ? (
          <p className="text-gray-400 text-center py-6">ምንም ተማሪ ገና አልተመዘገቡም።</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="pb-3 font-medium text-gray-600">#</th>
                  <th className="pb-3 font-medium text-gray-600">ስም</th>
                  <th className="pb-3 font-medium text-gray-600">መ.ቁ</th>
                  <th className="pb-3 font-medium text-gray-600">ኢሜል</th>
                  <th className="pb-3 font-medium text-gray-600">ውጤት</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((s, i) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-3 text-gray-400">{i + 1}</td>
                    <td className="py-3 font-medium">{s.name}</td>
                    <td className="py-3 text-gray-500">{s.student_id || '—'}</td>
                    <td className="py-3 text-gray-500">{s.email}</td>
                    <td className="py-3">
                      <Link
                        to={`/teacher/courses/${courseId}/grade-report`}
                        className="text-blue-600 text-xs hover:underline"
                      >
                        ውጤት ይዩ →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignments */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            ምደባዎች ({course.assignments?.length || 0})
          </h2>
          <Link to={`/teacher/courses/${courseId}/assignments`} className="btn-secondary btn-sm">
            ሁሉንም ይዩ
          </Link>
        </div>
        {!course.assignments?.length ? (
          <p className="text-gray-400 text-center py-6">ምንም ምደባ ገና አልተፈጠረም።</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {course.assignments.map(a => (
              <div key={a.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-gray-500">
                    ጊዜ ገደብ: {new Date(a.deadline).toLocaleString('am-ET')} ·{' '}
                    <span className={a.type === 'group' ? 'text-purple-600' : 'text-blue-600'}>
                      {a.type === 'group' ? 'ቡድን' : 'ግለሰብ'}
                    </span>
                  </p>
                </div>
                <Link
                  to={`/teacher/assignments/${a.id}/submissions`}
                  className="btn-secondary btn-sm"
                >
                  ምላሾች
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
