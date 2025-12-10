<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds drop round functionality to seasons table.
     * Business Rule: If drop_round=false, total_drop_rounds MUST be 0.
     */
    public function up(): void
    {
        Schema::table('seasons', function (Blueprint $table) {
            $table->boolean('drop_round')
                ->default(false)
                ->after('race_times_required')
                ->comment('Enable drop round feature for standings calculation');

            $table->unsignedTinyInteger('total_drop_rounds')
                ->default(0)
                ->after('drop_round')
                ->comment('Number of worst rounds to drop from standings (0-255)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('seasons', function (Blueprint $table) {
            $table->dropColumn(['drop_round', 'total_drop_rounds']);
        });
    }
};
