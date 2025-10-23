<?php

declare(strict_types=1);

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
        Schema::create('site_configs', function (Blueprint $table) {
            $table->id();

            // Site Identity
            $table->string('site_name', 255)->nullable(false);

            // Tracking
            $table->string('google_tag_manager_id', 50)->nullable();
            $table->string('google_analytics_id', 50)->nullable();
            $table->text('google_search_console_code')->nullable();

            // Social
            $table->string('discord_link', 500)->nullable();

            // Email Addresses
            $table->string('support_email', 255)->nullable();
            $table->string('contact_email', 255)->nullable();
            $table->string('admin_email', 255)->nullable();

            // Application Settings
            $table->boolean('maintenance_mode')->default(false)->nullable(false);
            $table->string('timezone', 50)->default('UTC')->nullable(false);
            $table->boolean('user_registration_enabled')->default(true)->nullable(false);

            // Metadata
            $table->boolean('is_active')->default(true)->nullable(false);
            $table->timestamps();

            // Indexes
            $table->index('is_active', 'idx_is_active');
            $table->index('maintenance_mode', 'idx_maintenance_mode');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_configs');
    }
};
