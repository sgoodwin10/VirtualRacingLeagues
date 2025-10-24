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
    ) {
    }

    /**
     * Create a driver and add them to a league.
     */
    public function createDriverForLeague(CreateDriverData $data, int $leagueId): LeagueDriverData
    {
        // Get effective nickname (auto-generated from Discord ID if needed)
        $effectiveNickname = $data->getEffectiveNickname();

        // Validate at least one name field (including effective nickname)
        $hasName = ($data->first_name !== null && trim($data->first_name) !== '')
            || ($data->last_name !== null && trim($data->last_name) !== '')
            || ($effectiveNickname !== null && trim($effectiveNickname) !== '');

        if (! $hasName) {
            throw InvalidDriverDataException::missingNameFields();
        }

        // Validate at least one platform ID
        $hasPlatformId = ($data->psn_id !== null && trim($data->psn_id) !== '')
            || ($data->iracing_id !== null && trim($data->iracing_id) !== '')
            || $data->iracing_customer_id !== null
            || ($data->discord_id !== null && trim($data->discord_id) !== '');

        if (! $hasPlatformId) {
            throw InvalidDriverDataException::missingPlatformIds();
        }

        // Validate that at least one platform ID belongs to the league's platforms
        $league = $this->leagueRepository->findById($leagueId);
        $leaguePlatformIds = $league->platformIds();

        $driverData = [
            'psn_id' => $data->psn_id,
            'iracing_id' => $data->iracing_id,
            'iracing_customer_id' => $data->iracing_customer_id,
            'discord_id' => $data->discord_id,
        ];

        if (! PlatformMappingService::hasValidPlatformForLeague($leaguePlatformIds, $driverData)) {
            throw InvalidDriverDataException::platformNotInLeague($leaguePlatformIds);
        }

        // Check if driver with these platform IDs already exists in this league
        if (
            $this->driverRepository->existsInLeagueByPlatformId(
                $leagueId,
                $data->psn_id,
                $data->iracing_id,
                $data->iracing_customer_id,
                $data->discord_id
            )
        ) {
            $platformId = $data->psn_id
                ?? $data->iracing_id
                ?? ($data->iracing_customer_id !== null ? (string) $data->iracing_customer_id : $data->discord_id)
                ?? 'unknown';

            throw DriverAlreadyInLeagueException::withPlatformId('platform', $platformId, $leagueId);
        }

        return DB::transaction(function () use ($data, $leagueId, $effectiveNickname) {
            // Create domain entities with effective nickname (auto-generated from Discord ID if needed)
            $driverName = DriverName::from($data->first_name, $data->last_name, $effectiveNickname);
            $platformIds = PlatformIdentifiers::from(
                $data->psn_id,
                $data->iracing_id,
                $data->iracing_customer_id,
                $data->discord_id
            );

            // Check if driver already exists globally (by platform IDs)
            $existingDriver = $this->driverRepository->findByPlatformId(
                $data->psn_id,
                $data->iracing_id,
                $data->iracing_customer_id,
                $data->discord_id
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
            $hasPlatformUpdate = $data->psn_id !== null
                || $data->iracing_id !== null || $data->iracing_customer_id !== null
                || $data->discord_id !== null;
            if ($hasPlatformUpdate) {
                $driver->updatePlatformIds(
                    PlatformIdentifiers::from(
                        $data->psn_id ?? $driver->platformIds()->psnId(),
                        $data->iracing_id ?? $driver->platformIds()->iracingId(),
                        $data->iracing_customer_id ?? $driver->platformIds()->iracingCustomerId(),
                        $data->discord_id ?? $driver->platformIds()->discordId()
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
        if (count($lines) === 1 && trim($lines[0]) === '') {
            return new ImportResultData(0, [['row' => 0, 'message' => 'CSV data is empty']]);
        }

        // Get header row
        $header = str_getcsv(array_shift($lines));
        $header = array_map(fn ($value) => trim((string) $value), $header);

        // Process each row
        foreach ($lines as $lineNumber => $line) {
            $rowNumber = $lineNumber + 2; // +2 because we removed header and arrays are 0-indexed

            if (trim($line) === '') {
                continue; // Skip empty lines
            }

            try {
                $row = str_getcsv($line);
                $row = array_map(fn ($value) => trim((string) $value), $row);

                // Create associative array
                $rowData = [];
                foreach ($header as $index => $columnName) {
                    $rowData[$columnName] = $row[$index] ?? null;
                }

                // Extract data (case-insensitive column matching)
                $firstName = $this->getCaseInsensitiveValue(
                    $rowData,
                    ['FirstName', 'first_name', 'firstname']
                );
                $lastName = $this->getCaseInsensitiveValue(
                    $rowData,
                    ['LastName', 'last_name', 'lastname']
                );
                $nickname = $this->getCaseInsensitiveValue($rowData, ['Nickname', 'nickname']);
                $psnId = $this->getCaseInsensitiveValue($rowData, ['PSN_ID', 'psn_id', 'psnid']);
                $iracingId = $this->getCaseInsensitiveValue(
                    $rowData,
                    ['iRacing_ID', 'iracing_id', 'iracinid']
                );
                $discordId = $this->getCaseInsensitiveValue($rowData, ['Discord_ID', 'discord_id', 'discordid']);
                $email = $this->getCaseInsensitiveValue($rowData, ['Email', 'email']);
                $phone = $this->getCaseInsensitiveValue($rowData, ['Phone', 'phone']);
                $driverNumber = $this->getCaseInsensitiveValue(
                    $rowData,
                    ['DriverNumber', 'driver_number', 'drivernumber']
                );
                $driverNumber = $driverNumber !== null ? (int) $driverNumber : null;

                // Validate: at least one name field (or Discord ID if no names provided)
                $hasName = ($firstName !== null && $firstName !== '')
                    || ($lastName !== null && $lastName !== '')
                    || ($nickname !== null && $nickname !== '');

                // If no name fields, check if Discord ID can be used as nickname
                $effectiveNickname = $nickname;
                if (! $hasName && ($discordId !== null && $discordId !== '')) {
                    $effectiveNickname = $discordId;
                    $hasName = true; // Discord ID will be used as nickname
                }

                if (! $hasName) {
                    $errors[] = [
                        'row' => $rowNumber,
                        'message' => "Row {$rowNumber}: At least one name field is required",
                    ];

                    continue;
                }

                // Validate: at least one platform ID
                $hasPlatformId = ($psnId !== null && $psnId !== '')
                    || ($iracingId !== null && $iracingId !== '')
                    || ($discordId !== null && $discordId !== '');

                if (! $hasPlatformId) {
                    $errors[] = [
                        'row' => $rowNumber,
                        'message' => "Row {$rowNumber}: At least one platform ID is required",
                    ];

                    continue;
                }

                // Check if already in league
                if (
                    $this->driverRepository->existsInLeagueByPlatformId(
                        $leagueId,
                        $psnId,
                        $iracingId,
                        null,
                        $discordId
                    )
                ) {
                    $platformStr = $psnId ?? $iracingId ?? $discordId ?? 'unknown';
                    $message = "Row {$rowNumber}: Driver with platform ID '{$platformStr}' ";
                    $message .= 'already exists in this league';
                    $errors[] = [
                        'row' => $rowNumber,
                        'message' => $message,
                    ];

                    continue;
                }

                // Create driver data (use effective nickname if auto-generated from Discord ID)
                $createData = new CreateDriverData(
                    first_name: $firstName,
                    last_name: $lastName,
                    nickname: $effectiveNickname,
                    email: $email,
                    phone: $phone,
                    psn_id: $psnId,
                    iracing_id: $iracingId,
                    iracing_customer_id: null,
                    discord_id: $discordId,
                    driver_number: $driverNumber,
                    status: 'active',
                    league_notes: null
                );

                // Create driver and add to league
                $this->createDriverForLeague($createData, $leagueId);
                $successCount++;
            } catch (InvalidArgumentException $e) {
                $errors[] = [
                    'row' => $rowNumber,
                    'message' => "Row {$rowNumber}: " . $e->getMessage(),
                ];
            } catch (DriverAlreadyInLeagueException $e) {
                $errors[] = [
                    'row' => $rowNumber,
                    'message' => "Row {$rowNumber}: " . $e->getMessage(),
                ];
            } catch (\Exception $e) {
                $errors[] = [
                    'row' => $rowNumber,
                    'message' => "Row {$rowNumber}: Unexpected error - " . $e->getMessage(),
                ];
            }
        }

        return new ImportResultData($successCount, $errors);
    }

    /**
     * Get value from row data using case-insensitive column name matching.
     *
     * @param array<string, mixed> $rowData
     * @param array<int, string> $possibleKeys
     */
    private function getCaseInsensitiveValue(array $rowData, array $possibleKeys): ?string
    {
        foreach ($possibleKeys as $key) {
            if (array_key_exists($key, $rowData) && $rowData[$key] !== null && $rowData[$key] !== '') {
                return (string) $rowData[$key];
            }
        }

        return null;
    }
}
