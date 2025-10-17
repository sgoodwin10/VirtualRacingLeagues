<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('alias', 100)->nullable()->after('last_name');
            $table->string('uuid', 60)->unique()->nullable()->after('alias');
            $table->enum('status', ['active', 'inactive'])->default('active')->after('uuid');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['alias', 'uuid', 'status']);
        });
    }
};
