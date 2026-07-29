<?php
namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\Course;
use App\Models\UserNotification;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    // GET /courses/{courseId}/announcements
    public function index(Request $request, $courseId)
    {
        $user   = $request->user();
        $course = Course::findOrFail($courseId);

        if ($user->isStudent()) {
            $enrolled = $user->enrolledCourses()->where('course_id', $courseId)->exists();
            if (!$enrolled) return response()->json(['message' => 'Not enrolled.'], 403);
        }
        if ($user->isTeacher() && (int)$course->teacher_id !== (int)$user->id)
            return response()->json(['message' => 'Unauthorized.'], 403);

        $announcements = Announcement::where('course_id', $courseId)
            ->with('creator:id,name')
            ->orderByDesc('is_pinned')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($announcements);
    }

    // POST /courses/{courseId}/announcements
    public function store(Request $request, $courseId)
    {
        $user   = $request->user();
        $course = Course::findOrFail($courseId);

        if ($user->isStudent()) return response()->json(['message' => 'Students cannot post announcements.'], 403);
        if ($user->isTeacher() && (int)$course->teacher_id !== (int)$user->id)
            return response()->json(['message' => 'Unauthorized.'], 403);

        $data = $request->validate([
            'title'     => 'required|string|max:255',
            'body'      => 'required|string',
            'is_pinned' => 'boolean',
        ]);

        $announcement = Announcement::create([
            'course_id'  => $courseId,
            'created_by' => $user->id,
            'title'      => $data['title'],
            'body'       => $data['body'],
            'is_pinned'  => $data['is_pinned'] ?? false,
        ]);

        // Notify all enrolled students
        $studentIds = $course->students()->pluck('users.id')->toArray();
        UserNotification::notify(
            $studentIds,
            'announcement',
            "📢 New announcement in {$course->title}",
            $data['title'],
            ['course_id' => $courseId, 'announcement_id' => $announcement->id]
        );

        return response()->json($announcement->load('creator:id,name'), 201);
    }

    // PUT /announcements/{id}
    public function update(Request $request, $id)
    {
        $user         = $request->user();
        $announcement = Announcement::findOrFail($id);

        if ((int)$announcement->created_by !== (int)$user->id && !$user->isAdmin())
            return response()->json(['message' => 'Unauthorized.'], 403);

        $data = $request->validate([
            'title'     => 'sometimes|string|max:255',
            'body'      => 'sometimes|string',
            'is_pinned' => 'sometimes|boolean',
        ]);

        $announcement->update($data);
        return response()->json($announcement);
    }

    // DELETE /announcements/{id}
    public function destroy(Request $request, $id)
    {
        $user         = $request->user();
        $announcement = Announcement::findOrFail($id);

        if ((int)$announcement->created_by !== (int)$user->id && !$user->isAdmin())
            return response()->json(['message' => 'Unauthorized.'], 403);

        $announcement->delete();
        return response()->json(['message' => 'Deleted.']);
    }
}
