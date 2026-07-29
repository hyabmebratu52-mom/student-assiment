import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Auth
import LoginPage    from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Layout
import Layout from './components/Layout'

// Shared
import NotificationsPage from './pages/NotificationsPage'

// Teacher pages
import TeacherDashboard      from './pages/teacher/Dashboard'
import ManageCourses         from './pages/teacher/ManageCourses'
import CourseDetail          from './pages/teacher/CourseDetail'
import ManageAssignments     from './pages/teacher/ManageAssignments'
import AssignmentSubmissions from './pages/teacher/AssignmentSubmissions'
import GradeSubmission       from './pages/teacher/GradeSubmission'
import Analytics             from './pages/teacher/Analytics'
import TeacherAnnouncements  from './pages/teacher/Announcements'
import RubricEditor          from './pages/teacher/RubricEditor'
import RubricGrade           from './pages/teacher/RubricGrade'
import PlagiarismCheck       from './pages/teacher/PlagiarismCheck'
import GradeReport           from './pages/teacher/GradeReport'

// Student pages
import StudentDashboard    from './pages/student/Dashboard'
import StudentCourses      from './pages/student/Courses'
import StudentAssignments  from './pages/student/Assignments'
import SubmitAssignment    from './pages/student/SubmitAssignment'
import SubmissionDetail    from './pages/student/SubmissionDetail'
import MyGrades            from './pages/student/MyGrades'
import GroupsPage          from './pages/student/GroupsPage'
import CalendarPage        from './pages/student/CalendarPage'
import StudentAnnouncements from './pages/student/Announcements'

function RequireAuth({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role === 'teacher' && user.role === 'student')  return <Navigate to="/student" replace />
  if (role === 'student' && user.role !== 'student')  return <Navigate to="/teacher" replace />
  return children
}

export default function App() {
  const { user } = useAuth()
  const home = user ? (user.role === 'student' ? '/student' : '/teacher') : '/login'

  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={!user ? <LoginPage />    : <Navigate to={home} />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to={home} />} />

      {/* ─── Teacher routes ──────────────────────────────── */}
      <Route path="/teacher" element={<RequireAuth role="teacher"><Layout /></RequireAuth>}>
        <Route index element={<TeacherDashboard />} />
        <Route path="courses"                                       element={<ManageCourses />} />
        <Route path="courses/:courseId"                             element={<CourseDetail />} />
        <Route path="courses/:courseId/assignments"                 element={<ManageAssignments />} />
        <Route path="courses/:courseId/analytics"                   element={<Analytics />} />
        <Route path="courses/:courseId/announcements"               element={<TeacherAnnouncements />} />
        <Route path="courses/:courseId/grade-report"                element={<GradeReport />} />
        <Route path="assignments/:assignmentId/submissions"         element={<AssignmentSubmissions />} />
        <Route path="assignments/:assignmentId/rubric"              element={<RubricEditor />} />
        <Route path="assignments/:assignmentId/plagiarism"          element={<PlagiarismCheck />} />
        <Route path="submissions/:submissionId/grade"               element={<GradeSubmission />} />
        <Route path="submissions/:submissionId/rubric-grade"        element={<RubricGrade />} />
        <Route path="notifications"                                 element={<NotificationsPage />} />
      </Route>

      {/* ─── Student routes ──────────────────────────────── */}
      <Route path="/student" element={<RequireAuth role="student"><Layout /></RequireAuth>}>
        <Route index element={<StudentDashboard />} />
        <Route path="courses"                                       element={<StudentCourses />} />
        <Route path="courses/:courseId/assignments"                 element={<StudentAssignments />} />
        <Route path="courses/:courseId/groups"                      element={<GroupsPage />} />
        <Route path="courses/:courseId/announcements"               element={<StudentAnnouncements />} />
        <Route path="assignments/:assignmentId/submit"              element={<SubmitAssignment />} />
        <Route path="submissions/:submissionId"                     element={<SubmissionDetail />} />
        <Route path="grades"                                        element={<MyGrades />} />
        <Route path="calendar"                                      element={<CalendarPage />} />
        <Route path="notifications"                                 element={<NotificationsPage />} />
      </Route>

      {/* Default */}
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  )
}
