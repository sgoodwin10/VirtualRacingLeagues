<?php

declare(strict_types=1);

namespace App\Application\Driver\Services;

use App\Application\Driver\DTOs\CreateDriverData;
use App\Application\Driver\DTOs\ImportDriversData;
use App\Application\Driver\DTOs\ImportResultData;
use App\Application\Driver\DTOs\LeagueDriverData;
use App\Application\Driver\DTOs\PaginatedLeagueDriversData;
use App\Application\Driver\DTOs\UpdateDriverData;
use App\Application\Driver\DTOs\UpdateLeagueDriverData;
use App\Domain\Driver\Entities\Driver;
use App\Domain\Driver\Entities\LeagueDriver;
use App\Domain\Driver\Events\DriverAddedToLeague;
use App\Domain\Driver\Events\DriverCreated;
use App\Domain\Driver\Events\DriverRemovedFromLeague;
use App\Domain\Driver\Exceptions\DriverAlreadyInLeagueException;
use App\Domain\Driver\Exceptions\InvalidDriverDataException;
use App\Domain\Driver\Repositories\DriverRepositoryInterface;
use App\Domain\Driver\Services\PlatformMappingService;
use App\Domain\Driver\ValueObjects\DriverName;
use App\Domain\Driver\ValueObjects\DriverStatus;
use App\Domain\Driver\ValueObjects\PlatformIdentifiers;
use App\Domain\League\Repositories\LeagueRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use InvalidArgumentException;

final class DriverApplicationService
{
    public function __construct(
        private readonly DriverRepositoryInterface $driverRepository,
        private readonly LeagueRepositoryInterface $leagueRepository
    ) {}

    /**
     * Create a driver and add them to a league.
     */
    public function createDriverForLeague(CreateDriverData $data, int $leagueId): LeagueDriverData
    {
        // Validate at least one name field
        $hasName = ($data->first_name !== null && trim($data->first_name) !== '')
            || ($data->last_name !== null && trim($data->last_name) !== '')
            || ($data->nickname !== null && trim($data->nickname) !== '');

        if (! $hasName) {
            throw InvalidDriverDataException::missingNameFields();
        }

        // Validate at least one platform ID
        $hasPlatformId = ($data->psn_id !== null && trim($data->psn_id) !== '')
            || ($data->gt7_id !== null && trim($data->gt7_id) !== '')
            || ($data->iracing_id !== null && trim($data->iracing_id) !== '')
            || $data->iracing_customer_id !== null;

        if (! $hasPlatformId) {
            throw InvalidDriverDataException::missingPlatformIds();
        }

        // Validate that at least one platform ID belongs to the league's platforms
        $league = $this->leagueRepository->findById($leagueId);
        $leaguePlatformIds = $league->platformIds();

        $driverData = [
            'psn_id' => $data->psn_id,
            'gt7_id' => $data->gt7_id,
            'iracing_id' => $data->iracing_id,
            'iracing_customer_id' => $data->iracing_customer_id,
        ];

        if (! PlatformMappingService::hasValidPlatformForLeague($leaguePlatformIds, $driverData)) {
            throw InvalidDriverDataException::platformNotInLeague($leaguePlatformIds);
        }

        // Check if driver with these platform IDs already exists in this league
        if (
            $this->driverRepository->existsInLeagueByPlatformId(
                $leagueId,
                $data->psn_id,
                $data->gt7_id,
                $data->iracing_id,
                $data->iracing_customer_id
            )
        ) {
            throw DriverAlreadyInLeagueException::withPlatformId(
                'platform',
                $data->psn_id ?? $data->gt7_id ?? $data->iracing_id ?? (string) $data->iracing_customer_id,
                $leagueId
            );
        }

        return DB::transaction(function () use ($data, $leagueId) {
            // Create domain entities
            $driverName = DriverName::from($data->first_name, $data->last_name, $data->nickname);
            $platformIds = PlatformIdentifiers::from(
                $data->psn_id,
                $data->gt7_id,
                $data->iracing_id,
                $data->iracing_customer_id
            );

            // Check if driver already exists globally (by platform IDs)
            $existingDriver = $this->driverRepository->findByPlatformId(
                $data->psn_id,
                $data->gt7_id,
                $data->iracing_id,
                $data->iracing_customer_id
            );

            if ($existingDriver !== null) {
                // Driver exists globally, just add to league
                $driver = $existingDriver;
            } else {
                // Create new driver
                $driver = Driver::create(
                    name: $driverName,
                    platformIds: $platformIds,
                    email: $data->email,
                    phone: $data->phone
                );

                $this->driverRepository->save($driver);

                // Dispatch driver created event
                Event::dispatch(new DriverCreated(
                    driverId: $driver->id() ?? 0,
                    displayName: $driver->name()->displayName(),
                    primaryPlatformId: $driver->platformIds()->primaryIdentifier()
                ));
            }

            // Add driver to league
            $leagueDriver = LeagueDriver::create(
                leagueId: $leagueId,
                driverId: $driver->id() ?? 0,
                driverNumber: $data->driver_number,
                status: DriverStatus::from($data->status),
                leagueNotes: $data->league_notes
            );

            $this->driverRepository->addToLeague($leagueDriver);

            // Dispatch event
            Event::dispatch(new DriverAddedToLeague(
                leagueId: $leagueId,
                driverId: $driver->id() ?? 0,
                displayName: $driver->name()->displayName(),
                driverNumber: $data->driver_number,
                status: $data->status
            ));

            return LeagueDriverData::fromEntities($leagueDriver, $driver);
        });
    }

