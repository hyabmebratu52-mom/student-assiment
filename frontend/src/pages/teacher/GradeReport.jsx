import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function GradeReport() {
  const { courseId } = useParams()
  const [report, setReport]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView]       = useState('summary') // summary | detail

  useEffect(() => {
    api.get(`/courses/${courseId}/grade-report`)
      .then(r => setReport(r.data))
      .catch(() => toast.error('Report መጫን አልተሳካም'))
      .finally(() => setLoading(false))
  }, [courseId])

  function exportCSV() {
    if (!report) return
    const headers = [
      'ስም', 'መ.ቁ', 'ኢሜል',
      ...report.assignments.map(a => `${a.title}(${a.max_score})`),
      'ጠቅላላ', 'ከፍተኛ', '%', 'ደረጃ'
    ]
    const rows = report.students.map(s => [
      s.name, s.student_id_no||'', s.email,
      ...s.assignments.map(a => a.score ?? ''),
      s.total_score, s.total_max, s.percentage+'%', s.letter_grade
    ])

    let csv = headers.map(h => `"${h}"`).join(',') + '\n'
    rows.forEach(r => { csv += r.map(v => `"${v}"`).join(',') + '\n' })

    const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `${report.course.code}_grade_report.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV ተወርዷል!')
  }

  const letterColor = (l) => {
    if (['A+','A','A-'].includes(l)) return 'text-green-700 bg-green-100'
    if (['B+','B','B-'].includes(l)) return 'text-blue-700 bg-blue-100'
    if (['C+','C','C-'].includes(l)) return 'text-yellow-700 bg-yellow-100'
    if (l === 'D') return 'text-orange-700 bg-orange-100'
    return 'text-red-700 bg-red-100'
  }

  const pctColor = (p) => {
    if (p >= 80) return 'bg-green-500'
    if (p >= 60) return 'bg-blue-500'
    if (p >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (loading) return <Spinner />
  if (!report)  return <p className="text-red-500">Report አልተገኘም</p>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to={`/teacher/courses/${courseId}`} className="text-sm text-blue-600 hover:underline">← {report.course.title}</Link>
          <h1 className="text-2xl font-bold mt-1">📊 Grade Report</h1>
          <p className="text-gray-500 text-sm">{report.course.code} · {report.students.length} ተማሪዎች · {report.assignments.length} ምደባዎች</p>
        </div>
        <button onClick={exportCSV} className="btn-success btn-sm shrink-0">⬇ CSV አውርድ</button>
      </div>

      {/* Class stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:'ጠቅላላ ተማሪዎች', value: report.students.length,                  icon:'👨‍🎓', color:'blue'   },
          { label:'Class Average',    value: report.class_avg.toFixed(1)+'%',        icon:'📊', color:'green'  },
          { label:'ከፍተኛ ነጥብ',       value: report.class_high.toFixed(1)+'%',       icon:'🏆', color:'purple' },
          { label:'ዝቅተኛ ነጥብ',       value: report.class_low.toFixed(1)+'%',        icon:'📉', color:'red'    },
        ].map((s,i) => (
          <div key={i} className="card text-center">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[{v:'summary',l:'ማጠቃለያ'},{v:'detail',l:'ዝርዝር'}].map(t => (
          <button key={t.v} onClick={() => setView(t.v)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view===t.v ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Summary view */}
      {view === 'summary' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">#</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">ተማሪ</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">ቀርቧል</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">ተገምግሟል</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">ያልቀረበ</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ነጥብ</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">%</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">ደረጃ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report.students.map((s, i) => (
                <tr key={s.student_id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-400 font-medium">{i+1}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.student_id_no || s.email}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-blue-600 font-medium">{s.submitted}</td>
                  <td className="px-4 py-3 text-center text-green-600 font-medium">{s.graded}</td>
                  <td className="px-4 py-3 text-center">
                    {s.missing > 0
                      ? <span className="badge-red">{s.missing}</span>
                      : <span className="badge-green">0</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {s.total_score} / {s.total_max}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className={`rounded-full h-1.5 ${pctColor(s.percentage)}`}
                          style={{ width:`${s.percentage}%` }} />
                      </div>
                      <span className="text-xs font-medium w-10 text-right">{s.percentage}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${letterColor(s.letter_grade)}`}>
                      {s.letter_grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail view — per assignment */}
      {view === 'detail' && (
        <div className="space-y-4">
          {report.students.map((s, i) => (
            <div key={s.student_id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">
                    {i+1}
                  </div>
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.student_id_no}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${letterColor(s.letter_grade)}`}>
                    {s.letter_grade}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{s.percentage}%</p>
                </div>
              </div>

              <div className="space-y-2">
                {s.assignments.map((a, j) => (
                  <div key={j} className="flex items-center gap-3 text-sm">
                    <div className="flex-1">
                      <span className="text-gray-700">{a.assignment_title}</span>
                      <span className={`ml-2 badge text-xs ${a.assignment_type==='group' ? 'badge-blue' : 'badge-gray'}`}>
                        {a.assignment_type==='group' ? 'ቡድን' : 'ግለሰብ'}
                      </span>
                      {a.group_name && <span className="text-xs text-blue-500 ml-1">({a.group_name})</span>}
                      {a.is_late && <span className="badge-red ml-1 text-xs">ዘግይቷል</span>}
                    </div>
                    <div className="text-right shrink-0 w-32">
                      {a.score !== null ? (
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5">
                            <div className={`rounded-full h-1.5 ${pctColor(a.percentage)}`}
                              style={{ width:`${a.percentage}%` }} />
                          </div>
                          <span className="font-semibold text-gray-900 w-16 text-right">
                            {a.score}/{a.max_score}
                          </span>
                        </div>
                      ) : a.status === 'not_submitted' ? (
                        <span className="text-gray-400 text-xs">አልቀረበም</span>
                      ) : (
                        <span className="badge-yellow text-xs">በመጠባበቅ</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">ጠቅላላ</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-100 rounded-full h-2">
                    <div className={`rounded-full h-2 ${pctColor(s.percentage)}`}
                      style={{ width:`${s.percentage}%` }} />
                  </div>
                  <span className="font-bold text-gray-900">{s.total_score}/{s.total_max}</span>
                  <span className="text-gray-500">{s.percentage}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Spinner() { return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div> }
