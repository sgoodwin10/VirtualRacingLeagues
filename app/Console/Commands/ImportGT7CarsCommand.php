<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Application\Platform\Services\CarImportService;
use Illuminate\Console\Command;

/**
 * Console command to import GT7 cars from KudosPrime.
 */
final class ImportGT7CarsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:import-gt7-cars';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import GT7 cars from KudosPrime API';

    /**
     * Execute the console command.
     */
    public function handle(CarImportService $importService): int
    {
        $this->info('Starting GT7 car import from KudosPrime...');
        $this->newLine();

        try {
            $result = $importService->importGT7Cars();

            $this->info('Import completed successfully!');
            $this->newLine();

            $this->table(
                ['Metric', 'Count'],
                [
                    ['Brands Created', $result->brandsCreated],
                    ['Cars Created', $result->carsCreated],
                    ['Cars Updated', $result->carsUpdated],
                    ['Cars Deactivated', $result->carsDeactivated],
                    ['Total Processed', $result->totalProcessed],
                    ['Errors', count($result->errors)],
                ]
            );

            if (!empty($result->errors)) {
                $this->newLine();
                $this->warn('Errors encountered during import:');
                foreach ($result->errors as $error) {
                    $this->error('  - ' . $error);
                }
            }

            $this->newLine();
            $this->info("Completed at: {$result->completedAt}");

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Import failed: ' . $e->getMessage());
            $this->error('Stack trace: ' . $e->getTraceAsString());

            return self::FAILURE;
        }
    }
}
