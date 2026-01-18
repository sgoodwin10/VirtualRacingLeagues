<?php

namespace App\Console\Commands;

use App\Services\PSNService;
use Illuminate\Console\Command;

class SearchPsnUser extends Command
{
    protected $signature = 'psn:search {psn_id : The PSN ID/username to search for}';
    protected $description = 'Search for a PSN user by their PSN ID';

    public function handle(PSNService $psnService): int
    {
        $psnId = $this->argument('psn_id');

        $this->info("🔍 Searching for PSN user: {$psnId}");
        $this->newLine();

        try {
            $result = $psnService->searchUserByPsnId($psnId);

            if (!$result['found']) {
                $this->error('❌ User not found!');
                if (isset($result['error'])) {
                    $this->error("Error: {$result['error']}");
                }
                return self::FAILURE;
            }

            $this->info("✅ Found {$result['count']} user(s):");
            $this->newLine();

            foreach ($result['users'] as $index => $user) {
                $this->line("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                $this->line("Result #" . ($index + 1));
                $this->table(
                    ['Field', 'Value'],
                    [
                        ['Online ID', $user['online_id']],
                        ['Account ID', $user['account_id']],
                        ['Avatar URL', $user['avatar_url'] ?: 'N/A'],
                        ['PS Plus', $user['is_plus'] ? '✓ Yes' : '✗ No'],
                    ]
                );
            }

            // If exactly one user found, get full profile
            if ($result['count'] === 1) {
                $this->newLine();
                $this->info("📋 Fetching full PSN profile...");

                $accountId = $result['users'][0]['account_id'];
                $profile = $psnService->getUserProfile($accountId);

                if ($profile) {
                    $this->info("Full Profile Data:");
                    $jsonOutput = json_encode($profile, JSON_PRETTY_PRINT);
                    $this->line($jsonOutput !== false ? $jsonOutput : 'Failed to encode JSON');
                } else {
                    $this->warn("Could not fetch full profile");
                }
            }

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error("❌ An error occurred: {$e->getMessage()}");
            return self::FAILURE;
        }
    }
}
