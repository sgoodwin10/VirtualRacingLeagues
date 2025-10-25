<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('races', function (Blueprint $table) {
            // Add discriminator column
            $table->boolean('is_qualifier')->default(false)->after('round_id');

            // Add index for efficient queries
            $table->index(['round_id', 'is_qualifier'], 'idx_races_round_qualifier');
        });

        // Update existing records to be races (not qualifiers)
        DB::table('races')->update(['is_qualifier' => false]);

        // Make race_number nullable (NULL for qualifiers, required for races)
        Schema::table('races', function (Blueprint $table) {
            $table->integer('race_number')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('races', function (Blueprint $table) {
            $table->dropIndex('idx_races_round_qualifier');
            $table->dropColumn('is_qualifier');
            $table->integer('race_number')->nullable(false)->change();
        });
    }
};
