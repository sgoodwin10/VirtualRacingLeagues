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
            $table->integer('fastest_lap')->nullable()->after('internal_notes')
                ->comment('Points awarded for fastest lap. If null, each race awards fastest lap. If not null, fastest lap across all races (except quali) gets the points.');
            $table->boolean('fastest_lap_top_10')->default(false)->after('fastest_lap')
                ->comment('Whether fastest lap bonus is only awarded to drivers finishing in top 10.');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rounds', function (Blueprint $table) {
            $table->dropColumn(['fastest_lap', 'fastest_lap_top_10']);
        });
    }
};
