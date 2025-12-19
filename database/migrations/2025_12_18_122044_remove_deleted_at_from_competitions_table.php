<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * WARNING: This migration permanently deletes soft-deleted competitions.
     * Ensure you have database backups before running in production.
     */
    public function up(): void
    {
        DB::transaction(function () {
            // Check for soft-deleted competitions before removing the column
            $softDeletedCount = DB::table('competitions')
                ->whereNotNull('deleted_at')
                ->count();

            if ($softDeletedCount > 0) {
                // Check for orphaned media files
                $competitionsWithMedia = DB::table('competitions')
                    ->whereNotNull('deleted_at')
                    ->whereExists(function ($query) {
                        $query->select(DB::raw(1))
                            ->from('media')
                            ->whereColumn('media.model_id', 'competitions.id')
                            ->where('media.model_type', 'App\\Infrastructure\\Persistence\\Eloquent\\Models\\Competition');
                    })
                    ->count();

                if ($competitionsWithMedia > 0) {
                    Log::warning(
                        "{$competitionsWithMedia} soft-deleted competitions have related media files. "
                        . "These media files will be orphaned after deletion."
                    );
                }

                // Check for activity logs
                $competitionsWithActivityLogs = DB::table('competitions')
                    ->whereNotNull('deleted_at')
                    ->whereExists(function ($query) {
                        $query->select(DB::raw(1))
                            ->from('activity_log')
                            ->whereColumn('activity_log.subject_id', 'competitions.id')
                            ->where('activity_log.subject_type', 'App\\Infrastructure\\Persistence\\Eloquent\\Models\\Competition');
                    })
                    ->count();

                if ($competitionsWithActivityLogs > 0) {
                    Log::warning(
                        "{$competitionsWithActivityLogs} soft-deleted competitions have related activity logs. "
                        . "These activity logs will remain but reference deleted competitions."
                    );
                }

                // Verify no soft-deleted competitions have related seasons
                $competitionsWithSeasons = DB::table('competitions')
                    ->whereNotNull('deleted_at')
                    ->whereExists(function ($query) {
                        $query->select(DB::raw(1))
                            ->from('seasons')
                            ->whereColumn('seasons.competition_id', 'competitions.id');
                    })
                    ->count();

                if ($competitionsWithSeasons > 0) {
                    throw new \RuntimeException(
                        "Cannot remove soft-deleted competitions: {$competitionsWithSeasons} soft-deleted "
                        . "competitions have related seasons. Please manually resolve these relationships first."
                    );
                }

                // Create backup table for soft-deleted competitions
                Schema::dropIfExists('competitions_deleted_backup');

                // Create backup table structure (copy from competitions table)
                Schema::create('competitions_deleted_backup', function (Blueprint $table) {
                    $table->id();
                    $table->foreignId('league_id')->constrained('leagues')->onDelete('cascade');
                    $table->foreignId('platform_id')->constrained('platforms')->onDelete('cascade');
                    $table->foreignId('created_by_user_id')->constrained('users')->onDelete('cascade');
                    $table->string('name', 100);
                    $table->string('slug', 100)->unique();
                    $table->text('description')->nullable();
                    $table->string('logo_path')->nullable();
                    $table->string('competition_colour')->nullable();
                    $table->string('status', 20)->default('active');
                    $table->timestamp('archived_at')->nullable();
                    $table->timestamps();
                    $table->timestamp('deleted_at')->nullable();
                });

                // Copy soft-deleted records to backup table
                $softDeletedCompetitions = DB::table('competitions')
                    ->whereNotNull('deleted_at')
                    ->get();

                foreach ($softDeletedCompetitions as $competition) {
                    DB::table('competitions_deleted_backup')->insert((array) $competition);
                }

                Log::info("Backed up and removing {$softDeletedCount} soft-deleted competitions during migration");

                // Hard-delete soft-deleted records
                DB::table('competitions')
                    ->whereNotNull('deleted_at')
                    ->delete();
            }

            // Remove the soft deletes column
            Schema::table('competitions', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::transaction(function () {
            // Restore the soft deletes column
            Schema::table('competitions', function (Blueprint $table) {
                $table->softDeletes();
            });

            // Restore backed up soft-deleted competitions if backup table exists
            if (Schema::hasTable('competitions_deleted_backup')) {
                $backupCount = DB::table('competitions_deleted_backup')->count();

                if ($backupCount > 0) {
                    // Restore soft-deleted records from backup
                    $backupRecords = DB::table('competitions_deleted_backup')->get();

                    foreach ($backupRecords as $record) {
                        DB::table('competitions')->insert((array) $record);
                    }

                    Log::info(
                        "Restored {$backupCount} soft-deleted competitions from backup during migration rollback"
                    );
                }

                // Drop the backup table
                Schema::dropIfExists('competitions_deleted_backup');
            }
        });
    }
};
