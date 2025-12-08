<?php

declare(strict_types=1);

namespace App\Application\League\Services;

use App\Application\League\DTOs\CompetitionSummaryData;
use App\Application\League\DTOs\CreateLeagueData;
use App\Application\League\DTOs\LeagueData;
use App\Application\League\DTOs\LeagueDetailsData;
use App\Application\League\DTOs\LeaguePlatformData;
use App\Application\League\DTOs\PublicLeagueData;
use App\Application\League\DTOs\UpdateLeagueData;
use App\Domain\Competition\Repositories\CompetitionRepositoryInterface;
use App\Domain\Driver\Services\DriverPlatformColumnService;
use App\Domain\League\Entities\League;
use App\Domain\League\Exceptions\InvalidPlatformException;
use App\Domain\League\Exceptions\LeagueLimitReachedException;
use App\Domain\League\Exceptions\LeagueNotFoundException;
use App\Domain\League\Repositories\LeagueRepositoryInterface;
use App\Domain\League\ValueObjects\LeagueName;
use App\Domain\League\ValueObjects\LeagueSlug;
use App\Domain\League\ValueObjects\LeagueVisibility;
use App\Domain\League\ValueObjects\Tagline;
use App\Domain\Platform\Repositories\PlatformRepositoryInterface;
use App\Domain\Shared\Exceptions\UnauthorizedException;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\User\Repositories\UserRepositoryInterface;
use App\Helpers\FilterBuilder;
use App\Helpers\PaginationHelper;
use App\Http\Requests\Admin\IndexLeaguesRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;

/**
 * League Application Service.
 * Orchestrates league use cases and coordinates domain logic.
 */
final class LeagueApplicationService
{
    private const FREE_TIER_LEAGUE_LIMIT = 1;

    public function __construct(
        private readonly LeagueRepositoryInterface $leagueRepository,
        private readonly CompetitionRepositoryInterface $competitionRepository,
        private readonly DriverPlatformColumnService $driverPlatformColumnService,
        private readonly PlatformRepositoryInterface $platformRepository,
        private readonly UserRepositoryInterface $userRepository,
    ) {
    }

    /**
     * Create a new league.
     */
    public function createLeague(CreateLeagueData $data, int $userId, bool $isFreeTier = true): LeagueData
    {
        return DB::transaction(function () use ($data, $userId, $isFreeTier) {
            // Validate platform IDs
            $this->validatePlatformIds($data->platform_ids);

            // Check free tier limit (using computed property)
            if ($isFreeTier) {
                $leagueCount = $this->leagueRepository->countByUserId($userId);
                if ($leagueCount >= self::FREE_TIER_LEAGUE_LIMIT) {
                    throw LeagueLimitReachedException::forFreeTier(self::FREE_TIER_LEAGUE_LIMIT);
                }
            }

            // Generate unique slug
            $baseSlug = LeagueSlug::fromName($data->name);
            $slug = $this->generateUniqueSlug($baseSlug);

            // Track uploaded files for cleanup on failure
            $uploadedFiles = [];

            try {
                // Store logo
                $logoPath = $data->logo->store('leagues/logos', 'public');
                if (!$logoPath) {
                    throw new \RuntimeException('Failed to store league logo');
                }
                $uploadedFiles[] = $logoPath;

                // Store header image if provided
                $headerImagePath = null;
                if ($data->header_image) {
                    $headerImagePath = $data->header_image->store('leagues/headers', 'public');
                    if (!$headerImagePath) {
                        throw new \RuntimeException('Failed to store league header image');
                    }
                    $uploadedFiles[] = $headerImagePath;
                }

                // Create domain entity
                $league = League::create(
                    name: LeagueName::from($data->name),
                    slug: $slug,
                    logoPath: $logoPath,
                    ownerUserId: $userId,
                    timezone: $data->timezone,
                    contactEmail: $data->contact_email ? EmailAddress::from($data->contact_email) : null,
                    organizerName: $data->organizer_name,
                    tagline: Tagline::fromNullable($data->tagline),
                    description: $data->description,
                    headerImagePath: $headerImagePath,
                    platformIds: $data->platform_ids,
                    discordUrl: $data->discord_url,
                    websiteUrl: $data->website_url,
                    twitterHandle: $data->twitter_handle,
                    instagramHandle: $data->instagram_handle,
                    youtubeUrl: $data->youtube_url,
                    twitchUrl: $data->twitch_url,
                    visibility: LeagueVisibility::fromString($data->visibility),
                );

                // Persist
                $this->leagueRepository->save($league);

                // Record creation event now that ID is set
                $league->recordCreationEvent();

                // Dispatch domain events
                $this->dispatchEvents($league);

                // Fetch platform data for response
                $platforms = $this->fetchPlatformData($league->platformIds());

                // New leagues have 0 competitions and 0 drivers
                return LeagueData::fromEntity($league, $platforms, null, 0, 0);
            } catch (\Throwable $e) {
                // Clean up any uploaded files on failure
                $this->cleanupUploadedFiles($uploadedFiles);

                // Re-throw the exception
                throw $e;
            }
        });
    }

