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
        Schema::create('leagues', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 150)->unique();
            $table->string('tagline', 150)->nullable();
            $table->text('description')->nullable(); // Will store HTML from rich text editor

            // Image storage paths
            $table->string('logo_path')->nullable();
            $table->string('header_image_path')->nullable();

            // Platform selections stored as JSON array of platform IDs
            $table->json('platform_ids')->default('[]');

            // Social media links
            $table->string('discord_url')->nullable();
            $table->string('website_url')->nullable();
            $table->string('twitter_handle')->nullable();
            $table->string('instagram_handle')->nullable();
            $table->string('youtube_url')->nullable();
            $table->string('twitch_url')->nullable();

            // Settings
            $table->enum('visibility', ['public', 'private', 'unlisted'])->default('public');
            $table->string('timezone', 50)->nullable();

            // Administration
            $table->foreignId('owner_user_id')->constrained('users')->onDelete('cascade');
            $table->string('contact_email')->nullable();
            $table->string('organizer_name', 100)->nullable();

            // Status
            $table->enum('status', ['active', 'archived'])->default('active');

            // Metadata
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('slug');
            $table->index('visibility');
            $table->index('owner_user_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leagues');
    }
};
