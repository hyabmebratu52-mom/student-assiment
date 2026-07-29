<?php
namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\Grade;
use App\Models\Submission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    // GET /courses/{courseId}/analytics
    public function course(Request $request, $courseId)
    {
        $user   = $request->user();
        $course = Course::with('students')->findOrFail($courseId);

        if ($user->isStudent()) return response()->json(['message' => 'Unauthorized.'], 403);
        if ($user->isTeacher() && (int)$course->teacher_id !== (int)$user->id)
            return response()->json(['message' => 'Unauthorized.'], 403);

        $totalStudents   = $course->students()->count();
        $assignments     = Assignment::where('course_id', $courseId)->get();
        $totalAssignments = $assignments->count();

        $assignmentStats = $assignments->map(function ($a) use ($totalStudents) {
            $submissions      = Submission::where('assignment_id', $a->id)->get();
            $submitted        = $submissions->whereIn('status', ['submitted', 'late', 'graded'])->count();
            $graded           = $submissions->where('status', 'graded')->count();
            $late             = $submissions->where('is_late', true)->count();

            $scores = Grade::whereIn('submission_id', $submissions->pluck('id'))->pluck('score');
            $avgScore = $scores->count() ? round($scores->avg(), 2) : null;
            $maxScore = $scores->count() ? $scores->max() : null;
            $minScore = $scores->count() ? $scores->min() : null;

            // Students who haven't submitted
            $submittedStudentIds = $submissions->pluck('student_id')->toArray();

            return [
                'id'                => $a->id,
                'title'             => $a->title,
                'deadline'          => $a->deadline,
                'max_score'         => $a->max_score,
                'type'              => $a->type,
                'total_students'    => $totalStudents,
                'submitted_count'   => $submitted,
                'graded_count'      => $graded,
                'late_count'        => $late,
                'missing_count'     => max(0, $totalStudents - $submitted),
                'submission_rate'   => $totalStudents > 0 ? round(($submitted / $totalStudents) * 100, 1) : 0,
                'avg_score'         => $avgScore,
                'max_score_given'   => $maxScore,
                'min_score_given'   => $minScore,
                'submitted_ids'     => $submittedStudentIds,
            ];
        });

        // Per-student summary
        $studentSummary = $course->students()
            ->select('users.id', 'users.name', 'users.email', 'users.student_id')
            ->get()
            ->map(function ($student) use ($assignments) {
                $submissions = Submission::where('student_id', $student->id)
                    ->whereIn('assignment_id', $assignments->pluck('id'))
                    ->with('grade')
                    ->get();

                $submitted   = $submissions->whereIn('status', ['submitted', 'late', 'graded'])->count();
                $totalScore  = $submissions->sum(fn($s) => $s->grade?->score ?? 0);
                $graded      = $submissions->where('status', 'graded')->count();

                return [
                    'id'               => $student->id,
                    'name'             => $student->name,
                    'student_id'       => $student->student_id,
                    'email'            => $student->email,
                    'submitted_count'  => $submitted,
                    'total_score'      => $totalScore,
                    'graded_count'     => $graded,
                    'missing_count'    => $assignments->count() - $submitted,
                ];
            });

        return response()->json([
            'course'            => [
                'id'    => $course->id,
                'title' => $course->title,
                'code'  => $course->code,
            ],
            'total_students'    => $totalStudents,
            'total_assignments' => $totalAssignments,
            'assignment_stats'  => $assignmentStats,
            'student_summary'   => $studentSummary,
        ]);
    }

    // GET /assignments/{id}/analytics
    public function assignment(Request $request, $assignmentId)
    {
        $user       = $request->user();
        $assignment = Assignment::with('course')->findOrFail($assignmentId);

        if ($user->isStudent()) return response()->json(['message' => 'Unauthorized.'], 403);
        if ($user->isTeacher() && (int)$assignment->course->teacher_id !== (int)$user->id)
            return response()->json(['message' => 'Unauthorized.'], 403);

        $submissions = Submission::where('assignment_id', $assignmentId)
            ->with(['student:id,name,student_id', 'grade'])
            ->get();

        $scores    = $submissions->filter(fn($s) => $s->grade)->map(fn($s) => $s->grade->score);
        $totalEnrolled = $assignment->course->students()->count();

        // Score distribution buckets 0-10, 11-20, …, 91-100
        $buckets = [];
        for ($i = 0; $i <= 90; $i += 10) {
            $label = "{$i}-" . ($i + 10);
            $pct   = $assignment->max_score / 100;
            $lo    = $i * $pct;
            $hi    = ($i + 10) * $pct;
            $buckets[] = [
                'label' => $label . '%',
                'count' => $scores->filter(fn($s) => $s >= $lo && $s < $hi)->count(),
            ];
        }

        return response()->json([
            'assignment'      => $assignment,
            'total_enrolled'  => $totalEnrolled,
            'submitted_count' => $submissions->whereIn('status', ['submitted','late','graded'])->count(),
            'graded_count'    => $submissions->where('status','graded')->count(),
            'late_count'      => $submissions->where('is_late', true)->count(),
            'avg_score'       => $scores->count() ? round($scores->avg(), 2) : null,
            'score_distribution' => $buckets,
            'submissions'     => $submissions,
        ]);
    }
}
