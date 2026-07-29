<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Assignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'description', 'course_id', 'created_by',
        'type', 'deadline', 'allow_late', 'max_score', 'attachment',
    ];

    protected $casts = [
        'deadline'   => 'datetime',
        'allow_late' => 'boolean',
    ];

    // Appended computed attributes
    protected $appends = ['is_past_deadline', 'can_submit'];

    public function getIsPastDeadlineAttribute(): bool
    {
        return Carbon::now()->isAfter($this->deadline);
    }

    public function getCanSubmitAttribute(): bool
    {
        if (!$this->is_past_deadline) return true;
        return $this->allow_late;
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }

    public function rubricCriteria()
    {
        return $this->hasMany(RubricCriteria::class)->orderBy('order');
    }
}
