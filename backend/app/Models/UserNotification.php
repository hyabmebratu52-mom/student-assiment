<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserNotification extends Model
{
    use HasFactory;
    protected $fillable = ['user_id', 'type', 'title', 'body', 'data', 'read_at'];
    protected $casts    = ['data' => 'array', 'read_at' => 'datetime'];

    public function user() { return $this->belongsTo(User::class); }

    public function markRead()
    {
        $this->update(['read_at' => now()]);
    }

    /**
     * Create notifications for one or many users.
     * $userIds can be: int, array of ints, or Collection of ints
     */
    public static function notify($userIds, string $type, string $title, string $body, array $data = [])
    {
        // Normalize to flat array of scalar IDs
        $ids = collect($userIds)
            ->flatten()
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        if (empty($ids)) return;

        $now  = now()->toDateTimeString();
        $json = json_encode($data);

        $rows = array_map(fn($id) => [
            'user_id'    => (int) $id,
            'type'       => $type,
            'title'      => $title,
            'body'       => $body,
            'data'       => $json,
            'read_at'    => null,
            'created_at' => $now,
            'updated_at' => $now,
        ], $ids);

        self::insert($rows);
    }
}
