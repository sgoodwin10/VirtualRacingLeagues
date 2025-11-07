<?php

declare(strict_types=1);

namespace App\Application\League\Services;

use App\Application\League\DTOs\CreateLeagueData;
use App\Application\League\DTOs\LeagueData;
use App\Application\League\DTOs\LeaguePlatformData;
use App\Application\League\DTOs\UpdateLeagueData;
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
use App\Domain\Shared\Exceptions\UnauthorizedException;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
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
        private readonly DriverPlatformColumnService $driverPlatformColumnService,
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

            // Store logo
            $logoPath = $data->logo->store('leagues/logos', 'public');
            if (!$logoPath) {
                throw new \RuntimeException('Failed to store league logo');
            }

            // Store header image if provided
            $headerImagePath = null;
            if ($data->header_image) {
                $headerImagePath = $data->header_image->store('leagues/headers', 'public');
                if (!$headerImagePath) {
                    throw new \RuntimeException('Failed to store league header image');
                }
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
     */
    public function getLeagueById(int $leagueId): LeagueData
    {
        $result = $this->leagueRepository->findByIdWithCounts($leagueId);
        $league = $result['league'];
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
            if ($league->ownerUserId() !== $userId) {
                throw UnauthorizedException::forResource('league');
            }

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

            // Handle logo upload
            if ($data->logo !== null) {
                // Delete old logo if it exists
                $oldLogoPath = $league->logoPath();
                if ($oldLogoPath && Storage::disk('public')->exists($oldLogoPath)) {
                    Storage::disk('public')->delete($oldLogoPath);
                }

                $logoPath = $data->logo->store('leagues/logos', 'public');
                if (!$logoPath) {
                    throw new \RuntimeException('Failed to store league logo');
                }
                $league->updateLogo($logoPath);
            }

            // Handle header image upload
            if ($data->header_image !== null) {
                // Delete old header image if exists
                if ($league->headerImagePath() && Storage::disk('public')->exists($league->headerImagePath())) {
                    Storage::disk('public')->delete($league->headerImagePath());
                }

                $headerImagePath = $data->header_image->store('leagues/headers', 'public');
                if (!$headerImagePath) {
                    throw new \RuntimeException('Failed to store league header image');
                }
                $league->updateHeaderImage($headerImagePath);
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
            if ($league->ownerUserId() !== $userId) {
                throw UnauthorizedException::forResource('league');
            }

            $this->leagueRepository->delete($league);
        });
    }

    /**
     * Get platforms associated with a league.
     *
     * @param int $leagueId
     * @return array<int, LeaguePlatformData>
     * @throws LeagueNotFoundException
     */
    public function getLeaguePlatforms(int $leagueId): array
    {
        // Verify league exists first
        $this->leagueRepository->findById($leagueId);

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
     * @param LeagueSlug $baseSlug The base slug to make unique
     * @param int|null $excludeLeagueId Optional league ID to exclude from the check (for updates)
     */
    private function generateUniqueSlug(LeagueSlug $baseSlug, ?int $excludeLeagueId = null): LeagueSlug
    {
        $slug = $baseSlug;
        $counter = 1;

        while (!$this->leagueRepository->isSlugAvailable($slug->value(), $excludeLeagueId)) {
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

        $validPlatformIds = Platform::query()
            ->whereIn('id', $platformIds)
            ->where('is_active', true)
            ->pluck('id')
            ->toArray();

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

        return Platform::query()
            ->whereIn('id', $platformIds)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug'])
            ->map(fn($platform) => [
                'id' => $platform->id,
                'name' => $platform->name,
                'slug' => $platform->slug,
            ])
            ->toArray();
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
     * @return array<int, array{field: string, label: string, type: string}>
     * @throws LeagueNotFoundException
     */
    public function getDriverColumnsForLeague(int $leagueId): array
    {
        $league = $this->leagueRepository->findById($leagueId);
        return $this->driverPlatformColumnService->getColumnsForLeague($league->platformIds());
    }

    /**
     * Get driver form fields for a league's platforms.
     *
     * @param int $leagueId
     * @return array<int, array{field: string, label: string, type: string}>
     * @throws LeagueNotFoundException
     */
    public function getDriverFormFieldsForLeague(int $leagueId): array
    {
        $league = $this->leagueRepository->findById($leagueId);
        return $this->driverPlatformColumnService->getFormFieldsForLeague($league->platformIds());
    }

    /**
     * Get driver CSV headers for a league's platforms.
     *
     * @param int $leagueId
     * @return array<int, array{field: string, label: string, type: string}>
     * @throws LeagueNotFoundException
     */
    public function getDriverCsvHeadersForLeague(int $leagueId): array
    {
        $league = $this->leagueRepository->findById($leagueId);
        return $this->driverPlatformColumnService->getCsvHeadersForLeague($league->platformIds());
    }

    /**
     * Get all leagues for admin with pagination and filters.
     *
     * @param int $page
     * @param int $perPage
     * @param array<string, mixed> $filters
     * @return array{data: array<int, LeagueData>, total: int, per_page: int, current_page: int, last_page: int}
     */
    public function getAllLeaguesForAdmin(int $page, int $perPage, array $filters = []): array
    {
        return DB::transaction(function () use ($page, $perPage, $filters) {
            // Get paginated leagues from repository (now includes counts)
            $result = $this->leagueRepository->getPaginatedForAdmin($page, $perPage, $filters);

            // Fetch owner data for all leagues
            /** @var array<int, int> $ownerUserIds */
            $ownerUserIds = array_map(fn(array $item) => $item['league']->ownerUserId(), $result['data']);
            $owners = UserEloquent::whereIn('id', $ownerUserIds)
                ->get()
                ->keyBy('id');

            // Convert to DTOs with platform, owner data, and counts
            $leagueDTOs = array_map(
                function (array $item) use ($owners) {
                    $league = $item['league'];
                    $platforms = $this->fetchPlatformData($league->platformIds());

                    // Get owner data
                    $owner = $owners->get($league->ownerUserId());
                    $ownerData = $owner ? [
                        'id' => $owner->id,
                        'first_name' => $owner->first_name,
                        'last_name' => $owner->last_name,
                        'email' => $owner->email,
                    ] : null;

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
        });
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
        $owner = UserEloquent::find($league->ownerUserId());
        $ownerData = $owner ? [
            'id' => $owner->id,
            'first_name' => $owner->first_name,
            'last_name' => $owner->last_name,
            'email' => $owner->email,
        ] : null;

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
            $owner = UserEloquent::find($league->ownerUserId());
            $ownerData = $owner ? [
                'id' => $owner->id,
                'first_name' => $owner->first_name,
                'last_name' => $owner->last_name,
                'email' => $owner->email,
            ] : null;

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
     * Dispatch domain events.
     */
    private function dispatchEvents(League $league): void
    {
        $events = $league->releaseEvents();

        foreach ($events as $event) {
            Event::dispatch($event);
        }
    }
}
