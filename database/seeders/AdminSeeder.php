<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Infrastructure\Persistence\Eloquent\Models\AdminEloquent as Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a super admin
        Admin::firstOrCreate(
            ['email' => 'superadmin@example.com'],
            [
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'password' => Hash::make('password'),
                'role' => 'super_admin',
                'status' => 'active',
            ]
        );

        // Create additional test admins
        if (app()->environment('local')) {
            // Create a regular admin
            Admin::firstOrCreate(
                ['email' => 'admin@example.com'],
                [
                    'first_name' => 'Regular',
                    'last_name' => 'Admin',
                    'password' => Hash::make('password'),
                    'role' => 'admin',
                    'status' => 'active',
                ]
            );

            // Create a moderator
            Admin::firstOrCreate(
                ['email' => 'moderator@example.com'],
                [
                    'first_name' => 'Content',
                    'last_name' => 'Moderator',
                    'password' => Hash::make('password'),
                    'role' => 'moderator',
                    'status' => 'active',
                ]
            );

            // Admin::factory()->count(5)->create(['role' => 'admin']);
            // Admin::factory()->count(5)->create(['role' => 'moderator']);
            // Admin::factory()->count(3)->create(['status' => 'inactive']);
        }
    }
}
