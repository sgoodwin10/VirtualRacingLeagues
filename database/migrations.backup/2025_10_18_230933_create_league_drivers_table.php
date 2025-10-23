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
        Schema::create('league_drivers', function (Blueprint $table) {
            $table->id();

            // Foreign keys
            $table->foreignId('league_id')->constrained('leagues')->onDelete('cascade');
            $table->foreignId('driver_id')->constrained('drivers')->onDelete('cascade');

            // League-specific driver data
            $table->integer('driver_number')->nullable();
            $table->enum('status', ['active', 'inactive', 'banned'])->default('active');
            $table->text('league_notes')->nullable();

            // Timestamps
            $table->timestamp('added_to_league_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            // Constraints
            $table->unique(['league_id', 'driver_id'], 'unique_league_driver');

            // Indexes
            $table->index('status', 'idx_league_driver_status');
            $table->index('driver_number', 'idx_league_driver_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('league_drivers');
    }
};
