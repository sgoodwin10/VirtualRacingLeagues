<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Create round_tiebreaker_rules table.
     * Stores available tiebreaker rules that can be applied to resolve ties.
     */
    public function up(): void
    {
        Schema::create('round_tiebreaker_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name')->comment('Human-readable name of the rule');
            $table->string('slug')->unique()->comment('Unique slug identifier for the rule');
            $table->text('description')->nullable()->comment('Description of how the rule works');
            $table->boolean('is_active')->default(true)->comment('Whether this rule is active');
            $table->unsignedInteger('default_order')->default(0)->comment('Default order when adding to new seasons');
            $table->timestamps();

            // Indexes
            $table->index(['is_active', 'default_order'], 'idx_active_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('round_tiebreaker_rules');
    }
};
