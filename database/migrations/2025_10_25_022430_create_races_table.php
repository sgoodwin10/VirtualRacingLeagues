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
        Schema::create('races', function (Blueprint $table) {
            $table->id();
            $table->foreignId('round_id')->constrained('rounds')->onDelete('cascade');

            // Discriminator
            $table->boolean('is_qualifier')->default(false);

            // Basic
            $table->integer('race_number')->nullable();
            $table->string('name', 100)->nullable();
            $table->string('race_type', 50)->nullable();

            // Qualifying
            $table->enum('qualifying_format', ['standard', 'time_trial', 'none', 'previous_race']);
            $table->integer('qualifying_length')->nullable();
            $table->string('qualifying_tire', 50)->nullable();

            // Grid
            $table->enum('grid_source', ['qualifying', 'previous_race', 'reverse_previous', 'championship', 'reverse_championship', 'manual']);
            $table->foreignId('grid_source_race_id')->nullable()->constrained('races')->onDelete('set null');

            // Length
            $table->enum('length_type', ['laps', 'time']);
            $table->integer('length_value')->nullable();
            $table->boolean('extra_lap_after_time')->default(true);

            // Platform settings
            $table->string('weather', 100)->nullable();
            $table->string('tire_restrictions', 100)->nullable();
            $table->string('fuel_usage', 100)->nullable();
            $table->string('damage_model', 100)->nullable();

            // Penalties & Rules
            $table->boolean('track_limits_enforced')->default(true);
            $table->boolean('false_start_detection')->default(true);
            $table->boolean('collision_penalties')->default(true);
            $table->boolean('mandatory_pit_stop')->default(false);
            $table->integer('minimum_pit_time')->nullable();
            $table->text('assists_restrictions')->nullable();

            // Points Configuration
            $table->boolean('race_points')->default(false);

            // Points (JSON)
            $table->json('points_system');
            $table->json('bonus_points')->nullable();
            $table->integer('dnf_points')->default(0);
            $table->integer('dns_points')->default(0);

            // Notes
            $table->text('race_notes')->nullable();

            // Status
            $table->string('status', 20)->default('scheduled');

            $table->timestamps();

            // Indexes
            $table->index('round_id');
            $table->index(['round_id', 'race_number']);
            $table->index(['round_id', 'is_qualifier'], 'idx_races_round_qualifier');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('races');
    }
};
