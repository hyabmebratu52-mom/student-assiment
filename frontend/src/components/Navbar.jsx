import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, logout, isTeacher, isStudent } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    toast.success('ወጥተዋል')
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isStudent ? '/student' : '/teacher'} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">ም</span>
            </div>
            <span className="font-semibold text-gray-900 hidden sm:block">የምደባ ሥርዓት</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-5 text-sm font-medium">
            {isTeacher && (
              <>
                <Link to="/teacher"         className="text-gray-600 hover:text-blue-600 transition-colors">ዋና ገጽ</Link>
                <Link to="/teacher/courses" className="text-gray-600 hover:text-blue-600 transition-colors">ትምህርቶች</Link>
              </>
            )}
            {isStudent && (
              <>
                <Link to="/student"          className="text-gray-600 hover:text-blue-600 transition-colors">ዋና ገጽ</Link>
                <Link to="/student/courses"  className="text-gray-600 hover:text-blue-600 transition-colors">ትምህርቶች</Link>
                <Link to="/student/calendar" className="text-gray-600 hover:text-blue-600 transition-colors hidden sm:block">📅 የቀን መቁጠሪያ</Link>
                <Link to="/student/grades"   className="text-gray-600 hover:text-blue-600 transition-colors">ውጤቶቼ</Link>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900 leading-tight">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role === 'teacher' ? 'አስተማሪ' : user?.role === 'student' ? 'ተማሪ' : 'አስተዳዳሪ'}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-700 font-semibold text-sm">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <button onClick={handleLogout} className="btn-secondary btn-sm text-xs hidden sm:inline-flex">
              ውጣ
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
