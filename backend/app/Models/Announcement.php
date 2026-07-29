<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    use HasFactory;
    protected $fillable = ['course_id', 'created_by', 'title', 'body', 'is_pinned'];
    protected $casts    = ['is_pinned' => 'boolean'];

    public function course()   { return $this->belongsTo(Course::class); }
    public function creator()  { return $this->belongsTo(User::class, 'created_by'); }
}
