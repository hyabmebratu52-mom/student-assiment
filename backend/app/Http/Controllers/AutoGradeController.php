<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\Grade;
use App\Models\Submission;
use App\Models\UserNotification;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AutoGradeController extends Controller
{
    /**
     * POST /assignments/{assignmentId}/auto-zero
     * Teacher manually triggers 0 grade for all non-submitters
     */
    public function assignZero(Request $request, $assignmentId)
    {
        $user       = $request->user();
        $assignment = Assignment::with('course')->findOrFail($assignmentId);

        if ($user->isStudent()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }
        if ($user->isTeacher() && (int)$assignment->course->teacher_id !== (int)$user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if (!$assignment->is_past_deadline) {
            return response()->json([
                'message' => 'ምደባው ጊዜ ገደቡ ገና አላለፈም። Deadline ካለፈ በኋላ ይሞክሩ።'
            ], 422);
        }

        // Get all enrolled students
        $enrolledStudents = $assignment->course->students()->pluck('users.id');

        // Get students who already submitted
        $submittedIds = Submission::where('assignment_id', $assignmentId)
            ->pluck('student_id')
            ->toArray();

        // Find students who did NOT submit
        $missingIds = $enrolledStudents->filter(fn($id) => !in_array($id, $submittedIds));

        if ($missingIds->isEmpty()) {
            return response()->json([
                'message'  => 'ሁሉም ተማሪዎች ምደባ ቀርበዋል። ምንም ዜሮ አልተሰጠም።',
                'zeroed'   => 0,
            ]);
        }

        $zeroed = 0;

        foreach ($missingIds as $studentId) {
            // Create a "not submitted" submission record
            $submission = Submission::firstOrCreate(
                [
                    'assignment_id' => $assignmentId,
                    'student_id'    => $studentId,
                ],
                [
                    'content'      => null,
                    'file_path'    => null,
                    'status'       => 'graded',
                    'is_late'      => true,
                    'submitted_at' => null,
                ]
            );

            $submission->update(['status' => 'graded']);

            // Give 0 grade
            Grade::updateOrCreate(
                ['submission_id' => $submission->id],
                [
                    'graded_by' => $user->id,
                    'score'     => 0,
                    'feedback'  => 'ምደባ አልቀረበም — ዜሮ ነጥብ ተሰጥቷል።',
                ]
            );

            // Notify student
            UserNotification::notify(
                $studentId,
                'grade_received',
                "⚠️ ምደባ ባለማቅረብ 0 ነጥብ ተሰጥቷዎ",
                "{$assignment->title}: 0/{$assignment->max_score} — ምደባ አልቀረበም",
                ['assignment_id' => $assignmentId]
            );

            $zeroed++;
        }

        return response()->json([
            'message' => "{$zeroed} ተማሪ ዜሮ ነጥብ ተሰጥቷቸዋል ✓",
            'zeroed'  => $zeroed,
        ]);
    }

    /**
     * POST /courses/{courseId}/auto-zero-all
     * Auto-zero ALL past-deadline assignments in a course
     */
    public function assignZeroAll(Request $request, $courseId)
    {
        $user   = $request->user();
        $course = Course::with('assignments', 'students')->findOrFail($courseId);

        if ($user->isStudent()) return response()->json(['message' => 'Unauthorized.'], 403);
        if ($user->isTeacher() && (int)$course->teacher_id !== (int)$user->id)
            return response()->json(['message' => 'Unauthorized.'], 403);

        $totalZeroed = 0;
        $processed   = [];

        $pastAssignments = $course->assignments->filter(fn($a) => Carbon::now()->isAfter($a->deadline));

        foreach ($pastAssignments as $assignment) {
            $enrolledIds  = $course->students()->pluck('users.id');
            $submittedIds = Submission::where('assignment_id', $assignment->id)->pluck('student_id')->toArray();
            $missingIds   = $enrolledIds->filter(fn($id) => !in_array($id, $submittedIds));

            $count = 0;
            foreach ($missingIds as $studentId) {
                $submission = Submission::firstOrCreate(
                    ['assignment_id' => $assignment->id, 'student_id' => $studentId],
                    ['status' => 'graded', 'is_late' => true, 'submitted_at' => null]
                );
                $submission->update(['status' => 'graded']);

                Grade::updateOrCreate(
                    ['submission_id' => $submission->id],
                    [
                        'graded_by' => $user->id,
                        'score'     => 0,
                        'feedback'  => 'ምደባ አልቀረበም — ዜሮ ነጥብ ተሰጥቷል።',
                    ]
                );

                UserNotification::notify(
                    $studentId,
                    'grade_received',
                    "⚠️ ምደባ ባለማቅረብ 0 ነጥብ ተሰጥቷዎ",
                    "{$assignment->title}: 0/{$assignment->max_score}",
                    ['assignment_id' => $assignment->id]
                );

                $count++;
                $totalZeroed++;
            }

            $processed[] = [
                'assignment' => $assignment->title,
                'zeroed'     => $count,
            ];
        }

        return response()->json([
            'message'    => "ጠቅላላ {$totalZeroed} ዜሮ ነጥብ ተሰጥቷል",
            'total'      => $totalZeroed,
            'details'    => $processed,
        ]);
    }
}
