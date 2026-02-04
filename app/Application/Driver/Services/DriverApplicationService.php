<?php

declare(strict_types=1);

namespace App\Application\Driver\Services;

use App\Application\Activity\Services\LeagueActivityLogService;
use App\Application\Driver\DTOs\AdminCreateDriverData;
use App\Application\Driver\DTOs\AdminUpdateDriverData;
use App\Application\Driver\DTOs\CreateDriverData;
use App\Application\Driver\DTOs\DriverData;
use App\Application\Driver\DTOs\ImportDriversData;
use App\Application\Driver\DTOs\ImportResultData;
use App\Application\Driver\DTOs\LeagueDriverData;
use App\Application\Driver\DTOs\LeagueDriverSeasonData;
use App\Application\Driver\DTOs\PaginatedLeagueDriversData;
use App\Application\Driver\DTOs\UpdateDriverData;
use App\Application\Driver\DTOs\UpdateLeagueDriverData;
use App\Domain\Driver\Entities\Driver;
use App\Domain\Driver\Entities\LeagueDriver;
use App\Domain\Driver\Events\DriverAddedToLeague;
use App\Domain\Driver\Events\DriverCreated;
use App\Domain\Driver\Events\DriverRemovedFromLeague;
use App\Domain\Driver\Events\DriverRestored;
use App\Domain\Driver\Exceptions\DriverAlreadyInLeagueException;
use App\Domain\Driver\Exceptions\InvalidDriverDataException;
use App\Domain\Driver\Repositories\DriverRepositoryInterface;
use App\Domain\Driver\Services\PlatformMappingService;
use App\Domain\Driver\ValueObjects\DriverName;
use App\Domain\Driver\ValueObjects\DriverStatus;
use App\Domain\Driver\ValueObjects\PlatformIdentifiers;
use App\Domain\League\Repositories\LeagueRepositoryInterface;
use App\Domain\Shared\Exceptions\UnauthorizedException;
use App\Infrastructure\Persistence\Eloquent\Models\Driver as DriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

final class DriverApplicationService
{
    public function __construct(
        private readonly DriverRepositoryInterface $driverRepository,
        private readonly LeagueRepositoryInterface $leagueRepository,
        private readonly LeagueActivityLogService $activityLogService
    ) {
    }

    /**
     * Create a driver and add them to a league.
     *
     * @throws UnauthorizedException If the user does not own the league
     */
    public function createDriverForLeague(CreateDriverData $data, int $leagueId, int $userId): LeagueDriverData
    {
        // Authorization check
        $this->authorizeLeagueAccess($leagueId, $userId);

        // Get effective nickname (auto-populated if not provided)
        $effectiveNickname = $this->resolveNickname(
            $data->nickname,
            $data->first_name,
            $data->last_name,
            $data->discord_id,
            $data->psn_id,
            $data->iracing_id,
            $data->iracing_customer_id
        );

        // Validate at least one name field (including effective nickname)
        $hasName = ($data->first_name !== null && trim($data->first_name) !== '')
            || ($data->last_name !== null && trim($data->last_name) !== '')
            || ($effectiveNickname !== null && trim($effectiveNickname) !== '');

        // Validate at least one platform ID
        $hasPlatformId = ($data->psn_id !== null && trim($data->psn_id) !== '')
            || ($data->iracing_id !== null && trim($data->iracing_id) !== '')
            || $data->iracing_customer_id !== null
            || ($data->discord_id !== null && trim($data->discord_id) !== '');

        // Require at least one name field OR at least one platform ID
        if (! $hasName && ! $hasPlatformId) {
            throw InvalidDriverDataException::missingNameAndPlatformId();
        }

        // Validate that at least one platform ID belongs to the league's platforms
        // (only if driver has platform IDs)
        if ($hasPlatformId) {
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
            $platformId = $this->getPrimaryPlatformId(
                $data->psn_id,
                $data->iracing_id,
                $data->iracing_customer_id,
                $data->discord_id
            );

            throw DriverAlreadyInLeagueException::withPlatformId('platform', $platformId, $leagueId);
        }

        return DB::transaction(function () use ($data, $leagueId, $effectiveNickname) {
            return $this->createDriverForLeagueCore($data, $leagueId, $effectiveNickname);
        });
    }

