<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('race_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('race_id')->constrained('races')->cascadeOnDelete();
            $table->foreignId('driver_id')->constrained('season_drivers')->cascadeOnDelete();
            $table->foreignId('division_id')
                ->nullable()
                ->constrained('divisions')
                ->onDelete('set null');
            $table->unsignedSmallInteger('position')->nullable();
            $table->string('race_time', 15)->nullable();
            $table->string('race_time_difference', 15)->nullable();
            $table->string('fastest_lap', 15)->nullable();
            $table->string('penalties', 15)->nullable();
            $table->boolean('has_fastest_lap')->default(false);
            $table->boolean('has_pole')->default(false);
            $table->boolean('dnf')->default(false);
            $table->enum('status', ['pending', 'confirmed'])->default('pending');
            $table->unsignedSmallInteger('race_points')->default(0);
            $table->timestamps();

            // Unique constraint: one result per driver per race
            $table->unique(['race_id', 'driver_id']);

            // Index for querying results by race
            $table->index('race_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('race_results');
    }
};
