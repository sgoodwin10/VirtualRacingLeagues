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
        Schema::create('seasons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('competition_id')
                ->constrained('competitions')
                ->onDelete('cascade')
                ->comment('Competition this season belongs to');
            $table->string('name', 100)->comment('Season name');
            $table->string('slug', 150)->comment('URL-friendly slug');
            $table->string('car_class', 150)->nullable()->comment('Car class/restrictions');
            $table->text('description')->nullable()->comment('Rich text description');
            $table->text('technical_specs')->nullable()->comment('Technical specifications');
            $table->string('logo_path', 255)->nullable()->comment('Logo image path');
            $table->string('banner_path', 255)->nullable()->comment('Banner image path');
            $table->boolean('team_championship_enabled')
                ->default(false)
                ->comment('Enable team championship features');
            $table->boolean('race_divisions_enabled')
                ->default(false)
                ->comment('Enable race division features');
            $table->enum('status', ['setup', 'active', 'completed', 'archived'])
                ->default('setup')
                ->comment('Season lifecycle status');
            $table->foreignId('created_by_user_id')
                ->constrained('users')
                ->onDelete('restrict')
                ->comment('User who created the season');
            $table->timestamps();
            $table->softDeletes()->comment('Soft delete timestamp');

            // Indexes
            $table->unique(['competition_id', 'slug'], 'seasons_competition_slug_unique');
            $table->index('competition_id');
            $table->index('status');
            $table->index('created_by_user_id');
            $table->index('deleted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seasons');
    }
};
