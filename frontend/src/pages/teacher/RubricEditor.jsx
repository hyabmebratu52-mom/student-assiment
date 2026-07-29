import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function RubricEditor() {
  const { assignmentId } = useParams()
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState(null)
  const [criteria, setCriteria]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    Promise.all([
      api.get(`/assignments/${assignmentId}`),
      api.get(`/assignments/${assignmentId}/rubric`),
    ]).then(([a, r]) => {
      setAssignment(a.data)
      setCriteria(r.data.length ? r.data : [{ title: '', description: '', max_score: 10 }])
    }).finally(() => setLoading(false))
  }, [assignmentId])

  function addRow() { setCriteria([...criteria, { title: '', description: '', max_score: 10 }]) }
  function removeRow(i) { setCriteria(criteria.filter((_, idx) => idx !== i)) }
  function update(i, field, val) { setCriteria(criteria.map((c, idx) => idx === i ? { ...c, [field]: val } : c)) }

  const total = criteria.reduce((s, c) => s + (parseInt(c.max_score) || 0), 0)

  async function handleSave() {
    for (const c of criteria) {
      if (!c.title.trim()) return toast.error('All criteria need a title')
      if (!c.max_score || c.max_score < 1) return toast.error('All criteria need a max score ≥ 1')
    }
    setSaving(true)
    try {
      await api.post(`/assignments/${assignmentId}/rubric`, { criteria })
      toast.success(`Rubric saved! Total: ${total} pts`)
      navigate(-1)
    } catch(err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline mb-1 block">← Back</button>
        <h1 className="text-2xl font-bold">Rubric Editor</h1>
        <p className="text-gray-500 text-sm mt-0.5">{assignment?.title}</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Criteria</h2>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${total !== (assignment?.max_score || 0) ? 'text-orange-600' : 'text-green-600'}`}>
              Total: {total} pts
              {total !== (assignment?.max_score || 0) && ` (assignment max: ${assignment?.max_score})`}
            </span>
            <button onClick={addRow} className="btn-secondary btn-sm">+ Add Criterion</button>
          </div>
        </div>

        <div className="space-y-3">
          {criteria.map((c, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </span>
                <input
                  className="input flex-1"
                  placeholder="Criterion title (e.g. Code Quality)"
                  value={c.title}
                  onChange={e => update(i, 'title', e.target.value)}
                />
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number" min="1" max="1000"
                    className="input w-20 text-center"
                    value={c.max_score}
                    onChange={e => update(i, 'max_score', e.target.value)}
                  />
                  <span className="text-xs text-gray-400">pts</span>
                </div>
                <button onClick={() => removeRow(i)} disabled={criteria.length <= 1}
                  className="text-red-400 hover:text-red-600 disabled:opacity-30 shrink-0">✕</button>
              </div>
              <input
                className="input text-sm"
                placeholder="Description (optional) — e.g. Code is clean, follows conventions"
                value={c.description || ''}
                onChange={e => update(i, 'description', e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save Rubric'}
          </button>
          <button onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
        </div>
      </div>

      <div className="card bg-blue-50 border-blue-100 text-sm text-blue-800">
        <p className="font-medium mb-1">ℹ️ How rubrics work</p>
        <p>Saving a rubric will update the assignment max score to match the total ({total} pts). Teachers grade each criterion separately and the total is calculated automatically.</p>
      </div>
    </div>
  )
}

function Spinner() { return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div> }
