<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add tiebreaker rules enabled flag to seasons table.
     * When enabled, rounds will apply tiebreaker rules to resolve ties.
     * When disabled, tied drivers share the same position and points.
     */
    public function up(): void
    {
        Schema::table('seasons', function (Blueprint $table) {
            $table->boolean('round_totals_tiebreaker_rules_enabled')
                ->default(false)
                ->after('total_drop_rounds')
                ->comment('Enable tiebreaker rules for resolving ties in round totals');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('seasons', function (Blueprint $table) {
            $table->dropColumn('round_totals_tiebreaker_rules_enabled');
        });
    }
};
