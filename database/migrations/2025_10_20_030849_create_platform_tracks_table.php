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
        Schema::create('platform_tracks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_id')->constrained('platforms')->onDelete('cascade');
            $table->foreignId('platform_track_location_id')->constrained('platform_track_locations')->onDelete('cascade');
            $table->string('name');
            $table->string('slug');
            $table->boolean('is_reverse')->default(false);
            $table->string('image_path')->nullable();
            $table->integer('length_meters')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('platform_id');
            $table->index('platform_track_location_id');
            $table->index('slug');
            $table->index('is_active');
            $table->unique(['platform_id', 'platform_track_location_id', 'slug']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_tracks');
    }
};
