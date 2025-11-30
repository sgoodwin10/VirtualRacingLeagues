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
        Schema::table('rounds', function (Blueprint $table) {
            $table->json('qualifying_results')->nullable()->after('round_results');
            $table->json('race_time_results')->nullable()->after('qualifying_results');
            $table->json('fastest_lap_results')->nullable()->after('race_time_results');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rounds', function (Blueprint $table) {
            $table->dropColumn(['qualifying_results', 'race_time_results', 'fastest_lap_results']);
        });
    }
};