    /**
     * Check slug availability (for blur validation).
     *
     * @param string $name The league name to generate a slug from
     * @param int|null $excludeLeagueId Optional league ID to exclude from the check (for updates)
     * @return array{available: bool, slug: string, suggestion: string|null}
     */
    public function checkSlugAvailability(string $name, ?int $excludeLeagueId = null): array
    {
        $slug = LeagueSlug::fromName($name);
        $available = $this->leagueRepository->isSlugAvailable($slug->value(), $excludeLeagueId);

        return [
            'available' => $available,
            'slug' => $slug->value(),
            'suggestion' => $available ? null : $this->generateUniqueSlug($slug, $excludeLeagueId)->value(),
        ];
    }

    /**
     * Get all leagues for a user (owner).
     *
     * @return array<int, LeagueData>
     */
    public function getUserLeagues(int $userId): array
    {
        $leaguesWithCounts = $this->leagueRepository->findByUserIdWithCounts($userId);

        return array_map(
            function (array $item) {
                $league = $item['league'];
                $platforms = $this->fetchPlatformData($league->platformIds());
                return LeagueData::fromEntity(
                    $league,
                    $platforms,
                    null,
                    $item['competitions_count'],
                    $item['drivers_count']
                );
            },
            $leaguesWithCounts
        );
    }

    /**
     * Get a league by ID.
     *
     * @throws LeagueNotFoundException
     * @throws UnauthorizedException
     */
    public function getLeagueById(int $leagueId, int $userId): LeagueData
    {
        $result = $this->leagueRepository->findByIdWithCounts($leagueId);
        $league = $result['league'];

        // Authorization check
        $this->authorizeLeagueAccess($league, $userId);

        $platforms = $this->fetchPlatformData($league->platformIds());

        return LeagueData::fromEntity(
            $league,
            $platforms,
            null,
            $result['competitions_count'],
            $result['drivers_count']
        );
    }

