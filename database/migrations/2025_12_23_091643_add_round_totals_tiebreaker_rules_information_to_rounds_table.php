<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add tiebreaker rules information to rounds table.
     * Stores structured JSON data about how ties were resolved:
     * - resolutions: array of tie resolution objects
     * - applied_rules: which rules were used
     * - unresolved_ties: any ties that couldn't be broken
     */
    public function up(): void
    {
        Schema::table('rounds', function (Blueprint $table) {
            $table->json('round_totals_tiebreaker_rules_information')
                ->nullable()
                ->after('team_championship_results')
                ->comment('Structured information about how tiebreaker rules were applied');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rounds', function (Blueprint $table) {
            $table->dropColumn('round_totals_tiebreaker_rules_information');
        });
    }
};
