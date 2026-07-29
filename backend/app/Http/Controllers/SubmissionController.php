<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\Submission;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SubmissionController extends Controller
{
    // GET /assignments/{assignmentId}/submissions
    public function index(Request $request, $assignmentId)
    {
        $assignment = Assignment::with('course')->findOrFail($assignmentId);
        $user       = $request->user();

        if ($user->isStudent()) {
            // Student: must be enrolled, sees ONLY their own submission
            $enrolled = $user->enrolledCourses()->where('course_id', $assignment->course_id)->exists();
            if (!$enrolled) {
                return response()->json(['message' => 'You are not enrolled in this course.'], 403);
            }
            $submissions = Submission::where('assignment_id', $assignmentId)
                ->where('student_id', $user->id)
                ->with(['grade', 'group:id,name'])
                ->get();
        } else {
            // Teacher: must own this course
            if ((int) $assignment->course->teacher_id !== (int) $user->id && !$user->isAdmin()) {
                return response()->json(['message' => 'You do not own this assignment\'s course.'], 403);
            }
            $submissions = Submission::where('assignment_id', $assignmentId)
                ->with(['student:id,name,email,student_id', 'grade', 'group:id,name'])
                ->get();
        }

        return response()->json($submissions);
    }

    // POST /assignments/{assignmentId}/submissions
    public function store(Request $request, $assignmentId)
    {
        $user       = $request->user();
        $assignment = Assignment::with('course')->findOrFail($assignmentId);

        // Only students can submit
        if (!$user->isStudent()) {
            return response()->json(['message' => 'Only students can submit assignments.'], 403);
        }

        // Ensure student is enrolled in this course
        $enrolled = $user->enrolledCourses()->where('course_id', $assignment->course_id)->exists();
        if (!$enrolled) {
            return response()->json(['message' => 'You are not enrolled in this course.'], 403);
        }

        // Deadline check
        $isLate = Carbon::now()->isAfter($assignment->deadline);
        if ($isLate && !$assignment->allow_late) {
            return response()->json(['message' => 'Deadline has passed and late submissions are not allowed.'], 422);
        }

        // Prevent duplicate submissions — allow resubmission unless graded
        $existing = Submission::where('assignment_id', $assignmentId)
            ->where('student_id', $user->id)
            ->first();

        if ($existing && $existing->status === 'graded') {
            return response()->json(['message' => 'ይህ ምደባ ተገምግሟል — እንደገና ማቅረብ አይቻልም።'], 422);
        }

        $data = $request->validate([
            'content'  => 'nullable|string',
            'file'     => 'nullable|file|max:20480',
            'group_id' => 'nullable|exists:groups,id',
        ]);

        $filePath = null;
        $fileName = null;
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('submissions', 'public');
            $fileName = $request->file('file')->getClientOriginalName();
        }

        // At least content or file must be present
        if (empty($data['content']) && !$filePath && !$existing?->file_path) {
            // Allow empty submission — just mark as submitted
        }

        $submission = Submission::updateOrCreate(
            ['assignment_id' => $assignmentId, 'student_id' => $user->id],
            [
                'group_id'     => $data['group_id'] ?? null,
                'content'      => $data['content'] ?? null,
                'file_path'    => $filePath,
                'file_name'    => $fileName,
                'status'       => $isLate ? 'late' : 'submitted',
                'is_late'      => $isLate,
                'submitted_at' => Carbon::now(),
            ]
        );

        return response()->json($submission->load(['grade', 'group:id,name']), 201);
    }

    // GET /submissions/{id}
    public function show(Request $request, $id)
    {
        $submission = Submission::with([
            'assignment:id,title,max_score,deadline,course_id',
            'assignment.course:id,teacher_id',
            'student:id,name,email,student_id',
            'group:id,name',
            'group.members:id,name,student_id',
            'grade.gradedBy:id,name',
        ])->findOrFail($id);

        $user = $request->user();

        // Student: can only see their own submission
        if ($user->isStudent() && (int) $submission->student_id !== (int) $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Teacher: must own the course this submission belongs to
        if ($user->isTeacher() && (int) $submission->assignment->course->teacher_id !== (int) $user->id) {
            return response()->json(['message' => 'You do not own this assignment\'s course.'], 403);
        }

        return response()->json($submission);
    }

    // DELETE /submissions/{id} — student can retract a draft/submitted one before grading
    public function destroy(Request $request, $id)
    {
        $submission = Submission::findOrFail($id);
        $user       = $request->user();

        if ($user->isStudent() && $submission->student_id !== $user->id) {
            abort(403);
        }

        if ($submission->status === 'graded') {
            return response()->json(['message' => 'Cannot delete a graded submission.'], 422);
        }

        if ($submission->file_path) {
            Storage::disk('public')->delete($submission->file_path);
        }

        $submission->delete();
        return response()->json(['message' => 'Submission deleted.']);
    }
}
