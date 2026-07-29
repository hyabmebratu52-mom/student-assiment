<?php
namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\Grade;
use App\Models\Submission;
use Illuminate\Http\Request;

class ExportController extends Controller
{
    // GET /courses/{courseId}/export/grades  — CSV export of all grades
    public function courseGrades(Request $request, $courseId)
    {
        $user   = $request->user();
        $course = Course::with('students', 'assignments')->findOrFail($courseId);

        if ($user->isStudent()) return response()->json(['message' => 'Unauthorized.'], 403);
        if ($user->isTeacher() && (int)$course->teacher_id !== (int)$user->id)
            return response()->json(['message' => 'Unauthorized.'], 403);

        $assignments = $course->assignments;
        $students    = $course->students()->select('users.id','users.name','users.email','users.student_id')->get();

        // Build CSV
        $headers = ['Student Name', 'Student ID', 'Email'];
        foreach ($assignments as $a) {
            $headers[] = $a->title . ' (' . $a->max_score . 'pts)';
        }
        $headers[] = 'Total Score';
        $headers[] = 'Total Max';
        $headers[] = 'Percentage';

        $rows = [];
        foreach ($students as $student) {
            $row = [$student->name, $student->student_id ?? '', $student->email];
            $totalScore = 0;
            $totalMax   = 0;
            foreach ($assignments as $a) {
                $sub = Submission::where('assignment_id', $a->id)
                    ->where('student_id', $student->id)
                    ->with('grade')
                    ->first();
                $score = $sub?->grade?->score ?? '';
                $row[]      = $score;
                $totalScore += (float)($score === '' ? 0 : $score);
                $totalMax   += $a->max_score;
            }
            $row[] = $totalScore;
            $row[] = $totalMax;
            $row[] = $totalMax > 0 ? round(($totalScore / $totalMax) * 100, 1) . '%' : '0%';
            $rows[] = $row;
        }

        $csv  = implode(',', array_map(fn($h) => '"' . $h . '"', $headers)) . "\n";
        foreach ($rows as $row) {
            $csv .= implode(',', array_map(fn($v) => '"' . str_replace('"', '""', (string)$v) . '"', $row)) . "\n";
        }

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="grades_' . $course->code . '.csv"',
        ]);
    }

    // GET /assignments/{assignmentId}/export/grades
    public function assignmentGrades(Request $request, $assignmentId)
    {
        $user       = $request->user();
        $assignment = Assignment::with('course')->findOrFail($assignmentId);

        if ($user->isStudent()) return response()->json(['message' => 'Unauthorized.'], 403);
        if ($user->isTeacher() && (int)$assignment->course->teacher_id !== (int)$user->id)
            return response()->json(['message' => 'Unauthorized.'], 403);

        $submissions = Submission::where('assignment_id', $assignmentId)
            ->with(['student:id,name,email,student_id', 'grade'])
            ->get();

        $headers = ['Student Name', 'Student ID', 'Email', 'Status', 'Is Late', 'Score', 'Max Score', 'Percentage', 'Feedback', 'Submitted At'];

        $csv = implode(',', array_map(fn($h) => '"' . $h . '"', $headers)) . "\n";
        foreach ($submissions as $sub) {
            $score   = $sub->grade?->score ?? '';
            $pct     = ($score !== '' && $assignment->max_score > 0)
                ? round(($score / $assignment->max_score) * 100, 1) . '%'
                : '';
            $row = [
                $sub->student?->name       ?? '',
                $sub->student?->student_id ?? '',
                $sub->student?->email      ?? '',
                $sub->status,
                $sub->is_late ? 'Yes' : 'No',
                $score,
                $assignment->max_score,
                $pct,
                $sub->grade?->feedback     ?? '',
                $sub->submitted_at         ?? '',
            ];
            $csv .= implode(',', array_map(fn($v) => '"' . str_replace('"','""',(string)$v) . '"', $row)) . "\n";
        }

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="grades_assignment_' . $assignmentId . '.csv"',
        ]);
    }
}
