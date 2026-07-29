import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function PlagiarismCheck() {
  const { assignmentId } = useParams()
  const navigate          = useNavigate()
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)

  async function runCheck() {
    setLoading(true)
    try {
      const { data } = await api.get(`/assignments/${assignmentId}/plagiarism-check`)
      setResult(data)
      setChecked(true)
      if (data.suspicious_pairs === 0) {
        toast.success('ምንም ተመሳሳይነት አልተገኘም ✓')
      } else {
        toast.error(`${data.suspicious_pairs} ተጠርጣሪ ጥንዶች ተገኙ!`)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check አልተሳካም')
    } finally {
      setLoading(false)
    }
  }

  const riskColor = (level) => {
    if (level === 'ከፍተኛ ስጋት')   return 'bg-red-100 text-red-800 border-red-200'
    if (level === 'መካከለኛ ስጋት')  return 'bg-orange-100 text-orange-800 border-orange-200'
    if (level === 'ዝቅተኛ ስጋት')  return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-green-100 text-green-800 border-green-200'
  }

  const similarityBar = (pct) => {
    if (pct >= 80) return 'bg-red-500'
    if (pct >= 50) return 'bg-orange-500'
    if (pct >= 20) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline mb-2 block">← ወደ ኋላ</button>
        <h1 className="text-2xl font-bold">🔍 AI Similarity Check</h1>
        <p className="text-gray-500 text-sm mt-1">የተማሪዎች submissions ተመሳሳይነት ይፈትሻል</p>
      </div>

      {/* Info card */}
      <div className="card bg-blue-50 border-blue-100">
        <h3 className="font-semibold text-blue-900 mb-2">እንዴት ይሰራል?</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• ሁሉም text submissions አንዳቸው ከሌላው ጋር ይወዳደራሉ</p>
          <p>• 3 algorithm ይጠቀማል: similar_text, Jaccard, N-gram</p>
          <p>• ከ 20% በላይ ተመሳሳይነት ካለ ይታያል</p>
          <div className="flex gap-3 mt-3 flex-wrap">
            <span className="badge bg-red-100 text-red-800">80%+ = ከፍተኛ ስጋት</span>
            <span className="badge bg-orange-100 text-orange-800">50-79% = መካከለኛ</span>
            <span className="badge bg-yellow-100 text-yellow-800">20-49% = ዝቅተኛ</span>
          </div>
        </div>
      </div>

      {/* Run button */}
      <div className="card text-center py-8">
        {!checked ? (
          <>
            <p className="text-4xl mb-4">🤖</p>
            <p className="text-gray-600 mb-6">AI Similarity Check ለማሄድ ይጫኑ</p>
            <button onClick={runCheck} disabled={loading} className="btn-primary px-8 py-3 text-base">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  እየፈተሸ ነው…
                </span>
              ) : '🔍 Similarity Check ጀምር'}
            </button>
          </>
        ) : (
          <button onClick={runCheck} disabled={loading} className="btn-secondary btn-sm">
            🔄 እንደገና ፈትሽ
          </button>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'ምደባ', value: result.assignment, small: true },
              { label: 'ጠቅላላ Submissions', value: result.total_submissions },
              { label: 'የተፈተሹ ጥንዶች', value: result.pairs_checked },
              { label: 'ተጠርጣሪ ጥንዶች', value: result.suspicious_pairs,
                red: result.suspicious_pairs > 0 },
            ].map((s, i) => (
              <div key={i} className={`card text-center py-4 ${s.red ? 'bg-red-50 border-red-200' : ''}`}>
                <p className={`font-bold ${s.small ? 'text-sm' : 'text-2xl'} ${s.red ? 'text-red-700' : 'text-gray-900'}`}>
                  {s.value}
                </p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {result.results.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-green-700 font-semibold text-lg">ምንም ጉልህ ተመሳሳይነት አልተገኘም!</p>
              <p className="text-gray-500 text-sm mt-1">ሁሉም submissions ልዩ ናቸው</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-900">ተጠርጣሪ ጥንዶች ({result.results.length})</h2>
              {result.results.map((r, i) => (
                <div key={i} className={`card border ${riskColor(r.risk_level)}`}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <span className={`badge border ${riskColor(r.risk_level)}`}>
                        {r.risk_level}
                      </span>
                    </div>
                    <span className={`text-2xl font-bold ${
                      r.similarity >= 80 ? 'text-red-600' :
                      r.similarity >= 50 ? 'text-orange-600' : 'text-yellow-600'
                    }`}>
                      {r.similarity}%
                    </span>
                  </div>

                  {/* Similarity bar */}
                  <div className="bg-gray-200 rounded-full h-2 mb-4">
                    <div className={`rounded-full h-2 transition-all ${similarityBar(r.similarity)}`}
                      style={{ width: `${r.similarity}%` }} />
                  </div>

                  {/* Students */}
                  <div className="grid grid-cols-2 gap-4">
                    {[r.student1, r.student2].map((s, j) => (
                      <div key={j} className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="font-semibold text-gray-900">{s.name}</p>
                        {s.student_id && <p className="text-xs text-gray-500">መ.ቁ: {s.student_id}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
