<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RubricScore extends Model
{
    use HasFactory;
    protected $fillable = ['submission_id', 'rubric_criteria_id', 'score', 'comment'];

    public function criteria()   { return $this->belongsTo(RubricCriteria::class, 'rubric_criteria_id'); }
    public function submission() { return $this->belongsTo(Submission::class); }
}
