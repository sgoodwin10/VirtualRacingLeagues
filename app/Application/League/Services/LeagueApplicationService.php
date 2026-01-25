<?php

declare(strict_types=1);

namespace App\Application\League\Services;

use App\Application\League\DTOs\CompetitionSummaryData;
use App\Application\League\DTOs\CreateLeagueData;
use App\Application\League\DTOs\LeagueData;
use App\Application\League\DTOs\LeagueDetailsData;
use App\Application\League\DTOs\LeaguePlatformData;
use App\Application\League\DTOs\LeagueStatsData;
use App\Application\League\DTOs\PublicCompetitionDetailData;
use App\Application\League\DTOs\PublicLeagueBasicData;
use App\Application\League\DTOs\PublicLeagueData;
use App\Application\League\DTOs\PublicLeagueDetailData;
use App\Application\League\DTOs\PublicRaceResultsData;
use App\Application\League\DTOs\PublicSeasonDetailData;
use App\Application\League\DTOs\PublicSeasonSummaryData;
use App\Application\League\DTOs\UpdateLeagueData;
use App\Application\Driver\DTOs\PublicDriverProfileData;
use App\Application\Activity\Services\LeagueActivityLogService;
use App\Application\Shared\Factories\MediaDataFactory;
use App\Application\Competition\Services\SeasonApplicationService;
use App\Application\Shared\Services\MediaServiceInterface;
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
use App\Infrastructure\Cache\RaceResultsCacheService;
use App\Infrastructure\Cache\SeasonDetailCacheService;
use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\Driver;
use App\Infrastructure\Persistence\Eloquent\Models\League as EloquentLeague;
use App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\Race;
use App\Infrastructure\Persistence\Eloquent\Models\RaceResult;
use App\Infrastructure\Persistence\Eloquent\Models\Round;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * League Application Service.
 * Orchestrates league use cases and coordinates domain logic.
 */
final class LeagueApplicationService
{
    public function __construct(
        private readonly LeagueRepositoryInterface $leagueRepository,
        private readonly CompetitionRepositoryInterface $competitionRepository,
        private readonly DriverPlatformColumnService $driverPlatformColumnService,
        private readonly PlatformRepositoryInterface $platformRepository,
        private readonly UserRepositoryInterface $userRepository,
        private readonly SeasonApplicationService $seasonApplicationService,
        private readonly RaceResultsCacheService $raceResultsCache,
        private readonly SeasonDetailCacheService $seasonDetailCache,
        private readonly MediaServiceInterface $mediaService,
        private readonly MediaDataFactory $mediaDataFactory,
        private readonly LeagueActivityLogService $activityLogService,
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
                $freeTierLimit = $this->getFreeTierLimit();
                if ($leagueCount >= $freeTierLimit) {
                    throw LeagueLimitReachedException::forFreeTier($freeTierLimit);
                }
            }

            // Generate unique slug
            $baseSlug = LeagueSlug::fromName($data->name);
            $slug = $this->generateUniqueSlug($baseSlug);

