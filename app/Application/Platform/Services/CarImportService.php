<?php

declare(strict_types=1);

namespace App\Application\Platform\Services;

use App\Application\Platform\DTOs\ImportResultData;
use App\Domain\Platform\Entities\Car;
use App\Domain\Platform\Entities\CarBrand;
use App\Domain\Platform\Exceptions\PlatformNotFoundException;
use App\Domain\Platform\Repositories\CarBrandRepositoryInterface;
use App\Domain\Platform\Repositories\CarRepositoryInterface;
use App\Domain\Platform\Repositories\PlatformRepositoryInterface;
use App\Domain\Platform\ValueObjects\BrandName;
use App\Domain\Platform\ValueObjects\CarGroup;
use App\Domain\Platform\ValueObjects\CarName;
use App\Domain\Platform\ValueObjects\CarYear;
use App\Domain\Platform\ValueObjects\ExternalId;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * Car Import Application Service.
 * Orchestrates the GT7 car import process from KudosPrime.
 */
final readonly class CarImportService
{
    private const KUDOSPRIME_API_URL = 'https://www.kudosprime.com/gt7/MiloAPI.php?export=y';

    private const GT7_PLATFORM_NAME = 'Gran Turismo 7';

    private const RATE_LIMIT_DELAY = 2; // seconds

    public function __construct(
        private CarRepositoryInterface $carRepository,
        private CarBrandRepositoryInterface $brandRepository,
        private PlatformRepositoryInterface $platformRepository,
    ) {
    }

    /**
     * Import GT7 cars from KudosPrime.
     *
     * @throws PlatformNotFoundException
     * @throws \Exception
     */
    public function importGT7Cars(): ImportResultData
    {
        $startTime = now();

        // Find GT7 platform
        $platformId = $this->platformRepository->findIdByName(self::GT7_PLATFORM_NAME);

        Log::info('Starting GT7 car import', [
            'platform_id' => $platformId,
            'platform_name' => self::GT7_PLATFORM_NAME,
        ]);

        // Rate limiting - wait before making request
        sleep(self::RATE_LIMIT_DELAY);

        // Download Excel file from KudosPrime
        $excelData = $this->downloadExcelFile();

        // Parse Excel file
        $rows = $this->parseExcelFile($excelData);

        // Process import within transaction
        $result = DB::transaction(function () use ($platformId, $rows) {
            return $this->processImport($platformId, $rows);
        });

        Log::info('GT7 car import completed', [
            'platform_id' => $platformId,
            'brands_created' => $result->brandsCreated,
            'cars_created' => $result->carsCreated,
            'cars_updated' => $result->carsUpdated,
            'cars_deactivated' => $result->carsDeactivated,
            'total_processed' => $result->totalProcessed,
            'errors_count' => count($result->errors),
        ]);

        return $result;
    }

    /**
     * Download Excel file from KudosPrime.
     *
     * @throws \Exception
     */
    private function downloadExcelFile(): string
    {
        Log::info('Downloading Excel file from KudosPrime');

        $response = Http::timeout(60)
            ->asForm()
            ->post(self::KUDOSPRIME_API_URL, [
                'export_type' => 'cars',
            ]);

        if (! $response->successful()) {
            throw new \Exception(
                'Failed to download car data from KudosPrime: ' . $response->status()
            );
        }

        $body = $response->body();

        if (empty($body)) {
            throw new \Exception('Empty response from KudosPrime API');
        }

        Log::info('Excel file downloaded successfully', [
            'size_bytes' => strlen($body),
        ]);

        return $body;
    }

    /**
     * Parse Excel file and extract car data.
     *
     * @return array<array{external_id: string, group: string, maker: string, model: string, year: ?int}>
     *
     * @throws \Exception
     */
    private function parseExcelFile(string $excelData): array
    {
        // Save to temporary file
        $tempFile = tempnam(sys_get_temp_dir(), 'gt7_cars_');
        if ($tempFile === false) {
            throw new \Exception('Failed to create temporary file');
        }

        file_put_contents($tempFile, $excelData);

        try {
            $spreadsheet = IOFactory::load($tempFile);
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = [];

            // Skip header row (row 1), start from row 2
            $highestRow = $worksheet->getHighestRow();

            for ($row = 2; $row <= $highestRow; $row++) {
                $externalId = (string) $worksheet->getCell("A{$row}")->getValue();
                $group = (string) $worksheet->getCell("B{$row}")->getValue();
                $maker = (string) $worksheet->getCell("C{$row}")->getValue();
                $model = (string) $worksheet->getCell("D{$row}")->getValue();
                $yearValue = $worksheet->getCell("E{$row}")->getValue();

                // Skip empty rows
                if (empty($externalId) && empty($maker) && empty($model)) {
                    continue;
                }

                $year = null;
                if ($yearValue !== null && $yearValue !== '') {
                    $year = (int) $yearValue;
                }

                $rows[] = [
                    'external_id' => trim($externalId),
                    'group' => trim($group),
                    'maker' => trim($maker),
                    'model' => trim($model),
                    'year' => $year,
                ];
            }

            Log::info('Excel file parsed successfully', [
                'total_rows' => count($rows),
            ]);

            return $rows;
        } finally {
            // Clean up temporary file
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }
        }
    }

    /**
     * Process the import within a transaction.
     *
     * @param  array<array{external_id: string, group: string, maker: string, model: string, year: ?int}>  $rows
     */
    private function processImport(int $platformId, array $rows): ImportResultData
    {
        $brandsCreated = 0;
        $carsCreated = 0;
        $carsUpdated = 0;
        $errors = [];
        $processedExternalIds = [];

        foreach ($rows as $index => $row) {
            try {
                // Find or create brand
                $brand = $this->findOrCreateBrand($row['maker']);
                if ($brand->id() === null) {
                    $this->brandRepository->save($brand);
                    $brand->recordCreationEvent();
                    $this->dispatchEvents($brand);
                    $brandsCreated++;
                }

                $brandId = $brand->id();
                if ($brandId === null) {
                    throw new \LogicException('Brand ID is null after save');
                }

                // Find or create/update car
                $externalId = ExternalId::from($row['external_id']);
                $existingCar = $this->carRepository->findByExternalId($externalId, $platformId);

                if ($existingCar !== null) {
                    // Update existing car
                    $existingCar->updateDetails(
                        name: CarName::from($row['model']),
                        carBrandId: $brandId,
                        carGroup: CarGroup::from($row['group'] ?: null),
                        year: CarYear::from($row['year']),
                        imageUrl: null
                    );

                    // Ensure it's active
                    $existingCar->activate();

                    $this->carRepository->save($existingCar);
                    $carsUpdated++;
                } else {
                    // Create new car
                    $car = Car::create(
                        platformId: $platformId,
                        carBrandId: $brandId,
                        externalId: $externalId,
                        name: CarName::from($row['model']),
                        slug: Str::slug($row['maker'] . ' ' . $row['model']),
                        carGroup: CarGroup::from($row['group'] ?: null),
                        year: CarYear::from($row['year']),
                        imageUrl: null,
                        isActive: true,
                    );

                    $this->carRepository->save($car);
                    $car->recordCreationEvent();
                    $this->dispatchEvents($car);
                    $carsCreated++;
                }

                $processedExternalIds[] = $row['external_id'];
            } catch (\Exception $e) {
                $errors[] = sprintf(
                    'Row %d: %s (External ID: %s, Maker: %s, Model: %s)',
                    $index + 2, // +2 because we skip header and arrays are 0-indexed
                    $e->getMessage(),
                    $row['external_id'],
                    $row['maker'],
                    $row['model']
                );

                Log::warning('Error processing car import row', [
                    'row_index' => $index + 2,
                    'error' => $e->getMessage(),
                    'data' => $row,
                ]);
            }
        }

        // Deactivate cars not in the import
        $carsDeactivated = $this->carRepository->deactivateCarsNotInList(
            $platformId,
            $processedExternalIds
        );

        return new ImportResultData(
            brandsCreated: $brandsCreated,
            carsCreated: $carsCreated,
            carsUpdated: $carsUpdated,
            carsDeactivated: $carsDeactivated,
            totalProcessed: count($rows),
            errors: $errors,
            completedAt: now()->toIso8601String(),
        );
    }

    /**
     * Find or create a car brand.
     */
    private function findOrCreateBrand(string $makerName): CarBrand
    {
        $brandName = BrandName::from($makerName);
        $existingBrand = $this->brandRepository->findByName($brandName);

        if ($existingBrand !== null) {
            return $existingBrand;
        }

        // Create new brand
        return CarBrand::create(
            name: $brandName,
            slug: Str::slug($makerName),
            logoUrl: null,
            isActive: true,
        );
    }

    /**
     * Dispatch domain events from an entity.
     */
    private function dispatchEvents(object $entity): void
    {
        if (method_exists($entity, 'releaseEvents')) {
            foreach ($entity->releaseEvents() as $event) {
                event($event);
            }
        }
    }
}
