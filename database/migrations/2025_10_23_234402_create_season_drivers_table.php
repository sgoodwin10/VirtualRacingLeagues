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
        Schema::create('season_drivers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('season_id')
                ->constrained('seasons')
                ->onDelete('cascade')
                ->comment('Season this driver is assigned to');
            $table->foreignId('league_driver_id')
                ->constrained('league_drivers')
                ->onDelete('cascade')
                ->comment('Reference to league driver (NOT direct driver)');
            $table->enum('status', ['active', 'reserve', 'withdrawn'])
                ->default('active')
                ->comment('Driver status in this season');
            $table->text('notes')->nullable()->comment('Season-specific driver notes');
            $table->timestamp('added_at')->useCurrent()->comment('When driver was added to season');
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            // Indexes
            $table->unique(['season_id', 'league_driver_id'], 'season_drivers_season_league_driver_unique');
            $table->index('season_id');
            $table->index('league_driver_id');
            $table->index('status');
            $table->index(['season_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('season_drivers');
    }
};
