<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds teams drop rounds functionality to seasons table.
     * These fields only apply when team_championship_enabled is true.
     *
     * Business Rules:
     * 1. teams_drivers_for_calculation: NULL means "All", 1-16 for specific count
     * 2. If teams_drop_rounds=false, teams_total_drop_rounds MUST be NULL or 0
     */
    public function up(): void
    {
        Schema::table('seasons', function (Blueprint $table) {
            $table->unsignedTinyInteger('teams_drivers_for_calculation')
                ->nullable()
                ->after('team_championship_enabled')
                ->comment('Number of drivers\' points to count towards team scores (NULL = All, 1-16 = specific count)');

            $table->boolean('teams_drop_rounds')
                ->default(false)
                ->after('teams_drivers_for_calculation')
                ->comment('Enable drop rounds feature for team standings');

            $table->unsignedTinyInteger('teams_total_drop_rounds')
                ->nullable()
                ->after('teams_drop_rounds')
                ->comment('Number of worst rounds to drop for team standings (NULL or 0 when disabled)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('seasons', function (Blueprint $table) {
            $table->dropColumn([
                'teams_drivers_for_calculation',
                'teams_drop_rounds',
                'teams_total_drop_rounds',
            ]);
        });
    }
};
