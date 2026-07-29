<?php
namespace App\Http\Controllers;

use App\Models\Submission;
use App\Models\SubmissionComment;
use App\Models\UserNotification;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    // GET /submissions/{submissionId}/comments
    public function index(Request $request, $submissionId)
    {
        $user       = $request->user();
        $submission = Submission::with('assignment.course')->findOrFail($submissionId);

        // Student: only their own submission
        if ($user->isStudent() && (int)$submission->student_id !== (int)$user->id)
            return response()->json(['message' => 'Unauthorized.'], 403);

        // Teacher: must own the course
        if ($user->isTeacher() && (int)$submission->assignment->course->teacher_id !== (int)$user->id)
            return response()->json(['message' => 'Unauthorized.'], 403);

        $comments = SubmissionComment::where('submission_id', $submissionId)
            ->with('user:id,name,role')
            ->orderBy('created_at')
            ->get();

        return response()->json($comments);
    }

    // POST /submissions/{submissionId}/comments
    public function store(Request $request, $submissionId)
    {
        $user       = $request->user();
        $submission = Submission::with('assignment.course')->findOrFail($submissionId);

        // Student: only their own submission
        if ($user->isStudent() && (int)$submission->student_id !== (int)$user->id)
            return response()->json(['message' => 'Unauthorized.'], 403);

        // Teacher: must own the course
        if ($user->isTeacher() && (int)$submission->assignment->course->teacher_id !== (int)$user->id)
            return response()->json(['message' => 'Unauthorized.'], 403);

        $data = $request->validate(['body' => 'required|string|max:2000']);

        $comment = SubmissionComment::create([
            'submission_id' => $submissionId,
            'user_id'       => $user->id,
            'body'          => $data['body'],
        ]);

        // Notify the other party
        if ($user->isTeacher()) {
            // Notify student
            UserNotification::notify(
                $submission->student_id,
                'comment',
                "💬 Your teacher commented on your submission",
                $submission->assignment->title,
                ['submission_id' => $submissionId]
            );
        } else {
            // Notify teacher
            $teacherId = $submission->assignment->course->teacher_id;
            UserNotification::notify(
                $teacherId,
                'comment',
                "💬 Student replied on submission",
                "{$user->name}: " . $data['body'],
                ['submission_id' => $submissionId]
            );
        }

        return response()->json($comment->load('user:id,name,role'), 201);
    }

    // DELETE /comments/{id}
    public function destroy(Request $request, $id)
    {
        $comment = SubmissionComment::findOrFail($id);
        if ((int)$comment->user_id !== (int)$request->user()->id && !$request->user()->isAdmin())
            return response()->json(['message' => 'Unauthorized.'], 403);

        $comment->delete();
        return response()->json(['message' => 'Deleted.']);
    }
}
