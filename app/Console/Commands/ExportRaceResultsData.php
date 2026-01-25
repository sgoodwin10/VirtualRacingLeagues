<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Infrastructure\Persistence\Eloquent\Models\RaceResult;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class ExportRaceResultsData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:export-race-results-data
                            {--season= : Filter results by season ID}
                            {--output= : Custom output path (default: exports/race_results.json)}
                            {--chunk=1000 : Number of records to process at once}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Export race results data to JSON file';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting race results export...');

        try {
            // Get filter options
            /** @var string|null $seasonIdOption */
            $seasonIdOption = $this->option('season');
            $seasonId = $seasonIdOption !== null ? (int) $seasonIdOption : null;

            /** @var string|null $chunkSizeOption */
            $chunkSizeOption = $this->option('chunk');
            $chunkSize = $chunkSizeOption !== null ? (int) $chunkSizeOption : 1000;

            /** @var string|null $outputPathOption */
            $outputPathOption = $this->option('output');
            $outputPath = $outputPathOption ?? 'exports/race_results.json';

            // Validate season ID
            if ($seasonId !== null) {
                if ($seasonId <= 0) {
                    $this->error('Season ID must be a positive integer.');

                    return Command::FAILURE;
                }

                $seasonExists = SeasonEloquent::where('id', $seasonId)->exists();
                if (! $seasonExists) {
                    $this->error("Season with ID {$seasonId} does not exist.");

                    return Command::FAILURE;
                }

                $this->info("Filtering by season ID: {$seasonId}");
            }

            // Validate chunk size
            if ($chunkSize <= 0) {
                $this->error('Chunk size must be a positive integer.');

                return Command::FAILURE;
            }

            // Build query with optimized eager loading
            $query = RaceResult::with([
                'race:id,name,race_type,round_id',
                'race.round.season:id',
                'driver:id,league_driver_id',
                'driver.leagueDriver:id,driver_id',
                'driver.leagueDriver.driver:id,first_name,last_name,nickname',
                'division:id,name',
            ])
                ->orderBy('created_at', 'desc');

            // Apply season filter if provided
            if ($seasonId !== null) {
                $query->whereHas('race.round.season', function ($q) use ($seasonId): void {
                    $q->where('id', $seasonId);
                });
            }

            // Get total count for progress bar
            $totalRecords = $query->count();

            if ($totalRecords === 0) {
                $this->warn('No race results found to export.');

                return Command::FAILURE;
            }

            $this->info("Found {$totalRecords} race results to export.");

            // Initialize progress bar
            $progressBar = $this->output->createProgressBar($totalRecords);
            $progressBar->start();

            // Process data in chunks
            $raceResults = [];

            $query->chunk($chunkSize, function ($chunk) use (&$raceResults, $progressBar): void {
                foreach ($chunk as $result) {
                    $raceResults[] = [
                        'id' => $result->id,
                        'race_id' => $result->race_id,
                        'driver_id' => $result->driver_id,
                        'division_id' => $result->division_id,
                        'position' => $result->position,
                        'original_race_time' => $result->original_race_time,
                        'original_race_time_difference' => $result->original_race_time_difference,
                        'final_race_time_difference' => $result->final_race_time_difference,
                        'fastest_lap' => $result->fastest_lap,
                        'penalties' => $result->penalties,
                        'has_fastest_lap' => $result->has_fastest_lap,
                        'has_pole' => $result->has_pole,
                        'dnf' => $result->dnf,
                        'status' => $result->status,
                        'race_points' => $result->race_points,
                        'positions_gained' => $result->positions_gained,
                        'race' => $result->race ? [
                            'id' => $result->race->id,
                            'name' => $result->race->name,
                            'race_type' => $result->race->race_type,
                        ] : null,
                        'driver' => $result->driver ? [
                            'id' => $result->driver->id,
                            'league_driver_id' => $result->driver->league_driver_id,
                            'driver_info' => isset($result->driver->leagueDriver->driver) ? [
                                'driver_id' => $result->driver->leagueDriver->driver->id,
                                'name' => trim(
                                    ($result->driver->leagueDriver->driver->first_name ?? '') .
                                    ' ' .
                                    ($result->driver->leagueDriver->driver->last_name ?? '')
                                ),
                                'nickname' => $result->driver->leagueDriver->driver->nickname,
                            ] : null,
                        ] : null,
                        'division' => $result->division ? [
                            'id' => $result->division->id,
                            'name' => $result->division->name,
                        ] : null,
                        'created_at' => $result->created_at->toIso8601String(),
                        'updated_at' => $result->updated_at->toIso8601String(),
                    ];

                    $progressBar->advance();
                }
            });

            $progressBar->finish();
            $this->newLine();

            // Transform data
            $exportData = [
                'exported_at' => now()->toIso8601String(),
                'total_records' => count($raceResults),
                'filters' => [
                    'season_id' => $seasonId,
                ],
                'race_results' => $raceResults,
            ];

            // Ensure exports directory exists
            $directory = dirname($outputPath);
            if (! Storage::exists($directory)) {
                Storage::makeDirectory($directory);
            }

            // Write to file
            $jsonData = json_encode($exportData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

            if ($jsonData === false) {
                $this->error('Failed to encode data to JSON: ' . json_last_error_msg());

                return Command::FAILURE;
            }

            $written = Storage::put($outputPath, $jsonData);

            if (! $written) {
                $this->error('Failed to write file to storage.');

                return Command::FAILURE;
            }

            $fullPath = Storage::path($outputPath);
            $fileSize = Storage::size($outputPath);

            $this->info('Successfully exported ' . count($raceResults) . ' race results.');
            $this->info("File: {$fullPath}");
            $this->info('Size: ' . number_format($fileSize / 1024, 2) . ' KB');

            return Command::SUCCESS;
        } catch (Exception $e) {
            $this->error('Export failed: ' . $e->getMessage());
            $this->error($e->getTraceAsString());

            return Command::FAILURE;
        }
    }
}
