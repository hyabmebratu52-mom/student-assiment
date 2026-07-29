<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\Group;
use App\Models\Submission;
use App\Models\UserNotification;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    // POST /submissions/{submissionId}/grade
    public function store(Request $request, $submissionId)
    {
        $user       = $request->user();
        $submission = Submission::with('assignment.course', 'group.members')->findOrFail($submissionId);

        if ($user->isStudent()) {
            return response()->json(['message' => 'ተማሪዎች ምደባ መገምገም አይችሉም።'], 403);
        }

        $teacherId = (int) $submission->assignment->course->teacher_id;
        if ($teacherId !== (int) $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $data = $request->validate([
            'score'    => 'required|numeric|min:0|max:' . $submission->assignment->max_score,
            'feedback' => 'nullable|string',
        ]);

        // Save grade for this submission
        $grade = Grade::updateOrCreate(
            ['submission_id' => $submissionId],
            [
                'graded_by' => $user->id,
                'score'     => $data['score'],
                'feedback'  => $data['feedback'] ?? null,
            ]
        );

        $submission->update(['status' => 'graded']);

        // Notify submitter
        UserNotification::notify(
            $submission->student_id,
            'grade_received',
            "🏆 ምደባህ ተገምግሟል",
            "{$submission->assignment->title}: {$data['score']}/{$submission->assignment->max_score}",
            ['submission_id' => $submissionId, 'assignment_id' => $submission->assignment_id]
        );

        // ── GROUP GRADING ──────────────────────────────────────────────
        // If group submission → create/update grade for ALL group members
        if ($submission->group_id) {
            $group   = $submission->group()->with('members')->first();
            $members = $group?->members ?? collect();

            foreach ($members as $member) {
                // Skip the original submitter (already graded above)
                if ((int)$member->id === (int)$submission->student_id) continue;

                // Find or create a submission record for this member
                $memberSub = Submission::firstOrCreate(
                    [
                        'assignment_id' => $submission->assignment_id,
                        'student_id'    => $member->id,
                    ],
                    [
                        'group_id'     => $submission->group_id,
                        'content'      => $submission->content,
                        'file_path'    => $submission->file_path,
                        'file_name'    => $submission->file_name,
                        'status'       => 'graded',
                        'is_late'      => $submission->is_late,
                        'submitted_at' => $submission->submitted_at,
                    ]
                );

                // Update status to graded
                $memberSub->update(['status' => 'graded']);

                // Create grade for this member
                Grade::updateOrCreate(
                    ['submission_id' => $memberSub->id],
                    [
                        'graded_by' => $user->id,
                        'score'     => $data['score'],
                        'feedback'  => $data['feedback'] ?? null,
                    ]
                );

                // Notify each group member
                UserNotification::notify(
                    $member->id,
                    'grade_received',
                    "🏆 የቡድን ምደባ ተገምግሟል",
                    "{$submission->assignment->title}: {$data['score']}/{$submission->assignment->max_score} (ቡድን: {$group->name})",
                    ['submission_id' => $memberSub->id, 'assignment_id' => $submission->assignment_id]
                );
            }
        }
        // ── END GROUP GRADING ──────────────────────────────────────────

        return response()->json([
            'grade'           => $grade->load('gradedBy:id,name'),
            'group_graded'    => $submission->group_id ? true : false,
            'members_graded'  => $submission->group_id
                ? ($submission->group()->with('members')->first()?->members->count() ?? 1)
                : 1,
        ], 201);
    }

    // PUT /grades/{id}
    public function update(Request $request, $id)
    {
        $grade = Grade::with('submission.assignment.course')->findOrFail($id);
        $user  = $request->user();

        if ($user->isStudent()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $teacherId = (int) $grade->submission->assignment->course->teacher_id;
        if ($teacherId !== (int) $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $data = $request->validate([
            'score'    => 'sometimes|numeric|min:0|max:' . $grade->submission->assignment->max_score,
            'feedback' => 'nullable|string',
        ]);

        $grade->update($data);
        return response()->json($grade);
    }

    // GET /students/{studentId}/grades
    public function studentGrades(Request $request, $studentId)
    {
        $user = $request->user();

        if ($user->isStudent() && (int) $user->id !== (int) $studentId) {
            return response()->json(['message' => 'የራስዎን ውጤት ብቻ ማየት ይችላሉ።'], 403);
        }

        if ($user->isTeacher()) {
            $teacherCourseIds = $user->taughtCourses()->pluck('id');
            $grades = Grade::whereHas('submission', function ($q) use ($studentId, $teacherCourseIds) {
                $q->where('student_id', $studentId)
                  ->whereHas('assignment', fn($a) => $a->whereIn('course_id', $teacherCourseIds));
            })->with([
                'submission.assignment:id,title,max_score,course_id,type',
                'submission.assignment.course:id,title,code',
                'submission.group:id,name',
            ])->get();

            return response()->json($grades);
        }

        $grades = Grade::whereHas('submission', fn($q) => $q->where('student_id', $studentId))
            ->with([
                'submission.assignment:id,title,max_score,course_id,type',
                'submission.assignment.course:id,title,code',
                'submission.group:id,name',
            ])
            ->get();

        return response()->json($grades);
    }

    // GET /courses/{courseId}/grade-report  — full grade report
    public function gradeReport(Request $request, $courseId)
    {
        $user = $request->user();

        $course = \App\Models\Course::with([
            'students:id,name,email,student_id',
            'assignments:id,title,max_score,type,course_id',
        ])->findOrFail($courseId);

        if ($user->isStudent()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }
        if ($user->isTeacher() && (int)$course->teacher_id !== (int)$user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $assignments = $course->assignments;
        $students    = $course->students;

        $report = $students->map(function ($student) use ($assignments) {
            $studentGrades = [];
            $totalScore    = 0;
            $totalMax      = 0;
            $submitted     = 0;
            $graded        = 0;

            foreach ($assignments as $assignment) {
                $sub = Submission::where('assignment_id', $assignment->id)
                    ->where('student_id', $student->id)
                    ->with('grade')
                    ->first();

                $score = $sub?->grade?->score;

                $studentGrades[] = [
                    'assignment_id'    => $assignment->id,
                    'assignment_title' => $assignment->title,
                    'assignment_type'  => $assignment->type,
                    'max_score'        => $assignment->max_score,
                    'score'            => $score,
                    'status'           => $sub?->status ?? 'not_submitted',
                    'is_late'          => $sub?->is_late ?? false,
                    'group_name'       => $sub?->group?->name ?? null,
                    'percentage'       => $score !== null && $assignment->max_score > 0
                        ? round(($score / $assignment->max_score) * 100, 1)
                        : null,
                ];

                if ($sub) $submitted++;
                if ($sub?->status === 'graded') {
                    $graded++;
                    $totalScore += (float)$score;
                    $totalMax   += $assignment->max_score;
                }
            }

            return [
                'student_id'    => $student->id,
                'name'          => $student->name,
                'student_id_no' => $student->student_id,
                'email'         => $student->email,
                'assignments'   => $studentGrades,
                'total_score'   => $totalScore,
                'total_max'     => $totalMax,
                'percentage'    => $totalMax > 0 ? round(($totalScore / $totalMax) * 100, 1) : 0,
                'submitted'     => $submitted,
                'graded'        => $graded,
                'missing'       => $assignments->count() - $submitted,
                'letter_grade'  => $this->letterGrade(
                    $totalMax > 0 ? ($totalScore / $totalMax) * 100 : 0
                ),
            ];
        });

        // Sort by percentage descending
        $sorted = $report->sortByDesc('percentage')->values();

        return response()->json([
            'course'      => [
                'id'    => $course->id,
                'title' => $course->title,
                'code'  => $course->code,
            ],
            'assignments' => $assignments->map(fn($a) => [
                'id'        => $a->id,
                'title'     => $a->title,
                'max_score' => $a->max_score,
                'type'      => $a->type,
            ]),
            'students'     => $sorted,
            'class_avg'    => $sorted->where('total_max', '>', 0)->avg('percentage') ?? 0,
            'class_high'   => $sorted->max('percentage') ?? 0,
            'class_low'    => $sorted->where('total_max', '>', 0)->min('percentage') ?? 0,
        ]);
    }

    private function letterGrade(float $pct): string
    {
        if ($pct >= 90) return 'A+';
        if ($pct >= 85) return 'A';
        if ($pct >= 80) return 'A-';
        if ($pct >= 75) return 'B+';
        if ($pct >= 70) return 'B';
        if ($pct >= 65) return 'B-';
        if ($pct >= 60) return 'C+';
        if ($pct >= 55) return 'C';
        if ($pct >= 50) return 'C-';
        if ($pct >= 45) return 'D';
        return 'F';
    }
}
