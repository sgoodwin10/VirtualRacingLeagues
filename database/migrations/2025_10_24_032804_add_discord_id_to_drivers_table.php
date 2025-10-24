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
            // Add discord_id as a platform identifier (nullable)
            $table->string('discord_id', 255)->nullable()->after('iracing_customer_id');

            // Add index for searching/filtering by discord_id
            $table->index('discord_id', 'idx_driver_discord_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropIndex('idx_driver_discord_id');
            $table->dropColumn('discord_id');
        });
    }
};
