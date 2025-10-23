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
        Schema::create('competitions', function (Blueprint $table) {
            $table->id();

            // Foreign keys
            $table->foreignId('league_id')->constrained('leagues')->cascadeOnDelete();
            $table->foreignId('platform_id')->constrained('platforms')->restrictOnDelete();
            $table->foreignId('created_by_user_id')->constrained('users')->restrictOnDelete();

            // Core fields
            $table->string('name', 100);
            $table->string('slug', 100);
            $table->text('description')->nullable();
            $table->string('logo_path')->nullable();

            // Status fields
            $table->string('status', 20)->default('active')->index();
            $table->timestamp('archived_at')->nullable();

            // Timestamps
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->unique(['league_id', 'slug']); // Slug unique per league
            $table->index(['league_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competitions');
    }
};
