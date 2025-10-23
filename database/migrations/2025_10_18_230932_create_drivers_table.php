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
        Schema::create('drivers', function (Blueprint $table) {
            $table->id();

            // Names (at least one required - enforced at application layer)
            $table->string('first_name', 100)->nullable();
            $table->string('last_name', 100)->nullable();
            $table->string('nickname', 100)->nullable();

            // Contact information (optional)
            $table->string('email', 255)->nullable();
            $table->string('phone', 20)->nullable();

            // Platform identifiers (at least one required - enforced at application layer)
            $table->string('psn_id', 255)->nullable();
            $table->string('iracing_id', 255)->nullable();
            $table->integer('iracing_customer_id')->nullable();

            // Timestamps
            $table->timestamps();
            $table->softDeletes();

            // Indexes for searching and filtering
            $table->index(['first_name', 'last_name'], 'idx_driver_name');
            $table->index('nickname', 'idx_driver_nickname');
            $table->index('psn_id', 'idx_driver_psn_id');
            $table->index('iracing_id', 'idx_driver_iracing_id');
            $table->index('email', 'idx_driver_email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('drivers');
    }
};