    /**
     * Get paginated list of drivers in a league.
     */
    public function getLeagueDrivers(
        int $leagueId,
        ?string $search = null,
        ?string $status = null,
        int $page = 1,
        int $perPage = 15
    ): PaginatedLeagueDriversData {
        $result = $this->driverRepository->getLeagueDrivers($leagueId, $search, $status, $page, $perPage);

        // Map to DTOs
        $dtoData = array_map(
            fn (LeagueDriver $leagueDriver) => LeagueDriverData::fromEntities(
                $leagueDriver,
                $result['driver_data'][$leagueDriver->driverId()]
            ),
            $result['data']
        );

        return new PaginatedLeagueDriversData(
            data: $dtoData,
            total: $result['total'],
            per_page: $result['per_page'],
            current_page: $result['current_page'],
            last_page: $result['last_page']
        );
    }

    /**
     * Get a single league driver.
     */
    public function getLeagueDriver(int $leagueId, int $driverId): LeagueDriverData
    {
        $result = $this->driverRepository->getLeagueDriver($leagueId, $driverId);

        return LeagueDriverData::fromEntities(
            $result['league_driver'],
            $result['driver']
        );
    }

    /**
     * Update league-specific driver settings.
     */
    public function updateLeagueDriver(
        UpdateLeagueDriverData $data,
        int $leagueId,
        int $driverId
    ): LeagueDriverData {
        return DB::transaction(function () use ($data, $leagueId, $driverId) {
            $result = $this->driverRepository->getLeagueDriver($leagueId, $driverId);
            $leagueDriver = $result['league_driver'];
            $driver = $result['driver'];

            // Update league settings
            $leagueDriver->updateLeagueSettings(
                driverNumber: $data->driver_number,
                status: DriverStatus::from($data->status),
                leagueNotes: $data->league_notes
            );

            $this->driverRepository->updateLeagueDriver($leagueDriver);

            return LeagueDriverData::fromEntities($leagueDriver, $driver);
        });
    }

    /**
     * Update global driver fields and league-specific settings.
     * This is used when editing a driver in a league context where both
     * driver information and league settings can be updated.
     */
    public function updateDriverAndLeagueSettings(
        UpdateDriverData $data,
        int $leagueId,
        int $driverId
    ): LeagueDriverData {
        return DB::transaction(function () use ($data, $leagueId, $driverId) {
            $result = $this->driverRepository->getLeagueDriver($leagueId, $driverId);
            $leagueDriver = $result['league_driver'];
            $driver = $result['driver'];

            // Track if any driver fields were updated
            $driverUpdated = false;

            // Update global driver fields if provided
            $hasNameUpdate = $data->first_name !== null || $data->last_name !== null || $data->nickname !== null;
            if ($hasNameUpdate) {
                $driver->updateName(
                    DriverName::from(
                        $data->first_name ?? $driver->name()->firstName(),
                        $data->last_name ?? $driver->name()->lastName(),
                        $data->nickname ?? $driver->name()->nickname()
                    )
                );
                $driverUpdated = true;
            }

            // Update platform IDs if provided
            $hasPlatformUpdate = $data->psn_id !== null || $data->gt7_id !== null
                || $data->iracing_id !== null || $data->iracing_customer_id !== null;
            if ($hasPlatformUpdate) {
                $driver->updatePlatformIds(
                    PlatformIdentifiers::from(
                        $data->psn_id ?? $driver->platformIds()->psnId(),
                        $data->gt7_id ?? $driver->platformIds()->gt7Id(),
                        $data->iracing_id ?? $driver->platformIds()->iracingId(),
                        $data->iracing_customer_id ?? $driver->platformIds()->iracingCustomerId()
                    )
                );
                $driverUpdated = true;
            }

            // Update contact information if provided
            if ($data->email !== null) {
                $driver->updateEmail($data->email);
                $driverUpdated = true;
            }
            if ($data->phone !== null) {
                $driver->updatePhone($data->phone);
                $driverUpdated = true;
            }

            // Save driver updates if any fields changed
            if ($driverUpdated) {
                $this->driverRepository->save($driver);
            }

            // Update league-specific settings (only if explicitly provided)
            // Use existing values if not provided in the request
            $leagueDriver->updateLeagueSettings(
                driverNumber: $data->driver_number ?? $leagueDriver->driverNumber(),
                status: DriverStatus::from($data->status),
                leagueNotes: $data->league_notes ?? $leagueDriver->leagueNotes()
            );

            $this->driverRepository->updateLeagueDriver($leagueDriver);

            return LeagueDriverData::fromEntities($leagueDriver, $driver);
        });
    }