            try {
                // Store logo using old method for backward compatibility (dual-write during transition)
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

                // Store banner if provided
                $bannerPath = null;
                if ($data->banner) {
                    $bannerPath = $data->banner->store('leagues/banners', 'public');
                    if (!$bannerPath) {
                        throw new \RuntimeException('Failed to store league banner');
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
                    bannerPath: $bannerPath,
                    platformIds: $data->platform_ids,
                    discordUrl: $data->discord_url,
                    websiteUrl: $data->website_url,
                    twitterHandle: $data->twitter_handle,
                    instagramHandle: $data->instagram_handle,
                    youtubeUrl: $data->youtube_url,
                    twitchUrl: $data->twitch_url,
                    visibility: LeagueVisibility::fromString($data->visibility),
                );

                // Persist entity to database
                $this->leagueRepository->save($league);

                // Record creation event now that ID is set
                $league->recordCreationEvent();

                // Dispatch domain events
                $this->dispatchEvents($league);

                // Fetch the Eloquent model for media operations (with proper null check)
                $eloquentLeague = EloquentLeague::findOrFail($league->id());

                // Upload media using new media service (this replaces old media if it exists)
                // NOTE: Spatie's clearMediaCollection() is called inside upload(), which is safe
                $this->mediaService->upload($data->logo, $eloquentLeague, 'logo');

                if ($data->header_image) {
                    $this->mediaService->upload($data->header_image, $eloquentLeague, 'header_image');
                }

                if ($data->banner) {
                    $this->mediaService->upload($data->banner, $eloquentLeague, 'banner');
                }

                // Fetch platform data for response
                $platforms = $this->fetchPlatformData($league->platformIds());

                // Compute URLs for logo, header image, and banner
                $logoUrl = $this->computeLogoUrl($league);
                $headerImageUrl = $this->computeHeaderImageUrl($league);
                $bannerUrl = $this->computeBannerUrl($league);

                // Reload to get media relationships
                $eloquentLeague->load('media');

                // New leagues have 0 competitions, 0 drivers, 0 active seasons, and 0 races
                return LeagueData::fromEntity(
                    $league,
                    $platforms,
                    null,
                    0,
                    0,
                    0,
                    0,
                    $logoUrl,
                    $headerImageUrl,
                    $bannerUrl,
                    $eloquentLeague
                );
            } catch (\Throwable $e) {
                // Clean up any uploaded old-style files on failure
                // Note: Variables are always strings because we throw RuntimeException if store() returns false
                if (
                    isset($logoPath) &&
                    is_string($logoPath) &&
                    Storage::disk('public')->exists($logoPath)
                ) {
                    Storage::disk('public')->delete($logoPath);
                }
                if (
                    isset($headerImagePath) &&
                    is_string($headerImagePath) &&
                    Storage::disk('public')->exists($headerImagePath)
                ) {
                    Storage::disk('public')->delete($headerImagePath);
                }
                if (
                    isset($bannerPath) &&
                    is_string($bannerPath) &&
                    Storage::disk('public')->exists($bannerPath)
                ) {
                    Storage::disk('public')->delete($bannerPath);
                }

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

        // Fix N+1: Batch load all Eloquent models with media BEFORE the loop
        $leagueIds = array_map(fn(array $item) => $item['league']->id(), $leaguesWithCounts);
        $eloquentLeagues = EloquentLeague::query()
            ->whereIn('id', $leagueIds)
            ->with('media')
            ->get()
            ->keyBy('id');

        return array_map(
            function (array $item) use ($eloquentLeagues) {
                $league = $item['league'];
                $platforms = $this->fetchPlatformData($league->platformIds());
                $logoUrl = $this->computeLogoUrl($league);
                $headerImageUrl = $this->computeHeaderImageUrl($league);
                $bannerUrl = $this->computeBannerUrl($league);

                // Fetch eloquent model from pre-loaded collection
                $eloquentLeague = $eloquentLeagues->get($league->id());

                return LeagueData::fromEntity(
                    $league,
                    $platforms,
                    null,
                    $item['competitions_count'],
                    $item['drivers_count'],
                    $item['active_seasons_count'],
                    $item['total_races_count'],
                    $logoUrl,
                    $headerImageUrl,
                    $bannerUrl,
                    $eloquentLeague
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
        $logoUrl = $this->computeLogoUrl($league);
        $headerImageUrl = $this->computeHeaderImageUrl($league);
        $bannerUrl = $this->computeBannerUrl($league);

        // Fetch eloquent model for media relationships
        $eloquentLeague = EloquentLeague::with('media')->find($leagueId);

        return LeagueData::fromEntity(
            $league,
            $platforms,
            null,
            $result['competitions_count'],
            $result['drivers_count'],
            $result['active_seasons_count'],
            $result['total_races_count'],
            $logoUrl,
            $headerImageUrl,
            $bannerUrl,
            $eloquentLeague
        );
    }

    /**
     * Update an existing league.
     *
     * @throws LeagueNotFoundException
     * @throws InvalidPlatformException
     */
    public function updateLeague(
        int $leagueId,
        UpdateLeagueData $data,
        int $userId,
        array $validatedData = []
    ): LeagueData {
        return DB::transaction(function () use ($leagueId, $data, $userId, $validatedData) {
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
                $oldVisibility = $league->visibility()->value;
                $newVisibility = $data->visibility;

                $league->changeVisibility(LeagueVisibility::fromString($newVisibility));

                // If changing to private from public/unlisted, invalidate all race results caches
                $isChangingToPrivate = $newVisibility === LeagueVisibility::PRIVATE->value;
                $wasNotPrivate = $oldVisibility !== LeagueVisibility::PRIVATE->value;
                if ($isChangingToPrivate && $wasNotPrivate) {
                    $this->invalidateLeagueRaceResultsCache($leagueId);
                }
            }

            // Update contact info if provided
            if ($data->contact_email !== null || $data->organizer_name !== null) {
                $league->updateContactInfo(
                    $data->contact_email !== null ? EmailAddress::from($data->contact_email) : $league->contactEmail(),
                    $data->organizer_name ?? $league->organizerName()
                );
            }

            // Update social media if any provided
            // Use array_key_exists to differentiate between:
            // - "field not sent" (keep existing value)
            // - "field sent as null" (clear the value)
            if ($this->hasSocialMediaUpdatesInValidatedData($validatedData)) {
                $league->updateSocialMedia(
                    array_key_exists('discord_url', $validatedData)
                        ? $data->discord_url
                        : $league->discordUrl(),
                    array_key_exists('website_url', $validatedData)
                        ? $data->website_url
                        : $league->websiteUrl(),
                    array_key_exists('twitter_handle', $validatedData)
                        ? $data->twitter_handle
                        : $league->twitterHandle(),
                    array_key_exists('instagram_handle', $validatedData)
                        ? $data->instagram_handle
                        : $league->instagramHandle(),
                    array_key_exists('youtube_url', $validatedData)
                        ? $data->youtube_url
                        : $league->youtubeUrl(),
                    array_key_exists('twitch_url', $validatedData)
                        ? $data->twitch_url
                        : $league->twitchUrl()
                );
            }

            // Update timezone if provided
            if ($data->timezone !== null) {
                $league->updateTimezone($data->timezone);
            }

            // Fetch the Eloquent model for media operations (with proper null check)
            $eloquentLeague = EloquentLeague::findOrFail($leagueId);

            // Track new old-format file paths for cleanup on failure
            $newLogoPath = null;
            $newHeaderImagePath = null;
            $newBannerPath = null;

            // Handle media uploads
            try {
                // Handle logo upload
                if ($data->logo !== null) {
                    // Store new logo using old method (dual-write)
                    $newLogoPath = $data->logo->store('leagues/logos', 'public');
                    if (!$newLogoPath) {
                        throw new \RuntimeException('Failed to store league logo');
                    }

                    $league->updateLogo($newLogoPath);

                    // Upload using new media service (replaces old media)
                    $this->mediaService->upload($data->logo, $eloquentLeague, 'logo');
                }

                // Handle header image upload
                if ($data->header_image !== null) {
                    // Store new header image using old method (dual-write)
                    $newHeaderImagePath = $data->header_image->store('leagues/headers', 'public');
                    if (!$newHeaderImagePath) {
                        throw new \RuntimeException('Failed to store league header image');
                    }

                    $league->updateHeaderImage($newHeaderImagePath);

                    // Upload using new media service (replaces old media)
                    $this->mediaService->upload($data->header_image, $eloquentLeague, 'header_image');
                }

                // Handle banner upload
                if ($data->banner !== null) {
                    // Store new banner using old method (dual-write)
                    $newBannerPath = $data->banner->store('leagues/banners', 'public');
                    if (!$newBannerPath) {
                        throw new \RuntimeException('Failed to store league banner');
                    }

                    $league->updateBanner($newBannerPath);

                    // Upload using new media service (replaces old media)
                    $this->mediaService->upload($data->banner, $eloquentLeague, 'banner');
                }
            } catch (\Throwable $e) {
                // Clean up any newly uploaded old-format files on failure
                // Note: Variables are always strings because we throw RuntimeException if store() returns false
                if (
                    $newLogoPath !== null &&
                    is_string($newLogoPath) &&
                    Storage::disk('public')->exists($newLogoPath)
                ) {
                    Storage::disk('public')->delete($newLogoPath);
                }
                if (
                    $newHeaderImagePath !== null &&
                    is_string($newHeaderImagePath) &&
                    Storage::disk('public')->exists($newHeaderImagePath)
                ) {
                    Storage::disk('public')->delete($newHeaderImagePath);
                }
                if (
                    $newBannerPath !== null &&
                    is_string($newBannerPath) &&
                    Storage::disk('public')->exists($newBannerPath)
                ) {
                    Storage::disk('public')->delete($newBannerPath);
                }

                // Re-throw the exception (Spatie handles its own cleanup via clearMediaCollection)
                throw $e;
            }

            // Persist updates
            $this->leagueRepository->update($league);

            // Dispatch domain events
            $this->dispatchEvents($league);

            // Fetch updated counts and platform data for response
            $result = $this->leagueRepository->findByIdWithCounts($leagueId);
            $platforms = $this->fetchPlatformData($league->platformIds());
            $logoUrl = $this->computeLogoUrl($league);
            $headerImageUrl = $this->computeHeaderImageUrl($league);
            $bannerUrl = $this->computeBannerUrl($league);

            // Reload eloquent model to get updated media relationships
            $eloquentLeague->load('media');

            return LeagueData::fromEntity(
                $league,
                $platforms,
                null,
                $result['competitions_count'],
                $result['drivers_count'],
                $result['active_seasons_count'],
                $result['total_races_count'],
                $logoUrl,
                $headerImageUrl,
                $bannerUrl,
                $eloquentLeague
            );
        });
    }

    /**
     * Create a new league with activity logging.
     *
     * @param CreateLeagueData $data
     * @param int $userId
     * @param UserEloquent $user
     * @param bool $isFreeTier
     * @return LeagueData
     */
    public function createLeagueWithActivityLog(
        CreateLeagueData $data,
        int $userId,
        UserEloquent $user,
        bool $isFreeTier = true
    ): LeagueData {
        $leagueData = $this->createLeague($data, $userId, $isFreeTier);

        // Log activity
        try {
            $eloquentLeague = EloquentLeague::findOrFail($leagueData->id);
            $this->activityLogService->logLeagueCreated($user, $eloquentLeague);
        } catch (\Exception $e) {
            Log::error('Failed to log league creation activity', [
                'error' => $e->getMessage(),
                'league_id' => $leagueData->id,
            ]);
        }

        return $leagueData;
    }

    /**
     * Update a league with activity logging and change tracking.
     *
     * @param int $leagueId
     * @param UpdateLeagueData $data
     * @param int $userId
     * @param UserEloquent $user
     * @return LeagueData
     */
    public function updateLeagueWithActivityLog(
        int $leagueId,
        UpdateLeagueData $data,
        int $userId,
        UserEloquent $user,
        array $validatedData = []
    ): LeagueData {
        // Capture original data for change tracking
        $eloquentLeague = EloquentLeague::findOrFail($leagueId);
        $originalData = $eloquentLeague->only([
            'name',
            'visibility',
            'timezone',
            'contact_email',
            'organizer_name',
            'tagline',
            'description',
        ]);

        $leagueData = $this->updateLeague($leagueId, $data, $userId, $validatedData);

        // Log activity with changes
        try {
            $eloquentLeague->refresh();
            $newData = $eloquentLeague->only([
                'name',
                'visibility',
                'timezone',
                'contact_email',
                'organizer_name',
                'tagline',
                'description',
            ]);

            $this->activityLogService->logLeagueUpdated($user, $eloquentLeague, [
                'old' => $originalData,
                'new' => $newData,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log league update activity', [
                'error' => $e->getMessage(),
                'league_id' => $leagueId,
            ]);
        }

        return $leagueData;
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
     * Check if any social media fields are present in the validated data.
     *
     * @param array<string, mixed> $validatedData
     * @return bool
     */
    private function hasSocialMediaUpdatesInValidatedData(array $validatedData): bool
    {
        return array_key_exists('discord_url', $validatedData)
            || array_key_exists('website_url', $validatedData)
            || array_key_exists('twitter_handle', $validatedData)
            || array_key_exists('instagram_handle', $validatedData)
            || array_key_exists('youtube_url', $validatedData)
            || array_key_exists('twitch_url', $validatedData);
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

        // Fix N+1: Batch load all Eloquent models with media BEFORE the loop
        $leagueIds = array_map(fn(array $item) => $item['league']->id(), $result['data']);
        $eloquentLeagues = EloquentLeague::query()
            ->whereIn('id', $leagueIds)
            ->with('media')
            ->get()
            ->keyBy('id');

        // Convert to DTOs with platform, owner data, and counts
        $leagueDTOs = array_map(
            function (array $item) use ($owners, $eloquentLeagues) {
                $league = $item['league'];
                $platforms = $this->fetchPlatformData($league->platformIds());
                $logoUrl = $this->computeLogoUrl($league);
                $headerImageUrl = $this->computeHeaderImageUrl($league);
                $bannerUrl = $this->computeBannerUrl($league);

                // Get owner data
                $ownerData = $owners[$league->ownerUserId()] ?? null;

                // Fetch eloquent model from pre-loaded collection
                $eloquentLeague = $eloquentLeagues->get($league->id());

                return LeagueData::fromEntity(
                    $league,
                    $platforms,
                    $ownerData,
                    $item['competitions_count'],
                    $item['drivers_count'],
                    $item['active_seasons_count'],
                    $item['total_races_count'],
                    $logoUrl,
                    $headerImageUrl,
                    $bannerUrl,
                    $eloquentLeague
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
        $logoUrl = $this->computeLogoUrl($league);
        $headerImageUrl = $this->computeHeaderImageUrl($league);
        $bannerUrl = $this->computeBannerUrl($league);

        // Fetch owner data
        $owners = $this->userRepository->findMultipleByIds([$league->ownerUserId()]);
        $ownerData = $owners[$league->ownerUserId()] ?? null;

        // Fetch eloquent model for media relationships
        $eloquentLeague = EloquentLeague::with('media')->find($leagueId);

        return LeagueData::fromEntity(
            $league,
            $platforms,
            $ownerData,
            $result['competitions_count'],
            $result['drivers_count'],
            $result['active_seasons_count'],
            $result['total_races_count'],
            $logoUrl,
            $headerImageUrl,
            $bannerUrl,
            $eloquentLeague
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
            $logoUrl = $this->computeLogoUrl($league);
            $headerImageUrl = $this->computeHeaderImageUrl($league);
            $bannerUrl = $this->computeBannerUrl($league);
            $owners = $this->userRepository->findMultipleByIds([$league->ownerUserId()]);
            $ownerData = $owners[$league->ownerUserId()] ?? null;

            // Fetch eloquent model for media relationships
            $eloquentLeague = EloquentLeague::with('media')->find($leagueId);

            return LeagueData::fromEntity(
                $league,
                $platforms,
                $ownerData,
                $result['competitions_count'],
                $result['drivers_count'],
                $result['active_seasons_count'],
                $result['total_races_count'],
                $logoUrl,
                $headerImageUrl,
                $bannerUrl,
                $eloquentLeague
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

        // Fix N+1: Batch load all Eloquent models with media BEFORE the loop
        $leagueIds = array_map(fn(array $item) => $item['league']->id(), $result['data']);
        $eloquentLeagues = EloquentLeague::query()
            ->whereIn('id', $leagueIds)
            ->with('media')
            ->get()
            ->keyBy('id');

        // Convert to DTOs with platform, owner data, and counts
        $leagueDTOs = array_map(
            function (array $item) use ($owners, $eloquentLeagues) {
                $league = $item['league'];
                $platforms = $this->fetchPlatformData($league->platformIds());
                $logoUrl = $this->computeLogoUrl($league);
                $headerImageUrl = $this->computeHeaderImageUrl($league);
                $bannerUrl = $this->computeBannerUrl($league);

                // Get owner data
                $ownerData = $owners[$league->ownerUserId()] ?? null;

                // Fetch eloquent model from pre-loaded collection
                $eloquentLeague = $eloquentLeagues->get($league->id());

                return LeagueData::fromEntity(
                    $league,
                    $platforms,
                    $ownerData,
                    $item['competitions_count'],
                    $item['drivers_count'],
                    $item['active_seasons_count'],
                    $item['total_races_count'],
                    $logoUrl,
                    $headerImageUrl,
                    $bannerUrl,
                    $eloquentLeague
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

        // Fix N+1: Batch load all Eloquent models with media BEFORE the loop
        $leagueIds = array_map(fn(array $item) => $item['league']->id(), $result['data']);
        $eloquentLeagues = EloquentLeague::query()
            ->whereIn('id', $leagueIds)
            ->with('media')
            ->get()
            ->keyBy('id');

        // Convert to public DTOs with platform data
        $leagueDTOs = array_map(
            function (array $item) use ($eloquentLeagues) {
                $league = $item['league'];
                $platforms = $this->fetchPlatformData($league->platformIds());
                $logoUrl = $this->computeLogoUrl($league);
                $headerImageUrl = $this->computeHeaderImageUrl($league);
                $bannerUrl = $this->computeBannerUrl($league);

                // Fetch eloquent model from pre-loaded collection
                $eloquentLeague = $eloquentLeagues->get($league->id());

                return PublicLeagueData::fromEntity(
                    $league,
                    $platforms,
                    $item['competitions_count'],
                    $item['drivers_count'],
                    $item['active_seasons_count'],
                    $item['total_races_count'],
                    $logoUrl,
                    $headerImageUrl,
                    $bannerUrl,
                    $eloquentLeague
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
     * Get detailed league information for public viewing (no authentication required).
     * Returns null if league is not found or not public/unlisted.
     *
     * @param string $slug The league slug
     * @return PublicLeagueDetailData|null
     */
    public function getPublicLeagueDetail(string $slug): ?PublicLeagueDetailData
    {
        // Wrap in read-only transaction for consistent snapshot
        return DB::transaction(function () use ($slug) {
            // Find and validate league
            $leagueData = $this->findPublicLeague($slug);
            if ($leagueData === null) {
                return null;
            }

            ['eloquent' => $eloquentLeague, 'entity' => $league] = $leagueData;

            // Fetch platforms
            $platforms = $this->fetchPlatformData($league->platformIds());

            // Fetch competitions with seasons (extracted to helper)
            $competitions = $this->fetchCompetitionsWithSeasons((int)$league->id());

            // Calculate league statistics (extracted to helper)
            $stats = $this->calculateLeagueStats($competitions);

            // Map competitions to DTOs (extracted to helper)
            $competitionDTOs = $this->mapCompetitionsToDTOs($competitions);

            // Generate URLs for logo, header image, and banner
            $logoUrl = $league->logoPath()
                ? Storage::disk('public')->url($league->logoPath())
                : null;

            $headerImageUrl = $league->headerImagePath()
                ? Storage::disk('public')->url($league->headerImagePath())
                : null;

            $bannerUrl = $league->bannerPath()
                ? Storage::disk('public')->url($league->bannerPath())
                : null;

            // Build league basic data DTO
            $leagueBasicData = new PublicLeagueBasicData(
                id: $eloquentLeague->id,
                name: $league->name()->value(),
                slug: $league->slug()->value(),
                tagline: $league->tagline()?->value(),
                description: $league->description(),
                // OLD FORMAT (backward compatibility)
                logo_url: $logoUrl,
                header_image_url: $headerImageUrl,
                banner_url: $bannerUrl,
                // NEW FORMAT - media objects with conversions
                logo: $this->mediaDataFactory->fromMedia($eloquentLeague->getFirstMedia('logo')),
                header_image: $this->mediaDataFactory->fromMedia($eloquentLeague->getFirstMedia('header_image')),
                banner: $this->mediaDataFactory->fromMedia($eloquentLeague->getFirstMedia('banner')),
                platforms: $platforms,
                visibility: $league->visibility()->value,
                discord_url: $league->discordUrl(),
                website_url: $league->websiteUrl(),
                twitter_handle: $league->twitterHandle(),
                instagram_handle: $league->instagramHandle(),
                youtube_url: $league->youtubeUrl(),
                twitch_url: $league->twitchUrl(),
                created_at: $eloquentLeague->created_at?->format('Y-m-d H:i:s') ?? '',
            );

            // Build stats DTO
            $statsData = new LeagueStatsData(
                competitions_count: $stats['total_competitions'],
                active_seasons_count: $stats['active_seasons'],
                drivers_count: $stats['total_drivers'],
            );

            return new PublicLeagueDetailData(
                league: $leagueBasicData,
                stats: $statsData,
                competitions: $competitionDTOs,
                recent_activity: [],  // Placeholder - to be implemented later
                upcoming_races: [],   // Placeholder - to be implemented later
                championship_leaders: [],  // Placeholder - to be implemented later
            );
        }, attempts: 1);
    }

    /**
     * Compute logo URL from league entity.
     * Returns null if league has no logo path.
     *
     * @param League $league
     * @return string|null
     */
    private function computeLogoUrl(League $league): ?string
    {
        return $league->logoPath()
            ? Storage::disk('public')->url($league->logoPath())
            : null;
    }

    /**
     * Compute header image URL from league entity.
     * Returns null if league has no header image path.
     *
     * @param League $league
     * @return string|null
     */
    private function computeHeaderImageUrl(League $league): ?string
    {
        return $league->headerImagePath()
            ? Storage::disk('public')->url($league->headerImagePath())
            : null;
    }

    /**
     * Compute banner URL from league entity.
     * Returns null if league has no banner path.
     *
     * @param League $league
     * @return string|null
     */
    private function computeBannerUrl(League $league): ?string
    {
        return $league->bannerPath()
            ? Storage::disk('public')->url($league->bannerPath())
            : null;
    }


    /**
     * Get detailed season information for public viewing by slug (no authentication required).
     * Returns null if season/league is not found or not public/unlisted.
     *
     * @param string $leagueSlug The league slug
     * @param string $seasonSlug The season slug
     * @return PublicSeasonDetailData|null
     */
    public function getPublicSeasonDetail(string $leagueSlug, string $seasonSlug): ?PublicSeasonDetailData
    {
        // Find league by slug (Eloquent for visibility check)
        $eloquentLeague = EloquentLeague::where('slug', $leagueSlug)->first();

        if ($eloquentLeague === null || $eloquentLeague->visibility === LeagueVisibility::PRIVATE->value) {
            return null;
        }

        // Lightweight query to get season ID for cache lookup
        $seasonIdResult = SeasonEloquent::query()
            ->select('seasons.id')
            ->whereHas('competition', function ($query) use ($eloquentLeague) {
                $query->where('league_id', $eloquentLeague->id);
            })
            ->where('slug', $seasonSlug)
            ->first();

        if ($seasonIdResult === null) {
            return null;
        }

        $seasonId = $seasonIdResult->id;

        // Try to get from cache first
        $cached = $this->seasonDetailCache->get($seasonId);
        if ($cached !== null) {
            return $cached;
        }

        // Cache miss - fetch full data from database
        $eloquentSeason = SeasonEloquent::query()
            ->whereHas('competition', function ($query) use ($eloquentLeague) {
                $query->where('league_id', $eloquentLeague->id);
            })
            ->where('slug', $seasonSlug)
            ->with([
                'competition:id,league_id,name,slug,logo_path',
                'competition.league:id,name,slug,logo_path,header_image_path',
            ])
            ->withCount([
                'seasonDrivers as total_drivers',
                'seasonDrivers as active_drivers' => function ($q) {
                    $q->where('status', 'active');
                },
                'rounds as total_rounds',
                'rounds as completed_rounds' => function ($q) {
                    $q->where('status', 'completed');
                },
            ])
            ->first();

        // Calculate total and completed races separately
        $totalRaces = 0;
        $completedRaces = 0;
        if ($eloquentSeason) {
            $raceStats = Race::query()
                ->whereIn('round_id', function ($query) use ($eloquentSeason) {
                    $query->select('id')
                        ->from('rounds')
                        ->where('season_id', $eloquentSeason->id);
                })
                ->selectRaw('COUNT(*) as total_races')
                ->selectRaw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed_races')
                ->first();

            $totalRaces = $raceStats->total_races ?? 0;
            $completedRaces = $raceStats->completed_races ?? 0;
        }

        if ($eloquentSeason === null) {
            return null;
        }

        // CRITICAL: Verify season belongs to the specified league
        // Relationships are eager-loaded with ->with() so they won't be null,
        // but PHPStan doesn't know this
        /** @phpstan-ignore-next-line identical.alwaysFalse */
        if ($eloquentSeason->competition === null || $eloquentSeason->competition->league === null) {
            return null;
        }

        if ($eloquentSeason->competition->league->slug !== $leagueSlug) {
            return null;
        }

        // Generate logo/banner URLs (competition is guaranteed non-null after the check above)
        $logoUrl = $eloquentSeason->logo_path
            ? Storage::disk('public')->url($eloquentSeason->logo_path)
            : ($eloquentSeason->competition->logo_path
                ? Storage::disk('public')->url($eloquentSeason->competition->logo_path)
                : null);

        $bannerUrl = $eloquentSeason->banner_path
            ? Storage::disk('public')->url($eloquentSeason->banner_path)
            : null;

        // Build league data with images
        $leagueLogoUrl = $eloquentLeague->logo_path
            ? Storage::disk('public')->url($eloquentLeague->logo_path)
            : null;
        $leagueHeaderUrl = $eloquentLeague->header_image_path
            ? Storage::disk('public')->url($eloquentLeague->header_image_path)
            : null;

        $leagueData = [
            'name' => $eloquentSeason->competition->league->name,
            'slug' => $eloquentSeason->competition->league->slug,
            'logo_url' => $leagueLogoUrl,
            'header_image_url' => $leagueHeaderUrl,
        ];

        // Build competition data
        $competitionData = [
            'name' => $eloquentSeason->competition->name,
            'slug' => $eloquentSeason->competition->slug,
        ];

        // Build season data
        $seasonData = [
            'id' => $eloquentSeason->id,
            'name' => $eloquentSeason->name,
            'slug' => $eloquentSeason->slug,
            'car_class' => $eloquentSeason->car_class,
            'description' => $eloquentSeason->description,
            'logo_url' => $logoUrl,
            'banner_url' => $bannerUrl,
            'status' => $eloquentSeason->status,
            'is_active' => $eloquentSeason->status === 'active',
            'is_completed' => $eloquentSeason->status === 'completed',
            'race_divisions_enabled' => $eloquentSeason->race_divisions_enabled,
            'race_times_required' => $eloquentSeason->race_times_required,
            'stats' => [
                'total_drivers' => $eloquentSeason->total_drivers ?? 0,
                'active_drivers' => $eloquentSeason->active_drivers ?? 0,
                'total_rounds' => $eloquentSeason->total_rounds ?? 0,
                'completed_rounds' => $eloquentSeason->completed_rounds ?? 0,
                'total_races' => $totalRaces,
                'completed_races' => $completedRaces,
            ],
        ];

        // Fetch rounds with races
        $eloquentRounds = Round::query()
            ->where('season_id', $eloquentSeason->id)
            ->with([
                'races:id,round_id,race_number,name,race_type,status,is_qualifier',
                'platformTrack:id,name,slug,platform_track_location_id',
                'platformTrack.location:id,name,slug,country',
            ])
            ->orderBy('round_number')
            ->get();

        $rounds = [];
        foreach ($eloquentRounds as $round) {
            $trackName = $round->platformTrack?->name;
            $trackLayout = $round->track_layout;
            $circuitName = $round->platformTrack?->location?->name;
            $circuitCountry = $round->platformTrack?->location?->country;

            $races = [];
            foreach ($round->races as $race) {
                $races[] = [
                    'id' => $race->id,
                    'race_number' => $race->race_number ?? 0,
                    'name' => $race->name,
                    'race_type' => $race->race_type ?? 'custom',
                    'status' => $race->status,
                    'is_qualifier' => (bool) $race->is_qualifier,
                ];
            }

            // Enrich cross-division aggregate results with driver info
            $enrichedQualifying = $this->enrichCrossDivisionResults(
                $round->qualifying_results ?? [],
                $eloquentSeason->race_divisions_enabled
            );
            $enrichedRaceTime = $this->enrichCrossDivisionResults(
                $round->race_time_results ?? [],
                $eloquentSeason->race_divisions_enabled
            );
            $enrichedFastestLap = $this->enrichCrossDivisionResults(
                $round->fastest_lap_results ?? [],
                $eloquentSeason->race_divisions_enabled
            );

            // Use existing round_results from database (default to empty array if null)
            $roundStandings = $round->round_results ?? [];

            $rounds[] = [
                'id' => $round->id,
                'round_number' => $round->round_number,
                'name' => $round->name,
                'slug' => $round->slug,
                'scheduled_at' => $round->scheduled_at?->format('Y-m-d H:i:s'),
                'circuit_name' => $circuitName,
                'circuit_country' => $circuitCountry,
                'track_name' => $trackName,
                'track_layout' => $trackLayout,
                'status' => $round->status,
                'status_label' => ucfirst(str_replace('_', ' ', $round->status)),
                'races' => $races,
                'qualifying_results' => $enrichedQualifying,
                'race_time_results' => $enrichedRaceTime,
                'fastest_lap_results' => $enrichedFastestLap,
                'round_standings' => $roundStandings,
            ];
        }

        // Get standings using existing method from SeasonApplicationService
        $standingsData = $this->seasonApplicationService->getSeasonStandings($eloquentSeason->id);

        // Fetch qualifying results (from qualifying races)
        $qualifyingResults = $this->fetchQualifyingResults(
            $eloquentSeason->id,
            $eloquentSeason->race_divisions_enabled
        );

        // Fetch fastest lap results (sorted by fastest lap time)
        $fastestLapResults = $this->fetchFastestLapResults(
            $eloquentSeason->id,
            $eloquentSeason->race_divisions_enabled
        );

        // Fetch race time results (sorted by race time)
        $raceTimeResults = $this->fetchRaceTimeResults(
            $eloquentSeason->id,
            $eloquentSeason->race_divisions_enabled
        );

        $result = new PublicSeasonDetailData(
            league: $leagueData,
            competition: $competitionData,
            season: $seasonData,
            rounds: $rounds,
            standings: $standingsData['standings'],
            has_divisions: $standingsData['has_divisions'],
            qualifying_results: $qualifyingResults,
            fastest_lap_results: $fastestLapResults,
            race_time_results: $raceTimeResults,
            drop_round_enabled: $standingsData['drop_round_enabled'],
            team_championship_enabled: $standingsData['team_championship_enabled'],
            team_championship_results: $standingsData['team_championship_results'],
            teams_drop_rounds_enabled: $standingsData['teams_drop_rounds_enabled'],
        );

        // Store in cache for next request (24-hour TTL)
        $this->seasonDetailCache->put($seasonId, $result);

        return $result;
    }

    /**
     * Fetch qualifying results for a season.
     * Returns results from qualifying sessions (is_qualifier = true).
     *
     * @param int $seasonId
     * @param bool $hasDivisions
     * @return array<int, mixed>
     */
    private function fetchQualifyingResults(int $seasonId, bool $hasDivisions): array
    {
        // Get all qualifying race IDs for this season
        $qualifyingRaceIds = Race::query()
            ->join('rounds', 'races.round_id', '=', 'rounds.id')
            ->where('rounds.season_id', $seasonId)
            ->where('races.is_qualifier', true)
            ->where('races.status', 'completed')
            ->pluck('races.id')
            ->toArray();

        if (empty($qualifyingRaceIds)) {
            return [];
        }

        // Fetch results from qualifying races grouped by round
        $results = RaceResult::query()
            ->whereIn('race_id', $qualifyingRaceIds)
            ->join('drivers', 'race_results.driver_id', '=', 'drivers.id')
            ->join('league_drivers', 'drivers.id', '=', 'league_drivers.driver_id')
            ->join('season_drivers', 'league_drivers.id', '=', 'season_drivers.league_driver_id')
            ->join('races', 'race_results.race_id', '=', 'races.id')
            ->join('rounds', 'races.round_id', '=', 'rounds.id')
            ->leftJoin('divisions', 'race_results.division_id', '=', 'divisions.id')
            ->select([
                'race_results.position',
                'race_results.driver_id',
                'race_results.division_id',
                'race_results.fastest_lap',
                'race_results.has_pole',
                'drivers.first_name',
                'drivers.last_name',
                'drivers.nickname',
                'league_drivers.driver_number',
                'divisions.name as division_name',
                'rounds.round_number',
                'rounds.name as round_name',
                'races.id as race_id',
            ])
            ->orderBy('rounds.round_number')
            ->orderBy('race_results.position')
            ->get();

        // Format results - always group by round with flat results
        $groupedResults = [];
        /** @var RaceResult&object{round_number: int, round_name: string|null, division_name: string|null, first_name: string, last_name: string, nickname: string|null, driver_number: int|null} $result */
        foreach ($results as $result) {
            $roundKey = $result->round_number;

            if (!isset($groupedResults[$roundKey])) {
                $groupedResults[$roundKey] = [
                    'round_number' => $result->round_number,
                    'round_name' => $result->round_name,
                    'results' => [],
                ];
            }

            $formattedResult = $this->formatQualifyingResult($result);

            // Include division information if divisions are enabled
            if ($hasDivisions) {
                $formattedResult['division_id'] = $result->division_id;
                $formattedResult['division_name'] = $result->division_name ?? 'No Division';
            }

            $groupedResults[$roundKey]['results'][] = $formattedResult;
        }

        return array_values($groupedResults);
    }

    /**
     * Fetch fastest lap results for a season.
     * Returns results sorted by fastest lap time across all non-qualifying races.
     * Results are always returned as a flat array with division info included when divisions are enabled.
     *
     * @param int $seasonId
     * @param bool $hasDivisions
     * @return array<int, mixed>
     */
    private function fetchFastestLapResults(int $seasonId, bool $hasDivisions): array
    {
        // Get all non-qualifying race IDs for this season
        $raceIds = Race::query()
            ->join('rounds', 'races.round_id', '=', 'rounds.id')
            ->where('rounds.season_id', $seasonId)
            ->where('races.is_qualifier', false)
            ->where('races.status', 'completed')
            ->pluck('races.id')
            ->toArray();

        if (empty($raceIds)) {
            return [];
        }

        // Fetch results with fastest laps, sorted by time globally (not per division)
        $results = RaceResult::query()
            ->whereIn('race_id', $raceIds)
            ->whereNotNull('race_results.fastest_lap')
            ->where('race_results.fastest_lap', '!=', '')
            ->join('drivers', 'race_results.driver_id', '=', 'drivers.id')
            ->join('league_drivers', 'drivers.id', '=', 'league_drivers.driver_id')
            ->join('season_drivers', 'league_drivers.id', '=', 'season_drivers.league_driver_id')
            ->join('races', 'race_results.race_id', '=', 'races.id')
            ->join('rounds', 'races.round_id', '=', 'rounds.id')
            ->leftJoin('divisions', 'race_results.division_id', '=', 'divisions.id')
            ->select([
                'race_results.driver_id',
                'race_results.division_id',
                'race_results.fastest_lap',
                'drivers.first_name',
                'drivers.last_name',
                'drivers.nickname',
                'league_drivers.driver_number',
                'divisions.name as division_name',
                'rounds.round_number',
                'rounds.name as round_name',
            ])
            ->orderBy(DB::raw('CAST(race_results.fastest_lap AS CHAR)'))
            ->get();

        // Format as flat list with global positions
        $formattedResults = [];
        $position = 1;

        foreach ($results as $result) {
            $formattedResult = $this->formatFastestLapResult($result, $position);

            // Include division information if divisions are enabled
            if ($hasDivisions) {
                $formattedResult['division_id'] = $result->division_id;
                $formattedResult['division_name'] = $result->division_name ?? 'No Division';
            }

            $formattedResults[] = $formattedResult;
            $position++;
        }

        return $formattedResults;
    }

    /**
     * Fetch race time results for a season.
     * Returns results sorted by race time across all non-qualifying races.
     * Results are always returned as a flat array with division info included when divisions are enabled.
     *
     * @param int $seasonId
     * @param bool $hasDivisions
     * @return array<int, mixed>
     */
    private function fetchRaceTimeResults(int $seasonId, bool $hasDivisions): array
    {
        // Get all non-qualifying race IDs for this season
        $raceIds = Race::query()
            ->join('rounds', 'races.round_id', '=', 'rounds.id')
            ->where('rounds.season_id', $seasonId)
            ->where('races.is_qualifier', false)
            ->where('races.status', 'completed')
            ->pluck('races.id')
            ->toArray();

        if (empty($raceIds)) {
            return [];
        }

        // Fetch results with race times, sorted by time globally (not per division)
        $results = RaceResult::query()
            ->whereIn('race_id', $raceIds)
            ->whereNotNull('race_results.original_race_time')
            ->where('race_results.original_race_time', '!=', '')
            ->join('drivers', 'race_results.driver_id', '=', 'drivers.id')
            ->join('league_drivers', 'drivers.id', '=', 'league_drivers.driver_id')
            ->join('season_drivers', 'league_drivers.id', '=', 'season_drivers.league_driver_id')
            ->join('races', 'race_results.race_id', '=', 'races.id')
            ->join('rounds', 'races.round_id', '=', 'rounds.id')
            ->leftJoin('divisions', 'race_results.division_id', '=', 'divisions.id')
            ->select([
                'race_results.driver_id',
                'race_results.division_id',
                'race_results.original_race_time',
                'drivers.first_name',
                'drivers.last_name',
                'drivers.nickname',
                'league_drivers.driver_number',
                'divisions.name as division_name',
                'rounds.round_number',
                'rounds.name as round_name',
            ])
            ->orderBy(DB::raw('CAST(race_results.original_race_time AS CHAR)'))
            ->get();

        // Format as flat list with global positions
        $formattedResults = [];
        $position = 1;

        foreach ($results as $result) {
            $formattedResult = $this->formatRaceTimeResult($result, $position);

            // Include division information if divisions are enabled
            if ($hasDivisions) {
                $formattedResult['division_id'] = $result->division_id;
                $formattedResult['division_name'] = $result->division_name ?? 'No Division';
            }

            $formattedResults[] = $formattedResult;
            $position++;
        }

        return $formattedResults;
    }

    /**
     * Format driver name from database result.
     * Uses nickname if available, otherwise combines first/last name.
     *
     * @param object $result Database result with first_name, last_name, nickname
     * @return string
     */
    private function formatDriverName(object $result): string
    {
        if (!empty($result->nickname)) {
            return $result->nickname;
        }

        if (!empty($result->first_name) && !empty($result->last_name)) {
            return "{$result->first_name} {$result->last_name}";
        }

        return $result->first_name ?? $result->last_name ?? 'Unknown';
    }

    /**
     * Format a qualifying result.
     *
     * @param mixed $result The qualifying result from database
     * @return array<string, mixed>
     */
    private function formatQualifyingResult($result): array
    {
        return [
            'position' => $result->position,
            'driver_id' => $result->driver_id,
            'driver_name' => $this->formatDriverName($result),
            'driver_number' => $result->driver_number,
            'fastest_lap' => $result->fastest_lap,
            'has_pole' => (bool) $result->has_pole,
        ];
    }

    /**
     * Format a fastest lap result.
     *
     * @param mixed $result The fastest lap result from database
     * @param int $position The position in the fastest lap standings
     * @return array<string, mixed>
     */
    private function formatFastestLapResult($result, int $position): array
    {
        return [
            'position' => $position,
            'driver_id' => $result->driver_id,
            'driver_name' => $this->formatDriverName($result),
            'driver_number' => $result->driver_number,
            'fastest_lap' => $result->fastest_lap,
            'round_number' => $result->round_number,
            'round_name' => $result->round_name,
        ];
    }

    /**
     * Format a race time result.
     *
     * @param mixed $result The race time result from database
     * @param int $position The position in the race time standings
     * @return array<string, mixed>
     */
    private function formatRaceTimeResult($result, int $position): array
    {
        return [
            'position' => $position,
            'driver_id' => $result->driver_id,
            'driver_name' => $this->formatDriverName($result),
            'driver_number' => $result->driver_number,
            'race_time' => $result->original_race_time,
            'round_number' => $result->round_number,
            'round_name' => $result->round_name,
        ];
    }

    /**
     * Enrich cross-division aggregate results with driver information.
     * Takes the JSON stored results (position, race_result_id, time_ms) and enriches
     * them with driver_name, driver_number, division info, formatted time, and time_difference.
     *
     * @param array<int, array<string, mixed>> $results The raw JSON results from Round model
     * @param bool $hasDivisions Whether the season has divisions enabled
     * @return array<int, array<string, mixed>> Enriched results with driver info
     */
    private function enrichCrossDivisionResults(array $results, bool $hasDivisions): array
    {
        if (empty($results)) {
            return [];
        }

        // Extract all race_result_ids to fetch in a single query
        $raceResultIds = array_column($results, 'race_result_id');

        // Fetch all race results with driver and division info
        $raceResultsData = RaceResult::query()
            ->whereIn('race_results.id', $raceResultIds)
            ->join('drivers', 'race_results.driver_id', '=', 'drivers.id')
            ->join('league_drivers', 'drivers.id', '=', 'league_drivers.driver_id')
            ->join('season_drivers', 'league_drivers.id', '=', 'season_drivers.league_driver_id')
            ->leftJoin('divisions', 'race_results.division_id', '=', 'divisions.id')
            ->select([
                'race_results.id as race_result_id',
                'race_results.driver_id',
                'race_results.division_id',
                'drivers.first_name',
                'drivers.last_name',
                'drivers.nickname',
                'league_drivers.driver_number',
                'divisions.name as division_name',
            ])
            ->get()
            ->keyBy('race_result_id');

        // Get the fastest time (position 1) for calculating time differences
        $firstResult = $results[0];
        $fastestTimeMs = $firstResult['time_ms'] ?? null;

        // Enrich each result with driver information
        $enrichedResults = [];
        foreach ($results as $result) {
            $raceResultId = $result['race_result_id'];
            /** @var (RaceResult&object{race_result_id: int, driver_number: int|null, division_name: string|null, first_name: string, last_name: string, nickname: string|null})|null $driverData */
            $driverData = $raceResultsData->get($raceResultId);

            if (!$driverData) {
                // Skip if race result not found (shouldn't happen but be defensive)
                continue;
            }

            // Calculate time difference from position 1
            $timeDifference = null;
            $position = $result['position'] ?? 0;
            $timeMs = $result['time_ms'] ?? null;

            if ($position > 1 && $fastestTimeMs !== null && $timeMs !== null) {
                $diffMs = $timeMs - $fastestTimeMs;
                $timeDifference = $this->formatTimeDifference($diffMs);
            }

            $enriched = [
                'position' => $position,
                'race_result_id' => $raceResultId,
                'driver_id' => $driverData->driver_id,
                'driver_name' => $this->formatDriverName($driverData),
                'driver_number' => $driverData->driver_number,
                'time_ms' => $timeMs,
                'time_formatted' => $this->formatMillisecondsToTime($timeMs),
                'time_difference' => $timeDifference,
            ];

            // Include division information if divisions are enabled
            if ($hasDivisions) {
                $enriched['division_id'] = $driverData->division_id;
                $enriched['division_name'] = $driverData->division_name ?? 'No Division';
            }

            $enrichedResults[] = $enriched;
        }

        return $enrichedResults;
    }

    /**
     * Format milliseconds to readable time format.
     * Converts time in milliseconds to format like "1:25.123" or "25.123" for sub-minute times.
     *
     * @param int|null $milliseconds Time in milliseconds
     * @return string|null Formatted time string or null if input is null
     */
    private function formatMillisecondsToTime(?int $milliseconds): ?string
    {
        if ($milliseconds === null || $milliseconds <= 0) {
            return null;
        }

        $totalSeconds = (int) floor($milliseconds / 1000);
        $ms = $milliseconds % 1000;
        $minutes = (int) floor($totalSeconds / 60);
        $seconds = $totalSeconds % 60;

        if ($minutes > 0) {
            // Format: "M:SS.mmm" (e.g., "1:25.123")
            return sprintf('%d:%02d.%03d', $minutes, $seconds, $ms);
        }

        // Format: "SS.mmm" (e.g., "25.123")
        return sprintf('%d.%03d', $seconds, $ms);
    }

    /**
     * Format time difference in milliseconds to a human-readable string with '+' prefix.
     * Converts time difference to format like "+0.345" for sub-second gaps or "+1:23.456" for larger gaps.
     *
     * @param int $milliseconds Time difference in milliseconds
     * @return string Formatted time difference string with '+' prefix
     */
    private function formatTimeDifference(int $milliseconds): string
    {
        if ($milliseconds <= 0) {
            return '+0.000';
        }

        $totalSeconds = (int) floor($milliseconds / 1000);
        $ms = $milliseconds % 1000;
        $minutes = (int) floor($totalSeconds / 60);
        $seconds = $totalSeconds % 60;

        if ($minutes > 0) {
            // Format: "+M:SS.mmm" (e.g., "+1:23.456")
            return sprintf('+%d:%02d.%03d', $minutes, $seconds, $ms);
        }

        // Format: "+S.mmm" or "+SS.mmm" (e.g., "+0.345" or "+23.456")
        return sprintf('+%d.%03d', $seconds, $ms);
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

    /**
     * Get public race results for a race (no authentication required).
     * Returns null if race not found or belongs to a private league.
     *
     * @param int $raceId The race ID
     * @return PublicRaceResultsData|null
     */
    public function getPublicRaceResults(int $raceId): ?PublicRaceResultsData
    {
        // Find race with its round -> season -> competition -> league relationships
        // IMPORTANT: We must check visibility BEFORE returning cached data
        $race = Race::query()
            ->with(['round.season.competition.league:id,visibility'])
            ->find($raceId);

        if ($race === null) {
            return null;
        }

        // Load relationships - use getRelation() for PHPStan compatibility
        /** @var Round|null $round */
        $round = $race->getRelation('round');
        if ($round === null) {
            return null;
        }

        /** @var SeasonEloquent|null $season */
        $season = $round->getRelation('season');
        if ($season === null) {
            return null;
        }

        // Check if league is public or unlisted
        /** @var Competition|null $competition */
        $competition = $season->getRelation('competition');
        if ($competition === null) {
            return null;
        }

        /** @var EloquentLeague|null $league */
        $league = $competition->getRelation('league');
        if ($league === null || $league->visibility === LeagueVisibility::PRIVATE->value) {
            // If league is private but cache exists (visibility changed), invalidate cache
            if ($this->raceResultsCache->has($raceId)) {
                $this->raceResultsCache->forget($raceId);
            }
            return null;
        }

        // Now safe to check cache - we know the league is public/unlisted
        $cached = $this->raceResultsCache->get($raceId);
        if ($cached !== null) {
            return $cached;
        }

        $hasDivisions = $season->race_divisions_enabled ?? false;

        // Build race metadata
        $raceData = [
            'id' => $race->id,
            'race_number' => $race->race_number,
            'name' => $race->name,
            'race_type' => $race->race_type ?? 'custom',
            'status' => $race->status,
            'is_qualifier' => (bool) $race->is_qualifier,
            'race_points' => (bool) $race->race_points,
        ];

        // Fetch results with driver names
        $results = RaceResult::query()
            ->where('race_id', $raceId)
            ->join('drivers', 'race_results.driver_id', '=', 'drivers.id')
            ->join('league_drivers', 'drivers.id', '=', 'league_drivers.driver_id')
            ->join('season_drivers', 'league_drivers.id', '=', 'season_drivers.league_driver_id')
            ->leftJoin('divisions', 'race_results.division_id', '=', 'divisions.id')
            ->select([
                'race_results.position',
                'race_results.driver_id',
                'race_results.division_id',
                'race_results.original_race_time',
                'race_results.final_race_time_difference',
                'race_results.fastest_lap',
                'race_results.penalties',
                'race_results.race_points',
                'race_results.has_fastest_lap',
                'race_results.has_pole',
                'race_results.dnf',
                'race_results.status',
                'drivers.first_name',
                'drivers.last_name',
                'drivers.nickname',
                'league_drivers.driver_number',
                'divisions.name as division_name',
            ])
            ->orderBy('race_results.position')
            ->get();

        // Format results
        $formattedResults = [];

        if ($hasDivisions) {
            // Group by division
            $groupedResults = $results->groupBy('division_id');

            foreach ($groupedResults as $divisionId => $divisionResults) {
                $divisionName = $divisionResults->first()->division_name ?? 'No Division';

                $formattedResults[] = [
                    'division_id' => $divisionId,
                    'division_name' => $divisionName,
                    'results' => $divisionResults->map(function ($result) {
                        return $this->formatRaceResult($result);
                    })->values()->toArray(),
                ];
            }
        } else {
            // Flat list
            $formattedResults = $results->map(function ($result) {
                return $this->formatRaceResult($result);
            })->values()->toArray();
        }

        $data = new PublicRaceResultsData(
            race: $raceData,
            results: $formattedResults,
            has_divisions: $hasDivisions,
        );

        // Store in cache for next time
        $this->raceResultsCache->put($raceId, $data);

        return $data;
    }

    /**
     * Format a single race result.
     *
     * @param mixed $result The race result from database
     * @return array<string, mixed>
     */
    private function formatRaceResult($result): array
    {
        return [
            'position' => $result->position,
            'driver_id' => $result->driver_id,
            'driver_name' => $this->formatDriverName($result),
            'driver_number' => $result->driver_number,
            'race_time' => $result->original_race_time,
            'race_time_difference' => $result->final_race_time_difference,
            'fastest_lap' => $result->fastest_lap,
            'penalties' => $result->penalties,
            'race_points' => $result->race_points,
            'has_fastest_lap' => (bool) $result->has_fastest_lap,
            'has_pole' => (bool) $result->has_pole,
            'dnf' => (bool) $result->dnf,
            'status' => $result->status,
        ];
    }

    /**
     * Get the free tier league limit from config.
     */
    private function getFreeTierLimit(): int
    {
        return (int) config('league.free_tier_limit', 1);
    }

    /**
     * Invalidate all race results caches for a league.
     * This is called when league visibility changes to private.
     *
     * @param int $leagueId The league ID
     */
    private function invalidateLeagueRaceResultsCache(int $leagueId): void
    {
        // Get all race IDs for this league through the competition -> season -> round -> race hierarchy
        $raceIds = Race::query()
            ->join('rounds', 'races.round_id', '=', 'rounds.id')
            ->join('seasons', 'rounds.season_id', '=', 'seasons.id')
            ->join('competitions', 'seasons.competition_id', '=', 'competitions.id')
            ->where('competitions.league_id', $leagueId)
            ->pluck('races.id')
            ->toArray();

        // Invalidate cache for each race
        foreach ($raceIds as $raceId) {
            $this->raceResultsCache->forget($raceId);
        }
    }

    /**
     * Get public driver profile by season_driver_id (no authentication required).
     * Returns null if driver not found or belongs to a private league.
     * Results are cached for 1 hour.
     *
     * @param int $seasonDriverId The season driver ID
     * @return PublicDriverProfileData|null
     */
    public function getPublicDriverProfile(int $seasonDriverId): ?PublicDriverProfileData
    {
        // Cache key
        $cacheKey = "public_driver_profile_{$seasonDriverId}";

        // Check cache first
        return \Illuminate\Support\Facades\Cache::remember($cacheKey, 3600, function () use ($seasonDriverId) {
            // Find season_driver and get league_driver_id
            $seasonDriver = SeasonDriverEloquent::query()
                ->with([
                    'season.competition.league:id,visibility',
                    'leagueDriver.driver:id,nickname,first_name,last_name,psn_id,discord_id,iracing_id',
                    'leagueDriver:id,driver_id,driver_number',
                ])
                ->find($seasonDriverId);

            if ($seasonDriver === null) {
                return null;
            }

            // Use getRelation for PHPStan compatibility
            /** @var SeasonEloquent|null $season */
            $season = $seasonDriver->getRelation('season');
            if ($season === null) {
                return null;
            }

            /** @var Competition|null $competition */
            $competition = $season->getRelation('competition');
            if ($competition === null) {
                return null;
            }

            /** @var EloquentLeague|null $league */
            $league = $competition->getRelation('league');
            if ($league === null || $league->visibility === LeagueVisibility::PRIVATE->value) {
                return null;
            }

            // Get the actual driver
            /** @var LeagueDriverEloquent|null $leagueDriver */
            $leagueDriver = $seasonDriver->getRelation('leagueDriver');
            if ($leagueDriver === null) {
                return null;
            }

            /** @var Driver|null $driver */
            $driver = $leagueDriver->getRelation('driver');
            if ($driver === null) {
                return null;
            }

            // Get driver_id to query all their participations
            $driverId = $driver->id;

            // Build platform accounts array (only include non-null values)
            $platformAccounts = [];
            if ($driver->psn_id !== null) {
                $platformAccounts['psn_id'] = $driver->psn_id;
            }
            if ($driver->discord_id !== null) {
                $platformAccounts['discord_id'] = $driver->discord_id;
            }
            if ($driver->iracing_id !== null) {
                $platformAccounts['iracing_id'] = $driver->iracing_id;
            }

            // Get all season_drivers for this driver (via league_drivers)
            // IMPORTANT: The race_results.driver_id column is a foreign key to season_drivers.id (NOT drivers.id)
            // Schema: race_results.driver_id -> season_drivers.id -> league_drivers.id -> drivers.id
            // So we must query with season_driver IDs to get this driver's results across all seasons
            $allSeasonDriverIds = DB::table('season_drivers')
                ->join('league_drivers', 'season_drivers.league_driver_id', '=', 'league_drivers.id')
                ->where('league_drivers.driver_id', $driverId)  // Filter by drivers.id
                ->pluck('season_drivers.id')  // Get season_drivers.id values
                ->toArray();

            if (empty($allSeasonDriverIds)) {
                // Should never happen since we found one, but be defensive
                $allSeasonDriverIds = [$seasonDriverId];
            }

            // Calculate career stats (total poles and podiums)
            // CORRECT: Using season_driver IDs because race_results.driver_id -> season_drivers.id
            $totalPoles = RaceResult::query()
                ->whereIn('driver_id', $allSeasonDriverIds)
                ->where('has_pole', true)
                ->count();

            $totalPodiums = RaceResult::query()
                ->whereIn('driver_id', $allSeasonDriverIds)
                ->whereIn('position', [1, 2, 3])
                ->count();

            // Get all competitions/seasons this driver has participated in
            $competitions = DB::table('season_drivers')
                ->whereIn('season_drivers.id', $allSeasonDriverIds)
                ->join('seasons', 'season_drivers.season_id', '=', 'seasons.id')
                ->join('competitions', 'seasons.competition_id', '=', 'competitions.id')
                ->join('leagues', 'competitions.league_id', '=', 'leagues.id')
                ->select([
                    'leagues.name as league_name',
                    'leagues.slug as league_slug',
                    'seasons.name as season_name',
                    'seasons.slug as season_slug',
                    'season_drivers.status',
                ])
                ->orderBy('seasons.created_at', 'desc')
                ->get()
                ->map(function ($item) {
                    return [
                        'league_name' => $item->league_name,
                        'league_slug' => $item->league_slug,
                        'season_name' => $item->season_name,
                        'season_slug' => $item->season_slug,
                        'status' => $item->status,
                    ];
                })
                ->toArray();

            // Use nickname, or fallback to first/last name for display
            $nickname = $driver->nickname;
            if (empty($nickname)) {
                $nickname = trim(($driver->first_name ?? '') . ' ' . ($driver->last_name ?? ''));
                if (empty($nickname)) {
                    $nickname = 'Unknown Driver';
                }
            }

            return new PublicDriverProfileData(
                nickname: $nickname,
                driver_number: $leagueDriver->driver_number,
                platform_accounts: $platformAccounts,
                career_stats: [
                    'total_poles' => $totalPoles,
                    'total_podiums' => $totalPodiums,
                ],
                competitions: $competitions,
            );
        });
    }

    /**
     * Find and validate a public league by slug.
     * Returns array with eloquent model and entity, or null if not found or private.
     *
     * @param string $slug
     * @return array{eloquent: EloquentLeague, entity: League}|null
     */
    private function findPublicLeague(string $slug): ?array
    {
        // Find league by slug (using Eloquent to get timestamps and media)
        $eloquentLeague = EloquentLeague::where('slug', $slug)
            ->with('media')
            ->first();

        if ($eloquentLeague === null || $eloquentLeague->visibility === LeagueVisibility::PRIVATE->value) {
            return null;
        }

        // Convert to entity for business logic checks
        $league = $this->leagueRepository->findBySlug($slug);

        return [
            'eloquent' => $eloquentLeague,
            'entity' => $league,
        ];
    }

    /**
     * Fetch competitions with their seasons for a league.
     *
     * @param int $leagueId
     * @return \Illuminate\Support\Collection<int, mixed>
     */
    private function fetchCompetitionsWithSeasons(int $leagueId): \Illuminate\Support\Collection
    {
        /** @var \Illuminate\Database\Eloquent\Builder<Competition> $query */
        $query = Competition::query();

        return $query
            ->where('league_id', $leagueId)
            ->with(['platform:id,name,slug', 'seasons' => function ($query) {
                $query->withCount([
                    'seasonDrivers as total_drivers',
                    'seasonDrivers as active_drivers' => function ($q) {
                        $q->where('status', 'active');
                    },
                    'rounds as total_rounds',
                    'rounds as completed_rounds' => function ($q) {
                        $q->where('status', 'completed');
                    },
                ]);
            }])
            ->withCount([
                'seasons as total_seasons',
                'seasons as active_seasons' => function ($query) {
                    $query->where('status', 'active');
                },
            ])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Calculate league-wide statistics from competitions.
     *
     * @param \Illuminate\Support\Collection<int, mixed> $competitions
     * @return array{total_competitions: int, active_seasons: int, total_drivers: int}
     */
    private function calculateLeagueStats(\Illuminate\Support\Collection $competitions): array
    {
        $totalCompetitions = $competitions->count();
        $activeSeasons = 0;
        $totalDrivers = 0;

        foreach ($competitions as $competition) {
            $activeSeasons += $competition->active_seasons ?? 0;
        }

        // Count unique drivers across all seasons
        if ($totalCompetitions > 0) {
            $seasonIds = SeasonEloquent::query()
                ->whereIn('competition_id', $competitions->pluck('id'))
                ->pluck('id')
                ->toArray();

            if (!empty($seasonIds)) {
                $totalDrivers = SeasonDriverEloquent::query()
                    ->whereIn('season_id', $seasonIds)
                    ->distinct()
                    ->count('league_driver_id');
            }
        }

        return [
            'total_competitions' => $totalCompetitions,
            'active_seasons' => $activeSeasons,
            'total_drivers' => $totalDrivers,
        ];
    }

    /**
     * Map competitions collection to PublicCompetitionDetailData DTOs.
     *
     * @param \Illuminate\Support\Collection<int, mixed> $competitions
     * @return array<int, PublicCompetitionDetailData>
     */
    private function mapCompetitionsToDTOs(\Illuminate\Support\Collection $competitions): array
    {
        $competitionDTOs = [];

        foreach ($competitions as $competition) {
            // Get logo URL
            $logoUrl = null;
            if ($competition->logo_path) {
                $logoUrl = Storage::disk('public')->url($competition->logo_path);
            }

            // Map seasons to DTOs
            $seasonDTOs = [];
            foreach ($competition->seasons as $season) {
                $seasonDTOs[] = PublicSeasonSummaryData::from([
                    'id' => $season->id,
                    'name' => $season->name,
                    'slug' => $season->slug,
                    'car_class' => $season->car_class,
                    'status' => $season->status,
                    'stats' => [
                        'total_drivers' => $season->total_drivers ?? 0,
                        'active_drivers' => $season->active_drivers ?? 0,
                        'total_rounds' => $season->total_rounds ?? 0,
                        'completed_rounds' => $season->completed_rounds ?? 0,
                    ],
                ]);
            }

            $competitionDTOs[] = PublicCompetitionDetailData::from([
                'id' => $competition->id,
                'name' => $competition->name,
                'slug' => $competition->slug,
                'description' => $competition->description,
                'logo_url' => $logoUrl,
                'competition_colour' => $competition->competition_colour,
                'platform' => new \App\Application\Platform\DTOs\PlatformData(
                    id: $competition->platform->id,
                    name: $competition->platform->name,
                    slug: $competition->platform->slug,
                ),
                'stats' => [
                    'total_seasons' => $competition->total_seasons ?? 0,
                    'active_seasons' => $competition->active_seasons ?? 0,
                    'total_drivers' => $competition->total_drivers ?? 0,
                ],
                'seasons' => $seasonDTOs,
            ]);
        }

        return $competitionDTOs;
    }
}
