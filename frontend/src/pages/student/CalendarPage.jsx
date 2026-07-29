import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { format, isSameDay } from 'date-fns'
import api from '../../api/axios'

export default function CalendarPage() {
  const [assignments, setAssignments] = useState([])
  const [selected, setSelected]       = useState(new Date())
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    api.get('/courses').then(async ({ data: enrolled }) => {
      const all = await Promise.all(enrolled.map(c => api.get(`/courses/${c.id}/assignments`).then(r => r.data)))
      setAssignments(all.flat())
    }).finally(() => setLoading(false))
  }, [])

  function assignmentsOnDay(date) {
    return assignments.filter(a => isSameDay(new Date(a.deadline), date))
  }

  function tileContent({ date, view }) {
    if (view !== 'month') return null
    const count = assignmentsOnDay(date).length
    if (!count) return null
    return <div className="flex justify-center mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 block"/></div>
  }

  if (loading) return <Spinner />

  const selected_assignments = assignmentsOnDay(selected)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">📅 የምደባ ቀን መቁጠሪያ</h1>
        <p className="text-gray-500 text-sm mt-1">ሁሉም የጊዜ ገደቦች አንድ ቦታ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-4">
          <style>{`
            .react-calendar { width:100%; border:none; font-family:inherit; }
            .react-calendar__tile { border-radius:8px; }
            .react-calendar__tile--active { background:#2563eb !important; color:white; }
            .react-calendar__tile--now { background:#eff6ff; }
          `}</style>
          <Calendar onChange={setSelected} value={selected} tileContent={tileContent} />
          <div className="flex gap-4 mt-4 text-xs text-gray-500 justify-center">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"/>የጊዜ ገደብ አለ</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">
              {format(selected, 'MMMM d, yyyy')}
            </h2>
            {selected_assignments.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">በዚህ ቀን ምንም ምደባ የለም</p>
            ) : (
              <div className="space-y-3">
                {selected_assignments.map(a => (
                  <div key={a.id} className={`p-3 rounded-lg border ${a.is_past_deadline ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                    <div className="flex gap-2 mb-1">
                      <span className={a.type==='group' ? 'badge-blue':'badge-gray'}>{a.type==='group'?'ቡድን':'ግለሰብ'}</span>
                      {a.is_past_deadline ? <span className="badge-red">ጊዜ አልፏል</span> : <span className="badge-green">ክፍት</span>}
                    </div>
                    <p className="font-medium text-gray-900 text-sm">{a.title}</p>
                    <p className="text-xs text-gray-500 mt-1">⏰ {format(new Date(a.deadline), 'h:mm a')}</p>
                    {a.my_submission
                      ? <span className="text-xs text-green-600 font-medium mt-1 block">✓ ቀርቧል</span>
                      : a.can_submit
                        ? <Link to={`/student/assignments/${a.id}/submit`} className="text-xs text-blue-600 font-medium mt-1 block hover:underline">አቅርብ →</Link>
                        : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-semibold mb-3">ቀጣይ 7 ቀናት</h2>
            {(() => {
              const now  = new Date()
              const week = new Date(now.getTime() + 7*24*60*60*1000)
              const upcoming = assignments
                .filter(a => new Date(a.deadline)>=now && new Date(a.deadline)<=week)
                .sort((a,b) => new Date(a.deadline)-new Date(b.deadline))
              if (!upcoming.length) return <p className="text-gray-400 text-sm text-center py-4">ቀጣይ ምደባ የለም</p>
              return upcoming.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-gray-400">{format(new Date(a.deadline), 'MMM d, h:mm a')}</p>
                  </div>
                  {!a.my_submission && (
                    <Link to={`/student/assignments/${a.id}/submit`} className="btn-primary btn-sm text-xs shrink-0">አቅርብ</Link>
                  )}
                </div>
              ))
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}

function Spinner() { return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div> }
