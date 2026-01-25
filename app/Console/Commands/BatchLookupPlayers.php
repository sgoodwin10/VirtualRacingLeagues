<?php

namespace App\Console\Commands;

use App\Services\GT7Service;
use App\Services\PSNService;
use Illuminate\Console\Command;

class BatchLookupPlayers extends Command
{
    protected $signature = 'gt7:batch {file : Path to file with PSN IDs (one per line)}';

    protected $description = 'Batch lookup multiple players from a file';

    public function handle(PSNService $psnService, GT7Service $gt7Service): int
    {
        $filePath = $this->argument('file');

        if (! file_exists($filePath)) {
            $this->error("File not found: {$filePath}");

            return self::FAILURE;
        }

        $fileContents = file($filePath);
        if ($fileContents === false) {
            $this->error("Failed to read file: {$filePath}");

            return self::FAILURE;
        }
        $psnIds = array_filter(array_map('trim', $fileContents));
        $total = count($psnIds);

        $this->info("Processing {$total} players...");
        $this->newLine();

        $bar = $this->output->createProgressBar($total);
        $results = [];

        foreach ($psnIds as $psnId) {
            try {
                // Lookup player
                $psnResult = $psnService->searchUserByPsnId($psnId);

                if ($psnResult['found']) {
                    $onlineId = $psnResult['users'][0]['online_id'];
                    $gt7Profile = $gt7Service->getUserProfileByOnlineId($onlineId);

                    if ($gt7Profile && isset($gt7Profile['result']['user_id'])) {
                        $userId = $gt7Profile['result']['user_id'];
                        $stats = $gt7Service->getUserStats($userId);

                        $results[] = [
                            'psn_id' => $psnId,
                            'found' => true,
                            'gt7_user_id' => $userId,
                            'stats' => $stats,
                        ];
                    } else {
                        $results[] = [
                            'psn_id' => $psnId,
                            'found' => false,
                            'reason' => 'No GT7 profile',
                        ];
                    }
                } else {
                    $results[] = [
                        'psn_id' => $psnId,
                        'found' => false,
                        'reason' => 'PSN user not found',
                    ];
                }

                // Rate limiting
                sleep(1);
            } catch (\Exception $e) {
                $results[] = [
                    'psn_id' => $psnId,
                    'found' => false,
                    'error' => $e->getMessage(),
                ];
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        // Save results
        $outputFile = 'storage/gt7_batch_results_' . time() . '.json';
        file_put_contents($outputFile, json_encode($results, JSON_PRETTY_PRINT));

        $this->info("Results saved to: {$outputFile}");

        return self::SUCCESS;
    }
}
