<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::create('rubric_criteria', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('max_score');
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        Schema::create('rubric_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained()->onDelete('cascade');
            $table->unsignedBigInteger('rubric_criteria_id');
            $table->foreign('rubric_criteria_id')->references('id')->on('rubric_criteria')->onDelete('cascade');
            $table->integer('score');
            $table->text('comment')->nullable();
            $table->timestamps();
            $table->unique(['submission_id', 'rubric_criteria_id']);
        });
    }
    public function down() {
        Schema::dropIfExists('rubric_scores');
        Schema::dropIfExists('rubric_criteria');
    }
};
