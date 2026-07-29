<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::table('courses', function (Blueprint $table) {
            $table->softDeletes();
            $table->timestamp('archived_at')->nullable();
        });
    }
    public function down() {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn('archived_at');
        });
    }
};