    /**
     * Remove a driver from a league.
     */
    public function removeDriverFromLeague(int $leagueId, int $driverId): void
    {
        DB::transaction(function () use ($leagueId, $driverId) {
            // Get driver info before removal for event
            $result = $this->driverRepository->getLeagueDriver($leagueId, $driverId);
            $driver = $result['driver'];

            $this->driverRepository->removeFromLeague($leagueId, $driverId);

            // Dispatch event
            Event::dispatch(new DriverRemovedFromLeague(
                leagueId: $leagueId,
                driverId: $driverId,
                displayName: $driver->name()->displayName()
            ));
        });
    }

    /**
     * Import drivers from CSV data.
     */
    public function importDriversFromCSV(ImportDriversData $data, int $leagueId): ImportResultData
    {
        $successCount = 0;
        $errors = [];

        // Parse CSV
        $lines = explode("\n", trim($data->csv_data));
        if (empty($lines)) {
            return new ImportResultData(0, ['CSV data is empty']);
        }

        // Get header row
        $header = str_getcsv(array_shift($lines));
        $header = array_map('trim', $header);

        // Process each row
        foreach ($lines as $lineNumber => $line) {
            $rowNumber = $lineNumber + 2; // +2 because we removed header and arrays are 0-indexed

            if (trim($line) === '') {
                continue; // Skip empty lines
            }

            try {
                $row = str_getcsv($line);
                $row = array_map('trim', $row);

                // Create associative array
                $rowData = [];
                foreach ($header as $index => $columnName) {
                    $rowData[$columnName] = $row[$index] ?? null;
                }

                // Extract data
                $firstName = $rowData['FirstName'] ?? $rowData['first_name'] ?? null;
                $lastName = $rowData['LastName'] ?? $rowData['last_name'] ?? null;
                $nickname = $rowData['Nickname'] ?? $rowData['nickname'] ?? null;
                $psnId = $rowData['PSN_ID'] ?? $rowData['psn_id'] ?? null;
                $gt7Id = $rowData['GT7_ID'] ?? $rowData['gt7_id'] ?? null;
                $iracingId = $rowData['iRacing_ID'] ?? $rowData['iracing_id'] ?? null;
                $email = $rowData['Email'] ?? $rowData['email'] ?? null;
                $phone = $rowData['Phone'] ?? $rowData['phone'] ?? null;
                $driverNumber = isset($rowData['DriverNumber']) || isset($rowData['driver_number'])
                    ? (int) ($rowData['DriverNumber'] ?? $rowData['driver_number'])
                    : null;

                // Validate: at least one name field
                $hasName = ($firstName !== null && $firstName !== '')
                    || ($lastName !== null && $lastName !== '')
                    || ($nickname !== null && $nickname !== '');

                if (! $hasName) {
                    $errors[$rowNumber] = "Row {$rowNumber}: At least one name field is required";

                    continue;
                }

                // Validate: at least one platform ID
                $hasPlatformId = ($psnId !== null && $psnId !== '')
                    || ($gt7Id !== null && $gt7Id !== '')
                    || ($iracingId !== null && $iracingId !== '');

                if (! $hasPlatformId) {
                    $errors[$rowNumber] = "Row {$rowNumber}: At least one platform ID is required";

                    continue;
                }

                // Check if already in league
                if ($this->driverRepository->existsInLeagueByPlatformId($leagueId, $psnId, $gt7Id, $iracingId, null)) {
                    $platformStr = $psnId ?? $gt7Id ?? $iracingId ?? 'unknown';
                    $errors[$rowNumber] = "Row {$rowNumber}: Driver with platform ID '{$platformStr}' already exists in this league";

                    continue;
                }

                // Create driver data
                $createData = new CreateDriverData(
                    first_name: $firstName,
                    last_name: $lastName,
                    nickname: $nickname,
                    email: $email,
                    phone: $phone,
                    psn_id: $psnId,
                    gt7_id: $gt7Id,
                    iracing_id: $iracingId,
                    iracing_customer_id: null,
                    driver_number: $driverNumber,
                    status: 'active',
                    league_notes: null
                );

                // Create driver and add to league
                $this->createDriverForLeague($createData, $leagueId);
                $successCount++;
            } catch (InvalidArgumentException $e) {
                $errors[$rowNumber] = "Row {$rowNumber}: ".$e->getMessage();
            } catch (DriverAlreadyInLeagueException $e) {
                $errors[$rowNumber] = "Row {$rowNumber}: ".$e->getMessage();
            } catch (\Exception $e) {
                $errors[$rowNumber] = "Row {$rowNumber}: Unexpected error - ".$e->getMessage();
            }
        }

        return new ImportResultData($successCount, $errors);
    }
}
