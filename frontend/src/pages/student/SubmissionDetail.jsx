import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../api/axios'
import SubmissionComments from '../../components/SubmissionComments'

export default function SubmissionDetail() {
  const { submissionId } = useParams()
  const navigate          = useNavigate()
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    api.get(`/submissions/${submissionId}`)
      .then(({ data }) => setSubmission(data))
      .finally(() => setLoading(false))
  }, [submissionId])

  if (loading) return <Spinner />
  if (!submission) return (
    <div className="card text-center py-10 text-gray-400">ምላሽ አልተገኘም</div>
  )

  const { assignment, grade, group } = submission

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <div>
        <button onClick={() => navigate(-1)}
          className="text-sm text-blue-600 hover:underline mb-2 block">
          ← ወደ ኋላ
        </button>
        <h1 className="text-2xl font-bold">የምደባ ዝርዝር</h1>
      </div>

      {/* Assignment info */}
      <div className="card bg-blue-50 border-blue-100">
        <div className="flex flex-wrap gap-2 mb-2">
          <span className={assignment?.type === 'group' ? 'badge-blue' : 'badge-gray'}>
            {assignment?.type === 'group' ? '👥 ቡድን' : '👤 ግለሰብ'}
          </span>
          <span className={`badge ${submission.is_late ? 'badge-red' : 'badge-green'}`}>
            {submission.is_late ? '⚠️ ዘግይቶ ቀርቧል' : '✅ በጊዜ ቀርቧል'}
          </span>
          <span className={`badge ${
            submission.status === 'graded'    ? 'badge-green' :
            submission.status === 'submitted' ? 'badge-blue'  : 'badge-yellow'
          }`}>
            {submission.status === 'graded'    ? '🏆 ተገምግሟል' :
             submission.status === 'submitted' ? '📬 ቀርቧል'   : '⏳ በመጠባበቅ'}
          </span>
        </div>
        <h2 className="font-semibold text-gray-900 text-lg">{assignment?.title}</h2>
        {group && (
          <p className="text-sm text-blue-700 mt-1">👥 ቡድን: {group.name}</p>
        )}
        {submission.submitted_at && (
          <p className="text-xs text-gray-500 mt-2">
            📅 የቀረበ: {new Date(submission.submitted_at).toLocaleString('am-ET')}
          </p>
        )}
      </div>

      {/* My answer */}
      <div className="card">
        <h2 className="font-semibold mb-3">የእኔ መልስ</h2>
        {submission.content ? (
          <div className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap text-gray-800">
            {submission.content}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">ምንም የጽሑፍ መልስ አልቀረበም።</p>
        )}
        {submission.file_name && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span>📎</span>
              <span className="text-blue-700 font-medium">{submission.file_name}</span>
            </div>
            <a
              href={`http://localhost:8000/storage/${submission.file_path}`}
              target="_blank" rel="noreferrer"
              className="btn-primary btn-sm"
            >
              አውርድ
            </a>
          </div>
        )}
      </div>

      {/* Grade result */}
      {grade && (
        <div className="card bg-green-50 border-green-200">
          <h2 className="font-semibold text-green-900 mb-3">🏆 ውጤት</h2>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-green-700">{grade.score}</p>
              <p className="text-sm text-green-600">/ {assignment?.max_score}</p>
            </div>
            <div className="flex-1">
              <div className="bg-green-200 rounded-full h-3">
                <div
                  className="bg-green-500 rounded-full h-3 transition-all"
                  style={{ width: `${(grade.score / assignment?.max_score) * 100}%` }}
                />
              </div>
              <p className="text-sm text-green-700 mt-1 font-medium">
                {((grade.score / assignment?.max_score) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          {grade.feedback && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
              <p className="text-xs text-gray-500 mb-1">💬 አስተማሪ አስተያየት:</p>
              <p className="text-gray-800 text-sm">{grade.feedback}</p>
            </div>
          )}
          {grade.graded_by && (
            <p className="text-xs text-gray-400 mt-2">
              ገምጋሚ: {grade.graded_by.name}
            </p>
          )}
        </div>
      )}

      {!grade && (
        <div className="card text-center py-6 bg-yellow-50 border-yellow-100">
          <p className="text-yellow-700">⏳ ምደባው ገና አልተገመገመም</p>
          <p className="text-yellow-500 text-sm mt-1">አስተማሪ ሲገምግሙ notification ይደርስዎታል</p>
        </div>
      )}

      {/* Discussion / Comments */}
      <div className="card">
        <SubmissionComments submissionId={submissionId} />
      </div>
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
