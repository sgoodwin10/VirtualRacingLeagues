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
        Schema::table('users', function (Blueprint $table) {
            // Add soft deletes
            $table->softDeletes();

            // Update status enum to include 'suspended'
            $table->dropColumn('status');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active')->after('uuid');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn('status');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->enum('status', ['active', 'inactive'])->default('active')->after('uuid');
        });
    }
};
