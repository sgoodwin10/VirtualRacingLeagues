<?php

declare(strict_types=1);

namespace App\Application\Competition\Services;

use App\Application\Competition\DTOs\CompetitionData;
use App\Application\Competition\DTOs\CompetitionSeasonData;
use App\Application\Competition\DTOs\CompetitionSeasonStatsData;
use App\Application\Competition\DTOs\CreateCompetitionData;
use App\Application\Competition\DTOs\UpdateCompetitionData;
use App\Application\Shared\Services\MediaServiceInterface;
use App\Domain\Competition\Entities\Competition;
use App\Domain\Competition\Exceptions\CompetitionNotFoundException;
use App\Domain\Competition\Repositories\CompetitionRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonRepositoryInterface;
use App\Domain\Competition\ValueObjects\CompetitionName;
use App\Domain\Competition\ValueObjects\CompetitionSlug;
use App\Domain\League\Exceptions\InvalidPlatformException;
use App\Domain\League\Exceptions\LeagueNotFoundException;
use App\Domain\League\Repositories\LeagueRepositoryInterface;
use App\Domain\Platform\Exceptions\PlatformNotFoundException;
use App\Domain\Platform\Repositories\PlatformRepositoryInterface;
use App\Domain\Shared\Exceptions\UnauthorizedException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Competition Application Service.
 * Orchestrates competition use cases and coordinates domain logic.
 *
 * Responsibilities:
 * - Transaction management
 * - Authorization checks
 * - DTO transformations
 * - Event dispatching
 * - File storage
 */
final class CompetitionApplicationService
{
    public function __construct(
        private readonly CompetitionRepositoryInterface $competitionRepository,
        private readonly LeagueRepositoryInterface $leagueRepository,
        private readonly PlatformRepositoryInterface $platformRepository,
        private readonly SeasonRepositoryInterface $seasonRepository,
        private readonly MediaServiceInterface $mediaService,
    ) {
    }

    /**
     * Create a new competition.
     *
     * @throws LeagueNotFoundException
     * @throws UnauthorizedException
     * @throws InvalidPlatformException
     */
    public function createCompetition(CreateCompetitionData $data, int $userId): CompetitionData
    {
        return DB::transaction(function () use ($data, $userId) {
            // 1. Validate league exists and user owns it
            $league = $this->leagueRepository->findById($data->league_id);
            if ($league->ownerUserId() !== $userId) {
                throw new UnauthorizedException('Only league owner can create competitions');
            }

            // 2. Validate platform exists and is in league's platforms
            $this->validatePlatformForLeague($data->platform_id, $league->platformIds());

            // 3. Generate unique slug from name
            $baseSlug = CompetitionSlug::fromName($data->name);
            $uniqueSlug = $this->generateUniqueSlug($baseSlug, $data->league_id);

            // 4. Handle logo upload if provided
            $logoPath = null;
            if ($data->logo) {
                $logoPath = $data->logo->store('competitions/logos', 'public');
                if (!$logoPath) {
                    throw new \RuntimeException('Failed to store competition logo');
                }
            }

            // 5. Create competition entity
            $competition = Competition::create(
                leagueId: $data->league_id,
                name: CompetitionName::from($data->name),
                slug: $uniqueSlug,
                platformId: $data->platform_id,
                createdByUserId: $userId,
                description: $data->description,
                logoPath: $logoPath,
                competitionColour: $data->competition_colour,
            );

            // 6. Save via repository
            $this->competitionRepository->save($competition);

            // 7. Upload media using new media service (dual-write during transition)
            if ($data->logo && $competition->id()) {
                $eloquentCompetition = $this->competitionRepository->getEloquentModel($competition->id());
                $this->mediaService->upload($data->logo, $eloquentCompetition, 'logo');
            }

            // 8. Record creation event and dispatch
            $competition->recordCreationEvent();
            $this->dispatchEvents($competition);

            // 9. Log activity
            $this->logActivity($competition, $userId, 'competition_created', [
                'name' => $data->name,
                'league_id' => $data->league_id,
                'platform_id' => $data->platform_id,
                'description' => $data->description,
            ]);

            // 10. Get stats and return CompetitionData DTO
            $stats = $this->competitionRepository->getStatsForEntity($competition);
            return $this->toCompetitionData($competition, $stats);
        });
    }

