import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function SubmitAssignment() {
  const { assignmentId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [assignment, setAssignment] = useState(null)
  const [myGroups, setMyGroups]     = useState([])
  const [existing, setExisting]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [form, setForm]             = useState({ content:'', group_id:'' })
  const [file, setFile]             = useState(null)
  const [saving, setSaving]         = useState(false)
  const [loadError, setLoadError]   = useState('')

  useEffect(() => {
    api.get(`/assignments/${assignmentId}`).then(async ({ data }) => {
      setAssignment(data)
      setExisting(data.my_submission || null)
      if (data.my_submission) setForm({ content: data.my_submission.content||'', group_id: data.my_submission.group_id||'' })
      if (data.type === 'group') {
        try {
          const gRes = await api.get(`/courses/${data.course_id}/groups`)
          setMyGroups(gRes.data.filter(g => g.members?.some(m => m.id === user.id)))
        } catch (_) {}
      }
    }).catch(err => {
      console.error('Assignment load error:', err)
      setLoadError(err.response?.data?.message || 'ምደባ ማምጣት አልተሳካም')
      toast.error('ምደባ መጫን አልተሳካም')
    }).finally(() => setLoading(false))
  }, [assignmentId])

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true)
    try {
      const fd = new FormData()
      if (form.content)  fd.append('content', form.content)
      if (form.group_id) fd.append('group_id', form.group_id)
      if (file)          fd.append('file', file)
      await api.post(`/assignments/${assignmentId}/submissions`, fd, { headers:{ 'Content-Type':'multipart/form-data' } })
      toast.success(existing ? 'እንደገና ቀርቧል!' : 'ምደባ ቀርቧል!')
      navigate(-1)
    } catch (err) { toast.error(err.response?.data?.message || 'ማቅረብ አልተሳካም') }
    finally { setSaving(false) }
  }

  if (loading) return <Spinner />
  if (loadError) return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => window.history.back()} className="text-sm text-blue-600 hover:underline mb-4 block">← ወደ ኋላ</button>
      <div className="card bg-red-50 border-red-200 text-center py-10">
        <p className="text-4xl mb-3">❌</p>
        <p className="text-red-700 font-semibold">{loadError}</p>
        <p className="text-red-500 text-sm mt-2">ትምህርቱ ውስጥ ተመዝግበዋል?</p>
      </div>
    </div>
  )
  if (!assignment) return (
    <div className="max-w-2xl mx-auto card text-center py-10">
      <p className="text-gray-400">ምደባ አልተገኘም</p>
    </div>
  )

  const isPast   = assignment.is_past_deadline
  const canSubmit = assignment.can_submit

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline mb-2 block">← ወደ ኋላ</button>
        <h1 className="text-2xl font-bold">{existing ? 'ምደባ እንደገና አቅርብ' : 'ምደባ አቅርብ'}</h1>
      </div>

      {/* Assignment info */}
      <div className="card bg-blue-50 border-blue-100">
        <div className="flex flex-wrap gap-2 mb-2">
          <span className={assignment.type==='group' ? 'badge-blue' : 'badge-gray'}>{assignment.type==='group'?'ቡድን':'ግለሰብ'}</span>
          {isPast && <span className="badge-yellow">ዘግይቶ ቀርቧል</span>}
        </div>
        <h2 className="font-semibold text-gray-900">{assignment.title}</h2>
        <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <span>📅 የጊዜ ገደብ: {new Date(assignment.deadline).toLocaleString('am-ET')}</span>
          <span>🏆 ከፍተኛ: {assignment.max_score} ነጥብ</span>
        </div>
        {assignment.attachment && (
          <a href={`http://localhost:8000/storage/${assignment.attachment}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-blue-600 text-sm hover:underline">
            📎 የምደባ ፋይል አውርድ
          </a>
        )}
      </div>

      {!canSubmit && !existing ? (
        <div className="card bg-red-50 border-red-100 text-center py-8">
          <p className="text-red-600 font-semibold">⏰ የጊዜ ገደቡ አልፏል</p>
          <p className="text-red-500 text-sm mt-1">ለዚህ ምደባ ዘግይቶ ማቅረብ አይፈቀድም።</p>
        </div>
      ) : (
        <div className="card">
          <h2 className="font-semibold mb-4">መልስዎ</h2>
          <form onSubmit={handleSubmit} className="space-y-4">

            {assignment.type === 'group' && (
              <div>
                <label className="label">ቡድን ይምረጡ</label>
                {myGroups.length === 0 ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                    ምንም ቡድን ውስጥ አልገቡም።{' '}
                    <Link to={`/student/courses/${assignment.course_id}/groups`} className="font-medium underline">ቡድን ፍጠሩ ወይም ይቀላቀሉ</Link>
                  </div>
                ) : (
                  <select className="input" value={form.group_id} onChange={e => setForm({...form, group_id:e.target.value})}>
                    <option value="">ያለ ቡድን አቅርብ</option>
                    {myGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.members?.length} አባላት)</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div>
              <label className="label">መልስ / ማስታወሻ <span className="text-gray-400">(ፋይል ካቀረቡ አስፈላጊ አይደለም)</span></label>
              <textarea className="input" rows={6} placeholder="መልስዎን ወይም ማስታወሻ ይጻፉ…"
                value={form.content} onChange={e => setForm({...form, content:e.target.value})} />
            </div>

            <div>
              <label className="label">ፋይል አቅርብ <span className="text-gray-400">(አስፈላጊ ካልሆነ ይተው)</span></label>
              <input type="file" className="input py-1.5" onChange={e => setFile(e.target.files[0])} />
              {existing?.file_name && !file && (
                <p className="text-xs text-gray-400 mt-1">አሁን ያለ ፋይል: {existing.file_name}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button type="submit"
                disabled={saving}
                className="btn-primary">
                {saving ? 'እየቀረበ…' : existing ? 'እንደገና አቅርብ' : 'ምደባ አቅርብ'}
              </button>
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary">ሰርዝ</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function Spinner() { return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div> }
