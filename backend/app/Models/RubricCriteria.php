<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RubricCriteria extends Model
{
    use HasFactory;
    protected $fillable = ['assignment_id', 'title', 'description', 'max_score', 'order'];

    public function assignment() { return $this->belongsTo(Assignment::class); }
    public function scores()     { return $this->hasMany(RubricScore::class); }
}