    /**
     * Update an existing competition.
     *
     * @throws CompetitionNotFoundException
     * @throws UnauthorizedException
     */
    public function updateCompetition(int $competitionId, UpdateCompetitionData $data, int $userId): CompetitionData
    {
        return DB::transaction(function () use ($competitionId, $data, $userId) {
            // 1. Find competition
            $competition = $this->competitionRepository->findById($competitionId);

            // 2. Authorize (league owner)
            $this->authorizeLeagueOwner($competition, $userId);

            // Track changes for activity logging
            $changes = [];

            // 3. Update name and description if provided
            if ($data->name !== null) {
                $newName = CompetitionName::from($data->name);

                // If name changes, update slug silently (without separate event)
                // The updateDetails() call will record a single event with both changes
                if (!$competition->name()->equals($newName)) {
                    $changes['name'] = [
                        'old' => $competition->name()->value(),
                        'new' => $newName->value(),
                    ];

                    // Capture old slug BEFORE updating it
                    $oldSlug = $competition->slug()->value();

                    $newSlug = $this->generateUniqueSlug(
                        CompetitionSlug::fromName($data->name),
                        $competition->leagueId(),
                        $competitionId
                    );
                    // Use silent update to avoid double event recording
                    $competition->updateSlugSilent($newSlug);

                    $changes['slug'] = [
                        'old' => $oldSlug,
                        'new' => $newSlug->value(),
                    ];
                }

                $competition->updateDetails($newName, $data->description ?? $competition->description());
            } elseif ($data->description !== null) {
                if ($competition->description() !== $data->description) {
                    $changes['description'] = [
                        'old' => $competition->description(),
                        'new' => $data->description,
                    ];
                }
                $competition->updateDetails($competition->name(), $data->description);
            }

            // 4. Update logo if provided (FIXED: Upload new logo FIRST, then delete old)
            $oldLogoPath = null;
            if ($data->logo) {
                // Store old logo path for cleanup after transaction
                $oldLogoPath = $competition->logoPath();

                // Upload new logo first
                $logoPath = $data->logo->store('competitions/logos', 'public');
                if (!$logoPath) {
                    throw new \RuntimeException('Failed to store competition logo');
                }

                $competition->updateLogo($logoPath);

                // Upload via media service (dual-write)
                if ($competition->id()) {
                    $eloquentCompetition = $this->competitionRepository->getEloquentModel($competition->id());
                    $this->mediaService->upload($data->logo, $eloquentCompetition, 'logo');
                }

                $changes['logo'] = [
                    'old' => $oldLogoPath,
                    'new' => $logoPath,
                ];
            }

            // 5. Update competition colour if provided
            if ($data->competition_colour !== null) {
                if ($competition->competitionColour() !== $data->competition_colour) {
                    $changes['competition_colour'] = [
                        'old' => $competition->competitionColour(),
                        'new' => $data->competition_colour,
                    ];
                }
                $competition->updateCompetitionColour($data->competition_colour);
            }

            // 6. Save
            $this->competitionRepository->update($competition);
            $this->dispatchEvents($competition);

            // 7. Delete old logo after transaction commits successfully (FIXED: Race condition)
            if ($oldLogoPath) {
                DB::afterCommit(function () use ($oldLogoPath) {
                    try {
                        Storage::disk('public')->delete($oldLogoPath);
                    } catch (\Exception $e) {
                        Log::warning('Failed to delete old competition logo', [
                            'logo_path' => $oldLogoPath,
                            'error' => $e->getMessage(),
                        ]);
                    }
                });
            }

            // 8. Log activity if changes were made
            if (!empty($changes)) {
                $this->logActivity($competition, $userId, 'competition_updated', ['changes' => $changes]);
            }

            // 9. Get stats and return DTO
            $stats = $this->competitionRepository->getStatsForEntity($competition);
            return $this->toCompetitionData($competition, $stats);
        });
    }

    /**
     * Get competition by ID.
     *
     * @throws CompetitionNotFoundException
     */
    public function getCompetitionById(int $id): CompetitionData
    {
        $competition = $this->competitionRepository->findById($id);
        $stats = $this->competitionRepository->getStatsForEntity($competition);

        return $this->toCompetitionData($competition, $stats);
    }

