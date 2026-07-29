import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/axios'

export default function StudentAssignments() {
  const { courseId } = useParams()
  const [assignments, setAssignments] = useState([])
  const [course, setCourse]           = useState(null)
  const [loading, setLoading]         = useState(true)
  const [filter, setFilter]           = useState('all')

  useEffect(() => {
    Promise.all([api.get(`/courses/${courseId}`), api.get(`/courses/${courseId}/assignments`)])
      .then(([c, a]) => { setCourse(c.data); setAssignments(a.data) }).finally(() => setLoading(false))
  }, [courseId])

  if (loading) return <Spinner />

  const filtered = assignments.filter(a => {
    if (filter === 'open')      return !a.is_past_deadline
    if (filter === 'closed')    return a.is_past_deadline && !a.allow_late
    if (filter === 'submitted') return ['submitted','graded','late'].includes(a.my_submission?.status)
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <Link to="/student/courses" className="text-sm text-blue-600 hover:underline">← ወደ ትምህርቶች</Link>
        <h1 className="text-2xl font-bold mt-1">{course?.title}</h1>
        <p className="text-gray-500 text-sm">{course?.code} · አስተማሪ: {course?.teacher?.name}</p>
      </div>

      {/* Course actions */}
      <div className="flex gap-2 flex-wrap">
        <Link to={`/student/courses/${courseId}/groups`}        className="btn-secondary btn-sm">👥 ቡድኖች</Link>
        <Link to={`/student/courses/${courseId}/announcements`} className="btn-secondary btn-sm">📢 ማሳወቂያዎች</Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[{v:'all',l:'ሁሉም'},{v:'open',l:'ክፍት'},{v:'submitted',l:'ቀርቧል'},{v:'closed',l:'ተዘጋ'}].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`btn btn-sm ${filter===f.v ? 'btn-primary' : 'btn-secondary'}`}>{f.l}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">ምንም ምደባ አልተገኘም።</div>
      ) : (
        <div className="space-y-4">
          {filtered.map(a => {
            const isPast     = a.is_past_deadline
            const canSubmit  = a.can_submit
            const submission = a.my_submission
            const isGraded   = submission?.status === 'graded'
            const isSubmitted = submission?.status === 'submitted' || submission?.status === 'late'

            return (
              <div key={a.id} className="card hover:border-blue-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={a.type==='group' ? 'badge-blue' : 'badge-gray'}>{a.type==='group'?'ቡድን':'ግለሰብ'}</span>
                      {!isPast    && <span className="badge-green">ክፍት</span>}
                      {isPast && canSubmit  && <span className="badge-yellow">ዘግይቶ ይቀበላል</span>}
                      {isPast && !canSubmit && <span className="badge-red">ተዘጋ</span>}
                      {isSubmitted && <span className="badge-blue">ቀርቧል</span>}
                      {isGraded    && <span className="badge-green">ተገምግሟል ✓</span>}
                    </div>

                    {/* Title — clickable to submit page */}
                    <Link to={`/student/assignments/${a.id}/submit`}
                      className="block group">
                      <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                        {a.title} <span className="text-blue-400 text-sm opacity-0 group-hover:opacity-100">→</span>
                      </h3>
                    </Link>

                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{a.description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span>📅 የጊዜ ገደብ: {new Date(a.deadline).toLocaleString('am-ET')}</span>
                      <span>🏆 {a.max_score} ነጥብ</span>
                    </div>
                    {isGraded && submission?.grade && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm">
                        <p className="font-semibold text-green-800">
                          ነጥብ: {submission.grade.score} / {a.max_score}
                        </p>
                        {submission.grade.feedback && (
                          <p className="text-green-700 mt-1">💬 {submission.grade.feedback}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="shrink-0 flex flex-col gap-2 items-end">
                    {canSubmit && !isGraded && (
                      <Link to={`/student/assignments/${a.id}/submit`}
                        className={isSubmitted ? 'btn-secondary' : 'btn-primary'}>
                        {isSubmitted ? 'እንደገና አቅርብ' : 'አቅርብ'}
                      </Link>
                    )}
                    {/* Comment/Discussion link */}
                    {submission && (
                      <Link
                        to={`/student/submissions/${submission.id}`}
                        className="btn-secondary btn-sm"
                      >
                        💬 ውይይት
                      </Link>
                    )}
                    {isGraded && <span className="badge-green">ተገምግሟል ✓</span>}
                    {!canSubmit && !submission && (
                      <span className="badge-red text-xs">ጊዜ አልፏል</span>
                    )}
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
