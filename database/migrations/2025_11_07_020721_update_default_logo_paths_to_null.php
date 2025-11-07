<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * 1. Make logo_path nullable in leagues table
     * 2. Update existing records with default.png logo paths to null
     * This ensures logo_url will be null when no logo has been uploaded.
     */
    public function up(): void
    {
        // First, make logo_path nullable in leagues table
        Schema::table('leagues', function (Blueprint $table) {
            $table->string('logo_path')->nullable()->change();
        });

        // Now update existing records with default.png to null
        DB::table('leagues')
            ->where('logo_path', 'leagues/logos/default.png')
            ->update(['logo_path' => null]);

        // Update competitions table (if any have default.png)
        DB::table('competitions')
            ->where('logo_path', 'competitions/logos/default.png')
            ->orWhere('logo_path', 'default.png')
            ->update(['logo_path' => null]);
    }

    /**
     * Reverse the migrations.
     *
     * 1. Restore default.png values (optional - data migration reversal)
     * 2. Make logo_path NOT nullable again
     */
    public function down(): void
    {
        // Restore default.png values for leagues that have null
        DB::table('leagues')
            ->whereNull('logo_path')
            ->update(['logo_path' => 'leagues/logos/default.png']);

        // Make logo_path NOT nullable again in leagues table
        Schema::table('leagues', function (Blueprint $table) {
            $table->string('logo_path')->nullable(false)->change();
        });

        // We don't restore competition logos as they should remain null
    }
};
