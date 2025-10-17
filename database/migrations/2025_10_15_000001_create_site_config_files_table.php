<?php

declare(strict_types=1);

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
        Schema::create('site_config_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_config_id')
                ->constrained('site_configs')
                ->onDelete('cascade');

            // File Info
            $table->enum('file_type', ['logo', 'favicon', 'og_image'])->nullable(false);
            $table->string('file_name', 255)->nullable(false);
            $table->string('file_path', 500)->nullable(false);
            $table->string('storage_disk', 50)->default('public')->nullable(false);
            $table->string('mime_type', 100)->nullable(false);
            $table->unsignedInteger('file_size')->nullable(false)->comment('File size in bytes');

            // Metadata
            $table->timestamps();

            // Indexes
            $table->unique(['site_config_id', 'file_type'], 'idx_site_config_file_type');
            $table->index('file_type', 'idx_file_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_config_files');
    }
};
