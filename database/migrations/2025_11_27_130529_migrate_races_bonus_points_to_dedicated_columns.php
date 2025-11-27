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
        // Add new dedicated bonus columns to races table
        Schema::table('races', function (Blueprint $table) {
            // Fastest Lap Configuration
            $table->integer('fastest_lap')->nullable()
                ->after('assists_restrictions')
                ->comment('Points awarded for fastest lap');
            $table->boolean('fastest_lap_top_10')->default(false)
                ->after('fastest_lap')
                ->comment('Whether fastest lap bonus is only awarded to drivers finishing in top 10');

            // Qualifying Pole Configuration
            $table->integer('qualifying_pole')->nullable()
                ->after('fastest_lap_top_10')
                ->comment('Points awarded for qualifying pole position');
            $table->boolean('qualifying_pole_top_10')->default(false)
                ->after('qualifying_pole')
                ->comment('Whether qualifying pole bonus is only awarded to drivers finishing in top 10');
        });

        // Migrate existing data from bonus_points JSON column to dedicated columns
        DB::table('races')->orderBy('id')->chunk(100, function ($races) {
            foreach ($races as $race) {
                $bonusPoints = $race->bonus_points ? json_decode($race->bonus_points, true) : null;

                if ($bonusPoints === null) {
                    continue;
                }

                $updates = [];

                // Migrate fastest_lap
                if (isset($bonusPoints['fastest_lap'])) {
                    $updates['fastest_lap'] = (int) $bonusPoints['fastest_lap'];
                }

                // Migrate fastest_lap_top_10_only to fastest_lap_top_10
                if (isset($bonusPoints['fastest_lap_top_10_only'])) {
                    $updates['fastest_lap_top_10'] = (bool) $bonusPoints['fastest_lap_top_10_only'];
                }

                // Migrate pole to qualifying_pole
                if (isset($bonusPoints['pole'])) {
                    $updates['qualifying_pole'] = (int) $bonusPoints['pole'];
                }

                // Check if qualifying_pole_top_10 exists in JSON (future-proofing)
                if (isset($bonusPoints['qualifying_pole_top_10'])) {
                    $updates['qualifying_pole_top_10'] = (bool) $bonusPoints['qualifying_pole_top_10'];
                }

                if (!empty($updates)) {
                    DB::table('races')
                        ->where('id', $race->id)
                        ->update($updates);
                }
            }
        });

        // Drop the bonus_points JSON column
        Schema::table('races', function (Blueprint $table) {
            $table->dropColumn('bonus_points');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re-add the bonus_points JSON column
        Schema::table('races', function (Blueprint $table) {
            $table->json('bonus_points')->nullable()->after('assists_restrictions');
        });

        // Migrate data back from dedicated columns to bonus_points JSON
        DB::table('races')->orderBy('id')->chunk(100, function ($races) {
            foreach ($races as $race) {
                $bonusPoints = [];

                // Migrate back fastest_lap
                if ($race->fastest_lap !== null) {
                    $bonusPoints['fastest_lap'] = $race->fastest_lap;
                }

                // Migrate back fastest_lap_top_10 to fastest_lap_top_10_only
                if ($race->fastest_lap_top_10) {
                    $bonusPoints['fastest_lap_top_10_only'] = true;
                }

                // Migrate back qualifying_pole to pole
                if ($race->qualifying_pole !== null) {
                    $bonusPoints['pole'] = $race->qualifying_pole;
                }

                // Only update if there are bonus points
                $updates = [
                    'bonus_points' => !empty($bonusPoints) ? json_encode($bonusPoints) : null,
                ];

                DB::table('races')
                    ->where('id', $race->id)
                    ->update($updates);
            }
        });

        // Drop the dedicated columns
        Schema::table('races', function (Blueprint $table) {
            $table->dropColumn([
                'fastest_lap',
                'fastest_lap_top_10',
                'qualifying_pole',
                'qualifying_pole_top_10',
            ]);
        });
    }
};