    /**
     * Get competition by slug and league ID.
     *
     * @throws CompetitionNotFoundException
     */
    public function getCompetitionBySlug(string $slug, int $leagueId): CompetitionData
    {
        $competition = $this->competitionRepository->findBySlug($slug, $leagueId);
        $stats = $this->competitionRepository->getStatsForEntity($competition);

        return $this->toCompetitionData($competition, $stats);
    }

    /**
     * Get all competitions for a league.
     *
     * @return array<CompetitionData>
     */
    public function getLeagueCompetitions(int $leagueId): array
    {
        $competitions = $this->competitionRepository->findByLeagueId($leagueId);
        $statsMap = $this->competitionRepository->getStatsForEntities($competitions);

        // Optimize: Fetch league once (all competitions have same league)
        $league = $this->leagueRepository->findById($leagueId);

        // Optimize: Batch fetch platforms for all competitions
        $platformIds = array_unique(array_map(
            fn(Competition $c) => $c->platformId(),
            $competitions
        ));
        $platformsMap = $this->platformRepository->findByIds($platformIds);

        // Optimize: Batch fetch seasons for all competitions
        $seasonsDataMap = $this->batchGetSeasonsForCompetitions(
            array_filter(array_map(fn(Competition $c) => $c->id(), $competitions))
        );

        return array_map(
            function (Competition $competition) use ($statsMap, $league, $platformsMap, $seasonsDataMap) {
                $stats = $statsMap[$competition->id() ?? 0] ?? [];
                return $this->toCompetitionDataOptimized(
                    $competition,
                    $stats,
                    $league,
                    $platformsMap[$competition->platformId()] ?? null,
                    $seasonsDataMap[$competition->id() ?? 0] ?? []
                );
            },
            $competitions
        );
    }

    /**
     * Archive a competition.
     *
     * @throws CompetitionNotFoundException
     * @throws UnauthorizedException
     */
    public function archiveCompetition(int $id, int $userId): void
    {
        DB::transaction(function () use ($id, $userId) {
            $competition = $this->competitionRepository->findById($id);
            $this->authorizeLeagueOwner($competition, $userId);

            $competition->archive();
            $this->competitionRepository->update($competition);
            $this->dispatchEvents($competition);

            // Log activity
            $this->logActivity($competition, $userId, 'competition_archived', [
                'name' => $competition->name()->value(),
                'league_id' => $competition->leagueId(),
            ]);
        });
    }

    /**
     * Delete a competition (hard delete - permanent deletion).
     *
     * @throws CompetitionNotFoundException
     * @throws UnauthorizedException
     */
    public function deleteCompetition(int $id, int $userId): void
    {
        DB::transaction(function () use ($id, $userId) {
            $competition = $this->competitionRepository->findById($id);
            $this->authorizeLeagueOwner($competition, $userId);

            // Log activity before deletion (must happen before entity is deleted)
            $this->logActivity($competition, $userId, 'competition_deleted', [
                'name' => $competition->name()->value(),
                'league_id' => $competition->leagueId(),
                'slug' => $competition->slug()->value(),
            ]);

            $competition->delete();
            $this->competitionRepository->delete($competition);
            $this->dispatchEvents($competition);
        });
    }

    /**
     * Check if a slug is available for a competition name.
     *
     * @return array{available: bool, slug: string, suggestion: string|null}
     */
    public function checkSlugAvailability(string $name, int $leagueId, ?int $excludeId = null): array
    {
        $baseSlug = CompetitionSlug::fromName($name);
        $isAvailable = $this->competitionRepository->isSlugAvailable(
            $baseSlug->value(),
            $leagueId,
            $excludeId
        );

        $suggestion = null;
        if (!$isAvailable) {
            $uniqueSlug = $this->generateUniqueSlug($baseSlug, $leagueId, $excludeId);
            $suggestion = $uniqueSlug->value();
        }

        return [
            'available' => $isAvailable,
            'slug' => $baseSlug->value(),
            'suggestion' => $suggestion,
        ];
    }

