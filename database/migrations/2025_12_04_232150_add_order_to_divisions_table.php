<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('divisions', function (Blueprint $table) {
            // Add order column (NOT NULL with default 1)
            $table->unsignedInteger('order')->default(1)->after('season_id');

            // Add composite index on (season_id, order) for efficient querying
            $table->index(['season_id', 'order'], 'divisions_season_id_order_index');
        });

        // Backfill existing divisions with sequential order based on name
        $this->backfillDivisionOrder();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('divisions', function (Blueprint $table) {
            // Drop composite index first
            $table->dropIndex('divisions_season_id_order_index');

            // Drop order column
            $table->dropColumn('order');
        });
    }

    /**
     * Backfill existing divisions with sequential order based on name (alphabetically).
     */
    private function backfillDivisionOrder(): void
    {
        // Get all divisions grouped by season_id, ordered by name
        $divisions = DB::table('divisions')
            ->select('id', 'season_id', 'name')
            ->orderBy('season_id')
            ->orderBy('name')
            ->get();

        // Group by season_id and assign order numbers
        $divisionsBySeasonId = $divisions->groupBy('season_id');

        foreach ($divisionsBySeasonId as $seasonId => $seasonDivisions) {
            $order = 1;
            foreach ($seasonDivisions as $division) {
                DB::table('divisions')
                    ->where('id', $division->id)
                    ->update(['order' => $order++]);
            }
        }
    }
};
