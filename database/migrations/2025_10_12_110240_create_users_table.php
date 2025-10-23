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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('alias', 100)->nullable();
            $table->string('uuid', 60)->unique()->nullable();
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            // Indexes for frequently queried columns
            $table->index('status', 'idx_users_status');
            $table->index('alias', 'idx_users_alias');
            $table->index('uuid', 'idx_users_uuid');

            // Composite index for common query patterns (status + created_at)
            $table->index(['status', 'created_at'], 'idx_users_status_created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