    /**
     * Generate a unique slug for the league.
     */
    private function generateUniqueSlug(
        CompetitionSlug $baseSlug,
        int $leagueId,
        ?int $excludeId = null
    ): CompetitionSlug {
        $maxAttempts = 100;
        $slug = $baseSlug->value();
        $counter = 1;

        while (!$this->competitionRepository->isSlugAvailable($slug, $leagueId, $excludeId)) {
            if ($counter >= $maxAttempts) {
                throw new \RuntimeException(
                    "Unable to generate unique slug after {$maxAttempts} attempts for base slug: {$baseSlug->value()}"
                );
            }
            $slug = $baseSlug->value() . '-' . $counter;
            $counter++;
        }

        return CompetitionSlug::from($slug);
    }

    /**
     * Validate platform exists and belongs to league.
     *
     * @param array<int> $leaguePlatformIds
     * @throws InvalidPlatformException
     */
    private function validatePlatformForLeague(int $platformId, array $leaguePlatformIds): void
    {
        // Check platform exists using repository
        if (!$this->platformRepository->exists($platformId)) {
            throw InvalidPlatformException::notFound($platformId);
        }

        // Check platform is in league's platforms
        if (!in_array($platformId, $leaguePlatformIds, true)) {
            throw InvalidPlatformException::notInLeague($platformId);
        }
    }

    /**
     * Authorize that the user owns the competition's league.
     *
     * @throws UnauthorizedException
     */
    private function authorizeLeagueOwner(Competition $competition, int $userId): void
    {
        $league = $this->leagueRepository->findById($competition->leagueId());

        if ($league->ownerUserId() !== $userId) {
            throw new UnauthorizedException('Only league owner can manage competitions');
        }
    }

    /**
     * Dispatch all domain events from the competition.
     */
    private function dispatchEvents(Competition $competition): void
    {
        $events = $competition->releaseEvents();

        foreach ($events as $event) {
            Event::dispatch($event);
        }
    }

    /**
     * Convert Competition entity to CompetitionData DTO.
     *
     * @param array<string, int|string|null> $aggregates
     */
    private function toCompetitionData(Competition $competition, array $aggregates = []): CompetitionData
    {
        // Fetch league for additional data (name, slug, logo)
        $league = $this->leagueRepository->findById($competition->leagueId());

        $leagueData = [
            'id' => $league->id() ?? 0,
            'name' => $league->name()->value(),
            'slug' => $league->slug()->value(),
        ];

        // Get platform data using repository
        $platformData = $this->platformRepository->findById($competition->platformId());

        // Resolve logo URL with fallback to league logo
        $logoUrl = $this->resolveLogoUrl($competition, $league->logoPath());

        // Get seasons with stats for this competition
        $seasonsData = $this->getSeasonsForCompetition($competition->id() ?? 0);

        // Get eloquent model for media extraction
        $eloquentModel = null;
        if ($competition->id()) {
            $eloquentModel = $this->getEloquentModelSafely($competition->id());
        }

        // Return DTO
        return CompetitionData::fromEntity(
            competition: $competition,
            platformData: $platformData,
            logoUrl: $logoUrl,
            leagueData: $leagueData,
            aggregates: $aggregates,
            seasons: $seasonsData,
            eloquentModel: $eloquentModel,
        );
    }

    /**
     * Get seasons with stats for a competition.
     *
     * @return array<CompetitionSeasonData>
     */
    private function getSeasonsForCompetition(int $competitionId): array
    {
        if ($competitionId === 0) {
            return [];
        }

        $seasonsWithStats = $this->seasonRepository->getSeasonsWithStatsForCompetition($competitionId);

        return array_map(
            function (array $item): CompetitionSeasonData {
                $season = $item['season'];
                $stats = $item['stats'];

                return new CompetitionSeasonData(
                    id: $season->id() ?? 0,
                    name: $season->name()->value(),
                    slug: $season->slug()->value(),
                    status: $season->status()->value,
                    is_active: $season->isActive(),
                    is_archived: $season->isArchived(),
                    created_at: $season->createdAt()->format('Y-m-d H:i:s'),
                    stats: new CompetitionSeasonStatsData(
                        driver_count: $stats['driver_count'],
                        round_count: $stats['round_count'],
                        race_count: $stats['race_count'],
                    ),
                );
            },
            $seasonsWithStats
        );
    }

