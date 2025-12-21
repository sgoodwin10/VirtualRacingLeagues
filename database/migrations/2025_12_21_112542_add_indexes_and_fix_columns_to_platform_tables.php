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
        // Add composite indexes for common queries on platform_cars
        Schema::table('platform_cars', function (Blueprint $table) {
            $table->index(['platform_id', 'is_active'], 'platform_cars_platform_active_idx');
            $table->index(['platform_id', 'name'], 'platform_cars_platform_name_idx');
            $table->index('year', 'platform_cars_year_idx');
        });

        // Change URL columns from VARCHAR to TEXT for car_brands
        Schema::table('car_brands', function (Blueprint $table) {
            $table->text('logo_url')->nullable()->change();
        });

        // Change URL columns from VARCHAR to TEXT for platform_cars
        Schema::table('platform_cars', function (Blueprint $table) {
            $table->text('image_url')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop composite indexes from platform_cars
        Schema::table('platform_cars', function (Blueprint $table) {
            $table->dropIndex('platform_cars_platform_active_idx');
            $table->dropIndex('platform_cars_platform_name_idx');
            $table->dropIndex('platform_cars_year_idx');
        });

        // Revert URL columns back to VARCHAR for car_brands
        Schema::table('car_brands', function (Blueprint $table) {
            $table->string('logo_url', 255)->nullable()->change();
        });

        // Revert URL columns back to VARCHAR for platform_cars
        Schema::table('platform_cars', function (Blueprint $table) {
            $table->string('image_url', 255)->nullable()->change();
        });
    }
};
