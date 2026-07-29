<?php
namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\Grade;
use App\Models\RubricCriteria;
use App\Models\RubricScore;
use App\Models\Submission;
use App\Models\UserNotification;
use Illuminate\Http\Request;

class RubricController extends Controller
{
    // GET /assignments/{assignmentId}/rubric
    public function show($assignmentId)
    {
        $criteria = RubricCriteria::where('assignment_id', $assignmentId)
            ->orderBy('order')
            ->get();
        return response()->json($criteria);
    }

    // POST /assignments/{assignmentId}/rubric  — teacher sets criteria
    public function store(Request $request, $assignmentId)
    {
        $user       = $request->user();
        $assignment = Assignment::with('course')->findOrFail($assignmentId);

        if ($user->isStudent()) return response()->json(['message' => 'Unauthorized.'], 403);
        if ($user->isTeacher() && (int)$assignment->course->teacher_id !== (int)$user->id)
            return response()->json(['message' => 'Unauthorized.'], 403);

        $data = $request->validate([
            'criteria'               => 'required|array|min:1',
            'criteria.*.title'       => 'required|string|max:255',
            'criteria.*.description' => 'nullable|string',
            'criteria.*.max_score'   => 'required|integer|min:1',
        ]);

        // Remove old criteria and replace
        RubricCriteria::where('assignment_id', $assignmentId)->delete();

        $created = collect($data['criteria'])->mapWithKeys(function ($c, $i) use ($assignmentId) {
            return [$i => RubricCriteria::create([
                'assignment_id' => $assignmentId,
                'title'         => $c['title'],
                'description'   => $c['description'] ?? null,
                'max_score'     => $c['max_score'],
                'order'         => $i,
            ])];
        })->values();

        // Update assignment max_score to match rubric total
        $total = collect($data['criteria'])->sum('max_score');
        $assignment->update(['max_score' => $total]);

        return response()->json($created, 201);
    }

    // POST /submissions/{submissionId}/rubric-grade  — teacher grades by rubric
    public function gradeByRubric(Request $request, $submissionId)
    {
        $user       = $request->user();
        $submission = Submission::with('assignment.course', 'group.members')->findOrFail($submissionId);

        if ($user->isStudent()) return response()->json(['message' => 'Unauthorized.'], 403);
        if ($user->isTeacher() && (int)$submission->assignment->course->teacher_id !== (int)$user->id)
            return response()->json(['message' => 'Unauthorized.'], 403);

        $data = $request->validate([
            'scores'               => 'required|array',
            'scores.*.criteria_id' => 'required|exists:rubric_criteria,id',
            'scores.*.score'       => 'required|integer|min:0',
            'scores.*.comment'     => 'nullable|string',
            'feedback'             => 'nullable|string',
        ]);

        foreach ($data['scores'] as $s) {
            $criteria = RubricCriteria::findOrFail($s['criteria_id']);
            if ($s['score'] > $criteria->max_score)
                return response()->json(['message' => "Score for '{$criteria->title}' exceeds max {$criteria->max_score}."], 422);
        }

        foreach ($data['scores'] as $s) {
            RubricScore::updateOrCreate(
                ['submission_id' => $submissionId, 'rubric_criteria_id' => $s['criteria_id']],
                ['score' => $s['score'], 'comment' => $s['comment'] ?? null]
            );
        }

        $totalScore = collect($data['scores'])->sum('score');

        $grade = Grade::updateOrCreate(
            ['submission_id' => $submissionId],
            [
                'graded_by' => $user->id,
                'score'     => $totalScore,
                'feedback'  => $data['feedback'] ?? null,
            ]
        );

        $submission->update(['status' => 'graded']);

        // Notify submitter
        UserNotification::notify(
            $submission->student_id,
            'grade_received',
            "🏆 ምደባህ ተገምግሟል",
            "{$submission->assignment->title}: {$totalScore}/{$submission->assignment->max_score}",
            ['submission_id' => $submissionId, 'assignment_id' => $submission->assignment_id]
        );

        // ── GROUP: grade all members ──────────────────────────────────
        if ($submission->group_id) {
            $group   = $submission->group;
            $members = $group?->members ?? collect();

            foreach ($members as $member) {
                if ((int)$member->id === (int)$submission->student_id) continue;

                $memberSub = Submission::firstOrCreate(
                    ['assignment_id' => $submission->assignment_id, 'student_id' => $member->id],
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
                $memberSub->update(['status' => 'graded']);

                // Copy rubric scores
                foreach ($data['scores'] as $s) {
                    RubricScore::updateOrCreate(
                        ['submission_id' => $memberSub->id, 'rubric_criteria_id' => $s['criteria_id']],
                        ['score' => $s['score'], 'comment' => $s['comment'] ?? null]
                    );
                }

                Grade::updateOrCreate(
                    ['submission_id' => $memberSub->id],
                    ['graded_by' => $user->id, 'score' => $totalScore, 'feedback' => $data['feedback'] ?? null]
                );

                UserNotification::notify(
                    $member->id,
                    'grade_received',
                    "🏆 የቡድን ምደባ ተገምግሟል",
                    "{$submission->assignment->title}: {$totalScore}/{$submission->assignment->max_score} (ቡድን: {$group->name})",
                    ['submission_id' => $memberSub->id, 'assignment_id' => $submission->assignment_id]
                );
            }
        }
        // ── END GROUP ─────────────────────────────────────────────────

        return response()->json([
            'grade'          => $grade,
            'group_graded'   => $submission->group_id ? true : false,
            'members_graded' => $submission->group_id
                ? ($submission->group?->members->count() ?? 1) : 1,
            'rubric_scores'  => RubricScore::where('submission_id', $submissionId)
                ->with('criteria:id,title,max_score')
                ->get(),
        ]);
    }

    // GET /submissions/{submissionId}/rubric-scores
    public function submissionScores(Request $request, $submissionId)
    {
        $user       = $request->user();
        $submission = Submission::with('assignment.course')->findOrFail($submissionId);

        if ($user->isStudent() && (int)$submission->student_id !== (int)$user->id)
            return response()->json(['message' => 'Unauthorized.'], 403);

        $scores = RubricScore::where('submission_id', $submissionId)
            ->with('criteria:id,title,description,max_score,order')
            ->get()
            ->sortBy('criteria.order')
            ->values();

        return response()->json($scores);
    }
}
