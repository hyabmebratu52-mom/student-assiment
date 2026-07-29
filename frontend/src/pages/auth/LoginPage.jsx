import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [role, setRole]       = useState(null) // 'teacher' or 'student'

  async function handleLogin(selectedRole) {
    if (!form.email || !form.password) {
      setError('ኢሜልና የሚስጥር ቃል ይጻፉ')
      return
    }
    setLoading(true)
    setError('')
    setRole(selectedRole)
    try {
      const user = await login(form.email, form.password)
      // Role check
      if (selectedRole === 'teacher' && user.role === 'student') {
        setError('ይህ መለያ የተማሪ ነው — ተማሪ button ይጠቀሙ')
        setLoading(false)
        return
      }
      if (selectedRole === 'student' && (user.role === 'teacher' || user.role === 'admin')) {
        setError('ይህ መለያ የአስተማሪ ነው — አስተማሪ button ይጠቀሙ')
        setLoading(false)
        return
      }
      toast.success(`እንኳን ደህና መጡ، ${user.name}!`)
      navigate(user.role === 'student' ? '/student' : '/teacher')
    } catch (err) {
      setError(err.response?.data?.message || 'ኢሜል ወይም የሚስጥር ቃል ትክክለኛ አይደለም')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-md">

        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-3xl font-bold">ም</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">የምደባ ሥርዓት</h1>
          <p className="text-gray-400 mt-2">ወደ መለያዎ ይግቡ</p>
        </div>

        <div className="card shadow-md">

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span>❌</span> {error}
            </div>
          )}

          {/* Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="label">ኢሜል አድራሻ</label>
              <input
                type="email" className="input" placeholder="you@school.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleLogin('student')}
              />
            </div>
            <div>
              <label className="label">የሚስጥር ቃል</label>
              <input
                type="password" className="input" placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleLogin('student')}
              />
            </div>
          </div>

          {/* Two big buttons */}
          <div className="grid grid-cols-2 gap-3">

            {/* Teacher button */}
            <button
              onClick={() => handleLogin('teacher')}
              disabled={loading}
              className="flex flex-col items-center justify-center gap-2 py-5 px-4 rounded-xl border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 transition-all disabled:opacity-50 group"
            >
              {loading && role === 'teacher' ? (
                <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-4xl group-hover:scale-110 transition-transform">👩‍🏫</span>
              )}
              <span className="font-semibold text-purple-700 text-sm">አስተማሪ</span>
              <span className="text-xs text-purple-400">Teacher</span>
            </button>

            {/* Student button */}
            <button
              onClick={() => handleLogin('student')}
              disabled={loading}
              className="flex flex-col items-center justify-center gap-2 py-5 px-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-all disabled:opacity-50 group"
            >
              {loading && role === 'student' ? (
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-4xl group-hover:scale-110 transition-transform">👨‍🎓</span>
              )}
              <span className="font-semibold text-blue-700 text-sm">ተማሪ</span>
              <span className="text-xs text-blue-400">Student</span>
            </button>
          </div>

          {/* Register link */}
          <div className="mt-6 text-center text-sm text-gray-500">
            መለያ የሎትም?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              አዲስ መለያ ፍጠሩ →
            </Link>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium mb-3 text-center uppercase tracking-wide">
              የሙከራ መለያዎች
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setForm({ email:'abebe@school.com', password:'password' })}
                className="bg-purple-50 hover:bg-purple-100 rounded-lg p-2.5 text-left transition-colors"
              >
                <p className="text-xs font-semibold text-purple-700">👩‍🏫 አስተማሪ</p>
                <p className="text-xs text-gray-500 mt-0.5">abebe@school.com</p>
              </button>
              <button
                onClick={() => setForm({ email:'tigist@student.com', password:'password' })}
                className="bg-blue-50 hover:bg-blue-100 rounded-lg p-2.5 text-left transition-colors"
              >
                <p className="text-xs font-semibold text-blue-700">👨‍🎓 ተማሪ</p>
                <p className="text-xs text-gray-500 mt-0.5">tigist@student.com</p>
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">Password: password</p>
          </div>
        </div>
      </div>
    </div>
  )
}
