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
            $table->dateTime('scheduled_at')->nullable()->change();
            $table->foreignId('platform_track_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rounds', function (Blueprint $table) {
            $table->dateTime('scheduled_at')->nullable(false)->change();
            $table->foreignId('platform_track_id')->nullable(false)->change();
        });
    }
};
