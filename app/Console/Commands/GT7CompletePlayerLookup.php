<?php

namespace App\Console\Commands;

use App\Services\GT7Service;
use App\Services\PSNService;
use Illuminate\Console\Command;

class GT7CompletePlayerLookup extends Command
{
    protected $signature = 'gt7:player
                            {psn_id : The PSN ID to lookup}
                            {--guid= : GT7 User GUID (bypasses profile lookup)}';

    protected $description = 'Complete player lookup: PSN → GT7 Profile → Stats';

    public function handle(PSNService $psnService, GT7Service $gt7Service): int
    {
        $psnId = $this->argument('psn_id');
        $providedGuid = $this->option('guid');

        $this->info('╔═══════════════════════════════════════════════════════╗');
        $this->info('║     GRAN TURISMO 7 - COMPLETE PLAYER LOOKUP          ║');
        $this->info('╚═══════════════════════════════════════════════════════╝');
        $this->newLine();
        $this->line("Searching for: {$psnId}");
        if ($providedGuid) {
            $this->line("Using provided GUID: {$providedGuid}");
        }
        $this->newLine();

        try {
            // Step 1: PSN Search
            $this->info('🔍 [1/3] Searching PlayStation Network...');
            $psnResult = $psnService->searchUserByPsnId($psnId);

            if (! $psnResult['found']) {
                $this->error('❌ Player not found on PSN');

                return self::FAILURE;
            }

            $onlineId = $psnResult['users'][0]['online_id'];
            $accountId = $psnResult['users'][0]['account_id'];

            $this->info('   ✅ PSN Account Located');
            $this->line("   → Online ID: {$onlineId}");
            $this->line("   → Account ID: {$accountId}");
            $this->newLine();

            // Step 2: GT7 Profile / GUID
            $userId = null;
            $nickname = $onlineId;
            $country = '??';

            if ($providedGuid) {
                // Use provided GUID directly
                $this->info('🎮 [2/3] Using provided GT7 GUID...');
                $userId = $providedGuid;
                $this->info('   ✅ GUID provided');
                $this->line("   → User ID: {$userId}");
            } else {
                // Try to get GT7 Profile (will only work for token owner)
                $this->info('🎮 [2/3] Fetching GT7 Profile...');
                $gt7Profile = $gt7Service->getUserProfileByOnlineId($onlineId, $accountId);

                if (! $gt7Profile || ! isset($gt7Profile['result']['user_id'])) {
                    $this->error('❌ No GT7 profile found');
                    $this->warn('   The GT7 API only allows looking up your own profile.');
                    $this->warn('   To look up other players, provide their GT7 GUID:');
                    $this->newLine();
                    $this->line("   php artisan gt7:player \"{$psnId}\" --guid=<GT7_GUID>");
                    $this->newLine();
                    $this->warn('   Find GUIDs from gran-turismo.com profile URLs:');
                    $this->warn('   https://www.gran-turismo.com/us/gt7/user/mymenu/<GUID>/profile');

                    return self::FAILURE;
                }

                $userId = $gt7Profile['result']['user_id'];
                $nickname = $gt7Profile['result']['nick_name'] ?? $onlineId;
                $country = $gt7Profile['result']['country_code'] ?? '??';

                $this->info('   ✅ GT7 Profile Found');
                $this->line("   → User ID: {$userId}");
                $this->line("   → Nickname: {$nickname}");
                $this->line("   → Country: {$country}");
            }
            $this->newLine();

            $this->info('   ✅ GT7 Profile Found');
            $this->line("   → User ID: {$userId}");
            $this->line("   → Nickname: {$nickname}");
            $this->line("   → Country: {$country}");
            $this->newLine();

            // Step 3: Statistics
            $this->info('📊 [3/3] Retrieving Statistics...');
            $stats = $gt7Service->getUserStats($userId);

            if (! $stats || ! isset($stats['result'])) {
                $this->warn('⚠️  Statistics not available');

                return self::SUCCESS;
            }

            $result = $stats['result'];
            $this->info('   ✅ Statistics Retrieved');
            $this->newLine();

            // Display Summary
            $this->info('═══════════════════════════════════════════════════════');
            $this->info('                    PLAYER SUMMARY                      ');
            $this->info('═══════════════════════════════════════════════════════');
            $this->newLine();

            $driverRating = $result['driver_rating'] ?? 0;
            $drPointRatio = $result['dr_point_ratio'] ?? 0;
            $safetyRating = $result['safety_rating'] ?? 0;

            $drLetter = $gt7Service->getDRLetter($driverRating);
            $srLetter = $gt7Service->getSRLetter($safetyRating);
            $drPoints = $gt7Service->calculateDRPoints($driverRating, $drPointRatio);

            $this->table(
                ['Category', 'Details'],
                [
                    ['Player', "{$nickname} ({$onlineId})"],
                    ['Country', $country],
                    ['Driver Rating', "{$drLetter} (" . number_format($drPoints) . ' points)'],
                    ['Safety Rating', $srLetter],
                    ['Total Races', $result['race_count'] ?? 0],
                    ['Wins', $result['race_win'] ?? 0],
                    ['Win Rate', $this->calculateWinRate($result)],
                    ['Pole Positions', $result['pole_position'] ?? 0],
                    ['Fastest Laps', $result['fastest_lap'] ?? 0],
                ]
            );

            $this->newLine();
            $this->info('✨ Lookup completed successfully!');

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error("❌ Error: {$e->getMessage()}");

            return self::FAILURE;
        }
    }

    private function calculateWinRate(array $stats): string
    {
        $races = $stats['race_count'] ?? 0;
        $wins = $stats['race_win'] ?? 0;

        if ($races === 0) {
            return 'N/A';
        }

        $rate = ($wins / $races) * 100;

        return number_format($rate, 2) . '%';
    }
}