    /**
     * Update an existing league.
     *
     * @throws LeagueNotFoundException
     * @throws InvalidPlatformException
     */
    public function updateLeague(int $leagueId, UpdateLeagueData $data, int $userId): LeagueData
    {
        return DB::transaction(function () use ($leagueId, $data, $userId) {
            // Fetch existing league
            $league = $this->leagueRepository->findById($leagueId);

            // Authorization check
            $this->authorizeLeagueAccess($league, $userId);

            // Validate platform IDs if provided
            if ($data->platform_ids !== null) {
                $this->validatePlatformIds($data->platform_ids);
                $league->updatePlatforms($data->platform_ids);
            }

            // Update basic details if provided
            if ($data->name !== null || $data->tagline !== null || $data->description !== null) {
                $league->updateDetails(
                    $data->name !== null ? LeagueName::from($data->name) : $league->name(),
                    $data->tagline !== null ? Tagline::fromNullable($data->tagline) : $league->tagline(),
                    $data->description !== null ? $data->description : $league->description()
                );
            }

            // Regenerate slug if name is changing
            if ($data->name !== null) {
                $baseSlug = LeagueSlug::fromName($data->name);
                $newSlug = $this->generateUniqueSlug($baseSlug, $leagueId);
                $league->updateSlug($newSlug);
            }

            // Update visibility if provided
            if ($data->visibility !== null) {
                $league->changeVisibility(LeagueVisibility::fromString($data->visibility));
            }

            // Update contact info if provided
            if ($data->contact_email !== null || $data->organizer_name !== null) {
                $league->updateContactInfo(
                    $data->contact_email !== null ? EmailAddress::from($data->contact_email) : $league->contactEmail(),
                    $data->organizer_name ?? $league->organizerName()
                );
            }

            // Update social media if any provided
            if ($this->hasSocialMediaUpdates($data)) {
                $league->updateSocialMedia(
                    $data->discord_url ?? $league->discordUrl(),
                    $data->website_url ?? $league->websiteUrl(),
                    $data->twitter_handle ?? $league->twitterHandle(),
                    $data->instagram_handle ?? $league->instagramHandle(),
                    $data->youtube_url ?? $league->youtubeUrl(),
                    $data->twitch_url ?? $league->twitchUrl()
                );
            }

            // Update timezone if provided
            if ($data->timezone !== null) {
                $league->updateTimezone($data->timezone);
            }

            // Track uploaded files and old files for cleanup on failure
            $uploadedFiles = [];
            $oldFilesToDelete = [];

            try {
                // Handle logo upload
                if ($data->logo !== null) {
                    // Store new logo first
                    $logoPath = $data->logo->store('leagues/logos', 'public');
                    if (!$logoPath) {
                        throw new \RuntimeException('Failed to store league logo');
                    }
                    $uploadedFiles[] = $logoPath;

                    // Mark old logo for deletion only after successful upload
                    $oldLogoPath = $league->logoPath();
                    if ($oldLogoPath && Storage::disk('public')->exists($oldLogoPath)) {
                        $oldFilesToDelete[] = $oldLogoPath;
                    }

                    $league->updateLogo($logoPath);
                }

                // Handle header image upload
                if ($data->header_image !== null) {
                    // Store new header image first
                    $headerImagePath = $data->header_image->store('leagues/headers', 'public');
                    if (!$headerImagePath) {
                        throw new \RuntimeException('Failed to store league header image');
                    }
                    $uploadedFiles[] = $headerImagePath;

                    // Mark old header image for deletion only after successful upload
                    $oldHeaderImagePath = $league->headerImagePath();
                    if ($oldHeaderImagePath && Storage::disk('public')->exists($oldHeaderImagePath)) {
                        $oldFilesToDelete[] = $oldHeaderImagePath;
                    }

                    $league->updateHeaderImage($headerImagePath);
                }
            } catch (\Throwable $e) {
                // Clean up any newly uploaded files on failure
                $this->cleanupUploadedFiles($uploadedFiles);

                // Re-throw the exception
                throw $e;
            }

            // Delete old files only after all uploads succeed
            foreach ($oldFilesToDelete as $filePath) {
                Storage::disk('public')->delete($filePath);
            }

            // Persist updates
            $this->leagueRepository->update($league);

            // Dispatch domain events
            $this->dispatchEvents($league);

            // Fetch updated counts and platform data for response
            $result = $this->leagueRepository->findByIdWithCounts($leagueId);
            $platforms = $this->fetchPlatformData($league->platformIds());

            return LeagueData::fromEntity(
                $league,
                $platforms,
                null,
                $result['competitions_count'],
                $result['drivers_count']
            );
        });
    }

