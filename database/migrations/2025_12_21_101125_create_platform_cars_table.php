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
        Schema::create('platform_cars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_id')->constrained('platforms')->onDelete('cascade');
            $table->foreignId('car_brand_id')->constrained('car_brands')->onDelete('cascade');
            $table->string('external_id', 50);
            $table->string('name');
            $table->string('slug');
            $table->string('car_group', 50)->nullable();
            $table->integer('year')->nullable();
            $table->string('image_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            // Indexes
            $table->unique(['platform_id', 'external_id']);
            $table->unique(['platform_id', 'slug']);
            $table->index('car_brand_id');
            $table->index('is_active');
            $table->index('car_group');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_cars');
    }
};
