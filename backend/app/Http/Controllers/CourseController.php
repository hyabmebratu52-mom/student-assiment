<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\User;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    // GET /courses — teacher sees ONLY own courses, student sees ONLY enrolled courses
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->isTeacher() || $user->isAdmin()) {
            $courses = Course::where('teacher_id', $user->id)
                ->whereNull('archived_at')           // active only
                ->withCount('students')
                ->withCount('assignments')
                ->with('teacher:id,name')
                ->get();
        } else {
            $courses = $user->enrolledCourses()
                ->whereNull('archived_at')
                ->withCount('assignments')
                ->with('teacher:id,name')
                ->get();
        }

        return response()->json($courses);
    }

    // GET /courses/archived — teacher sees archived/past courses
    public function archived(Request $request)
    {
        $user = $request->user();

        if ($user->isStudent()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $courses = Course::where('teacher_id', $user->id)
            ->whereNotNull('archived_at')
            ->withCount('students')
            ->withCount('assignments')
            ->withTrashed()
            ->get();

        return response()->json($courses);
    }

    // POST /courses/{id}/archive
    public function archive(Request $request, $id)
    {
        $course = Course::findOrFail($id);
        $this->authorizeOwner($request, $course->teacher_id);

        $course->update([
            'archived_at' => now(),
            'is_active'   => false,
        ]);

        return response()->json(['message' => 'Course archived.']);
    }

    // POST /courses/{id}/unarchive
    public function unarchive(Request $request, $id)
    {
        $course = Course::withTrashed()->findOrFail($id);
        $this->authorizeOwner($request, $course->teacher_id);

        $course->update([
            'archived_at' => null,
            'is_active'   => true,
        ]);

        return response()->json(['message' => 'Course restored.']);
    }

    // GET /courses/all — all active courses (for enrollment)
    public function all()
    {
        return response()->json(
            Course::where('is_active', true)->with('teacher:id,name')->get()
        );
    }

    // POST /courses
    public function store(Request $request)
    {
        $this->authorizeRole($request, ['teacher', 'admin']);

        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'code'        => 'required|string|max:50|unique:courses',
            'description' => 'nullable|string',
        ]);

        $course = Course::create([
            'title'      => $data['title'],
            'code'       => $data['code'],
            'description'=> $data['description'] ?? null,
            'teacher_id' => $request->user()->id,
        ]);

        return response()->json($course, 201);
    }

    // GET /courses/{id}
    public function show(Request $request, $id)
    {
        $user   = $request->user();
        $course = Course::with(['teacher:id,name', 'assignments', 'groups.members:id,name'])
            ->findOrFail($id);

        // Student must be enrolled to view course detail
        if ($user->isStudent()) {
            $enrolled = $user->enrolledCourses()->where('course_id', $id)->exists();
            if (!$enrolled) {
                return response()->json(['message' => 'You are not enrolled in this course.'], 403);
            }
        }

        // Teacher must own the course
        if ($user->isTeacher() && $course->teacher_id !== $user->id) {
            return response()->json(['message' => 'You do not own this course.'], 403);
        }

        return response()->json($course);
    }

    // PUT /courses/{id}
    public function update(Request $request, $id)
    {
        $course = Course::findOrFail($id);
        $this->authorizeOwner($request, $course->teacher_id);

        $data = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'is_active'   => 'sometimes|boolean',
        ]);

        $course->update($data);
        return response()->json($course);
    }

    // DELETE /courses/{id}
    public function destroy(Request $request, $id)
    {
        $course = Course::findOrFail($id);
        $this->authorizeOwner($request, $course->teacher_id);
        $course->delete();
        return response()->json(['message' => 'Course deleted.']);
    }

    // POST /courses/{id}/enroll
    public function enroll(Request $request, $id)
    {
        $this->authorizeRole($request, ['student']);
        $course = Course::findOrFail($id);
        $user   = $request->user();

        if ($user->enrolledCourses()->where('course_id', $id)->exists()) {
            return response()->json(['message' => 'Already enrolled.'], 422);
        }

        $user->enrolledCourses()->attach($id);
        return response()->json(['message' => 'Enrolled successfully.']);
    }

    // POST /courses/{id}/unenroll
    public function unenroll(Request $request, $id)
    {
        $this->authorizeRole($request, ['student']);
        $request->user()->enrolledCourses()->detach($id);
        return response()->json(['message' => 'Unenrolled successfully.']);
    }

    // GET /courses/{id}/students — teacher only
    public function students(Request $request, $id)
    {
        $user   = $request->user();
        $course = Course::findOrFail($id);

        // Only the course teacher or admin can see the student list
        if ($user->isStudent()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }
        if ($user->isTeacher() && $course->teacher_id !== $user->id) {
            return response()->json(['message' => 'You do not own this course.'], 403);
        }

        return response()->json(
            $course->students()->select('users.id', 'users.name', 'users.email', 'users.student_id')->get()
        );
    }

    // ---- helpers ----
    private function authorizeRole(Request $request, array $roles)
    {
        if (!in_array($request->user()->role, $roles)) {
            abort(403, 'Unauthorized action.');
        }
    }

    private function authorizeOwner(Request $request, $ownerId)
    {
        if ((int) $request->user()->id !== (int) $ownerId && !$request->user()->isAdmin()) {
            abort(403, 'Unauthorized action.');
        }
    }
}
