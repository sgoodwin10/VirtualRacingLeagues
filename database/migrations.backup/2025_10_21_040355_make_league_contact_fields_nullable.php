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
        Schema::table('leagues', function (Blueprint $table) {
            $table->string('timezone', 50)->nullable()->change();
            $table->string('contact_email')->nullable()->change();
            $table->string('organizer_name', 100)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leagues', function (Blueprint $table) {
            $table->string('timezone', 50)->nullable(false)->change();
            $table->string('contact_email')->nullable(false)->change();
            $table->string('organizer_name', 100)->nullable(false)->change();
        });
    }
};
