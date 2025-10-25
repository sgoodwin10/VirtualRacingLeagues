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
        Schema::table('season_drivers', function (Blueprint $table) {
            $table->foreignId('division_id')
                ->nullable()
                ->after('team_id')
                ->constrained('divisions')
                ->onDelete('set null')
                ->comment('Division this driver is assigned to (optional)');

            // Index for querying drivers by division
            $table->index('division_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('season_drivers', function (Blueprint $table) {
            $table->dropForeign(['division_id']);
            $table->dropIndex(['division_id']);
            $table->dropColumn('division_id');
        });
    }
};
