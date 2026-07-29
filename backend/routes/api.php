<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AutoGradeController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PlagiarismController;
use App\Http\Controllers\RubricController;
use App\Http\Controllers\SubmissionController;
use Illuminate\Support\Facades\Route;

// ── Public auth routes ──────────────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// ── Authenticated routes ─────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Courses
    Route::get('/courses',           [CourseController::class, 'index']);
    Route::get('/courses/browse',    [CourseController::class, 'all']);
    Route::get('/courses/archived',  [CourseController::class, 'archived']);
    Route::post('/courses',          [CourseController::class, 'store']);
    Route::get('/courses/{id}',      [CourseController::class, 'show']);
    Route::put('/courses/{id}',      [CourseController::class, 'update']);
    Route::delete('/courses/{id}',   [CourseController::class, 'destroy']);
    Route::post('/courses/{id}/enroll',     [CourseController::class, 'enroll']);
    Route::post('/courses/{id}/unenroll',   [CourseController::class, 'unenroll']);
    Route::get('/courses/{id}/students',    [CourseController::class, 'students']);
    Route::post('/courses/{id}/archive',    [CourseController::class, 'archive']);
    Route::post('/courses/{id}/unarchive',  [CourseController::class, 'unarchive']);

    // Groups
    Route::get('/courses/{courseId}/groups',    [GroupController::class, 'index']);
    Route::post('/courses/{courseId}/groups',   [GroupController::class, 'store']);
    Route::get('/groups/{id}',                  [GroupController::class, 'show']);
    Route::delete('/groups/{id}',               [GroupController::class, 'destroy']);
    Route::post('/groups/{id}/members',         [GroupController::class, 'addMember']);
    Route::delete('/groups/{id}/members/{userId}', [GroupController::class, 'removeMember']);

    // Assignments
    Route::get('/courses/{courseId}/assignments',  [AssignmentController::class, 'index']);
    Route::post('/courses/{courseId}/assignments', [AssignmentController::class, 'store']);
    Route::get('/assignments/{id}',    [AssignmentController::class, 'show']);
    Route::put('/assignments/{id}',    [AssignmentController::class, 'update']);
    Route::delete('/assignments/{id}', [AssignmentController::class, 'destroy']);

    // Submissions
    Route::get('/assignments/{assignmentId}/submissions',  [SubmissionController::class, 'index']);
    Route::post('/assignments/{assignmentId}/submissions', [SubmissionController::class, 'store']);
    Route::get('/submissions/{id}',    [SubmissionController::class, 'show']);
    Route::delete('/submissions/{id}', [SubmissionController::class, 'destroy']);

    // Grades
    Route::post('/submissions/{submissionId}/grade', [GradeController::class, 'store']);
    Route::put('/grades/{id}',                       [GradeController::class, 'update']);
    Route::get('/students/{studentId}/grades',       [GradeController::class, 'studentGrades']);
    Route::get('/courses/{courseId}/grade-report',   [GradeController::class, 'gradeReport']);

    // Notifications
    Route::get('/notifications',              [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/read-all',    [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{id}/read',   [NotificationController::class, 'markRead']);
    Route::delete('/notifications/{id}',      [NotificationController::class, 'destroy']);

    // Announcements
    Route::get('/courses/{courseId}/announcements',  [AnnouncementController::class, 'index']);
    Route::post('/courses/{courseId}/announcements', [AnnouncementController::class, 'store']);
    Route::put('/announcements/{id}',                [AnnouncementController::class, 'update']);
    Route::delete('/announcements/{id}',             [AnnouncementController::class, 'destroy']);

    // Comments / Discussion
    Route::get('/submissions/{submissionId}/comments',  [CommentController::class, 'index']);
    Route::post('/submissions/{submissionId}/comments', [CommentController::class, 'store']);
    Route::delete('/comments/{id}',                     [CommentController::class, 'destroy']);

    // Rubric
    Route::get('/assignments/{assignmentId}/rubric',         [RubricController::class, 'show']);
    Route::post('/assignments/{assignmentId}/rubric',        [RubricController::class, 'store']);
    Route::post('/submissions/{submissionId}/rubric-grade',  [RubricController::class, 'gradeByRubric']);
    Route::get('/submissions/{submissionId}/rubric-scores',  [RubricController::class, 'submissionScores']);

    // Export (CSV)
    Route::get('/courses/{courseId}/export/grades',        [ExportController::class, 'courseGrades']);
    Route::get('/assignments/{assignmentId}/export/grades',[ExportController::class, 'assignmentGrades']);

    // Auto-zero (missing submissions)
    Route::post('/assignments/{assignmentId}/auto-zero',  [AutoGradeController::class, 'assignZero']);
    Route::post('/courses/{courseId}/auto-zero-all',      [AutoGradeController::class, 'assignZeroAll']);

    // Analytics
    Route::get('/courses/{courseId}/analytics',    [AnalyticsController::class, 'course']);
    Route::get('/assignments/{id}/analytics',      [AnalyticsController::class, 'assignment']);

    // Plagiarism check
    Route::get('/assignments/{assignmentId}/plagiarism-check', [PlagiarismController::class, 'check']);
});
