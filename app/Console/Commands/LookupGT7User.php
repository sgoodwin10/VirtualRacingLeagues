<?php

namespace App\Console\Commands;

use App\Services\GT7Service;
use App\Services\PSNService;
use Illuminate\Console\Command;

class LookupGT7User extends Command
{
    protected $signature = 'gt7:lookup {psn_id : The PSN ID to lookup in GT7}';

    protected $description = 'Look up a GT7 player profile by their PSN ID';

    public function handle(PSNService $psnService, GT7Service $gt7Service): int
    {
        $psnId = $this->argument('psn_id');

        $this->info("🔍 Looking up GT7 profile for: {$psnId}");
        $this->newLine();

        try {
            // Step 1: Find PSN user
            $this->line('Step 1: Searching PSN...');
            $psnResult = $psnService->searchUserByPsnId($psnId);

            if (! $psnResult['found']) {
                $this->error('❌ PSN user not found!');

                return self::FAILURE;
            }

            if ($psnResult['count'] > 1) {
                $this->warn("⚠️  Found {$psnResult['count']} PSN users. Using the first one.");
            }

            $onlineId = $psnResult['users'][0]['online_id'];
            $accountId = $psnResult['users'][0]['account_id'];

            $this->info("✅ Found PSN user: {$onlineId}");
            $this->line("   Account ID: {$accountId}");
            $this->newLine();

            // Step 2: Get GT7 profile
            $this->line('Step 2: Fetching GT7 profile...');
            $gt7Profile = $gt7Service->getUserProfileByOnlineId($onlineId);

            if (! $gt7Profile) {
                $this->error("❌ GT7 profile not found for {$onlineId}");
                $this->warn('This user may not have played Gran Turismo 7 or their profile is private.');

                return self::FAILURE;
            }

            if (! isset($gt7Profile['result'])) {
                $this->error('❌ Unexpected GT7 API response format');
                $this->line('Response: ' . json_encode($gt7Profile, JSON_PRETTY_PRINT));

                return self::FAILURE;
            }

            $userId = $gt7Profile['result']['user_id'] ?? null;
            $nickname = $gt7Profile['result']['nick_name'] ?? $onlineId;
            $country = $gt7Profile['result']['country_code'] ?? 'Unknown';

            $this->info('✅ GT7 Profile Found!');
            $this->table(
                ['Field', 'Value'],
                [
                    ['GT7 User ID', $userId],
                    ['Nickname', $nickname],
                    ['Country', $country],
                    ['PSN Online ID', $gt7Profile['result']['np_online_id'] ?? 'N/A'],
                ]
            );

            $this->newLine();
            $this->info('Full GT7 Profile Data:');
            $jsonOutput = json_encode($gt7Profile, JSON_PRETTY_PRINT);
            $this->line($jsonOutput !== false ? $jsonOutput : 'Failed to encode JSON');

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error("❌ An error occurred: {$e->getMessage()}");
            $this->line($e->getTraceAsString());

            return self::FAILURE;
        }
    }
}
