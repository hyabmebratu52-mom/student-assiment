import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import SubmissionComments from '../../components/SubmissionComments'
import toast from 'react-hot-toast'

export default function RubricGrade() {
  const { submissionId } = useParams()
  const navigate          = useNavigate()
  const [submission, setSubmission] = useState(null)
  const [criteria, setCriteria]     = useState([])
  const [scores, setScores]         = useState({})   // { criteriaId: { score, comment } }
  const [feedback, setFeedback]     = useState('')
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    api.get(`/submissions/${submissionId}`).then(async ({ data: sub }) => {
      setSubmission(sub)
      setFeedback(sub.grade?.feedback || '')
      // Load rubric criteria
      const { data: crit } = await api.get(`/assignments/${sub.assignment_id}/rubric`)
      setCriteria(crit)
      // Load existing rubric scores
      const { data: existing } = await api.get(`/submissions/${submissionId}/rubric-scores`)
      const map = {}
      existing.forEach(s => { map[s.rubric_criteria_id] = { score: s.score, comment: s.comment || '' } })
      setScores(map)
    }).finally(() => setLoading(false))
  }, [submissionId])

  const totalScore = criteria.reduce((s, c) => s + (parseInt(scores[c.id]?.score) || 0), 0)
  const totalMax   = criteria.reduce((s, c) => s + c.max_score, 0)

  function setScore(id, field, val) {
    setScores(s => ({ ...s, [id]: { ...(s[id] || {}), [field]: val } }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    for (const c of criteria) {
      const sc = scores[c.id]?.score
      if (sc === undefined || sc === '') return toast.error(`Enter score for: ${c.title}`)
      if (parseInt(sc) > c.max_score) return toast.error(`Score for "${c.title}" cannot exceed ${c.max_score}`)
    }
    setSaving(true)
    try {
      await api.post(`/submissions/${submissionId}/rubric-grade`, {
        scores: criteria.map(c => ({
          criteria_id: c.id,
          score:   parseInt(scores[c.id]?.score) || 0,
          comment: scores[c.id]?.comment || '',
        })),
        feedback,
      })
      toast.success('Graded successfully!')
      navigate(-1)
    } catch(err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  if (loading) return <Spinner />
  if (!submission) return <p>Not found.</p>

  const { assignment, student } = submission

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline mb-1 block">← Back</button>
        <h1 className="text-2xl font-bold">Rubric Grading</h1>
      </div>

      {/* Info */}
      <div className="card grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-gray-500">Assignment</p><p className="font-semibold">{assignment?.title}</p></div>
        <div><p className="text-gray-500">Student</p><p className="font-semibold">{student?.name}</p><p className="text-gray-400">{student?.student_id}</p></div>
        <div><p className="text-gray-500">Submitted</p><p className="font-semibold">{submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : '—'}</p></div>
        <div><p className="text-gray-500">Status</p><span className={`badge ${submission.is_late ? 'badge-red' : 'badge-green'}`}>{submission.is_late ? 'Late' : 'On time'}</span></div>
      </div>

      {/* Student answer */}
      <div className="card">
        <h2 className="font-semibold mb-3">Student's Answer</h2>
        {submission.content ? (
          <div className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap">{submission.content}</div>
        ) : <p className="text-gray-400 text-sm">No text answer.</p>}
        {submission.file_name && (
          <a href={`http://localhost:8000/storage/${submission.file_path}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 mt-3 text-blue-600 text-sm hover:underline">
            📎 {submission.file_name}
          </a>
        )}
      </div>

      {/* Rubric grading form */}
      {criteria.length === 0 ? (
        <div className="card bg-yellow-50 border-yellow-100 text-sm text-yellow-800">
          No rubric set for this assignment. <button onClick={() => navigate(`/teacher/assignments/${submission.assignment_id}/rubric`)} className="underline font-medium">Add rubric →</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">Grade by Criteria</h2>
              <span className={`font-bold text-lg ${totalScore === totalMax ? 'text-green-600' : 'text-blue-600'}`}>
                {totalScore} / {totalMax}
              </span>
            </div>

            <div className="space-y-5">
              {criteria.map(c => (
                <div key={c.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-medium text-gray-900">{c.title}</p>
                      {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
                    </div>
                    <span className="text-sm text-gray-500 shrink-0">Max: {c.max_score} pts</span>
                  </div>
                  {/* Score slider + input */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min="0" max={c.max_score}
                        value={scores[c.id]?.score ?? 0}
                        onChange={e => setScore(c.id, 'score', e.target.value)}
                        className="flex-1 accent-blue-600"
                      />
                      <input
                        type="number" min="0" max={c.max_score}
                        className="input w-16 text-center text-sm"
                        value={scores[c.id]?.score ?? ''}
                        onChange={e => setScore(c.id, 'score', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-500 rounded-full h-1.5 transition-all"
                        style={{ width: `${((scores[c.id]?.score || 0) / c.max_score) * 100}%` }} />
                    </div>
                  </div>
                  <input
                    className="input text-sm mt-2"
                    placeholder="Comment for this criterion (optional)"
                    value={scores[c.id]?.comment || ''}
                    onChange={e => setScore(c.id, 'comment', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <label className="label">Overall Feedback</label>
            <textarea className="input" rows={3} value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Write overall feedback for the student…" />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : submission.grade ? 'Update Grade' : 'Submit Grade'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {/* Discussion */}
      <div className="card">
        <SubmissionComments submissionId={submissionId} />
      </div>
    </div>
  )
}

function Spinner() { return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div> }
