<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::create('user_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type'); // assignment_created, grade_received, deadline_reminder, announcement, comment
            $table->string('title');
            $table->text('body');
            $table->json('data')->nullable(); // extra context: course_id, assignment_id, submission_id
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }
    public function down() { Schema::dropIfExists('user_notifications'); }
};
