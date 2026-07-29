import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

export default function MyGrades() {
  const { user }  = useAuth()
  const [grades, setGrades]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/students/${user.id}/grades`).then(r => setGrades(r.data)).finally(() => setLoading(false))
  }, [user.id])

  if (loading) return <Spinner />

  const totalScore = grades.reduce((s,g) => s + parseFloat(g.score), 0)
  const totalMax   = grades.reduce((s,g) => s + (g.submission?.assignment?.max_score || 0), 0)
  const percentage = totalMax > 0 ? ((totalScore/totalMax)*100).toFixed(1) : 0

  const byCourse = grades.reduce((acc, g) => {
    const course = g.submission?.assignment?.course
    if (!course) return acc
    if (!acc[course.id]) acc[course.id] = { course, grades:[] }
    acc[course.id].grades.push(g)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ውጤቶቼ</h1>

      {grades.length > 0 && (
        <div className="card bg-gradient-to-br from-blue-500 to-blue-700 text-white">
          <p className="text-sm opacity-80">አጠቃላይ ውጤት</p>
          <p className="text-4xl font-bold mt-1">{percentage}%</p>
          <p className="text-sm opacity-80 mt-1">
            {totalScore.toFixed(1)} / {totalMax} ነጥብ — {grades.length} ምደባ ተገምግሟል
          </p>
          <div className="mt-3 bg-white/20 rounded-full h-2">
            <div className="bg-white rounded-full h-2 transition-all" style={{ width:`${percentage}%` }} />
          </div>
        </div>
      )}

      {grades.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          ምንም ውጤት የለም። ምደባ አቅርበው ውጤትዎን እዚህ ያዩ።
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(byCourse).map(({ course, grades:cGrades }) => {
            const cTotal = cGrades.reduce((s,g) => s + parseFloat(g.score), 0)
            const cMax   = cGrades.reduce((s,g) => s + (g.submission?.assignment?.max_score||0), 0)
            return (
              <div key={course.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg">{course.title}</h2>
                  <span className="text-sm font-medium text-blue-600">{cTotal.toFixed(1)} / {cMax} ነጥብ</span>
                </div>
                <div className="space-y-3">
                  {cGrades.map(g => {
                    const maxScore = g.submission?.assignment?.max_score || 100
                    const pct      = ((g.score/maxScore)*100).toFixed(0)
                    return (
                      <div key={g.id} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{g.submission?.assignment?.title}</p>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {g.submission?.assignment?.type === 'group' && (
                                <span className="badge-blue text-xs">
                                  👥 ቡድን{g.submission?.group?.name ? `: ${g.submission.group.name}` : ''}
                                </span>
                              )}
                              {g.submission?.is_late && <span className="badge-red text-xs">ዘግይቷል</span>}
                            </div>
                            {g.feedback && <p className="text-sm text-gray-500 mt-1">💬 {g.feedback}</p>}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-xl text-gray-900">
                              {g.score}<span className="text-sm font-normal text-gray-400">/{maxScore}</span>
                            </p>
                            <span className={`badge ${pct>=70?'badge-green':pct>=50?'badge-yellow':'badge-red'}`}>{pct}%</span>
                          </div>
                        </div>
                        <div className="mt-3 bg-gray-100 rounded-full h-1.5">
                          <div className={`rounded-full h-1.5 ${pct>=70?'bg-green-500':pct>=50?'bg-yellow-500':'bg-red-500'}`}
                            style={{ width:`${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
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
