import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', password: '', password_confirmation: '',
    role: 'student', student_id: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      const user = await register(form)
      toast.success('መለያ ተፈጥሯል!')
      navigate(user.role === 'student' ? '/student' : '/teacher')
    } catch (err) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
      else setErrors({ general: err.response?.data?.message || 'ምዝገባ አልተሳካም።' })
    } finally {
      setLoading(false)
    }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">መለያ ይፍጠሩ</h1>
          <p className="text-gray-500 mt-1">ወደ የምደባ ሥርዓት ይቀላቀሉ</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {errors.general}
              </div>
            )}

            {/* Role selector */}
            <div>
              <label className="label">እኔ ነኝ</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'student', label: 'ተማሪ' },
                  { value: 'teacher', label: 'አስተማሪ' },
                ].map(r => (
                  <button type="button" key={r.value}
                    onClick={() => setForm({ ...form, role: r.value })}
                    className={`py-2.5 rounded-lg border-2 font-medium transition-colors ${
                      form.role === r.value
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">ሙሉ ስም</label>
              <input type="text" className="input" placeholder="አበበ ጊርማ"
                value={form.name} onChange={set('name')} required />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
            </div>

            <div>
              <label className="label">ኢሜል</label>
              <input type="email" className="input" placeholder="you@school.com"
                value={form.email} onChange={set('email')} required />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
            </div>

            {form.role === 'student' && (
              <div>
                <label className="label">የተማሪ መታወቂያ <span className="text-gray-400">(አስፈላጊ ካልሆነ ይተው)</span></label>
                <input type="text" className="input" placeholder="STU001"
                  value={form.student_id} onChange={set('student_id')} />
                {errors.student_id && <p className="text-red-500 text-xs mt-1">{errors.student_id[0]}</p>}
              </div>
            )}

            <div>
              <label className="label">የሚስጥር ቃል</label>
              <input type="password" className="input" placeholder="ቢያንስ 6 ፊደላት"
                value={form.password} onChange={set('password')} required />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>}
            </div>

            <div>
              <label className="label">የሚስጥር ቃል ያረጋግጡ</label>
              <input type="password" className="input" placeholder="የሚስጥር ቃሉን ይድገሙ"
                value={form.password_confirmation} onChange={set('password_confirmation')} required />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? 'እየተፈጠረ ነው…' : 'መለያ ፍጠር'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            መለያ አልዎት?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">ይግቡ</Link>
          </div>

          {/* Enrollment info */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800 space-y-2">
              <p className="font-semibold">📋 ስርዓቱ እንዴት ይሰራል?</p>
              <p>1️⃣ <strong>መለያ ፍጠሩ</strong> — ተማሪ ወይም አስተማሪ ሆነው ይመዝገቡ</p>
              <p>2️⃣ <strong>ትምህርት ተቀላቀሉ</strong> — "ትምህርቶች" → "ያሉ ትምህርቶች" → ተመዝገብ</p>
              <p>3️⃣ <strong>ምደባዎችን ይመልከቱ</strong> — ትምህርቱ ውስጥ ምደባዎች ይታያሉ</p>
              <p>4️⃣ <strong>አቅርቡ</strong> — text ወይም file ያቅርቡ</p>
              <p>5️⃣ <strong>ውጤት ይጠብቁ</strong> — አስተማሪ ነጥብ ሲሰጥ notification ይደርሳቸዋል</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
