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
        Schema::create('divisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('season_id')
                ->constrained('seasons')
                ->onDelete('cascade')
                ->comment('Season this division belongs to');
            $table->string('name', 60)->comment('Division name (2-60 characters, not unique)');
            $table->text('description')->nullable()->comment('Division description (10-500 characters, optional)');
            $table->string('logo_url', 255)->nullable()->comment('Division logo URL/path');
            $table->timestamps();

            // Indexes
            $table->index('season_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('divisions');
    }
};
