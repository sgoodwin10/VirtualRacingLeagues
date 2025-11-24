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
            $table->longText('points_system')->nullable()->after('fastest_lap_top_10');
            $table->boolean('round_points')->default(false)->after('points_system');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rounds', function (Blueprint $table) {
            $table->dropColumn(['points_system', 'round_points']);
        });
    }
};
