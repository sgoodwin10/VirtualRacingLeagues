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
        Schema::table('drivers', function (Blueprint $table) {
            // Drop the gt7_id column and its index if they exist
            if (Schema::hasColumn('drivers', 'gt7_id')) {
                $table->dropIndex('idx_driver_gt7_id');
                $table->dropColumn('gt7_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            // Re-add the gt7_id column and index
            $table->string('gt7_id', 255)->nullable()->after('psn_id');
            $table->index('gt7_id', 'idx_driver_gt7_id');
        });
    }
};
