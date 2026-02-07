<?php

declare(strict_types=1);

namespace Database\Seeders\Backup;

use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * UsersBackupSeeder
 *
 * This seeder restores the users table data from a backup.
 * Generated: 2026-02-07
 *
 * IMPORTANT: This seeder should ONLY run in local/development/staging environments.
 */
class UsersBackupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Environment safety check - NEVER run in production
        if (app()->environment('production')) {
            $this->command->error('UsersBackupSeeder cannot run in production environment!');
            return;
        }

        $this->command->info('Seeding users backup data...');

        // Disable foreign key checks temporarily
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        $users = [
            [
                'id' => 1,
                'first_name' => 'Samuel',
                'last_name' => 'Goodwin',
                'alias' => 'samuel-g',
                'uuid' => null,
                'status' => 'active',
                'is_admin' => false,
                'email' => 'samuel.goodwin@gmail.com',
                'email_verified_at' => '2026-01-20 12:27:05',
                'password' => '$2y$12$m4AYR4zO0nwFrFRA/GVRo.xZPgAVtROBhvRmoFc8ZpE0/p32YkQbi',
                'remember_token' => null,
                'created_at' => '2026-01-20 12:27:05',
                'updated_at' => '2026-01-20 12:27:05',
                'deleted_at' => null,
            ],
            [
                'id' => 3,
                'first_name' => 'Sammy',
                'last_name' => 'Gman',
                'alias' => null,
                'uuid' => 'eaf0f684-5362-4140-a977-224a252c0ab8',
                'status' => 'active',
                'is_admin' => false,
                'email' => 'sammyg@test.com',
                'email_verified_at' => '2026-01-20 12:27:05',
                'password' => '$2y$12$P1HgXsCv2IHuT403CzoqfuH2bj91q6feU3SrtWDuAjp5f4y1NRMG2',
                'remember_token' => 'MRsr4fMOap5pPEuWbyv90OA44TYOmzdQDTNzHOqjVPKh8WWM9JOKoCFlBOyz',
                'created_at' => '2026-01-22 09:27:15',
                'updated_at' => '2026-01-22 09:27:15',
                'deleted_at' => null,
            ],
        ];

        foreach ($users as $usersData) {
            UserEloquent::updateOrCreate(
                ['id' => $usersData['id']],
                $usersData
            );
        }

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('UsersBackupSeeder seeded successfully. Total records: ' . count($users));
    }
}