    /**
     * Resolve logo URL with fallback to league logo.
     * Returns null if neither competition nor league has a logo.
     */
    private function resolveLogoUrl(Competition $competition, ?string $leagueLogoPath): ?string
    {
        if ($competition->logoPath()) {
            return Storage::disk('public')->url($competition->logoPath());
        }

        // Fallback to league logo if it exists
        if ($leagueLogoPath) {
            return Storage::disk('public')->url($leagueLogoPath);
        }

        return null;
    }

    /**
     * Batch fetch seasons for multiple competitions.
     *
     * @param array<int> $competitionIds
     * @return array<int, array<CompetitionSeasonData>>
     */
    private function batchGetSeasonsForCompetitions(array $competitionIds): array
    {
        if (empty($competitionIds)) {
            return [];
        }

        // Use the batch repository method to avoid N+1 queries
        $seasonsWithStatsByCompetition = $this->seasonRepository
            ->getBatchSeasonsWithStatsForCompetitions($competitionIds);

        // Map to CompetitionSeasonData DTOs
        $result = [];
        foreach ($seasonsWithStatsByCompetition as $competitionId => $seasonsWithStats) {
            $result[$competitionId] = array_map(
                function (array $item): CompetitionSeasonData {
                    $season = $item['season'];
                    $stats = $item['stats'];

                    return new CompetitionSeasonData(
                        id: $season->id() ?? 0,
                        name: $season->name()->value(),
                        slug: $season->slug()->value(),
                        status: $season->status()->value,
                        is_active: $season->isActive(),
                        is_archived: $season->isArchived(),
                        created_at: $season->createdAt()->format('Y-m-d H:i:s'),
                        stats: new CompetitionSeasonStatsData(
                            driver_count: $stats['driver_count'],
                            round_count: $stats['round_count'],
                            race_count: $stats['race_count'],
                        ),
                    );
                },
                $seasonsWithStats
            );
        }

        return $result;
    }

    /**
     * Optimized version of toCompetitionData that accepts pre-fetched data.
     *
     * @param array<string, int|string|null> $aggregates
     * @param array{id: int, name: string, slug: string}|null $platformData
     * @param array<CompetitionSeasonData> $seasonsData
     */
    private function toCompetitionDataOptimized(
        Competition $competition,
        array $aggregates,
        \App\Domain\League\Entities\League $league,
        ?array $platformData,
        array $seasonsData
    ): CompetitionData {
        // Handle missing platform data
        if ($platformData === null) {
            $platformData = $this->platformRepository->findById($competition->platformId());
        }

        $leagueData = [
            'id' => $league->id() ?? 0,
            'name' => $league->name()->value(),
            'slug' => $league->slug()->value(),
        ];

        // Resolve logo URL with fallback to league logo
        $logoUrl = $this->resolveLogoUrl($competition, $league->logoPath());

        // Get eloquent model for media extraction
        $eloquentModel = null;
        if ($competition->id()) {
            $eloquentModel = $this->getEloquentModelSafely($competition->id());
        }

        // Return DTO
        return CompetitionData::fromEntity(
            competition: $competition,
            platformData: $platformData,
            logoUrl: $logoUrl,
            leagueData: $leagueData,
            aggregates: $aggregates,
            seasons: $seasonsData,
            eloquentModel: $eloquentModel,
        );
    }

    /**
     * Safely get eloquent model with error logging.
     *
     * @return \App\Infrastructure\Persistence\Eloquent\Models\Competition|null
     */
    private function getEloquentModelSafely(
        int $competitionId
    ): ?\App\Infrastructure\Persistence\Eloquent\Models\Competition {
        try {
            return $this->competitionRepository->getEloquentModel($competitionId);
        } catch (\Exception $e) {
            Log::warning('Failed to load eloquent model for competition', [
                'competition_id' => $competitionId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Log activity for a competition.
     *
     * @param array<string, mixed> $properties
     */
    private function logActivity(Competition $competition, int $userId, string $logName, array $properties = []): void
    {
        if (!$competition->id()) {
            return;
        }

        $eloquentCompetition = $this->getEloquentModelSafely($competition->id());
        if (!$eloquentCompetition) {
            Log::warning('Cannot log activity: eloquent model not found', [
                'competition_id' => $competition->id(),
                'log_name' => $logName,
            ]);
            return;
        }

        activity()
            ->performedOn($eloquentCompetition)
            ->causedBy($userId)
            ->withProperties($properties)
            ->log($logName);
    }
}
