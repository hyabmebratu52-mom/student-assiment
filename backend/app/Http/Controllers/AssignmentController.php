<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AssignmentController extends Controller
{
    // GET /courses/{courseId}/assignments
    public function index(Request $request, $courseId)
    {
        $course = Course::findOrFail($courseId);
        $user   = $request->user();

        // Students: must be enrolled in this course
        if ($user->isStudent()) {
            $enrolled = $user->enrolledCourses()->where('course_id', $courseId)->exists();
            if (!$enrolled) {
                return response()->json(['message' => 'You are not enrolled in this course.'], 403);
            }
        }

        // Teachers: must own this course
        if ($user->isTeacher() && (int) $course->teacher_id !== (int) $user->id) {
            return response()->json(['message' => 'You do not own this course.'], 403);
        }

        $assignments = Assignment::where('course_id', $courseId)
            ->withCount('submissions')
            ->orderBy('deadline')
            ->get();

        // For students, attach their own submission + grade
        if ($user->isStudent()) {
            $assignments->each(function ($assignment) use ($user) {
                $submission = $assignment->submissions()
                    ->with('grade')
                    ->where('student_id', $user->id)
                    ->first();
                $assignment->my_submission = $submission;
            });
        }

        return response()->json($assignments);
    }

    // POST /courses/{courseId}/assignments
    public function store(Request $request, $courseId)
    {
        $this->requireTeacher($request);
        $course = Course::findOrFail($courseId);

        if ($course->teacher_id !== $request->user()->id && !$request->user()->isAdmin()) {
            abort(403, 'You do not own this course.');
        }

        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'required|string',
            'type'        => 'required|in:individual,group',
            'deadline'    => 'required|date|after:now',
            'allow_late'  => 'nullable',
            'max_score'   => 'integer|min:1|max:1000',
            'attachment'  => 'nullable|file|max:20480',
        ]);

        // Convert allow_late to proper boolean
        $allowLate = filter_var($request->input('allow_late', false), FILTER_VALIDATE_BOOLEAN);

        $filePath = null;
        if ($request->hasFile('attachment')) {
            $filePath = $request->file('attachment')->store('assignments', 'public');
        }

        $assignment = Assignment::create([
            'title'       => $data['title'],
            'description' => $data['description'],
            'course_id'   => $courseId,
            'created_by'  => $request->user()->id,
            'type'        => $data['type'],
            'deadline'    => $data['deadline'],
            'allow_late'  => $allowLate,
            'max_score'   => $data['max_score'] ?? 100,
            'attachment'  => $filePath,
        ]);

        // Notify all enrolled students
        $studentIds = $course->students()->pluck('users.id')->toArray();
        UserNotification::notify(
            $studentIds,
            'assignment_created',
            "📝 New assignment in {$course->title}",
            $data['title'] . ' — due ' . \Carbon\Carbon::parse($data['deadline'])->format('M d, Y H:i'),
            ['course_id' => $courseId, 'assignment_id' => $assignment->id]
        );

        return response()->json($assignment->load('course:id,title'), 201);
    }

    // GET /assignments/{id}
    public function show(Request $request, $id)
    {
        $assignment = Assignment::with(['course:id,title,teacher_id', 'creator:id,name'])
            ->findOrFail($id);

        $user = $request->user();

        // Student must be enrolled in the course this assignment belongs to
        if ($user->isStudent()) {
            $enrolled = $user->enrolledCourses()->where('course_id', $assignment->course_id)->exists();
            if (!$enrolled) {
                return response()->json(['message' => 'You are not enrolled in this course.'], 403);
            }
            $assignment->my_submission = $assignment->submissions()
                ->with('grade')
                ->where('student_id', $user->id)
                ->first();
        }

        // Teacher must own the course
        if ($user->isTeacher() && (int) $assignment->course->teacher_id !== (int) $user->id) {
            return response()->json(['message' => 'You do not own this assignment\'s course.'], 403);
        }

        return response()->json($assignment);
    }

    // PUT /assignments/{id}
    public function update(Request $request, $id)
    {
        $this->requireTeacher($request);
        $assignment = Assignment::findOrFail($id);

        if ($assignment->created_by !== $request->user()->id && !$request->user()->isAdmin()) {
            abort(403);
        }

        $data = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'deadline'    => 'sometimes|date',
            'allow_late'  => 'sometimes|boolean',
            'max_score'   => 'sometimes|integer|min:1',
        ]);

        $assignment->update($data);
        return response()->json($assignment);
    }

    // DELETE /assignments/{id}
    public function destroy(Request $request, $id)
    {
        $this->requireTeacher($request);
        $assignment = Assignment::findOrFail($id);

        if ($assignment->created_by !== $request->user()->id && !$request->user()->isAdmin()) {
            abort(403);
        }

        if ($assignment->attachment) {
            Storage::disk('public')->delete($assignment->attachment);
        }

        $assignment->delete();
        return response()->json(['message' => 'Assignment deleted.']);
    }

    private function requireTeacher(Request $request)
    {
        if ($request->user()->isStudent()) {
            abort(403, 'Only teachers can manage assignments.');
        }
    }
}
