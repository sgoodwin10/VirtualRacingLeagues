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
        Schema::table('races', function (Blueprint $table) {
            // Change bonus points columns from integer to decimal(10,2)
            $table->decimal('fastest_lap', 10, 2)->nullable()->change();
            $table->decimal('qualifying_pole', 10, 2)->nullable()->change();
            $table->decimal('dnf_points', 10, 2)->default(0)->change();
            $table->decimal('dns_points', 10, 2)->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('races', function (Blueprint $table) {
            // Revert bonus points columns back to integer
            $table->integer('fastest_lap')->nullable()->change();
            $table->integer('qualifying_pole')->nullable()->change();
            $table->integer('dnf_points')->default(0)->change();
            $table->integer('dns_points')->default(0)->change();
        });
    }
};
