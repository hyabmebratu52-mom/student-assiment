import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import SubmissionComments from '../../components/SubmissionComments'
import toast from 'react-hot-toast'

export default function GradeSubmission() {
  const { submissionId } = useParams()
  const navigate = useNavigate()
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [form, setForm]             = useState({ score:'', feedback:'' })
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    api.get(`/submissions/${submissionId}`).then(({ data }) => {
      setSubmission(data)
      if (data.grade) setForm({ score: data.grade.score, feedback: data.grade.feedback || '' })
    }).finally(() => setLoading(false))
  }, [submissionId])

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true)
    try {
      const res = submission.grade
        ? await api.put(`/grades/${submission.grade.id}`, form)
        : await api.post(`/submissions/${submissionId}/grade`, form)

      const d = res.data
      if (d.group_graded && d.members_graded > 1) {
        toast.success(`ነጥብ ተሰጥቷል! ${d.members_graded} የቡድን አባላት ሁሉ ነጥብ ደርሷቸዋል ✓`)
      } else {
        toast.success('ነጥብ ተቀምጧል!')
      }
      navigate(-1)
    } catch (err) { toast.error(err.response?.data?.message || 'አልተሳካም') }
    finally { setSaving(false) }
  }

  if (loading) return <Spinner />
  if (!submission) return <p>አልተገኘም።</p>

  const { assignment, student } = submission

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline mb-2 block">← ወደ ምላሾች ተመለስ</button>
        <h1 className="text-2xl font-bold">ምደባ ገምግም</h1>
      </div>

      {/* Info */}
      <div className="card grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-gray-500">ምደባ</p><p className="font-semibold">{assignment?.title}</p></div>
        <div><p className="text-gray-500">ተማሪ</p><p className="font-semibold">{student?.name}</p><p className="text-gray-400">{student?.student_id || student?.email}</p></div>
        <div><p className="text-gray-500">የቀረበ ጊዜ</p><p className="font-semibold">{submission.submitted_at ? new Date(submission.submitted_at).toLocaleString('am-ET') : '—'}</p></div>
        <div><p className="text-gray-500">ሁኔታ</p><span className={`badge ${submission.is_late ? 'badge-red' : 'badge-green'}`}>{submission.is_late ? 'ዘግይቷል' : 'በጊዜ'}</span></div>
      </div>

      {/* Student answer */}
      <div className="card">
        <h2 className="font-semibold mb-3">የተማሪ መልስ</h2>
        {submission.content
          ? <div className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap">{submission.content}</div>
          : <p className="text-gray-400 text-sm">ምንም የጽሑፍ መልስ የለም።</p>}
        {submission.file_name && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span>📎</span>
              <span className="text-blue-700 font-medium">{submission.file_name}</span>
            </div>
            <a href={`http://localhost:8000/storage/${submission.file_path}`} target="_blank" rel="noreferrer" className="btn-primary btn-sm">አውርድ</a>
          </div>
        )}
      </div>

      {/* Grading form */}
      <div className="card">
        <h2 className="font-semibold mb-4">{submission.grade ? 'ነጥብ አዘምን' : 'ነጥብ ስጥ'}</h2>

        {/* Group notice */}
        {submission.group && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p className="font-semibold">👥 ቡድን ምደባ — {submission.group.name}</p>
            <p className="mt-1">
              ➜ ይህን ነጥብ ሲሰጡ <strong>ሁሉም የቡድን አባላት</strong> ያው ነጥብ ይደርሳቸዋል + notification ይላካሉ።
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">ነጥብ <span className="text-gray-400">(ከ {assignment?.max_score} ውስጥ)</span></label>
            <input type="number" min="0" max={assignment?.max_score} step="0.5"
              className="input w-40" value={form.score}
              onChange={e => setForm({...form, score:e.target.value})} required />
          </div>
          <div>
            <label className="label">አስተያየት <span className="text-gray-400">(አስፈላጊ ካልሆነ ይተው)</span></label>
            <textarea className="input" rows={4} placeholder="ለተማሪው አስተያየት ይጻፉ…"
              value={form.feedback} onChange={e => setForm({...form, feedback:e.target.value})} />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'እየተቀመጠ…' : submission.grade ? 'ነጥብ አዘምን' : 'ነጥብ ስጥ'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">ሰርዝ</button>
          </div>
        </form>
      </div>

      {/* Discussion */}
      <div className="card">
        <SubmissionComments submissionId={submissionId} />
      </div>
    </div>
  )
}

function Spinner() { return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div> }