    /**
     * Get paginated list of drivers in a league.
     *
     * @param  string|null  $deletedStatus  Filter by deleted status: 'active', 'deleted', 'all'
     *
     * @throws UnauthorizedException If the user does not own the league
     */
    public function getLeagueDrivers(
        int $leagueId,
        int $userId,
        ?string $search = null,
        ?string $status = null,
        int $page = 1,
        int $perPage = 15,
        ?string $deletedStatus = 'active'
    ): PaginatedLeagueDriversData {
        // Authorization check
        $this->authorizeLeagueAccess($leagueId, $userId);

        $result = $this->driverRepository->getLeagueDrivers(
            $leagueId,
            $search,
            $status,
            $page,
            $perPage,
            $deletedStatus
        );

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
     *
     * @throws UnauthorizedException If the user does not own the league
     */
    public function getLeagueDriver(int $leagueId, int $driverId, int $userId): LeagueDriverData
    {
        // Authorization check
        $this->authorizeLeagueAccess($leagueId, $userId);

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
     *
     * @throws UnauthorizedException If the user does not own the league
     */
    public function updateDriverAndLeagueSettings(
        UpdateDriverData $data,
        int $leagueId,
        int $driverId,
        int $userId
    ): LeagueDriverData {
        // Authorization check
        $this->authorizeLeagueAccess($leagueId, $userId);

        return DB::transaction(function () use ($data, $leagueId, $driverId) {
            $result = $this->driverRepository->getLeagueDriver($leagueId, $driverId);
            $leagueDriver = $result['league_driver'];
            $driver = $result['driver'];

            // Track if any driver fields were updated
            $driverUpdated = false;

            // Update global driver fields if provided
            if ($this->updateDriverNameIfProvided($driver, $data->first_name, $data->last_name, $data->nickname)) {
                $driverUpdated = true;
            }

            // Update platform IDs if provided
            // Note: We check if the request CONTAINS the field (even if null/empty) to allow clearing
            /** @phpstan-ignore-next-line */
            $requestData = request()->all();
            $hasPlatformUpdate = array_key_exists('psn_id', $requestData)
                || array_key_exists('iracing_id', $requestData)
                || array_key_exists('iracing_customer_id', $requestData)
                || array_key_exists('discord_id', $requestData);
            if ($hasPlatformUpdate) {
                // Build the new platform IDs (combining existing with updates)
                // Use array_key_exists() to distinguish between "not provided" vs "explicitly cleared"
                $newPsnId = array_key_exists('psn_id', $requestData)
                    ? ($data->psn_id !== null && $data->psn_id !== '' ? $data->psn_id : null)
                    : $driver->platformIds()->psnId();
                $newIracingId = array_key_exists('iracing_id', $requestData)
                    ? ($data->iracing_id !== null && $data->iracing_id !== '' ? $data->iracing_id : null)
                    : $driver->platformIds()->iracingId();
                $newIracingCustomerId = array_key_exists('iracing_customer_id', $requestData)
                    ? $data->iracing_customer_id
                    : $driver->platformIds()->iracingCustomerId();
                $newDiscordId = array_key_exists('discord_id', $requestData)
                    ? ($data->discord_id !== null && $data->discord_id !== '' ? $data->discord_id : null)
                    : $driver->platformIds()->discordId();

                // Ensure driver has been persisted with an ID
                $driverId = $driver->id();
                assert($driverId !== null, 'Driver must have an ID');

                // Validate no conflict with another driver
                $this->validatePlatformIdConflict(
                    $driverId,
                    $newPsnId,
                    $newIracingId,
                    $newIracingCustomerId,
                    $newDiscordId
                );

                // Validate that new platform IDs match league's platforms
                $this->validateLeaguePlatformMatch(
                    $leagueId,
                    $newPsnId,
                    $newIracingId,
                    $newIracingCustomerId,
                    $newDiscordId
                );

                $driver->updatePlatformIds(
                    PlatformIdentifiers::from(
                        $newPsnId,
                        $newIracingId,
                        $newIracingCustomerId,
                        $newDiscordId
                    )
                );
                $driverUpdated = true;
            }

            // Update contact information if provided
            // Use array_key_exists() to distinguish between "not provided" vs "explicitly cleared"
            if (array_key_exists('email', $requestData)) {
                $driver->updateEmail($data->email !== null && $data->email !== '' ? $data->email : null);
                $driverUpdated = true;
            }
            if (array_key_exists('phone', $requestData)) {
                $driver->updatePhone($data->phone !== null && $data->phone !== '' ? $data->phone : null);
                $driverUpdated = true;
            }

            // Save driver updates if any fields changed
            if ($driverUpdated) {
                $this->driverRepository->save($driver);
            }

            // Update league-specific settings (only if explicitly provided)
            // Use existing values if not provided in the request
            // Use array_key_exists() to allow clearing league_notes
            $leagueDriver->updateLeagueSettings(
                driverNumber: array_key_exists('driver_number', $requestData)
                    ? $data->driver_number
                    : $leagueDriver->driverNumber(),
                status: array_key_exists('status', $requestData) && $data->status !== null
                    ? DriverStatus::from($data->status)
                    : $leagueDriver->status(),
                leagueNotes: array_key_exists('league_notes', $requestData)
                    ? ($data->league_notes !== null && $data->league_notes !== '' ? $data->league_notes : null)
                    : $leagueDriver->leagueNotes()
            );

            $this->driverRepository->updateLeagueDriver($leagueDriver);

            return LeagueDriverData::fromEntities($leagueDriver, $driver);
        });
    }

    /**
     * Soft delete a driver (preserves league_drivers relationship).
     *
     * @throws UnauthorizedException If the user does not own the league
     */
    public function deleteDriverFromLeague(int $leagueId, int $driverId, int $userId): void
    {
        // Authorization check
        $this->authorizeLeagueAccess($leagueId, $userId);

        DB::transaction(function () use ($leagueId, $driverId) {
            // Get driver info before deletion
            $result = $this->driverRepository->getLeagueDriver($leagueId, $driverId);
            $driver = $result['driver'];

            // Soft delete the driver (preserves league_drivers relationship)
            $driver->delete();
            $this->driverRepository->save($driver);

            // Dispatch event
            Event::dispatch(new DriverRemovedFromLeague(
                leagueId: $leagueId,
                driverId: $driverId,
                displayName: $driver->name()->displayName()
            ));
        });
    }

    /**
     * Remove a driver from a league (deletes league_drivers relationship).
     * Kept for potential future use.
     *
     * @throws UnauthorizedException If the user does not own the league
     */
    public function removeDriverFromLeague(int $leagueId, int $driverId, int $userId): void
    {
        // Authorization check
        $this->authorizeLeagueAccess($leagueId, $userId);

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
     * Restore a soft-deleted driver.
     *
     * @throws UnauthorizedException If the user does not own the league
     */
    public function restoreDriver(int $leagueId, int $driverId, int $userId): void
    {
        $this->authorizeLeagueAccess($leagueId, $userId);

        DB::transaction(function () use ($driverId) {
            $driver = $this->driverRepository->findById($driverId);

            if ($driver->deletedAt() === null) {
                throw new \InvalidArgumentException('Driver is not deleted');
            }

            $driver->restore();
            $this->driverRepository->save($driver);

            Event::dispatch(new DriverRestored(
                driverId: $driverId,
                displayName: $driver->name()->displayName()
            ));
        });
    }

    /**
     * Restore driver with activity logging.
     *
     * @throws UnauthorizedException If the user does not own the league
     */
    public function restoreDriverWithActivityLog(int $leagueId, int $driverId, int $userId): void
    {
        $this->restoreDriver($leagueId, $driverId, $userId);

        // Log activity
        try {
            $user = Auth::user();
            if ($user instanceof UserEloquent) {
                $leagueDriver = LeagueDriverEloquent::with('league')
                    ->where('league_id', $leagueId)
                    ->where('driver_id', $driverId)
                    ->firstOrFail();

                $driverModel = DriverEloquent::findOrFail($driverId);

                $this->activityLogService->logDriverRestored(
                    $user,
                    $leagueId,
                    $leagueDriver->league->name,
                    $driverModel
                );
            }
        } catch (\Exception $e) {
            Log::error('Failed to log driver restore activity', [
                'error' => $e->getMessage(),
                'league_id' => $leagueId,
                'driver_id' => $driverId,
            ]);
        }
    }

    /**
     * Import drivers from CSV data.
     * The entire import is wrapped in a single transaction - if any error occurs,
     * all changes are rolled back to prevent partial imports.
     *
     * @throws UnauthorizedException If the user does not own the league
     */
    public function importDriversFromCSV(ImportDriversData $data, int $leagueId, int $userId): ImportResultData
    {
        // Authorization check
        $this->authorizeLeagueAccess($leagueId, $userId);

        // Parse CSV
        $lines = explode("\n", trim($data->csv_data));
        if (count($lines) === 1 && trim($lines[0]) === '') {
            return new ImportResultData(0, 0, [['row' => 0, 'message' => 'CSV data is empty']]);
        }

        // Get header row
        $header = str_getcsv(array_shift($lines));
        $header = array_map(fn ($value) => trim((string) $value), $header);

        // Wrap entire import in a single transaction for atomicity
        return DB::transaction(function () use ($lines, $header, $leagueId) {
            $successCount = 0;
            $skippedCount = 0;
            $errors = [];

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

                    // Extract data (case-insensitive column matching) and sanitize for CSV injection
                    $firstName = $this->sanitizeCsvValue($this->getCaseInsensitiveValue(
                        $rowData,
                        ['FirstName', 'first_name', 'firstname']
                    ));
                    $lastName = $this->sanitizeCsvValue($this->getCaseInsensitiveValue(
                        $rowData,
                        ['LastName', 'last_name', 'lastname']
                    ));
                    $nickname = $this->sanitizeCsvValue($this->getCaseInsensitiveValue(
                        $rowData,
                        ['Nickname', 'nickname']
                    ));
                    $psnId = $this->sanitizeCsvValue($this->getCaseInsensitiveValue(
                        $rowData,
                        ['PsnId', 'PSN_ID', 'psn_id', 'psnid']
                    ));
                    $iracingId = $this->sanitizeCsvValue($this->getCaseInsensitiveValue(
                        $rowData,
                        ['IracingId', 'iRacing_ID', 'iracing_id', 'iracingid']
                    ));
                    $iracingCustomerIdStr = $this->getCaseInsensitiveValue(
                        $rowData,
                        ['IracingCustomerId', 'iracing_customer_id', 'iracingcustomerid']
                    );
                    $iracingCustomerId = $iracingCustomerIdStr !== null ? (int) $iracingCustomerIdStr : null;
                    $discordId = $this->sanitizeCsvValue($this->getCaseInsensitiveValue(
                        $rowData,
                        ['Discord_ID', 'discord_id', 'discordid']
                    ));
                    $email = $this->sanitizeCsvValue($this->getCaseInsensitiveValue(
                        $rowData,
                        ['Email', 'email']
                    ));
                    $phone = $this->sanitizeCsvValue($this->getCaseInsensitiveValue(
                        $rowData,
                        ['Phone', 'phone']
                    ));
                    $driverNumber = $this->getCaseInsensitiveValue(
                        $rowData,
                        ['DriverNumber', 'driver_number', 'drivernumber']
                    );
                    $driverNumber = $driverNumber !== null ? (int) $driverNumber : null;

                    // Resolve effective nickname (auto-populated if not provided)
                    $effectiveNickname = $this->resolveNickname(
                        $nickname,
                        $firstName,
                        $lastName,
                        $discordId,
                        $psnId,
                        $iracingId,
                        $iracingCustomerId
                    );

                    // Validate: at least one name field (including effective nickname)
                    $hasName = ($firstName !== null && $firstName !== '')
                        || ($lastName !== null && $lastName !== '')
                        || ($effectiveNickname !== null && $effectiveNickname !== '');

                    // Validate: at least one platform ID
                    $hasPlatformId = ($psnId !== null && $psnId !== '')
                        || ($iracingId !== null && $iracingId !== '')
                        || $iracingCustomerId !== null
                        || ($discordId !== null && $discordId !== '');

                    // Require at least one name field OR at least one platform ID
                    if (! $hasName && ! $hasPlatformId) {
                        $errors[] = [
                            'row' => $rowNumber,
                            'message' => "Row {$rowNumber}: At least one name field "
                                . 'OR at least one platform ID is required',
                        ];

                        continue;
                    }

                    // Skip if driver already exists in league (duplicate platform ID)
                    if (
                        $this->driverRepository->existsInLeagueByPlatformId(
                            $leagueId,
                            $psnId,
                            $iracingId,
                            $iracingCustomerId,
                            $discordId
                        )
                    ) {
                        // Skip this driver silently - they're already in the league
                        $skippedCount++;

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
                        iracing_customer_id: $iracingCustomerId,
                        discord_id: $discordId,
                        driver_number: $driverNumber,
                        status: 'active',
                        league_notes: null
                    );

                    // Create driver and add to league
                    // Note: We call the core method directly since we're already in a transaction
                    $this->createDriverForLeagueCore($createData, $leagueId, $effectiveNickname);
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

            return new ImportResultData($successCount, $skippedCount, $errors);
        });
    }

    /**
     * Get value from row data using case-insensitive column name matching.
     *
     * @param  array<string, mixed>  $rowData
     * @param  array<int, string>  $possibleKeys
     */
    private function getCaseInsensitiveValue(array $rowData, array $possibleKeys): ?string
    {
        // Build a lowercase lookup map of possible keys
        $lowerPossibleKeys = array_map('strtolower', $possibleKeys);

        // Check each column in the row data
        foreach ($rowData as $columnName => $value) {
            $lowerColumnName = strtolower($columnName);

            // If this column matches any of our possible keys (case-insensitive)
            if (in_array($lowerColumnName, $lowerPossibleKeys, true)) {
                if ($value !== null && $value !== '') {
                    return (string) $value;
                }
            }
        }

        return null;
    }

    /**
     * Sanitize CSV value to prevent formula injection attacks.
     * Removes leading characters that could trigger formula execution: =, +, -, @, \t, \r
     *
     * Note: LIKE wildcard escaping (%,_) is NOT done here as these values are used in
     * exact match queries (=). LIKE wildcards are escaped separately in repository
     * search methods where LIKE queries are used.
     *
     * @param  string|null  $value  The CSV value to sanitize
     * @return string|null The sanitized value
     */
    private function sanitizeCsvValue(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        // Remove leading dangerous characters that could trigger formula injection
        $dangerousChars = ['=', '+', '-', '@', "\t", "\r"];

        while (! empty($value) && in_array($value[0], $dangerousChars, true)) {
            $value = substr($value, 1);
        }

        return $value !== '' ? $value : null;
    }

    /**
     * Get all seasons a league driver is participating in.
     *
     * @return array<LeagueDriverSeasonData>
     *
     * @throws UnauthorizedException If the user does not own the league
     * @throws \App\Domain\Driver\Exceptions\DriverNotFoundException If the driver is not found in the league
     */
    public function getLeagueDriverSeasons(int $leagueId, int $driverId, int $userId): array
    {
        // Authorization check
        $this->authorizeLeagueAccess($leagueId, $userId);

        // Get the league driver (this also validates the driver exists in the league)
        $result = $this->driverRepository->getLeagueDriver($leagueId, $driverId);
        $leagueDriverId = $result['league_driver']->id();

        assert($leagueDriverId !== null, 'League driver ID should not be null after retrieval');

        $seasons = $this->driverRepository->getSeasonsForLeagueDriver($leagueDriverId);

        return array_map(
            fn (array $season) => new LeagueDriverSeasonData(
                season_id: $season['season_id'],
                season_name: $season['season_name'],
                season_slug: $season['season_slug'],
                season_status: $season['season_status'],
                competition_id: $season['competition_id'],
                competition_name: $season['competition_name'],
                competition_slug: $season['competition_slug'],
                division_name: $season['division_name'],
                team_name: $season['team_name'],
                added_at: $season['added_at']
            ),
            $seasons
        );
    }

    // ===================================================================
    // User Context Methods with Activity Logging
    // Wrapper methods that add activity logging to user context operations
    // ===================================================================

    /**
     * Create a driver and add them to a league with activity logging.
     *
     * @throws UnauthorizedException If the user does not own the league
     */
    public function createDriverForLeagueWithActivityLog(
        CreateDriverData $data,
        int $leagueId,
        int $userId
    ): LeagueDriverData {
        $leagueDriverData = $this->createDriverForLeague($data, $leagueId, $userId);

        // Log activity
        try {
            $user = Auth::user();
            if ($user instanceof UserEloquent) {
                $leagueDriver = LeagueDriverEloquent::findOrFail($leagueDriverData->id);
                $this->activityLogService->logDriverAdded($user, $leagueId, $leagueDriver);
            }
        } catch (\Exception $e) {
            Log::error('Failed to log driver creation activity', [
                'error' => $e->getMessage(),
                'league_id' => $leagueId,
                'driver_id' => $leagueDriverData->id,
            ]);
        }

        return $leagueDriverData;
    }

    /**
     * Update driver and league settings with activity logging and change tracking.
     *
     * @throws UnauthorizedException If the user does not own the league
     */
    public function updateDriverAndLeagueSettingsWithActivityLog(
        UpdateDriverData $data,
        int $leagueId,
        int $driverId,
        int $userId
    ): LeagueDriverData {
        // Capture original data for change tracking
        // Query by league_id and driver_id since $driverId is the driver.id, not league_drivers.id
        $leagueDriver = LeagueDriverEloquent::with('driver')
            ->where('league_id', $leagueId)
            ->where('driver_id', $driverId)
            ->firstOrFail();
        $originalData = [
            'driver_name' => $leagueDriver->driver->name,
            'status' => $leagueDriver->status,
        ];

        $leagueDriverData = $this->updateDriverAndLeagueSettings($data, $leagueId, $driverId, $userId);

        // Log activity with changes
        try {
            $user = Auth::user();
            if ($user instanceof UserEloquent) {
                $leagueDriver->refresh();
                $leagueDriver->load('driver');
                $newData = [
                    'driver_name' => $leagueDriver->driver->name,
                    'status' => $leagueDriver->status,
                ];

                $this->activityLogService->logDriverUpdated($user, $leagueId, $leagueDriver, [
                    'old' => $originalData,
                    'new' => $newData,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to log driver update activity', [
                'error' => $e->getMessage(),
                'league_id' => $leagueId,
                'driver_id' => $driverId,
            ]);
        }

        return $leagueDriverData;
    }

    /**
     * Soft delete a driver with activity logging.
     *
     * @throws UnauthorizedException If the user does not own the league
     */
    public function deleteDriverFromLeagueWithActivityLog(int $leagueId, int $driverId, int $userId): void
    {
        // Capture driver data before deletion for logging
        // Query by league_id and driver_id since $driverId is the driver.id, not league_drivers.id
        $leagueDriver = LeagueDriverEloquent::with('driver', 'league')
            ->where('league_id', $leagueId)
            ->where('driver_id', $driverId)
            ->firstOrFail();
        /** @var DriverEloquent $driverModel */
        $driverModel = $leagueDriver->driver;
        $leagueName = $leagueDriver->league->name;

        $this->deleteDriverFromLeague($leagueId, $driverId, $userId);

        // Log activity
        try {
            $user = Auth::user();
            if ($user instanceof UserEloquent) {
                $this->activityLogService->logDriverRemoved($user, $leagueId, $leagueName, $driverModel);
            }
        } catch (\Exception $e) {
            Log::error('Failed to log driver deletion activity', [
                'error' => $e->getMessage(),
                'league_id' => $leagueId,
                'driver_id' => $driverId,
            ]);
        }
    }

    /**
     * Remove a driver from a league with activity logging.
     * Kept for potential future use.
     *
     * @throws UnauthorizedException If the user does not own the league
     */
    public function removeDriverFromLeagueWithActivityLog(int $leagueId, int $driverId, int $userId): void
    {
        // Capture driver data before deletion for logging
        // Query by league_id and driver_id since $driverId is the driver.id, not league_drivers.id
        $leagueDriver = LeagueDriverEloquent::with('driver', 'league')
            ->where('league_id', $leagueId)
            ->where('driver_id', $driverId)
            ->firstOrFail();
        /** @var DriverEloquent $driverModel */
        $driverModel = $leagueDriver->driver;
        $leagueName = $leagueDriver->league->name;

        $this->removeDriverFromLeague($leagueId, $driverId, $userId);

        // Log activity
        try {
            $user = Auth::user();
            if ($user instanceof UserEloquent) {
                $this->activityLogService->logDriverRemoved($user, $leagueId, $leagueName, $driverModel);
            }
        } catch (\Exception $e) {
            Log::error('Failed to log driver removal activity', [
                'error' => $e->getMessage(),
                'league_id' => $leagueId,
                'driver_id' => $driverId,
            ]);
        }
    }

    /**
     * Import drivers from CSV with activity logging.
     *
     * @throws UnauthorizedException If the user does not own the league
     */
    public function importDriversFromCSVWithActivityLog(
        ImportDriversData $data,
        int $leagueId,
        int $userId
    ): ImportResultData {
        $result = $this->importDriversFromCSV($data, $leagueId, $userId);

        // Log activity
        try {
            $user = Auth::user();
            if ($user instanceof UserEloquent) {
                $leagueModel = League::findOrFail($leagueId);
                $this->activityLogService->logDriversImported(
                    $user,
                    $leagueId,
                    $leagueModel->name,
                    $result->success_count
                );
            }
        } catch (\Exception $e) {
            Log::error('Failed to log driver import activity', [
                'error' => $e->getMessage(),
                'league_id' => $leagueId,
                'count' => $result->success_count,
            ]);
        }

        return $result;
    }

    // ===================================================================
    // Admin Context Methods
    // Methods for admin dashboard to manage all drivers globally
    // ===================================================================

    /**
     * Get all drivers (admin context) with pagination and filtering.
     *
     * @return array{data: array<DriverData>, total: int, per_page: int, current_page: int, last_page: int}
     */
    public function getAllDrivers(
        ?string $search = null,
        int $page = 1,
        int $perPage = 15,
        string $orderBy = 'created_at',
        string $orderDirection = 'desc'
    ): array {
        $result = $this->driverRepository->getAllDriversPaginated(
            $search,
            $page,
            $perPage,
            $orderBy,
            $orderDirection
        );

        // Map drivers to DTOs
        $dtoData = array_map(
            fn (Driver $driver) => DriverData::fromEntity($driver),
            $result['data']
        );

        return [
            'data' => $dtoData,
            'total' => $result['total'],
            'per_page' => $result['per_page'],
            'current_page' => $result['current_page'],
            'last_page' => $result['last_page'],
        ];
    }

    /**
     * Get a single driver by ID (admin context).
     */
    public function getDriverById(int $id): DriverData
    {
        $driver = $this->driverRepository->findById($id);

        return DriverData::fromEntity($driver);
    }

    /**
     * Get detailed driver information for admin view.
     * Includes driver info, linked user, leagues, seasons, and race statistics.
     *
     * @return array<string, mixed>
     */
    public function getDriverDetailsForAdmin(int $id): array
    {
        $driver = $this->driverRepository->findById($id);
        $driverData = DriverData::fromEntity($driver);

        // Get leagues the driver belongs to
        $leagues = $this->driverRepository->getDriverLeagues($id);

        // Get seasons the driver has participated in
        $seasons = $this->driverRepository->getDriverSeasons($id);

        // Get race statistics
        $stats = $this->driverRepository->getDriverRaceStats($id);

        // Get linked user if exists
        $linkedUser = $this->driverRepository->getLinkedUser($id);

        return [
            'driver' => $driverData->toArray(),
            'linked_user' => $linkedUser,
            'leagues' => $leagues,
            'seasons' => $seasons,
            'stats' => $stats,
        ];
    }

    /**
     * Create a new driver (admin context - global driver, not tied to a specific league).
     */
    public function createDriver(AdminCreateDriverData $data): DriverData
    {
        // Get effective nickname (auto-populated if not provided)
        $effectiveNickname = $this->resolveNickname(
            $data->nickname,
            $data->first_name,
            $data->last_name,
            $data->discord_id,
            $data->psn_id,
            $data->iracing_id,
            $data->iracing_customer_id
        );

        // Validate at least one name field (including effective nickname)
        $hasName = ($data->first_name !== null && trim($data->first_name) !== '')
            || ($data->last_name !== null && trim($data->last_name) !== '')
            || ($effectiveNickname !== null && trim($effectiveNickname) !== '');

        // Validate at least one platform ID
        $hasPlatformId = ($data->psn_id !== null && trim($data->psn_id) !== '')
            || ($data->iracing_id !== null && trim($data->iracing_id) !== '')
            || $data->iracing_customer_id !== null
            || ($data->discord_id !== null && trim($data->discord_id) !== '');

        // Require at least one name field OR at least one platform ID
        if (! $hasName && ! $hasPlatformId) {
            throw InvalidDriverDataException::missingNameAndPlatformId();
        }

        // Check if driver with these platform IDs already exists
        $existingDriver = $this->driverRepository->findByPlatformId(
            $data->psn_id,
            $data->iracing_id,
            $data->iracing_customer_id,
            $data->discord_id
        );

        if ($existingDriver !== null) {
            throw InvalidDriverDataException::duplicatePlatformId(
                $data->psn_id,
                $data->iracing_id,
                $data->iracing_customer_id,
                $data->discord_id
            );
        }

        return DB::transaction(function () use ($data, $effectiveNickname) {
            // Create domain entity
            $driverName = DriverName::from($data->first_name, $data->last_name, $effectiveNickname);
            $platformIds = PlatformIdentifiers::from(
                $data->psn_id,
                $data->iracing_id,
                $data->iracing_customer_id,
                $data->discord_id
            );

            $driver = Driver::create(
                name: $driverName,
                platformIds: $platformIds,
                email: $data->email,
                phone: $data->phone
            );

            $this->driverRepository->save($driver);

            // Verify driver was persisted successfully
            if ($driver->id() === null) {
                throw new \RuntimeException('Failed to persist driver - ID is null after save');
            }

            // Dispatch driver created event
            Event::dispatch(new DriverCreated(
                driverId: $driver->id(),
                displayName: $driver->name()->displayName(),
                primaryPlatformId: $driver->platformIds()->primaryIdentifier()
            ));

            return DriverData::fromEntity($driver);
        });
    }

    /**
     * Update an existing driver (admin context - global driver update).
     */
    public function updateDriver(int $id, AdminUpdateDriverData $data): DriverData
    {
        return DB::transaction(function () use ($id, $data) {
            $driver = $this->driverRepository->findById($id);

            // Track if any driver fields were updated
            $driverUpdated = false;

            // Update name fields if provided
            if ($this->updateDriverNameIfProvided($driver, $data->first_name, $data->last_name, $data->nickname)) {
                $driverUpdated = true;
            }

            // Update platform IDs if provided
            // Note: We check if the request CONTAINS the field (even if null/empty) to allow clearing
            /** @phpstan-ignore-next-line */
            $adminRequestData = request()->all();
            $hasPlatformUpdate = array_key_exists('psn_id', $adminRequestData)
                || array_key_exists('iracing_id', $adminRequestData)
                || array_key_exists('iracing_customer_id', $adminRequestData)
                || array_key_exists('discord_id', $adminRequestData);
            if ($hasPlatformUpdate) {
                // Build the new platform IDs (combining existing with updates)
                // Use array_key_exists() to distinguish between "not provided" vs "explicitly cleared"
                $newPsnId = array_key_exists('psn_id', $adminRequestData)
                    ? ($data->psn_id !== null && $data->psn_id !== '' ? $data->psn_id : null)
                    : $driver->platformIds()->psnId();
                $newIracingId = array_key_exists('iracing_id', $adminRequestData)
                    ? ($data->iracing_id !== null && $data->iracing_id !== '' ? $data->iracing_id : null)
                    : $driver->platformIds()->iracingId();
                $newIracingCustomerId = array_key_exists('iracing_customer_id', $adminRequestData)
                    ? $data->iracing_customer_id
                    : $driver->platformIds()->iracingCustomerId();
                $newDiscordId = array_key_exists('discord_id', $adminRequestData)
                    ? ($data->discord_id !== null && $data->discord_id !== '' ? $data->discord_id : null)
                    : $driver->platformIds()->discordId();

                // Ensure driver has been persisted with an ID
                $driverId = $driver->id();
                assert($driverId !== null, 'Driver must have an ID');

                // Validate no conflict with another driver
                $this->validatePlatformIdConflict(
                    $driverId,
                    $newPsnId,
                    $newIracingId,
                    $newIracingCustomerId,
                    $newDiscordId
                );

                $driver->updatePlatformIds(
                    PlatformIdentifiers::from(
                        $newPsnId,
                        $newIracingId,
                        $newIracingCustomerId,
                        $newDiscordId
                    )
                );
                $driverUpdated = true;
            }

            // Update contact information if provided
            // Use array_key_exists() to distinguish between "not provided" vs "explicitly cleared"
            if (array_key_exists('email', $adminRequestData)) {
                $driver->updateEmail($data->email !== null && $data->email !== '' ? $data->email : null);
                $driverUpdated = true;
            }
            if (array_key_exists('phone', $adminRequestData)) {
                $driver->updatePhone($data->phone !== null && $data->phone !== '' ? $data->phone : null);
                $driverUpdated = true;
            }

            // Save driver updates if any fields changed
            if ($driverUpdated) {
                $this->driverRepository->save($driver);
            }

            return DriverData::fromEntity($driver);
        });
    }

    /**
     * Delete a driver (admin context - soft delete).
     */
    public function deleteDriver(int $id): void
    {
        DB::transaction(function () use ($id) {
            $driver = $this->driverRepository->findById($id);
            $driver->delete();
            $this->driverRepository->delete($driver);
        });
    }

    // ===================================================================
    // Private Helper Methods
    // ===================================================================

    /**
     * Core logic for creating a driver and adding them to a league.
     * This method does NOT wrap itself in a transaction - the caller is responsible
     * for transaction management. This allows it to be used both in:
     * - createDriverForLeague (which wraps in its own transaction)
     * - importDriversFromCSV (which has a single outer transaction for all rows)
     *
     * @param  CreateDriverData  $data  The driver creation data
     * @param  int  $leagueId  The league ID
     * @param  string|null  $effectiveNickname  The resolved nickname (may be auto-generated from Discord ID)
     */
    private function createDriverForLeagueCore(
        CreateDriverData $data,
        int $leagueId,
        ?string $effectiveNickname
    ): LeagueDriverData {
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

            // Verify driver was persisted successfully
            if ($driver->id() === null) {
                throw new \RuntimeException('Failed to persist driver - ID is null after save');
            }

            // Dispatch driver created event
            Event::dispatch(new DriverCreated(
                driverId: $driver->id(),
                displayName: $driver->name()->displayName(),
                primaryPlatformId: $driver->platformIds()->primaryIdentifier()
            ));
        }

        // Verify driver ID is available (whether new or existing)
        if ($driver->id() === null) {
            throw new \RuntimeException('Driver ID is null - cannot add to league');
        }

        // Add driver to league
        $leagueDriver = LeagueDriver::create(
            leagueId: $leagueId,
            driverId: $driver->id(),
            driverNumber: $data->driver_number,
            status: DriverStatus::from($data->status),
            leagueNotes: $data->league_notes
        );

        $this->driverRepository->addToLeague($leagueDriver);

        // Dispatch event
        Event::dispatch(new DriverAddedToLeague(
            leagueId: $leagueId,
            driverId: $driver->id(),
            displayName: $driver->name()->displayName(),
            driverNumber: $data->driver_number,
            status: $data->status
        ));

        return LeagueDriverData::fromEntities($leagueDriver, $driver);
    }

    /**
     * Verify that a league belongs to the specified user.
     *
     * @param  int  $leagueId  The league ID to check
     * @param  int  $userId  The user ID to verify ownership against
     *
     * @throws UnauthorizedException If the user does not own the league
     */
    private function authorizeLeagueAccess(int $leagueId, int $userId): void
    {
        $league = $this->leagueRepository->findById($leagueId);
        if ($league->ownerUserId() !== $userId) {
            throw UnauthorizedException::forResource('league');
        }
    }

    /**
     * Validate that platform IDs don't conflict with another driver.
     * Checks if any of the provided platform IDs already exist for a different driver.
     *
     * @param  int  $currentDriverId  The driver being updated (to exclude from conflict check)
     *
     * @throws InvalidDriverDataException If platform IDs conflict with another driver
     */
    private function validatePlatformIdConflict(
        int $currentDriverId,
        ?string $psnId,
        ?string $iracingId,
        ?int $iracingCustomerId,
        ?string $discordId
    ): void {
        // Check if any of the platform IDs conflict with another driver
        $existingDriver = $this->driverRepository->findByPlatformId(
            $psnId,
            $iracingId,
            $iracingCustomerId,
            $discordId
        );

        // If found and it's a DIFFERENT driver, we have a conflict
        if ($existingDriver !== null && $existingDriver->id() !== $currentDriverId) {
            throw InvalidDriverDataException::duplicatePlatformId(
                $psnId,
                $iracingId,
                $iracingCustomerId,
                $discordId
            );
        }
    }

    /**
     * Validate that driver's platform IDs match league's supported platforms.
     * At least one of the driver's platform IDs must belong to the league's platforms.
     *
     * @param  int  $leagueId  The league ID
     *
     * @throws InvalidDriverDataException If no platform ID matches league's platforms
     */
    private function validateLeaguePlatformMatch(
        int $leagueId,
        ?string $psnId,
        ?string $iracingId,
        ?int $iracingCustomerId,
        ?string $discordId
    ): void {
        $league = $this->leagueRepository->findById($leagueId);
        $leaguePlatformIds = $league->platformIds();

        $driverData = [
            'psn_id' => $psnId,
            'iracing_id' => $iracingId,
            'iracing_customer_id' => $iracingCustomerId,
            'discord_id' => $discordId,
        ];

        if (! PlatformMappingService::hasValidPlatformForLeague($leaguePlatformIds, $driverData)) {
            throw InvalidDriverDataException::platformNotInLeague($leaguePlatformIds);
        }
    }

    /**
     * Resolve the effective nickname for a driver.
     * Auto-populates nickname when not explicitly provided using this priority:
     * 1. If nickname is provided and not empty, use it
     * 2. If no nickname, auto-populate using priority order:
     *    - Discord ID (highest priority)
     *    - Platform ID (PSN > iRacing > iRacing Customer ID)
     *    - First Name (lowest priority)
     */
    private function resolveNickname(
        ?string $nickname,
        ?string $firstName,
        ?string $lastName,
        ?string $discordId,
        ?string $psnId = null,
        ?string $iracingId = null,
        ?int $iracingCustomerId = null
    ): ?string {
        // If nickname is provided and not empty, use it
        if ($nickname !== null && trim($nickname) !== '') {
            return $nickname;
        }

        // Auto-populate nickname using priority order:
        // 1. Discord ID (highest priority)
        if ($discordId !== null && trim($discordId) !== '') {
            return $discordId;
        }

        // 2. Platform ID (PSN > iRacing > iRacing Customer ID)
        if ($psnId !== null && trim($psnId) !== '') {
            return $psnId;
        }

        if ($iracingId !== null && trim($iracingId) !== '') {
            return $iracingId;
        }

        if ($iracingCustomerId !== null) {
            return (string) $iracingCustomerId;
        }

        // 3. First Name (lowest priority)
        if ($firstName !== null && trim($firstName) !== '') {
            return $firstName;
        }

        return null;
    }

    /**
     * Get the primary platform ID for display/error messages.
     * Returns the first non-null platform ID in priority order:
     * PSN > iRacing > iRacing Customer ID > Discord ID
     */
    private function getPrimaryPlatformId(
        ?string $psnId,
        ?string $iracingId,
        ?int $iracingCustomerId,
        ?string $discordId
    ): string {
        return $psnId
            ?? $iracingId
            ?? ($iracingCustomerId !== null ? (string) $iracingCustomerId : $discordId)
            ?? 'unknown';
    }

    /**
     * Update driver name if any name fields are provided.
     * Returns true if name was updated, false otherwise.
     */
    private function updateDriverNameIfProvided(
        Driver $driver,
        ?string $firstName,
        ?string $lastName,
        ?string $nickname
    ): bool {
        $hasNameUpdate = $firstName !== null || $lastName !== null || $nickname !== null;

        if ($hasNameUpdate) {
            $driver->updateName(
                DriverName::from(
                    $firstName ?? $driver->name()->firstName(),
                    $lastName ?? $driver->name()->lastName(),
                    $nickname ?? $driver->name()->nickname()
                )
            );

            return true;
        }

        return false;
    }
}