    /**
     * Delete a league (soft delete).
     */
    public function deleteLeague(int $leagueId, int $userId): void
    {
        DB::transaction(function () use ($leagueId, $userId) {
            $league = $this->leagueRepository->findById($leagueId);

            // Authorization check
            $this->authorizeLeagueAccess($league, $userId);

            $this->leagueRepository->delete($league);
        });
    }

    /**
     * Get platforms associated with a league.
     *
     * @param int $leagueId
     * @param int $userId
     * @return array<int, LeaguePlatformData>
     * @throws LeagueNotFoundException
     * @throws UnauthorizedException
     */
    public function getLeaguePlatforms(int $leagueId, int $userId): array
    {
        // Verify league exists and belongs to user
        $league = $this->leagueRepository->findById($leagueId);

        // Authorization check
        $this->authorizeLeagueAccess($league, $userId);

        // Get platforms from repository
        $platformsData = $this->leagueRepository->getPlatformsByLeagueId($leagueId);

        // Convert to DTOs
        return array_map(
            fn(array $platformData) => LeaguePlatformData::fromArray($platformData),
            $platformsData
        );
    }

    /**
     * Generate a unique slug by appending a counter if needed.
     *
     * Note: There is a potential TOCTOU (Time-of-Check-Time-of-Use) race condition between
     * checking slug availability and saving the league. However, the database unique constraint
     * on the slug column is the ultimate source of truth and will prevent duplicate slugs.
     * This method provides a best-effort attempt to generate a unique slug before hitting the
     * database constraint.
     *
     * @param LeagueSlug $baseSlug The base slug to make unique
     * @param int|null $excludeLeagueId Optional league ID to exclude from the check (for updates)
     * @throws \RuntimeException If a unique slug cannot be generated after maximum attempts
     */
    private function generateUniqueSlug(LeagueSlug $baseSlug, ?int $excludeLeagueId = null): LeagueSlug
    {
        $maxAttempts = 100;
        $slug = $baseSlug;
        $counter = 1;

        while (!$this->leagueRepository->isSlugAvailable($slug->value(), $excludeLeagueId)) {
            if ($counter >= $maxAttempts) {
                throw new \RuntimeException(
                    "Unable to generate unique slug for '{$baseSlug->value()}' after {$maxAttempts} attempts"
                );
            }

            $newSlug = $baseSlug->value() . '-' . str_pad((string)$counter, 2, '0', STR_PAD_LEFT);
            $slug = LeagueSlug::from($newSlug);
            $counter++;
        }

        return $slug;
    }

    /**
     * Validate that all platform IDs exist and are active.
     *
     * @param array<int> $platformIds
     * @throws InvalidPlatformException
     */
    private function validatePlatformIds(array $platformIds): void
    {
        if (empty($platformIds)) {
            throw InvalidPlatformException::forEmptyPlatforms();
        }

        $validPlatforms = $this->platformRepository->findActiveByIds($platformIds);
        $validPlatformIds = array_map(fn($platform) => $platform['id'], $validPlatforms);

        $invalidIds = array_diff($platformIds, $validPlatformIds);

        if (!empty($invalidIds)) {
            throw InvalidPlatformException::forInvalidIds($invalidIds);
        }
    }

    /**
     * Fetch platform data for given platform IDs.
     *
     * @param array<int> $platformIds
     * @return array<array{id: int, name: string, slug: string}>
     */
    private function fetchPlatformData(array $platformIds): array
    {
        if (empty($platformIds)) {
            return [];
        }

        return $this->platformRepository->findActiveByIds($platformIds);
    }

    /**
     * Check if any social media fields are being updated.
     */
    private function hasSocialMediaUpdates(UpdateLeagueData $data): bool
    {
        return $data->discord_url !== null
            || $data->website_url !== null
            || $data->twitter_handle !== null
            || $data->instagram_handle !== null
            || $data->youtube_url !== null
            || $data->twitch_url !== null;
    }

