<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Infrastructure\Persistence\Eloquent\Models\RaceResult;
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
                            {--output= : Custom output path (default: exports/race_results.json)}';

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

            /** @var string|null $outputPathOption */
            $outputPathOption = $this->option('output');
            $outputPath = $outputPathOption ?? 'exports/race_results.json';

            // Build query
            $query = RaceResult::with(['race.raceEvent.round.season', 'driver', 'division'])
                ->orderBy('created_at', 'desc');

            // Apply season filter if provided
            if ($seasonId !== null) {
                // @phpstan-ignore-next-line - Eloquent whereHas is not recognized by PHPStan
                $query->whereHas('race.raceEvent.round.season', function ($q) use ($seasonId): void {
                    $q->where('id', $seasonId);
                });
                $this->info("Filtering by season ID: {$seasonId}");
            }

            // Fetch results
            $results = $query->get();

            if ($results->isEmpty()) {
                $this->warn('No race results found to export.');
                return Command::FAILURE;
            }

            // Transform data
            $exportData = [
                'exported_at' => now()->toIso8601String(),
                'total_records' => $results->count(),
                'filters' => [
                    'season_id' => $seasonId,
                ],
                'race_results' => $results->map(function ($result) {
                    return [
                        'id' => $result->id,
                        'race_id' => $result->race_id,
                        'driver_id' => $result->driver_id,
                        'division_id' => $result->division_id,
                        'position' => $result->position,
                        'race_time' => $result->race_time,
                        'race_time_difference' => $result->race_time_difference,
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
                            'type' => $result->race->type,
                        ] : null,
                        'driver' => $result->driver ? [
                            'id' => $result->driver->id,
                            'user_id' => $result->driver->user_id,
                        ] : null,
                        'division' => $result->division ? [
                            'id' => $result->division->id,
                            'name' => $result->division->name,
                        ] : null,
                        'created_at' => $result->created_at?->toIso8601String(),
                        'updated_at' => $result->updated_at?->toIso8601String(),
                    ];
                })->toArray(),
            ];

            // Ensure exports directory exists
            $directory = dirname($outputPath);
            if (!Storage::exists($directory)) {
                Storage::makeDirectory($directory);
            }

            // Write to file
            $jsonData = json_encode($exportData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

            if ($jsonData === false) {
                $this->error('Failed to encode data to JSON.');
                return Command::FAILURE;
            }

            $written = Storage::put($outputPath, $jsonData);

            if (!$written) {
                $this->error('Failed to write file to storage.');
                return Command::FAILURE;
            }

            $fullPath = Storage::path($outputPath);
            $fileSize = Storage::size($outputPath);

            $this->info("Successfully exported {$results->count()} race results.");
            $this->info("File: {$fullPath}");
            $this->info("Size: " . number_format($fileSize / 1024, 2) . " KB");

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Export failed: ' . $e->getMessage());
            $this->error($e->getTraceAsString());
            return Command::FAILURE;
        }
    }
}
