<?php

namespace App\Console\Commands;

use App\Services\PSNService;
use App\Services\GT7Service;
use Illuminate\Console\Command;

class GetGT7Stats extends Command
{
    protected $signature = 'gt7:stats
                            {psn_id : The PSN ID to get stats for}
                            {--year= : Year for stats (default: current)}
                            {--month= : Month for stats (default: current)}';

    protected $description = 'Get GT7 statistics for a player';

    public function handle(PSNService $psnService, GT7Service $gt7Service): int
    {
        $psnId = $this->argument('psn_id');
        $yearOption = $this->option('year');
        $monthOption = $this->option('month');
        $year = $yearOption !== null ? (int) $yearOption : null;
        $month = $monthOption !== null ? (int) $monthOption : null;

        $this->info("🏁 Fetching GT7 stats for: {$psnId}");
        $this->newLine();

        try {
            // Step 1: Get PSN user
            $this->line("Step 1: Finding PSN user...");
            $psnResult = $psnService->searchUserByPsnId($psnId);

            if (!$psnResult['found']) {
                $this->error('❌ PSN user not found!');
                return self::FAILURE;
            }

            $onlineId = $psnResult['users'][0]['online_id'];
            $this->info("✅ Found: {$onlineId}");

            // Step 2: Get GT7 profile
            $this->line("Step 2: Fetching GT7 profile...");
            $gt7Profile = $gt7Service->getUserProfileByOnlineId($onlineId);

            if (!$gt7Profile || !isset($gt7Profile['result']['user_id'])) {
                $this->error("❌ GT7 profile not found");
                return self::FAILURE;
            }

            $userId = $gt7Profile['result']['user_id'];
            $this->info("✅ GT7 User ID: {$userId}");
            $this->newLine();

            // Step 3: Get stats
            $this->line("Step 3: Fetching statistics...");
            $stats = $gt7Service->getUserStats($userId, $year, $month);

            if (!$stats || !isset($stats['result'])) {
                $this->error("❌ Could not fetch statistics");
                return self::FAILURE;
            }

            $result = $stats['result'];

            // Display Driver Rating
            $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            $this->info("📊 DRIVER STATISTICS");
            $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            $this->newLine();

            $driverRating = $result['driver_rating'] ?? 0;
            $drPointRatio = $result['dr_point_ratio'] ?? 0;
            $safetyRating = $result['safety_rating'] ?? 0;
            $srPointRatio = $result['sr_point_ratio'] ?? 0;

            $drLetter = $gt7Service->getDRLetter($driverRating);
            $srLetter = $gt7Service->getSRLetter($safetyRating);
            $drPoints = $gt7Service->calculateDRPoints($driverRating, $drPointRatio);

            $this->table(
                ['Rating Type', 'Letter', 'Points', 'Progress'],
                [
                    [
                        'Driver Rating (DR)',
                        $drLetter,
                        number_format($drPoints),
                        number_format($drPointRatio * 100, 2) . '%'
                    ],
                    [
                        'Safety Rating (SR)',
                        $srLetter,
                        '-',
                        number_format($srPointRatio * 100, 2) . '%'
                    ],
                ]
            );

            // Display race statistics
            $this->newLine();
            $this->info("🏆 RACE STATISTICS");
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Total Races', $result['race_count'] ?? 0],
                    ['Wins', $result['race_win'] ?? 0],
                    ['Pole Positions', $result['pole_position'] ?? 0],
                    ['Fastest Laps', $result['fastest_lap'] ?? 0],
                    ['Clean Races', $result['clean_race'] ?? 0],
                ]
            );

            // Full data dump
            $this->newLine();
            if ($this->option('verbose')) {
                $this->info("Full Stats Data:");
                $jsonOutput = json_encode($stats, JSON_PRETTY_PRINT);
                $this->line($jsonOutput !== false ? $jsonOutput : 'Failed to encode JSON');
            } else {
                $this->comment("💡 Tip: Use -v flag to see full stats data");
            }

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error("❌ An error occurred: {$e->getMessage()}");
            return self::FAILURE;
        }
    }
}
