<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Make created_by_user_id nullable in tables that reference users.
     *
     * This allows us to set these columns to NULL when a user is hard deleted,
     * preserving the records while removing the user reference.
     *
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        // For SQLite (testing), we can't modify columns easily
        // The foreign key constraints in SQLite are also different
        // Just ensure the schema is correct for fresh migrations
        if ($driver === 'sqlite') {
            // SQLite doesn't enforce foreign keys the same way
            // The columns in original migrations should already be set up correctly
            // for new databases. For existing SQLite databases (tests), we can skip.
            return;
        }

        // For MySQL/MariaDB, modify the schema
        $this->modifyTable('rounds', 'rounds_created_by_user_id_foreign');
        $this->modifyTable('seasons', 'seasons_created_by_user_id_foreign');
        $this->modifyTable('competitions', 'competitions_created_by_user_id_foreign');
    }

    /**
     * Modify a table to make created_by_user_id nullable with nullOnDelete FK.
     */
    private function modifyTable(string $table, string $fkName): void
    {
        // Check if FK exists
        $fkExists = DB::selectOne("
            SELECT COUNT(*) as cnt FROM information_schema.TABLE_CONSTRAINTS
            WHERE CONSTRAINT_NAME = ?
            AND TABLE_SCHEMA = DATABASE()
        ", [$fkName]);

        if ($fkExists && $fkExists->cnt > 0) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropForeign(['created_by_user_id']);
            });
        }

        // Make column nullable
        DB::statement("ALTER TABLE {$table} MODIFY created_by_user_id BIGINT UNSIGNED NULL");

        // Clean up orphaned records
        DB::statement(
            "UPDATE {$table} SET created_by_user_id = NULL " .
            "WHERE created_by_user_id IS NOT NULL " .
            "AND created_by_user_id NOT IN (SELECT id FROM users)"
        );

        // Add FK with nullOnDelete
        Schema::table($table, function (Blueprint $blueprint) {
            $blueprint->foreign('created_by_user_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            return;
        }

        // Note: Reversing this migration may fail if there are NULL values
        $this->revertTable('rounds');
        $this->revertTable('seasons');
        $this->revertTable('competitions');
    }

    /**
     * Revert a table to NOT NULL with restrictOnDelete FK.
     */
    private function revertTable(string $table): void
    {
        Schema::table($table, function (Blueprint $blueprint) {
            $blueprint->dropForeign(['created_by_user_id']);
        });

        DB::statement("ALTER TABLE {$table} MODIFY created_by_user_id BIGINT UNSIGNED NOT NULL");

        Schema::table($table, function (Blueprint $blueprint) {
            $blueprint->foreign('created_by_user_id')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
        });
    }
};
