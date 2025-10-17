<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Infrastructure\Persistence\Eloquent\Models\AdminEloquent as Admin;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent as User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
        ]);

        // Create Super Admin
        $superAdminPassword = Str::random(16);

        $superAdmin = Admin::create([
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make($superAdminPassword),
            'role' => 'super_admin',
            'status' => 'active',
        ]);

        // Output credentials for first-time setup
        $this->command->info('============================================');
        $this->command->info('Super Admin Account Created Successfully!');
        $this->command->info('============================================');
        $this->command->info('Email: ' . $superAdmin->email);
        $this->command->info('Password: ' . $superAdminPassword);
        $this->command->warn('IMPORTANT: Save these credentials securely!');
        $this->command->info('============================================');
    }
}
