<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a test user who will own the league
        User::firstOrCreate(
            ['email' => 'samuel.goodwin@gmail.com'],
            [
                'first_name' => 'Samuel',
                'last_name' => 'Goodwin',
                'password' => Hash::make('password'),
                'status' => 'active',
                'email_verified_at' => now(),
                'alias' => 'samuel-g',
            ]
        );

        // Create additional test users if in local environment
        if (app()->environment('local')) {
            User::firstOrCreate(
                ['email' => 'john@example.com'],
                [
                    'first_name' => 'John',
                    'last_name' => 'Doe',
                    'password' => Hash::make('password'),
                    'status' => 'active',
                    'email_verified_at' => now(),
                    'alias' => 'johndoe',
                ]
            );
        }
    }
}