    /**
     * Get driver columns for a league's platforms.
     *
     * @param int $leagueId
     * @param int $userId
     * @return array<int, array{field: string, label: string, type: string}>
     * @throws LeagueNotFoundException
     * @throws UnauthorizedException
     */
    public function getDriverColumnsForLeague(int $leagueId, int $userId): array
    {
        $league = $this->leagueRepository->findById($leagueId);

        // Authorization check
        $this->authorizeLeagueAccess($league, $userId);

        return $this->driverPlatformColumnService->getColumnsForLeague($league->platformIds());
    }

    /**
     * Get driver form fields for a league's platforms.
     *
     * @param int $leagueId
     * @param int $userId
     * @return array<int, array{field: string, label: string, type: string}>
     * @throws LeagueNotFoundException
     * @throws UnauthorizedException
     */
    public function getDriverFormFieldsForLeague(int $leagueId, int $userId): array
    {
        $league = $this->leagueRepository->findById($leagueId);

        // Authorization check
        $this->authorizeLeagueAccess($league, $userId);

        return $this->driverPlatformColumnService->getFormFieldsForLeague($league->platformIds());
    }

    /**
     * Get driver CSV headers for a league's platforms.
     *
     * @param int $leagueId
     * @param int $userId
     * @return array<int, array{field: string, label: string, type: string}>
     * @throws LeagueNotFoundException
     * @throws UnauthorizedException
     */
    public function getDriverCsvHeadersForLeague(int $leagueId, int $userId): array
    {
        $league = $this->leagueRepository->findById($leagueId);

        // Authorization check
        $this->authorizeLeagueAccess($league, $userId);

        return $this->driverPlatformColumnService->getCsvHeadersForLeague($league->platformIds());
    }

    /**
     * Get all leagues for admin with pagination and filters.
     *
     * Accepts either a FormRequest or individual parameters.
     *
     * @param IndexLeaguesRequest|int $requestOrPage
     * @param int|null $perPage
     * @param array<string, mixed> $filters
     * @return array<string, mixed>
     */
    public function getAllLeaguesForAdmin(
        IndexLeaguesRequest|int $requestOrPage,
        ?int $perPage = null,
        array $filters = []
    ): array {
        // Handle both signatures
        if ($requestOrPage instanceof IndexLeaguesRequest) {
            return $this->getAllLeaguesForAdminFromRequest($requestOrPage);
        }

        // Old signature - for backward compatibility
        $page = $requestOrPage;
        // Get paginated leagues from repository (now includes counts)
        $result = $this->leagueRepository->getPaginatedForAdmin($page, $perPage ?? 15, $filters);

        // Fetch owner data for all leagues
        /** @var array<int, int> $ownerUserIds */
        $ownerUserIds = array_map(fn(array $item) => $item['league']->ownerUserId(), $result['data']);
        $ownerUserIds = array_unique($ownerUserIds);
        $owners = $this->userRepository->findMultipleByIds($ownerUserIds);

        // Convert to DTOs with platform, owner data, and counts
        $leagueDTOs = array_map(
            function (array $item) use ($owners) {
                $league = $item['league'];
                $platforms = $this->fetchPlatformData($league->platformIds());

                // Get owner data
                $ownerData = $owners[$league->ownerUserId()] ?? null;

                return LeagueData::fromEntity(
                    $league,
                    $platforms,
                    $ownerData,
                    $item['competitions_count'],
                    $item['drivers_count']
                );
            },
            $result['data']
        );

        return [
            'data' => $leagueDTOs,
            'total' => $result['total'],
            'per_page' => $result['per_page'],
            'current_page' => $result['current_page'],
            'last_page' => $result['last_page'],
        ];
    }

    /**
     * Get a league by ID for admin (no authorization check).
     *
     * @throws LeagueNotFoundException
     */
    public function getLeagueForAdmin(int $leagueId): LeagueData
    {
        $result = $this->leagueRepository->findByIdWithCounts($leagueId);
        $league = $result['league'];
        $platforms = $this->fetchPlatformData($league->platformIds());

        // Fetch owner data
        $owners = $this->userRepository->findMultipleByIds([$league->ownerUserId()]);
        $ownerData = $owners[$league->ownerUserId()] ?? null;

        return LeagueData::fromEntity(
            $league,
            $platforms,
            $ownerData,
            $result['competitions_count'],
            $result['drivers_count']
        );
    }

