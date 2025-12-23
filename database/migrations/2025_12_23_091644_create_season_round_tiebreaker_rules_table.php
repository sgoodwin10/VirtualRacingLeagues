<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Create season_round_tiebreaker_rules pivot table.
     * Links seasons to their ordered tiebreaker rules.
     */
    public function up(): void
    {
        Schema::create('season_round_tiebreaker_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('season_id')->constrained('seasons')->onDelete('cascade');
            $table->foreignId('round_tiebreaker_rule_id')->constrained('round_tiebreaker_rules')->onDelete('cascade');
            $table->unsignedInteger('order')->comment('Order in which rules are applied (1 = first)');
            $table->timestamps();

            // Unique constraint: a rule can only be added once per season
            $table->unique(['season_id', 'round_tiebreaker_rule_id'], 'unique_season_rule');

            // Index for efficient ordering queries
            $table->index(['season_id', 'order'], 'idx_season_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('season_round_tiebreaker_rules');
    }
};
