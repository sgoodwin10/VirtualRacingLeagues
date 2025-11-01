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
        Schema::create('platform_track_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_id')->constrained('platforms')->onDelete('cascade');
            $table->string('name');
            $table->string('slug');
            $table->string('country')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('platform_id');
            $table->index('slug');
            $table->index('is_active');
            $table->unique(['platform_id', 'slug'], 'platform_track_locations_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_track_locations');
    }
};
