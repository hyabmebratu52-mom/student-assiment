<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    use HasFactory;

    protected $fillable = [
        'assignment_id', 'student_id', 'group_id',
        'content', 'file_path', 'file_name',
        'status', 'is_late', 'submitted_at',
    ];

    protected $casts = [
        'is_late'      => 'boolean',
        'submitted_at' => 'datetime',
    ];

    public function assignment()
    {
        return $this->belongsTo(Assignment::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function grade()
    {
        return $this->hasOne(Grade::class);
    }

    public function comments()
    {
        return $this->hasMany(SubmissionComment::class)->orderBy('created_at');
    }

    public function rubricScores()
    {
        return $this->hasMany(RubricScore::class);
    }
}
