<?php
namespace App\Http\Controllers;

use App\Models\UserNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // GET /notifications  — user's notifications (latest 50)
    public function index(Request $request)
    {
        $notifications = UserNotification::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json($notifications);
    }

    // GET /notifications/unread-count
    public function unreadCount(Request $request)
    {
        $count = UserNotification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();

        return response()->json(['count' => $count]);
    }

    // POST /notifications/{id}/read
    public function markRead(Request $request, $id)
    {
        $notif = UserNotification::where('user_id', $request->user()->id)
            ->findOrFail($id);
        $notif->markRead();
        return response()->json(['message' => 'Marked as read.']);
    }

    // POST /notifications/read-all
    public function markAllRead(Request $request)
    {
        UserNotification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'All marked as read.']);
    }

    // DELETE /notifications/{id}
    public function destroy(Request $request, $id)
    {
        UserNotification::where('user_id', $request->user()->id)
            ->findOrFail($id)
            ->delete();
        return response()->json(['message' => 'Deleted.']);
    }
}
