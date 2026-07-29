<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Group;
use Illuminate\Http\Request;

class GroupController extends Controller
{
    // GET /courses/{courseId}/groups
    public function index(Request $request, $courseId)
    {
        $user   = $request->user();
        $course = Course::findOrFail($courseId);

        // Student must be enrolled
        if ($user->isStudent()) {
            $enrolled = $user->enrolledCourses()->where('course_id', $courseId)->exists();
            if (!$enrolled) {
                return response()->json(['message' => 'You are not enrolled in this course.'], 403);
            }
        }

        // Teacher must own the course
        if ($user->isTeacher() && (int) $course->teacher_id !== (int) $user->id) {
            return response()->json(['message' => 'You do not own this course.'], 403);
        }

        $groups = Group::where('course_id', $courseId)
            ->with(['members:id,name,email,student_id', 'creator:id,name'])
            ->get();

        return response()->json($groups);
    }

    // POST /courses/{courseId}/groups
    public function store(Request $request, $courseId)
    {
        $user   = $request->user();
        $course = Course::findOrFail($courseId);

        // Student must be enrolled in this course
        if ($user->isStudent()) {
            $enrolled = $user->enrolledCourses()->where('course_id', $courseId)->exists();
            if (!$enrolled) {
                return response()->json(['message' => 'You are not enrolled in this course.'], 403);
            }
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $group = Group::create([
            'name'       => $data['name'],
            'course_id'  => $courseId,
            'created_by' => $user->id,
        ]);

        // Auto-add creator as leader if student
        if ($user->isStudent()) {
            $group->members()->attach($user->id, ['is_leader' => true]);
        }

        return response()->json($group->load('members:id,name'), 201);
    }

    // GET /groups/{id}
    public function show($id)
    {
        $group = Group::with([
            'members:id,name,email,student_id',
            'creator:id,name',
            'course:id,title',
        ])->findOrFail($id);

        return response()->json($group);
    }

    // POST /groups/{id}/members — add a member
    public function addMember(Request $request, $id)
    {
        $group = Group::findOrFail($id);
        $user  = $request->user();

        // Only group leader or teacher can add members
        $isLeader = $group->members()
            ->where('user_id', $user->id)
            ->wherePivot('is_leader', true)
            ->exists();

        if (!$isLeader && $user->isStudent()) {
            abort(403, 'Only the group leader can add members.');
        }

        $data = $request->validate([
            'user_id'   => 'required|exists:users,id',
            'is_leader' => 'boolean',
        ]);

        if ($group->members()->where('user_id', $data['user_id'])->exists()) {
            return response()->json(['message' => 'User is already a member.'], 422);
        }

        $group->members()->attach($data['user_id'], [
            'is_leader' => $data['is_leader'] ?? false,
        ]);

        return response()->json($group->load('members:id,name'));
    }

    // DELETE /groups/{id}/members/{userId}
    public function removeMember(Request $request, $id, $userId)
    {
        $group = Group::findOrFail($id);
        $user  = $request->user();

        $isLeader = $group->members()
            ->where('user_id', $user->id)
            ->wherePivot('is_leader', true)
            ->exists();

        if (!$isLeader && $user->isStudent() && $user->id != $userId) {
            abort(403, 'Only the group leader can remove members.');
        }

        $group->members()->detach($userId);
        return response()->json(['message' => 'Member removed.']);
    }

    // DELETE /groups/{id}
    public function destroy(Request $request, $id)
    {
        $group = Group::findOrFail($id);
        $user  = $request->user();

        if ($group->created_by !== $user->id && !$user->isAdmin() && !$user->isTeacher()) {
            abort(403);
        }

        $group->delete();
        return response()->json(['message' => 'Group deleted.']);
    }
}