    /**
     * Archive a league (admin action).
     *
     * @throws LeagueNotFoundException
     */
    public function archiveLeague(int $leagueId): LeagueData
    {
        return DB::transaction(function () use ($leagueId) {
            // Find league by ID
            $league = $this->leagueRepository->findById($leagueId);

            // Call archive domain method
            $league->archive();

            // Save via repository
            $this->leagueRepository->update($league);

            // Dispatch domain events
            $this->dispatchEvents($league);

            // Fetch updated counts, platform, and owner data for response
            $result = $this->leagueRepository->findByIdWithCounts($leagueId);
            $platforms = $this->fetchPlatformData($league->platformIds());
            $owners = $this->userRepository->findMultipleByIds([$league->ownerUserId()]);
            $ownerData = $owners[$league->ownerUserId()] ?? null;

            return LeagueData::fromEntity(
                $league,
                $platforms,
                $ownerData,
                $result['competitions_count'],
                $result['drivers_count']
            );
        });
    }

    /**
     * Get detailed league information for admin (includes competitions, seasons summary, and stats).
     *
     * @throws LeagueNotFoundException
     */
    public function getLeagueDetailsForAdmin(int $leagueId): LeagueDetailsData
    {
        // Fetch league entity
        $league = $this->leagueRepository->findById($leagueId);

        // Fetch platforms
        $platforms = $this->fetchPlatformData($league->platformIds());

        // Fetch owner data
        $owners = $this->userRepository->findMultipleByIds([$league->ownerUserId()]);
        $ownerData = $owners[$league->ownerUserId()] ?? null;

        // Get league statistics from repository (competitions, seasons, drivers, races)
        $statistics = $this->leagueRepository->getLeagueStatistics($leagueId);

        // Fetch competition entities from repository
        $competitions = $this->competitionRepository->findByLeagueId($leagueId);

        // Convert competition entities to DTOs with platform and season count data
        $competitionDTOs = array_map(
            function ($competition) use ($statistics) {
                // Find matching competition data from statistics using native PHP
                $competitionData = null;
                foreach ($statistics['competitions'] as $item) {
                    if ($item['competition']['id'] === $competition->id()) {
                        $competitionData = $item;
                        break;
                    }
                }

                return CompetitionSummaryData::fromEntity(
                    $competition,
                    $competitionData['platform_name'] ?? 'Unknown',
                    $competitionData['platform_slug'] ?? 'unknown',
                    $competitionData['seasons_count'] ?? 0
                );
            },
            $competitions
        );

        $stats = [
            'total_drivers' => $statistics['total_drivers'],
            'total_races' => $statistics['total_races'],
            'total_competitions' => $statistics['total_competitions'],
        ];

        // Generate URLs for logo and header image
        $logoUrl = $league->logoPath()
            ? Storage::disk('public')->url($league->logoPath())
            : null;

        $headerImageUrl = $league->headerImagePath()
            ? Storage::disk('public')->url($league->headerImagePath())
            : null;

        return LeagueDetailsData::fromEntity(
            $league,
            $platforms,
            $ownerData,
            $competitionDTOs,
            $statistics['seasons_summary'],
            $stats,
            $logoUrl,
            $headerImageUrl
        );
    }

    /**
     * Dispatch domain events.
     */
    private function dispatchEvents(League $league): void
    {
        $events = $league->releaseEvents();

        foreach ($events as $event) {
            Event::dispatch($event);
        }
    }

