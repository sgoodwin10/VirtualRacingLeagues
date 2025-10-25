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
        Schema::create('rounds', function (Blueprint $table) {
            $table->id();

            $table->foreignId('season_id')
                ->constrained('seasons')
                ->onDelete('cascade')
                ->comment('Season this round belongs to');

            // Basic Info
            $table->integer('round_number')->comment('Round number (1-99)');
            $table->string('name', 100)->nullable()->comment('Optional round name');
            $table->string('slug', 150)->comment('URL-friendly slug');

            // Schedule
            $table->dateTime('scheduled_at')->comment('Round date and time');
            $table->string('timezone', 50)->comment('Timezone (inherited from league)');

            // Track
            $table->foreignId('platform_track_id')
                ->constrained('platform_tracks')
                ->onDelete('restrict')
                ->comment('Track for this round');
            $table->string('track_layout', 100)->nullable()->comment('Track layout/configuration');
            $table->text('track_conditions')->nullable()->comment('Track conditions description');

            // Specifications
            $table->text('technical_notes')->nullable()->comment('BOP, restrictions, etc.');
            $table->string('stream_url', 255)->nullable()->comment('Stream/broadcast URL');
            $table->text('internal_notes')->nullable()->comment('Internal notes for organizers');

            // Status
            $table->enum('status', ['scheduled', 'pre_race', 'in_progress', 'completed', 'cancelled'])
                ->default('scheduled')
                ->comment('Round status');

            // Metadata
            $table->foreignId('created_by_user_id')
                ->constrained('users')
                ->onDelete('restrict')
                ->comment('User who created this round');

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('season_id');
            $table->index('status');
            $table->index('scheduled_at');
            $table->unique(['season_id', 'slug'], 'unique_season_slug');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rounds');
    }
};
