<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    use HasFactory;

    protected $fillable = ['submission_id', 'graded_by', 'score', 'feedback'];

    protected $casts = ['score' => 'decimal:2'];

    public function submission()
    {
        return $this->belongsTo(Submission::class);
    }

    public function gradedBy()
    {
        return $this->belongsTo(User::class, 'graded_by');
    }
}