    /**
     * Get all leagues for admin from a request object.
     * Handles filter building, pagination parameter extraction, and link generation.
     *
     * @return array{data: array<int, mixed>, meta: array<string, int>, links: array<string, string|null>}
     */
    private function getAllLeaguesForAdminFromRequest(IndexLeaguesRequest $request): array
    {
        // Build filters from validated request data
        $filters = FilterBuilder::build($request->validated());

        // Ensure platform_ids are integers if provided
        if (isset($filters['platform_ids'])) {
            $filters['platform_ids'] = array_map('intval', $filters['platform_ids']);
        }

        // Extract pagination parameters
        $perPage = (int) ($request->validated()['per_page'] ?? 15);
        $page = (int) ($request->validated()['page'] ?? 1);

        // Get paginated leagues from repository
        $result = $this->leagueRepository->getPaginatedForAdmin($page, $perPage, $filters);

        // Fetch owner data for all leagues
        /** @var array<int, int> $ownerUserIds */
        $ownerUserIds = array_map(fn(array $item) => $item['league']->ownerUserId(), $result['data']);
        $ownerUserIds = array_unique($ownerUserIds);
        $owners = $this->userRepository->findMultipleByIds($ownerUserIds);

        // Convert to DTOs with platform, owner data, and counts
        $leagueDTOs = array_map(
            function (array $item) use ($owners) {
                $league = $item['league'];
                $platforms = $this->fetchPlatformData($league->platformIds());

                // Get owner data
                $ownerData = $owners[$league->ownerUserId()] ?? null;

                return LeagueData::fromEntity(
                    $league,
                    $platforms,
                    $ownerData,
                    $item['competitions_count'],
                    $item['drivers_count']
                );
            },
            $result['data']
        );

        // Build pagination links
        $links = PaginationHelper::buildLinks($request, $result['current_page'], $result['last_page']);

        // Convert DTOs to arrays for response
        $data = array_map(fn($item) => $item->toArray(), $leagueDTOs);

        return [
            'data' => $data,
            'meta' => [
                'total' => $result['total'],
                'per_page' => $result['per_page'],
                'current_page' => $result['current_page'],
                'last_page' => $result['last_page'],
            ],
            'links' => $links,
        ];
    }

    /**
     * Get paginated public leagues (no authentication required).
     *
     * @param int $page Current page number
     * @param int $perPage Number of items per page
     * @param array<string, mixed> $filters Search and filter criteria
     * @return array{data: array<int, mixed>, meta: array<string, int>}
     */
    public function getPublicLeagues(int $page, int $perPage = 12, array $filters = []): array
    {
        $result = $this->leagueRepository->getPaginatedPublic($page, $perPage, $filters);

        // Convert to public DTOs with platform data
        $leagueDTOs = array_map(
            function (array $item) {
                $league = $item['league'];
                $platforms = $this->fetchPlatformData($league->platformIds());

                return PublicLeagueData::fromEntity(
                    $league,
                    $platforms,
                    $item['competitions_count'],
                    $item['drivers_count']
                );
            },
            $result['data']
        );

        return [
            'data' => array_map(fn($dto) => $dto->toArray(), $leagueDTOs),
            'meta' => [
                'total' => $result['total'],
                'per_page' => $result['per_page'],
                'current_page' => $result['current_page'],
                'last_page' => $result['last_page'],
            ],
        ];
    }

    /**
     * Clean up uploaded files from storage.
     *
     * @param array<string> $filePaths Array of file paths to delete
     */
    private function cleanupUploadedFiles(array $filePaths): void
    {
        foreach ($filePaths as $filePath) {
            if (Storage::disk('public')->exists($filePath)) {
                Storage::disk('public')->delete($filePath);
            }
        }
    }

    /**
     * Verify that a league belongs to the specified user.
     *
     * @param League $league The league entity to check
     * @param int $userId The user ID to verify ownership against
     * @throws UnauthorizedException If the user does not own the league
     */
    private function authorizeLeagueAccess(League $league, int $userId): void
    {
        if ($league->ownerUserId() !== $userId) {
            throw UnauthorizedException::forResource('league');
        }
    }
}
