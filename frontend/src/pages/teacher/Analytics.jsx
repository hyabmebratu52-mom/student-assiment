import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import api from '../../api/axios'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function Analytics() {
  const { courseId } = useParams()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState('overview')

  useEffect(() => {
    api.get(`/courses/${courseId}/analytics`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [courseId])

  if (loading) return <Spinner />
  if (!data)   return <p className="text-red-500">Failed to load analytics.</p>

  const submissionRateData = data.assignment_stats.map(a => ({
    name:  a.title.length > 20 ? a.title.slice(0, 20) + '…' : a.title,
    rate:  a.submission_rate,
    avg:   a.avg_score ?? 0,
    missing: a.missing_count,
  }))

  const statusPie = [
    { name: 'Graded',    value: data.assignment_stats.reduce((s,a)=>s+a.graded_count,0) },
    { name: 'Submitted', value: data.assignment_stats.reduce((s,a)=>s+(a.submitted_count-a.graded_count),0) },
    { name: 'Missing',   value: data.assignment_stats.reduce((s,a)=>s+a.missing_count,0) },
  ].filter(x => x.value > 0)

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/teacher/courses/${courseId}`} className="text-sm text-blue-600 hover:underline">← {data.course.title}</Link>
        <h1 className="text-2xl font-bold mt-1">Course Analytics</h1>
        <p className="text-gray-500 text-sm">{data.course.code}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Students"    value={data.total_students}    icon="👨‍🎓" color="blue" />
        <StatCard label="Assignments" value={data.total_assignments}  icon="📝" color="purple" />
        <StatCard label="Avg Sub Rate"
          value={data.assignment_stats.length
            ? Math.round(data.assignment_stats.reduce((s,a)=>s+a.submission_rate,0)/data.assignment_stats.length)+'%'
            : '—'}
          icon="📬" color="green" />
        <StatCard label="Total Missing"
          value={data.assignment_stats.reduce((s,a)=>s+a.missing_count,0)}
          icon="⚠️" color="red" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {['overview','assignments','students'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${tab===t ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submission rate bar chart */}
          <div className="card">
            <h2 className="font-semibold mb-4">Submission Rate per Assignment (%)</h2>
            {submissionRateData.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={submissionRateData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => v + '%'} />
                  <Bar dataKey="rate" fill="#3b82f6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Avg score bar */}
          <div className="card">
            <h2 className="font-semibold mb-4">Average Score per Assignment</h2>
            {submissionRateData.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={submissionRateData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="avg" fill="#10b981" radius={[4,4,0,0]} name="Avg Score" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Status pie */}
          <div className="card">
            <h2 className="font-semibold mb-4">Overall Submission Status</h2>
            {statusPie.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                    {statusPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Missing submissions */}
          <div className="card">
            <h2 className="font-semibold mb-4">Missing Submissions per Assignment</h2>
            {submissionRateData.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={submissionRateData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="missing" fill="#ef4444" radius={[4,4,0,0]} name="Missing" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {tab === 'assignments' && (
        <div className="space-y-4">
          {data.assignment_stats.map(a => (
            <div key={a.id} className="card">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{a.title}</h3>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className={a.type==='group' ? 'badge-blue' : 'badge-gray'}>{a.type}</span>
                    <span className="badge-gray">Due: {new Date(a.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
                <Link to={`/teacher/assignments/${a.id}/submissions`} className="btn-secondary btn-sm shrink-0">View</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                {[
                  { label: 'Total',     value: a.total_students,  bg: 'bg-gray-50' },
                  { label: 'Submitted', value: a.submitted_count, bg: 'bg-blue-50' },
                  { label: 'Graded',    value: a.graded_count,    bg: 'bg-green-50' },
                  { label: 'Late',      value: a.late_count,      bg: 'bg-yellow-50' },
                  { label: 'Missing',   value: a.missing_count,   bg: 'bg-red-50' },
                ].map(s => (
                  <div key={s.label} className={`rounded-lg p-3 ${s.bg}`}>
                    <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>
              {/* Submission rate bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Submission rate</span>
                  <span className="font-medium">{a.submission_rate}%</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 rounded-full h-2 transition-all" style={{ width: `${a.submission_rate}%` }} />
                </div>
              </div>
              {a.avg_score !== null && (
                <p className="text-sm text-gray-500 mt-2">
                  Avg score: <span className="font-semibold text-gray-800">{a.avg_score} / {a.max_score}</span>
                  {' '}· Min: {a.min_score_given} · Max: {a.max_score_given}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'students' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Student</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Submitted</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Graded</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Missing</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Total Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.student_summary.map(s => (
                <tr key={s.id} className={`hover:bg-gray-50 ${s.missing_count > 0 ? '' : ''}`}>
                  <td className="px-5 py-3">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.student_id || s.email}</p>
                  </td>
                  <td className="px-4 py-3 text-center">{s.submitted_count}</td>
                  <td className="px-4 py-3 text-center">{s.graded_count}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={s.missing_count > 0 ? 'badge-red' : 'badge-green'}>
                      {s.missing_count}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">{s.total_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, color }) {
  const colors = { blue:'bg-blue-50 text-blue-600', green:'bg-green-50 text-green-600', purple:'bg-purple-50 text-purple-600', red:'bg-red-50 text-red-600' }
  return (
    <div className="card flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${colors[color]}`}>{icon}</div>
      <div><p className="text-xl font-bold">{value}</p><p className="text-xs text-gray-500">{label}</p></div>
    </div>
  )
}
function Empty() { return <p className="text-gray-400 text-center py-8 text-sm">No data yet</p> }
function Spinner() { return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div> }
