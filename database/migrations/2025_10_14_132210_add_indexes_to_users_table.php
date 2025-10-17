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
            // Add single-column indexes for frequently queried columns
            $table->index('status', 'idx_users_status');
            $table->index('alias', 'idx_users_alias');
            $table->index('uuid', 'idx_users_uuid');

            // Add composite index for common query patterns (status + created_at)
            // This is useful for queries that filter by status and order by created_at
            $table->index(['status', 'created_at'], 'idx_users_status_created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop indexes in reverse order
            $table->dropIndex('idx_users_status_created_at');
            $table->dropIndex('idx_users_uuid');
            $table->dropIndex('idx_users_alias');
            $table->dropIndex('idx_users_status');
        });
    }
};
