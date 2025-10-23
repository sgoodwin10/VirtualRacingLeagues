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
        // Add composite indexes to admins table
        Schema::table('admins', function (Blueprint $table) {
            $table->index(['status', 'role'], 'admins_status_role_index');
            $table->index(['email', 'status'], 'admins_email_status_index');
        });

        // Add composite indexes to users table
        Schema::table('users', function (Blueprint $table) {
            $table->index(['status', 'created_at'], 'users_status_created_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->dropIndex('admins_status_role_index');
            $table->dropIndex('admins_email_status_index');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_status_created_at_index');
        });
    }
};
