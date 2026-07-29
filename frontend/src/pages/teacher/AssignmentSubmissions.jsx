import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function AssignmentSubmissions() {
  const { assignmentId } = useParams()
  const [assignment, setAssignment]   = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [allStudents, setAllStudents] = useState([])
  const [loading, setLoading]         = useState(true)
  const [filter, setFilter]           = useState('all')
  const [search, setSearch]           = useState('')
  const [showMissing, setShowMissing] = useState(false)
  const [zeroing, setZeroing]         = useState(false)

  async function handleAutoZero() {
    if (!confirm(`ምደባ ያልቀረቡ ${missingStudents.length} ተማሪዎች 0 ነጥብ ይሰጣቸዋል። እርግጠኛ ነዎት?`)) return
    setZeroing(true)
    try {
      const { data } = await api.post(`/assignments/${assignmentId}/auto-zero`)
      toast.success(data.message)
      // Reload submissions
      const s = await api.get(`/assignments/${assignmentId}/submissions`)
      setSubmissions(s.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'አልተሳካም')
    } finally { setZeroing(false) }
  }

  useEffect(() => {
    Promise.all([
      api.get(`/assignments/${assignmentId}`),
      api.get(`/assignments/${assignmentId}/submissions`),
    ]).then(async ([a, s]) => {
      setAssignment(a.data)
      setSubmissions(s.data)
      // Load all students in this course
      try {
        const st = await api.get(`/courses/${a.data.course?.id}/students`)
        setAllStudents(st.data)
      } catch (_) {}
    }).finally(() => setLoading(false))
  }, [assignmentId])

  function handleExport() {
    fetch(`http://localhost:8000/api/assignments/${assignmentId}/export/grades`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.blob()).then(blob => {
      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href = url; a.download = `ምደባ_ነጥቦች_${assignmentId}.csv`; a.click()
      URL.revokeObjectURL(url); toast.success('ተወርዷል!')
    }).catch(() => toast.error('ማውረድ አልተሳካም'))
  }

  if (loading) return <Spinner />
  if (!assignment) return <p className="text-red-500">አልተገኘም።</p>

  // Students who haven't submitted
  const submittedIds = new Set(submissions.map(s => s.student?.id))
  const missingStudents = allStudents.filter(s => !submittedIds.has(s.id))

  const filtered = submissions
    .filter(s => filter === 'all' || s.status === filter)
    .filter(s => !search ||
      s.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.student?.student_id?.toLowerCase().includes(search.toLowerCase()))

  const stats = {
    total:   submissions.length,
    graded:  submissions.filter(s => s.status === 'graded').length,
    late:    submissions.filter(s => s.is_late).length,
    pending: submissions.filter(s => s.status === 'submitted' || s.status === 'late').length,
    missing: missingStudents.length,
  }

  // Group submissions together
  const groupedSubs = {}
  filtered.forEach(sub => {
    if (sub.group?.id) {
      if (!groupedSubs[sub.group.id]) {
        groupedSubs[sub.group.id] = { group: sub.group, submissions: [] }
      }
      groupedSubs[sub.group.id].submissions.push(sub)
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to={`/teacher/courses/${assignment.course?.id}/assignments`} className="text-sm text-blue-600 hover:underline">
          ← {assignment.course?.title}
        </Link>
        <div className="flex items-start justify-between gap-3 mt-1">
          <div>
            <h1 className="text-2xl font-bold">{assignment.title}</h1>
            <div className="flex gap-2 mt-1 flex-wrap">
              <span className={assignment.type==='group' ? 'badge-blue' : 'badge-gray'}>
                {assignment.type==='group' ? '👥 ቡድን' : '👤 ግለሰብ'}
              </span>
              {assignment.is_past_deadline
                ? <span className="badge-red">ጊዜ አልፏል</span>
                : <span className="badge-green">ክፍት</span>}
              <span className="badge-gray">ከፍተኛ: {assignment.max_score} ነጥብ</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <Link to={`/teacher/assignments/${assignment.id}/rubric`}     className="btn-secondary btn-sm">📋 ሩብሪክ</Link>
            <Link to={`/teacher/assignments/${assignment.id}/plagiarism`} className="btn-secondary btn-sm">🔍 AI Check</Link>
            <button onClick={handleExport} className="btn-success btn-sm">⬇ CSV አውርድ</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label:'ጠቅላላ',      value: stats.total,   bg:'bg-gray-50',   text:'text-gray-900' },
          { label:'በመጠባበቅ',   value: stats.pending, bg:'bg-yellow-50', text:'text-yellow-700' },
          { label:'ተገምግሟል',   value: stats.graded,  bg:'bg-green-50',  text:'text-green-700' },
          { label:'ዘግይቷል',    value: stats.late,    bg:'bg-red-50',    text:'text-red-700' },
          { label:'አልቀረቡም',   value: stats.missing, bg: stats.missing > 0 ? 'bg-orange-50' : 'bg-gray-50',
            text: stats.missing > 0 ? 'text-orange-700' : 'text-gray-900' },
        ].map(s => (
          <div key={s.label} className={`card text-center py-4 ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Missing students alert */}
      {missingStudents.length > 0 && (
        <div className="card bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-orange-600 text-lg">⚠️</span>
              <div>
                <p className="font-semibold text-orange-800">
                  {missingStudents.length} ተማሪ ምደባ አልቀረቡም
                </p>
                <p className="text-sm text-orange-600">
                  እነዚህ ተማሪዎች ገና submission አላቀረቡም
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {assignment.is_past_deadline && missingStudents.length > 0 && (
                <button
                  onClick={handleAutoZero}
                  disabled={zeroing}
                  className="btn-danger btn-sm"
                >
                  {zeroing ? 'እየሰጠ…' : `0️⃣ ሁሉም 0 ነጥብ ስጥ (${missingStudents.length})`}
                </button>
              )}
              <button
                onClick={() => setShowMissing(!showMissing)}
                className="btn-secondary btn-sm"
              >
                {showMissing ? 'ደብቅ' : 'ይዩ'}
              </button>
            </div>
          </div>

          {showMissing && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {missingStudents.map(s => (
                <div key={s.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
                  <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-700">
                    {s.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.student_id || s.email}</p>
                  </div>
                  <span className="badge-red ml-auto text-xs">አልቀረቡም</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter + Search */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          className="input w-48 text-sm"
          placeholder="🔍 ተማሪ ፈልግ…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {[
          {v:'all',       l:'ሁሉም'},
          {v:'submitted', l:'ቀርቧል'},
          {v:'late',      l:'ዘግይቷል'},
          {v:'graded',    l:'ተገምግሟል'},
        ].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`btn btn-sm ${filter===f.v ? 'btn-primary' : 'btn-secondary'}`}>
            {f.l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">ምንም ምላሽ የለም።</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">ተማሪ</th>
                {assignment.type === 'group' && (
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ቡድን</th>
                )}
                <th className="text-left px-4 py-3 font-medium text-gray-600">የቀረበ ጊዜ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ሁኔታ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ነጥብ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ተግባር</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(sub => (
                <tr
                  key={sub.id}
                  className={`hover:bg-gray-50 ${sub.is_late && sub.status !== 'graded' ? 'bg-red-50' : ''}`}
                >
                  <td className="px-5 py-3">
                    <p className="font-medium">{sub.student?.name}</p>
                    <p className="text-xs text-gray-400">{sub.student?.student_id || sub.student?.email}</p>
                    {sub.is_late && (
                      <span className="badge-red text-xs mt-1 inline-block">⚠ ዘግይቷል</span>
                    )}
                  </td>

                  {/* Group column */}
                  {assignment.type === 'group' && (
                    <td className="px-4 py-3">
                      {sub.group ? (
                        <span className="badge-blue">👥 {sub.group.name}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">ቡድን የለም</span>
                      )}
                    </td>
                  )}

                  <td className="px-4 py-3 text-gray-500">
                    {sub.submitted_at
                      ? new Date(sub.submitted_at).toLocaleString('am-ET')
                      : '—'}
                  </td>

                  <td className="px-4 py-3">
                    <span className={
                      sub.status==='graded'    ? 'badge-green' :
                      sub.status==='late'      ? 'badge-red'   :
                      sub.status==='submitted' ? 'badge-blue'  : 'badge-gray'
                    }>
                      {sub.status==='graded'    ? 'ተገምግሟል' :
                       sub.status==='late'      ? 'ዘግይቷል'  :
                       sub.status==='submitted' ? 'ቀርቧል'   : 'ረቂቅ'}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {sub.grade ? (
                      <div>
                        <span className="font-semibold text-gray-900">
                          {sub.grade.score} / {assignment.max_score}
                        </span>
                        <div className="w-16 bg-gray-100 rounded-full h-1 mt-1">
                          <div
                            className="bg-blue-500 rounded-full h-1"
                            style={{ width: `${(sub.grade.score/assignment.max_score)*100}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to={`/teacher/submissions/${sub.id}/grade`} className="btn-primary btn-sm">
                        {sub.grade ? 'እንደገና' : 'ገምግም'}
                      </Link>
                      <Link to={`/teacher/submissions/${sub.id}/rubric-grade`} className="btn-secondary btn-sm">
                        ሩብሪክ
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  )
}
