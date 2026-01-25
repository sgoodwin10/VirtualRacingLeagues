<?php

declare(strict_types=1);

namespace App\Application\Competition\Services;

use App\Application\Competition\DTOs\CreateSeasonData;
use App\Application\Competition\DTOs\PlatformData;
use App\Application\Competition\DTOs\SeasonCompetitionData;
use App\Application\Competition\DTOs\SeasonData;
use App\Application\Competition\DTOs\SeasonLeagueData;
use App\Application\Competition\DTOs\UpdateSeasonData;
use App\Application\Competition\Traits\BatchFetchHelpersTrait;
use App\Application\Shared\Services\MediaServiceInterface;
use App\Domain\Competition\Entities\Season;
use App\Domain\Competition\Exceptions\CompetitionNotFoundException;
use App\Domain\Competition\Exceptions\SeasonNotFoundException;
use App\Domain\Competition\Repositories\CompetitionRepositoryInterface;
use App\Domain\Competition\Repositories\RaceRepositoryInterface;
use App\Domain\Competition\Repositories\RaceResultRepositoryInterface;
use App\Domain\Competition\Repositories\RoundRepositoryInterface;
use App\Domain\Competition\Repositories\RoundTiebreakerRuleRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonDriverRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonRepositoryInterface;
use App\Domain\Competition\ValueObjects\SeasonName;
use App\Domain\Competition\ValueObjects\SeasonSlug;
use App\Domain\Competition\ValueObjects\TiebreakerRuleConfiguration;
use App\Domain\Competition\ValueObjects\TiebreakerRuleReference;
use App\Domain\Division\Repositories\DivisionRepositoryInterface;
use App\Domain\League\Repositories\LeagueRepositoryInterface;
use App\Domain\Platform\Repositories\PlatformRepositoryInterface;
use App\Domain\Shared\Exceptions\UnauthorizedException;
use App\Domain\Team\Repositories\TeamRepositoryInterface;
use App\Infrastructure\Cache\RaceResultsCacheService;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentSeasonRepository;
use Exception;
use Illuminate\Database\QueryException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

/**
 * Season Application Service.
 * Orchestrates season use cases and coordinates domain logic.
 *
 * Responsibilities:
 * - Transaction management
 * - Authorization checks
 * - DTO transformations
 * - Event dispatching
 * - File storage (logos, banners)
 */
final class SeasonApplicationService
{
    use BatchFetchHelpersTrait;

    public function __construct(
        private readonly SeasonRepositoryInterface $seasonRepository,
        private readonly SeasonDriverRepositoryInterface $seasonDriverRepository,
        private readonly CompetitionRepositoryInterface $competitionRepository,
        private readonly LeagueRepositoryInterface $leagueRepository,
        private readonly PlatformRepositoryInterface $platformRepository,
        private readonly DivisionRepositoryInterface $divisionRepository,
        private readonly TeamRepositoryInterface $teamRepository,
        private readonly RoundRepositoryInterface $roundRepository,
        private readonly RaceRepositoryInterface $raceRepository,
        private readonly RaceResultRepositoryInterface $raceResultRepository,
        private readonly RaceResultsCacheService $raceResultsCacheService,
        private readonly MediaServiceInterface $mediaService,
        private readonly RoundTiebreakerRuleRepositoryInterface $tiebreakerRuleRepository,
    ) {}

    /**
     * Create a new season.
     *
     * @throws CompetitionNotFoundException
     * @throws UnauthorizedException
     */
    public function createSeason(CreateSeasonData $data, int $userId): SeasonData
    {
        $logoPath = null;
        $bannerPath = null;

        try {
            return $this->executeWithRetry(function () use ($data, $userId, &$logoPath, &$bannerPath) {
                return DB::transaction(function () use ($data, $userId, &$logoPath, &$bannerPath) {
                    // 1. Validate competition exists
                    $competition = $this->competitionRepository->findById($data->competition_id);

                    // 2. Authorize (league owner)
                    $this->authorizeLeagueOwner($competition, $userId);

                    // 3. Generate unique slug
                    $slug = $data->slug
                        ? SeasonSlug::from($data->slug)
                        : SeasonSlug::fromName($data->name);

                    $uniqueSlug = $this->seasonRepository->generateUniqueSlug(
                        $slug->value(),
                        $data->competition_id
                    );

                    // 4. Handle logo upload
                    if ($data->logo) {
                        $logoPath = $this->storeSeasonImage($data->logo, 'logo', null);
                    }

                    // 5. Handle banner upload
                    if ($data->banner) {
                        $bannerPath = $this->storeSeasonImage($data->banner, 'banner', null);
                    }

                    // 6. Create season entity
                    $season = Season::create(
                        competitionId: $data->competition_id,
                        name: SeasonName::from($data->name),
                        slug: SeasonSlug::from($uniqueSlug),
                        createdByUserId: $userId,
                        carClass: $data->car_class,
                        description: $data->description,
                        technicalSpecs: $data->technical_specs,
                        logoPath: $logoPath,
                        bannerPath: $bannerPath,
                        teamChampionshipEnabled: $data->team_championship_enabled,
                        teamsDriversForCalculation: $data->teams_drivers_for_calculation,
                        teamsDropRounds: $data->teams_drop_rounds,
                        teamsTotalDropRounds: $data->teams_total_drop_rounds,
                        raceDivisionsEnabled: $data->race_divisions_enabled,
                        raceTimesRequired: $data->race_times_required,
                        dropRound: $data->drop_round,
                        totalDropRounds: $data->total_drop_rounds,
                    );

                    // 7. Save via repository
                    $this->seasonRepository->save($season);

                    // 7b. Copy default tiebreaker rules if enabled
                    if ($data->round_totals_tiebreaker_rules_enabled) {
                        $this->copyDefaultTiebreakerRules($season);
                    }

                    // 8. Upload media using new media service (dual-write during transition)
                    if ($season->id() && $this->seasonRepository instanceof EloquentSeasonRepository) {
                        $eloquentSeason = $this->seasonRepository->getEloquentModel($season->id());
                        if ($data->logo) {
                            $this->mediaService->upload($data->logo, $eloquentSeason, 'logo');
                        }
                        if ($data->banner) {
                            $this->mediaService->upload($data->banner, $eloquentSeason, 'banner');
                        }
                    }

                    // 9. Record creation event and dispatch
                    $league = $this->leagueRepository->findById($competition->leagueId());
                    $season->recordCreationEvent($league->id() ?? 0);
                    $this->dispatchEvents($season);

                    // 10. Return SeasonData DTO
                    return $this->toSeasonData($season, $competition->logoPath());
                });
            });
        } catch (Throwable $e) {
            // Cleanup uploaded files on failure
            // Wrap cleanup in try-catch to prevent cleanup failures from masking the original exception
            if ($logoPath) {
                try {
                    $this->deleteSeasonImage($logoPath);
                } catch (Throwable $cleanupException) {
                    // Log cleanup failure but don't throw - preserve original exception
                    Log::warning('Failed to cleanup season logo during error handling', [
                        'logo_path' => $logoPath,
                        'cleanup_error' => $cleanupException->getMessage(),
                        'original_error' => $e->getMessage(),
                    ]);
                }
            }
            if ($bannerPath) {
                try {
                    $this->deleteSeasonImage($bannerPath);
                } catch (Throwable $cleanupException) {
                    // Log cleanup failure but don't throw - preserve original exception
                    Log::warning('Failed to cleanup season banner during error handling', [
                        'banner_path' => $bannerPath,
                        'cleanup_error' => $cleanupException->getMessage(),
                        'original_error' => $e->getMessage(),
                    ]);
                }
            }
            throw $e;
        }
    }

    /**
     * Update an existing season.
     *
     * @throws SeasonNotFoundException
     * @throws UnauthorizedException
     */
    public function updateSeason(int $id, UpdateSeasonData $data, int $userId, array $requestData = []): SeasonData
    {
        return DB::transaction(function () use ($id, $data, $userId, $requestData) {
            // 1. Find season
            $season = $this->seasonRepository->findById($id);

            // 2. Find competition for authorization
            $competition = $this->competitionRepository->findById($season->competitionId());

            // 3. Authorize (league owner)
            $this->authorizeLeagueOwner($competition, $userId);

            // 4. Update details
            $season->updateDetails(
                SeasonName::from($data->name),
                $data->car_class,
                $data->description,
                $data->technical_specs
            );

            // 5. Handle team championship toggle
            if ($data->team_championship_enabled !== null) {
                if ($data->team_championship_enabled) {
                    $season->enableTeamChampionship();
                } else {
                    $season->disableTeamChampionship();
                }
            }

            // 5b. Handle race divisions toggle
            if ($data->race_divisions_enabled !== null) {
                if ($data->race_divisions_enabled) {
                    $season->enableRaceDivisions();
                } else {
                    $season->disableRaceDivisions();
                }
            }

            // 5c. Handle race times required toggle
            if ($data->race_times_required !== null) {
                if ($data->race_times_required) {
                    $season->enableRaceTimes();
                } else {
                    $season->disableRaceTimes();
                }
            }

            // 5d. Handle drop round toggle
            if ($data->drop_round !== null) {
                if ($data->drop_round) {
                    $season->enableDropRound();
                } else {
                    $season->disableDropRound();
                }
            }

            // 5e. Handle total drop rounds update
            if ($data->total_drop_rounds !== null) {
                $season->updateTotalDropRounds($data->total_drop_rounds);
            }

            // 5f. Handle teams drivers for calculation update
            // Check if field was present in request (not just non-null)
            // This allows us to distinguish between "not provided" and "provided as null"
            if (array_key_exists('teams_drivers_for_calculation', $requestData)) {
                $season->updateTeamsDriversForCalculation($data->teams_drivers_for_calculation);
            }

            // 5g. Handle teams drop rounds toggle
            if ($data->teams_drop_rounds !== null) {
                if ($data->teams_drop_rounds) {
                    $season->enableTeamsDropRounds();
                } else {
                    $season->disableTeamsDropRounds();
                }
            }

            // 5h. Handle teams total drop rounds update
            if ($data->teams_total_drop_rounds !== null) {
                $season->updateTeamsTotalDropRounds($data->teams_total_drop_rounds);
            }

            // 5i. Handle tiebreaker rules toggle
            if ($data->round_totals_tiebreaker_rules_enabled !== null) {
                $currentlyEnabled = $season->hasTiebreakerRulesEnabled();
                $shouldEnable = $data->round_totals_tiebreaker_rules_enabled;

                if ($shouldEnable && ! $currentlyEnabled) {
                    // Enabling tiebreaker rules - copy default rules
                    $this->copyDefaultTiebreakerRules($season);
                } elseif (! $shouldEnable && $currentlyEnabled) {
                    // Disabling tiebreaker rules
                    $season->disableTiebreakerRules();
                }
            }

            // 6. Handle logo updates
            if ($data->remove_logo) {
                $this->deleteSeasonImage($season->logoPath());
                $season->updateBranding(null, $season->bannerPath());
            } elseif ($data->logo) {
                $this->deleteSeasonImage($season->logoPath());
                $logoPath = $this->storeSeasonImage($data->logo, 'logo', $season->id());
                $season->updateBranding($logoPath, $season->bannerPath());

                // Upload via media service (dual-write)
                if ($season->id() && $this->seasonRepository instanceof EloquentSeasonRepository) {
                    $eloquentSeason = $this->seasonRepository->getEloquentModel($season->id());
                    $this->mediaService->upload($data->logo, $eloquentSeason, 'logo');
                }
            }

            // 7. Handle banner updates
            if ($data->remove_banner) {
                $this->deleteSeasonImage($season->bannerPath());
                $season->updateBranding($season->logoPath(), null);
            } elseif ($data->banner) {
                $this->deleteSeasonImage($season->bannerPath());
                $bannerPath = $this->storeSeasonImage($data->banner, 'banner', $season->id());
                $season->updateBranding($season->logoPath(), $bannerPath);

                // Upload via media service (dual-write)
                if ($season->id() && $this->seasonRepository instanceof EloquentSeasonRepository) {
                    $eloquentSeason = $this->seasonRepository->getEloquentModel($season->id());
                    $this->mediaService->upload($data->banner, $eloquentSeason, 'banner');
                }
            }

            // 8. Save
            $this->seasonRepository->save($season);
            $this->dispatchEvents($season);

            // 9. Return DTO
            return $this->toSeasonData($season, $competition->logoPath());
        });
    }

    /**
     * Get season by ID.
     *
     * @throws SeasonNotFoundException
     */
    public function getSeason(int $id): SeasonData
    {
        $season = $this->seasonRepository->findById($id);
        $competition = $this->competitionRepository->findById($season->competitionId());

        return $this->toSeasonData($season, $competition->logoPath());
    }

    /**
     * Get all seasons for a competition.
     *
     * @return array<SeasonData>
     */
    public function getSeasonsByCompetition(int $competitionId): array
    {
        $seasons = $this->seasonRepository->findByCompetition($competitionId);
        $competition = $this->competitionRepository->findById($competitionId);

        return array_map(
            fn (Season $season) => $this->toSeasonData($season, $competition->logoPath()),
            $seasons
        );
    }

    /**
     * Delete a season permanently with cascade deletion.
     * Deletes all related data: race results, races, rounds, season drivers, and the season itself.
     *
     * @throws SeasonNotFoundException
     * @throws UnauthorizedException
     */
    public function deleteSeason(int $id, int $userId): void
    {
        // Collect race IDs for cache invalidation before transaction
        $raceIdsToInvalidate = [];

        DB::transaction(function () use ($id, $userId, &$raceIdsToInvalidate) {
            $season = $this->seasonRepository->findById($id);
            $competition = $this->competitionRepository->findById($season->competitionId());

            $this->authorizeLeagueOwner($competition, $userId);

            // 1. Delete uploaded images before deleting the season
            $this->deleteSeasonImage($season->logoPath());
            $this->deleteSeasonImage($season->bannerPath());

            // 2. Get all rounds for this season (including soft-deleted ones)
            $rounds = $this->roundRepository->findBySeasonId($id);

            // 3. For each round, cascade delete races and race results
            foreach ($rounds as $round) {
                if ($round->id() === null) {
                    continue;
                }

                // Get all races for this round using repository
                $races = $this->raceRepository->findAllByRoundId($round->id());

                foreach ($races as $race) {
                    if ($race->id() === null) {
                        continue;
                    }

                    // Collect race ID for cache invalidation
                    $raceIdsToInvalidate[] = $race->id();

                    // Delete all race results for this race using repository
                    $this->raceResultRepository->deleteByRaceId($race->id());

                    // Delete the race itself using repository
                    $this->raceRepository->delete($race);
                }

                // Delete the round using repository
                $this->roundRepository->delete($round);
            }

            // 4. Delete all season drivers
            $this->seasonDriverRepository->deleteAllForSeason($id);

            // 5. Delete the season using repository (which handles force delete)
            $this->seasonRepository->forceDelete($id);

            // 6. Record and dispatch deletion event
            $season->delete();
            $this->dispatchEvents($season);
        });

        // Invalidate race results caches AFTER transaction commits
        foreach ($raceIdsToInvalidate as $raceId) {
            $this->raceResultsCacheService->forget($raceId);
        }
    }

    /**
     * Archive a season.
     *
     * @throws SeasonNotFoundException
     * @throws UnauthorizedException
     */
    public function archiveSeason(int $id, int $userId): SeasonData
    {
        return DB::transaction(function () use ($id, $userId) {
            $season = $this->seasonRepository->findById($id);
            $competition = $this->competitionRepository->findById($season->competitionId());

            $this->authorizeLeagueOwner($competition, $userId);

            $season->archive();
            $this->seasonRepository->save($season);
            $this->dispatchEvents($season);

            return $this->toSeasonData($season, $competition->logoPath());
        });
    }

    /**
     * Activate a season.
     *
     * @throws SeasonNotFoundException
     * @throws UnauthorizedException
     */
    public function activateSeason(int $id, int $userId): SeasonData
    {
        return DB::transaction(function () use ($id, $userId) {
            $season = $this->seasonRepository->findById($id);
            $competition = $this->competitionRepository->findById($season->competitionId());

            $this->authorizeLeagueOwner($competition, $userId);

            $season->activate();
            $this->seasonRepository->save($season);
            $this->dispatchEvents($season);

            return $this->toSeasonData($season, $competition->logoPath());
        });
    }

    /**
     * Complete a season.
     *
     * @throws SeasonNotFoundException
     * @throws UnauthorizedException
     */
    public function completeSeason(int $id, int $userId): SeasonData
    {
        return DB::transaction(function () use ($id, $userId) {
            $season = $this->seasonRepository->findById($id);
            $competition = $this->competitionRepository->findById($season->competitionId());

            $this->authorizeLeagueOwner($competition, $userId);

            $season->complete();
            $this->seasonRepository->save($season);
            $this->dispatchEvents($season);

            return $this->toSeasonData($season, $competition->logoPath());
        });
    }

    /**
     * Reactivate a completed season (change status from completed back to active).
     *
     * @throws SeasonNotFoundException
     * @throws UnauthorizedException
     * @throws \InvalidArgumentException if season is not in completed status
     */
    public function reactivateSeason(int $id, int $userId): SeasonData
    {
        return DB::transaction(function () use ($id, $userId) {
            $season = $this->seasonRepository->findById($id);
            $competition = $this->competitionRepository->findById($season->competitionId());

            $this->authorizeLeagueOwner($competition, $userId);

            $season->reactivate();
            $this->seasonRepository->save($season);
            $this->dispatchEvents($season);

            return $this->toSeasonData($season, $competition->logoPath());
        });
    }

    /**
     * Unarchive a season (restore from archived status).
     *
     * @throws SeasonNotFoundException
     * @throws UnauthorizedException
     */
    public function unarchiveSeason(int $id, int $userId): SeasonData
    {
        return DB::transaction(function () use ($id, $userId) {
            $season = $this->seasonRepository->findById($id);
            $competition = $this->competitionRepository->findById($season->competitionId());

            $this->authorizeLeagueOwner($competition, $userId);

            $season->restore();
            $this->seasonRepository->save($season);
            $this->dispatchEvents($season);

            return $this->toSeasonData($season, $competition->logoPath());
        });
    }

    /**
     * Restore a soft-deleted season.
     *
     * @throws SeasonNotFoundException
     * @throws UnauthorizedException
     */
    public function restoreSeason(int $id, int $userId): SeasonData
    {
        return DB::transaction(function () use ($id, $userId) {
            $season = $this->seasonRepository->findByIdWithTrashed($id);
            $competition = $this->competitionRepository->findById($season->competitionId());

            $this->authorizeLeagueOwner($competition, $userId);

            $this->seasonRepository->restore($id);

            // Reload the restored season
            $season = $this->seasonRepository->findById($id);

            return $this->toSeasonData($season, $competition->logoPath());
        });
    }

    /**
     * Check if slug is available for a season name.
     *
     * @return array{available: bool, slug: string, suggestion: string|null}
     */
    public function checkSlugAvailability(int $competitionId, string $name, ?int $excludeId = null): array
    {
        // Generate slug from name
        $baseSlug = SeasonSlug::fromName($name);

        // Check if slug is available
        $available = $this->seasonRepository->isSlugAvailable(
            $baseSlug->value(),
            $competitionId,
            $excludeId
        );

        $suggestion = null;
        if (! $available) {
            $suggestion = $this->seasonRepository->generateUniqueSlug(
                $baseSlug->value(),
                $competitionId,
                $excludeId
            );
        }

        return [
            'available' => $available,
            'slug' => $baseSlug->value(),
            'suggestion' => $suggestion,
        ];
    }

    /**
     * Store a season image (logo or banner).
     */
    private function storeSeasonImage(UploadedFile $file, string $type, ?int $seasonId): string
    {
        $directory = $seasonId
            ? "seasons/{$seasonId}"
            : 'seasons/temp';

        $path = $file->store($directory, 'public');

        if (! $path) {
            throw new RuntimeException("Failed to store season {$type}");
        }

        return $path;
    }

    /**
     * Delete a season image from storage.
     */
    private function deleteSeasonImage(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * Convert Season entity to SeasonData DTO.
     */
    private function toSeasonData(Season $season, ?string $competitionLogoPath): SeasonData
    {
        // Get competition data
        $competition = $this->competitionRepository->findById($season->competitionId());

        // Get league data for breadcrumbs
        $league = $this->leagueRepository->findById($competition->leagueId());

        // Determine logo URL (season logo or inherit from competition)
        $logoUrl = $season->logoPath()
            ? Storage::disk('public')->url($season->logoPath())
            : ($competitionLogoPath ? Storage::disk('public')->url($competitionLogoPath) : null);

        $bannerUrl = $season->bannerPath()
            ? Storage::disk('public')->url($season->bannerPath())
            : null;

        // Get driver counts
        $totalDrivers = $this->seasonDriverRepository->countDriversInSeason($season->id() ?? 0);
        $activeDrivers = $this->seasonDriverRepository->countActiveDriversInSeason($season->id() ?? 0);

        // Get division and team counts
        $totalDivisions = count($this->divisionRepository->findBySeasonId($season->id() ?? 0));
        $totalTeams = count($this->teamRepository->findBySeasonId($season->id() ?? 0));

        // Get round counts
        $rounds = $this->roundRepository->findBySeasonId($season->id() ?? 0);
        $totalRounds = count($rounds);
        $completedRounds = count(array_filter($rounds, fn ($round) => $round->status()->isCompleted()));

        // Get platform data via repository (returns array)
        $platformArray = $this->platformRepository->findById($competition->platformId());

        // Build nested competition data with league and platform
        $competitionData = new SeasonCompetitionData(
            id: $competition->id() ?? 0,
            name: $competition->name()->value(),
            slug: $competition->slug()->value(),
            platform_id: $competition->platformId(),
            competition_colour: $competition->competitionColour(),
            league: new SeasonLeagueData(
                id: $league->id() ?? 0,
                name: $league->name()->value(),
                slug: $league->slug()->value(),
            ),
            platform: new PlatformData(
                id: $platformArray['id'],
                name: $platformArray['name'],
                slug: $platformArray['slug'],
            ),
        );

        // Get eloquent model for media extraction
        $eloquentModel = null;
        if ($season->id() && $this->seasonRepository instanceof EloquentSeasonRepository) {
            try {
                $eloquentModel = $this->seasonRepository->getEloquentModel($season->id());
            } catch (Exception $e) {
                // Model not found or error loading media - continue without media
            }
        }

        return SeasonData::fromEntity(
            season: $season,
            competitionData: $competitionData,
            logoUrl: $logoUrl,
            bannerUrl: $bannerUrl,
            aggregates: [
                'total_drivers' => $totalDrivers,
                'active_drivers' => $activeDrivers,
                'total_races' => 0, // Races are part of rounds, count rounds instead
                'completed_races' => 0, // Races are part of rounds, count rounds instead
                'total_divisions' => $totalDivisions,
                'total_teams' => $totalTeams,
                'total_rounds' => $totalRounds,
                'completed_rounds' => $completedRounds,
            ],
            eloquentModel: $eloquentModel,
        );
    }

    /**
     * Authorize that user is league owner.
     */
    private function authorizeLeagueOwner($competition, int $userId): void
    {
        $league = $this->leagueRepository->findById($competition->leagueId());

        if ($league->ownerUserId() !== $userId) {
            throw new UnauthorizedException('Only league owner can manage seasons');
        }
    }

    /**
     * Get season standings by aggregating round standings.
     * Returns cumulative standings for all drivers across all completed rounds.
     *
     * @return array{
     *     standings: array<mixed>,
     *     has_divisions: bool,
     *     drop_round_enabled: bool,
     *     total_drop_rounds: int,
     *     team_championship_enabled: bool,
     *     team_championship_results: array<mixed>,
     *     teams_drop_rounds_enabled: bool,
     *     teams_total_drop_rounds: int
     * }
     */
    public function getSeasonStandings(int $seasonId): array
    {
        // Fetch season to check if divisions and drop rounds are enabled
        $season = $this->seasonRepository->findById($seasonId);
        $hasDivisions = $season->raceDivisionsEnabled();
        $dropRoundEnabled = $season->hasDropRound();
        $totalDropRounds = $season->getTotalDropRounds();
        $teamChampionshipEnabled = $season->teamChampionshipEnabled();
        $teamsDropRoundsEnabled = $season->hasTeamsDropRounds();
        $teamsTotalDropRounds = $season->getTeamsTotalDropRounds() ?? 0;

        // Fetch all rounds with results (completed rounds only)
        $rounds = $this->roundRepository->findBySeasonId($seasonId);

        // Filter to completed rounds with round_results populated
        $completedRounds = array_filter($rounds, fn ($round) => $this->isRoundCompleteWithResults($round));

        if (empty($completedRounds)) {
            // No completed rounds yet
            return [
                'standings' => $hasDivisions ? [] : [],
                'has_divisions' => $hasDivisions,
                'drop_round_enabled' => $dropRoundEnabled,
                'total_drop_rounds' => $totalDropRounds,
                'team_championship_enabled' => $teamChampionshipEnabled,
                'team_championship_results' => [],
                'teams_drop_rounds_enabled' => $teamsDropRoundsEnabled,
                'teams_total_drop_rounds' => $teamsTotalDropRounds,
            ];
        }

        // Aggregate team championship results if enabled
        $teamChampionshipResults = [];
        if ($teamChampionshipEnabled) {
            $teamChampionshipResults = $this->aggregateTeamChampionshipStandings(
                $completedRounds,
                $teamsDropRoundsEnabled,
                $teamsTotalDropRounds
            );
        }

        if ($hasDivisions) {
            return [
                'standings' => $this->aggregateStandingsWithDivisions(
                    $completedRounds,
                    $dropRoundEnabled,
                    $totalDropRounds
                ),
                'has_divisions' => true,
                'drop_round_enabled' => $dropRoundEnabled,
                'total_drop_rounds' => $totalDropRounds,
                'team_championship_enabled' => $teamChampionshipEnabled,
                'team_championship_results' => $teamChampionshipResults,
                'teams_drop_rounds_enabled' => $teamsDropRoundsEnabled,
                'teams_total_drop_rounds' => $teamsTotalDropRounds,
            ];
        }

        return [
            'standings' => $this->aggregateStandingsWithoutDivisions(
                $completedRounds,
                $dropRoundEnabled,
                $totalDropRounds
            ),
            'has_divisions' => false,
            'drop_round_enabled' => $dropRoundEnabled,
            'total_drop_rounds' => $totalDropRounds,
            'team_championship_enabled' => $teamChampionshipEnabled,
            'team_championship_results' => $teamChampionshipResults,
            'teams_drop_rounds_enabled' => $teamsDropRoundsEnabled,
            'teams_total_drop_rounds' => $teamsTotalDropRounds,
        ];
    }

    /**
     * Aggregate standings across rounds without divisions.
     *
     * @param  array<\App\Domain\Competition\Entities\Round>  $rounds
     * @return array<mixed>
     */
    private function aggregateStandingsWithoutDivisions(
        array $rounds,
        bool $dropRoundEnabled,
        int $totalDropRounds
    ): array {
        // Get season ID from first round (use reset() since array_filter preserves keys)
        $firstRound = reset($rounds);
        $seasonId = $firstRound !== false ? $firstRound->seasonId() : 0;

        // Extract unique driver IDs for batch fetch
        $driverIds = [];
        foreach ($rounds as $round) {
            $roundResults = $round->roundResults();
            if ($roundResults === null || ! isset($roundResults['standings'])) {
                continue;
            }

            foreach ($roundResults['standings'] as $standing) {
                $driverIds[$standing['driver_id']] = true;
            }
        }
        $driverIds = array_keys($driverIds);

        // Batch fetch driver names to avoid N+1 queries
        $driverNames = $this->batchFetchDriverNames($driverIds);

        // Batch fetch team IDs for all drivers in this season
        $driverTeamIds = $this->batchFetchDriverTeams($seasonId, $driverIds);

        // Extract unique team IDs and batch fetch team data
        $teamIds = array_filter(array_unique(array_values($driverTeamIds)));
        $teamData = ! empty($teamIds) ? $this->batchFetchTeamData($teamIds) : [];

        // Aggregate points per driver
        $driverTotals = [];
        $driverRoundData = [];

        foreach ($rounds as $round) {
            $roundResults = $round->roundResults();
            if ($roundResults === null || ! isset($roundResults['standings'])) {
                continue;
            }

            $roundId = $round->id();
            $roundNumber = $round->roundNumber()->value();

            foreach ($roundResults['standings'] as $standing) {
                $driverId = $standing['driver_id'];
                $points = $standing['total_points'];
                $hasPole = ($standing['pole_position_points'] ?? 0) > 0;
                $hasFastestLap = ($standing['fastest_lap_points'] ?? 0) > 0;
                $position = $standing['position'] ?? null;
                $totalPenalties = is_numeric($standing['total_penalties'] ?? 0)
                    ? max(0, (int) ($standing['total_penalties'] ?? 0))
                    : 0;

                if (! isset($driverTotals[$driverId])) {
                    $driverTotals[$driverId] = [
                        'driver_id' => $driverId,
                        'driver_name' => $driverNames[$driverId] ?? 'Unknown Driver',
                        'total_points' => 0,
                        'podiums' => 0,
                        'poles' => 0,
                        'total_penalties' => 0,
                    ];
                    $driverRoundData[$driverId] = [];
                }

                $driverTotals[$driverId]['total_points'] += $points;

                // Count podiums (positions 1, 2, or 3)
                if ($position !== null && $position >= 1 && $position <= 3) {
                    $driverTotals[$driverId]['podiums']++;
                }

                // Count poles
                if ($hasPole) {
                    $driverTotals[$driverId]['poles']++;
                }

                // Sum penalties
                $driverTotals[$driverId]['total_penalties'] += $totalPenalties;

                $driverRoundData[$driverId][] = [
                    'round_id' => $roundId,
                    'round_number' => $roundNumber,
                    'points' => $points,
                    'position' => $position,
                    'has_pole' => $hasPole,
                    'has_fastest_lap' => $hasFastestLap,
                    'total_penalties' => $totalPenalties,
                ];
            }
        }

        // Calculate drop totals if drop round is enabled
        if ($dropRoundEnabled && $totalDropRounds > 0) {
            // Get total number of completed rounds
            $totalCompletedRounds = count($rounds);

            foreach ($driverTotals as $driverId => $data) {
                // Get all round points for this driver
                $roundPoints = array_map(fn ($round) => $round['points'], $driverRoundData[$driverId]);

                // Pad with 0s for missing rounds (per documentation: "Missing rounds count as 0 points")
                $participatedRounds = count($roundPoints);
                $missingRounds = $totalCompletedRounds - $participatedRounds;
                for ($i = 0; $i < $missingRounds; $i++) {
                    $roundPoints[] = 0.0;
                }

                // Sort points ascending to identify lowest scores
                sort($roundPoints, SORT_NUMERIC);

                // Calculate how many rounds to drop
                // Can only drop if driver has more rounds than drop rounds configured
                // This ensures at least one round always counts
                $roundsToDrop = $totalCompletedRounds > $totalDropRounds
                    ? min($totalDropRounds, $totalCompletedRounds)
                    : 0;

                // Sum the lowest N rounds to subtract
                $droppedPoints = 0.0;
                for ($i = 0; $i < $roundsToDrop; $i++) {
                    $droppedPoints += (float) ($roundPoints[$i] ?? 0);
                }

                // Calculate drop total
                $driverTotals[$driverId]['drop_total'] = $data['total_points'] - $droppedPoints;
            }

            // Sort by drop total descending
            uasort($driverTotals, fn ($a, $b) => $b['drop_total'] <=> $a['drop_total']);
        } else {
            // Sort by total points descending
            uasort($driverTotals, fn ($a, $b) => $b['total_points'] <=> $a['total_points']);
        }

        // Build final standings with positions using standard competition ranking
        // Standard competition ranking: drivers with same points share position,
        // next position skips (e.g., two drivers at 5th, next driver is 7th)
        $standings = [];
        $position = 1;
        $previousScore = null;
        $driversAtCurrentPosition = 0;

        foreach ($driverTotals as $driverId => $data) {
            // Determine which score to use for ranking
            $currentScore = ($dropRoundEnabled && $totalDropRounds > 0 && isset($data['drop_total']))
                ? $data['drop_total']
                : $data['total_points'];

            // If score changed from previous driver, update position
            if ($previousScore !== null && $currentScore !== $previousScore) {
                $position += $driversAtCurrentPosition;
                $driversAtCurrentPosition = 0;
            }

            // Get team information for this driver
            $teamId = $driverTeamIds[$driverId] ?? null;
            $team = $teamId !== null && isset($teamData[$teamId]) ? $teamData[$teamId] : null;

            $standing = [
                'position' => $position,
                'driver_id' => $data['driver_id'],
                'driver_name' => $data['driver_name'],
                'total_points' => $data['total_points'],
                'podiums' => $data['podiums'],
                'poles' => $data['poles'],
                'total_penalties' => $data['total_penalties'],
                'rounds' => $driverRoundData[$driverId],
                'team_id' => $teamId,
                'team_name' => $team !== null ? $team['name'] : null,
                'team_logo' => $team !== null ? $team['logo_url'] : null,
            ];

            // Add drop_total if drop rounds are enabled
            if ($dropRoundEnabled && $totalDropRounds > 0 && isset($data['drop_total'])) {
                $standing['drop_total'] = $data['drop_total'];
            }

            $standings[] = $standing;
            $previousScore = $currentScore;
            $driversAtCurrentPosition++;
        }

        return $standings;
    }

    /**
     * Aggregate standings across rounds with divisions.
     *
     * @param  array<\App\Domain\Competition\Entities\Round>  $rounds
     * @return array<mixed>
     */
    private function aggregateStandingsWithDivisions(
        array $rounds,
        bool $dropRoundEnabled,
        int $totalDropRounds
    ): array {
        // Get season ID from first round (use reset() since array_filter preserves keys)
        $firstRound = reset($rounds);
        $seasonId = $firstRound !== false ? $firstRound->seasonId() : 0;

        // Extract unique driver IDs and division IDs for batch fetch
        $driverIds = [];
        $divisionIds = [];

        foreach ($rounds as $round) {
            $roundResults = $round->roundResults();
            if ($roundResults === null || ! isset($roundResults['standings'])) {
                continue;
            }

            foreach ($roundResults['standings'] as $divisionStanding) {
                $divisionId = $divisionStanding['division_id'] ?? 0;
                if ($divisionId > 0) {
                    $divisionIds[$divisionId] = true;
                }

                foreach ($divisionStanding['results'] as $standing) {
                    $driverIds[$standing['driver_id']] = true;
                }
            }
        }
        $driverIds = array_keys($driverIds);
        $divisionIds = array_keys($divisionIds);

        // Batch fetch driver names and division data (name + order)
        $driverNames = $this->batchFetchDriverNames($driverIds);
        $divisionData = $this->batchFetchDivisionData($divisionIds);

        // Batch fetch team IDs for all drivers in this season
        $driverTeamIds = $this->batchFetchDriverTeams($seasonId, $driverIds);

        // Extract unique team IDs and batch fetch team data
        $teamIds = array_filter(array_unique(array_values($driverTeamIds)));
        $teamData = ! empty($teamIds) ? $this->batchFetchTeamData($teamIds) : [];

        // Aggregate points per driver per division
        $divisionDriverTotals = [];
        $divisionDriverRoundData = [];

        foreach ($rounds as $round) {
            $roundResults = $round->roundResults();
            if ($roundResults === null || ! isset($roundResults['standings'])) {
                continue;
            }

            $roundId = $round->id();
            $roundNumber = $round->roundNumber()->value();

            foreach ($roundResults['standings'] as $divisionStanding) {
                $divisionId = $divisionStanding['division_id'] ?? 0;
                $divisionInfo = $divisionData[$divisionId] ?? null;
                $divisionName = $divisionId === 0
                    ? 'No Division'
                    : ($divisionInfo['name'] ?? 'Unknown Division');
                $divisionOrder = $divisionId === 0
                    ? PHP_INT_MAX
                    : ($divisionInfo['order'] ?? (PHP_INT_MAX - 1));

                if (! isset($divisionDriverTotals[$divisionId])) {
                    $divisionDriverTotals[$divisionId] = [
                        'division_id' => $divisionId === 0 ? null : $divisionId,
                        'division_name' => $divisionName,
                        'order' => $divisionOrder,
                        'drivers' => [],
                    ];
                    $divisionDriverRoundData[$divisionId] = [];
                }

                foreach ($divisionStanding['results'] as $standing) {
                    $driverId = $standing['driver_id'];
                    $points = $standing['total_points'];
                    $hasPole = ($standing['pole_position_points'] ?? 0) > 0;
                    $hasFastestLap = ($standing['fastest_lap_points'] ?? 0) > 0;
                    $position = $standing['position'] ?? null;
                    $totalPenalties = is_numeric($standing['total_penalties'] ?? 0)
                        ? max(0, (int) ($standing['total_penalties'] ?? 0))
                        : 0;

                    if (! isset($divisionDriverTotals[$divisionId]['drivers'][$driverId])) {
                        $divisionDriverTotals[$divisionId]['drivers'][$driverId] = [
                            'driver_id' => $driverId,
                            'driver_name' => $driverNames[$driverId] ?? 'Unknown Driver',
                            'total_points' => 0,
                            'podiums' => 0,
                            'poles' => 0,
                            'total_penalties' => 0,
                        ];
                        $divisionDriverRoundData[$divisionId][$driverId] = [];
                    }

                    $divisionDriverTotals[$divisionId]['drivers'][$driverId]['total_points'] += $points;

                    // Count podiums (positions 1, 2, or 3)
                    if ($position !== null && $position >= 1 && $position <= 3) {
                        $divisionDriverTotals[$divisionId]['drivers'][$driverId]['podiums']++;
                    }

                    // Count poles
                    if ($hasPole) {
                        $divisionDriverTotals[$divisionId]['drivers'][$driverId]['poles']++;
                    }

                    // Sum penalties
                    $divisionDriverTotals[$divisionId]['drivers'][$driverId]['total_penalties'] += $totalPenalties;

                    $divisionDriverRoundData[$divisionId][$driverId][] = [
                        'round_id' => $roundId,
                        'round_number' => $roundNumber,
                        'points' => $points,
                        'position' => $position,
                        'has_pole' => $hasPole,
                        'has_fastest_lap' => $hasFastestLap,
                        'total_penalties' => $totalPenalties,
                    ];
                }
            }
        }

        // Build final standings with positions per division
        $standings = [];
        foreach ($divisionDriverTotals as $divisionId => $divisionTotals) {
            // Calculate drop totals if drop round is enabled
            if ($dropRoundEnabled && $totalDropRounds > 0) {
                // Get total number of completed rounds
                $totalCompletedRounds = count($rounds);

                foreach ($divisionTotals['drivers'] as $driverId => $data) {
                    // Get all round points for this driver
                    $roundPoints = array_map(
                        fn ($round) => $round['points'],
                        $divisionDriverRoundData[$divisionId][$driverId]
                    );

                    // Pad with 0s for missing rounds (per documentation: "Missing rounds count as 0 points")
                    $participatedRounds = count($roundPoints);
                    $missingRounds = $totalCompletedRounds - $participatedRounds;
                    for ($i = 0; $i < $missingRounds; $i++) {
                        $roundPoints[] = 0.0;
                    }

                    // Sort points ascending to identify lowest scores
                    sort($roundPoints, SORT_NUMERIC);

                    // Calculate how many rounds to drop
                    // Can only drop if driver has more rounds than drop rounds configured
                    // This ensures at least one round always counts
                    $roundsToDrop = $totalCompletedRounds > $totalDropRounds
                        ? min($totalDropRounds, $totalCompletedRounds)
                        : 0;

                    // Sum the lowest N rounds to subtract
                    $droppedPoints = 0.0;
                    for ($i = 0; $i < $roundsToDrop; $i++) {
                        $droppedPoints += (float) ($roundPoints[$i] ?? 0);
                    }

                    // Calculate drop total
                    $divisionDriverTotals[$divisionId]['drivers'][$driverId]['drop_total'] =
                        $data['total_points'] - $droppedPoints;
                }

                // Sort drivers by drop total descending
                // PHPStan loses type information after uasort
                uasort(
                    $divisionDriverTotals[$divisionId]['drivers'],
                    fn ($a, $b) => ($b['drop_total'] ?? 0) <=> ($a['drop_total'] ?? 0)
                );
            } else {
                // Sort drivers by total points descending
                uasort(
                    $divisionDriverTotals[$divisionId]['drivers'],
                    fn ($a, $b) => $b['total_points'] <=> $a['total_points']
                );
            }

            // Build driver standings with positions using standard competition ranking
            // Standard competition ranking: drivers with same points share position,
            // next position skips (e.g., two drivers at 5th, next driver is 7th)
            $drivers = [];
            $position = 1;
            $previousScore = null;
            $driversAtCurrentPosition = 0;

            foreach ($divisionDriverTotals[$divisionId]['drivers'] as $driverId => $driverData) {
                // PHPStan loses type information after uasort
                /**
                 * @var array{
                 *     driver_id: mixed,
                 *     driver_name: string,
                 *     total_points: float|int,
                 *     podiums: int,
                 *     poles: int,
                 *     total_penalties: int,
                 *     drop_total?: float|int
                 * } $driverData
                 */

                // Determine which score to use for ranking
                $currentScore = ($dropRoundEnabled && $totalDropRounds > 0 && isset($driverData['drop_total']))
                    ? $driverData['drop_total']
                    : $driverData['total_points'];

                // If score changed from previous driver, update position
                if ($previousScore !== null && $currentScore !== $previousScore) {
                    $position += $driversAtCurrentPosition;
                    $driversAtCurrentPosition = 0;
                }

                // Get team information for this driver
                $teamId = $driverTeamIds[$driverId] ?? null;
                $team = $teamId !== null && isset($teamData[$teamId]) ? $teamData[$teamId] : null;

                $driver = [
                    'position' => $position,
                    'driver_id' => $driverData['driver_id'],
                    'driver_name' => $driverData['driver_name'],
                    'total_points' => $driverData['total_points'],
                    'podiums' => $driverData['podiums'],
                    'poles' => $driverData['poles'],
                    'total_penalties' => $driverData['total_penalties'],
                    'rounds' => $divisionDriverRoundData[$divisionId][$driverId],
                    'team_id' => $teamId,
                    'team_name' => $team !== null ? $team['name'] : null,
                    'team_logo' => $team !== null ? $team['logo_url'] : null,
                ];

                // Add drop_total if drop rounds are enabled
                if ($dropRoundEnabled && $totalDropRounds > 0 && isset($driverData['drop_total'])) {
                    $driver['drop_total'] = $driverData['drop_total'];
                }

                $drivers[] = $driver;
                $previousScore = $currentScore;
                $driversAtCurrentPosition++;
            }

            $standings[] = [
                'division_id' => $divisionTotals['division_id'],
                'division_name' => $divisionTotals['division_name'],
                'order' => $divisionTotals['order'],
                'drivers' => $drivers,
            ];
        }

        // Sort standings by division order
        usort($standings, fn ($a, $b) => $a['order'] <=> $b['order']);

        return $standings;
    }

    /**
     * Aggregate team championship standings across all completed rounds.
     *
     * @param  array<\App\Domain\Competition\Entities\Round>  $rounds
     * @return array<mixed>
     */
    private function aggregateTeamChampionshipStandings(
        array $rounds,
        bool $teamsDropRoundsEnabled,
        int $teamsTotalDropRounds
    ): array {
        // Aggregate team points across all rounds
        $teamTotals = [];
        $teamRoundData = [];
        $teamIds = [];

        foreach ($rounds as $round) {
            $teamResults = $round->teamChampionshipResults();
            if ($teamResults === null || ! isset($teamResults['standings'])) {
                continue;
            }

            $roundId = $round->id();
            $roundNumber = $round->roundNumber()->value();

            foreach ($teamResults['standings'] as $standing) {
                $teamId = $standing['team_id'];
                $points = $standing['total_points'];

                // Track team IDs for batch fetch
                $teamIds[$teamId] = true;

                if (! isset($teamTotals[$teamId])) {
                    $teamTotals[$teamId] = [
                        'team_id' => $teamId,
                        'total_points' => 0,
                    ];
                    $teamRoundData[$teamId] = [];
                }

                $teamTotals[$teamId]['total_points'] += $points;

                // Store per-round points
                $teamRoundData[$teamId][] = [
                    'round_id' => $roundId,
                    'round_number' => $roundNumber,
                    'points' => $points,
                ];
            }
        }

        // Calculate drop totals if team drop rounds are enabled
        if ($teamsDropRoundsEnabled && $teamsTotalDropRounds > 0) {
            // Get total number of completed rounds
            $totalCompletedRounds = count($rounds);

            foreach ($teamTotals as $teamId => $data) {
                // Get all round points for this team
                $roundPoints = array_map(fn ($round) => $round['points'], $teamRoundData[$teamId]);

                // Pad with 0s for missing rounds (per documentation: "Missing rounds count as 0 points")
                $participatedRounds = count($roundPoints);
                $missingRounds = $totalCompletedRounds - $participatedRounds;
                for ($i = 0; $i < $missingRounds; $i++) {
                    $roundPoints[] = 0.0;
                }

                // Sort points ascending to identify lowest scores
                sort($roundPoints, SORT_NUMERIC);

                // Calculate how many rounds to drop
                // Can only drop if team has more rounds than drop rounds configured
                // This ensures at least one round always counts
                $roundsToDrop = $totalCompletedRounds > $teamsTotalDropRounds
                    ? min($teamsTotalDropRounds, $totalCompletedRounds)
                    : 0;

                // Sum the lowest N rounds to subtract
                $droppedPoints = 0.0;
                for ($i = 0; $i < $roundsToDrop; $i++) {
                    $droppedPoints += (float) ($roundPoints[$i] ?? 0);
                }

                // Calculate drop total
                $teamTotals[$teamId]['drop_total'] = $data['total_points'] - $droppedPoints;
            }
        }

        // Batch fetch team names and logos using repository (properly formats URLs)
        $teamIds = array_keys($teamIds);
        $teamData = $this->batchFetchTeamData($teamIds);

        // Build final standings with team names and logos
        $standings = [];
        foreach ($teamTotals as $teamId => $data) {
            $team = $teamData[$teamId] ?? null;

            $standing = [
                'team_id' => $data['team_id'],
                'team_name' => $team !== null ? $team['name'] : 'Unknown Team',
                'team_logo' => $team !== null ? $team['logo_url'] : null,
                'total_points' => $data['total_points'],
                'rounds' => $teamRoundData[$teamId],
            ];

            // Add drop_total if drop rounds are enabled
            if ($teamsDropRoundsEnabled && $teamsTotalDropRounds > 0 && isset($data['drop_total'])) {
                $standing['drop_total'] = $data['drop_total'];
            }

            $standings[] = $standing;
        }

        // Sort by drop total if enabled, otherwise by total points
        if ($teamsDropRoundsEnabled && $teamsTotalDropRounds > 0) {
            usort($standings, fn ($a, $b) => ($b['drop_total'] ?? 0) <=> ($a['drop_total'] ?? 0));
        } else {
            usort($standings, fn ($a, $b) => $b['total_points'] <=> $a['total_points']);
        }

        // Assign positions using standard competition ranking
        // Standard competition ranking: teams with same points share position,
        // next position skips (e.g., two teams at 5th, next team is 7th)
        $position = 1;
        $previousScore = null;
        $teamsAtCurrentPosition = 0;

        foreach ($standings as &$standing) {
            // Determine which score to use for ranking
            $currentScore = ($teamsDropRoundsEnabled && $teamsTotalDropRounds > 0 && isset($standing['drop_total']))
                ? $standing['drop_total']
                : $standing['total_points'];

            // If score changed from previous team, update position
            if ($previousScore !== null && $currentScore !== $previousScore) {
                $position += $teamsAtCurrentPosition;
                $teamsAtCurrentPosition = 0;
            }

            $standing['position'] = $position;
            $previousScore = $currentScore;
            $teamsAtCurrentPosition++;
        }

        return $standings;
    }

    /**
     * Check if a round is completed and has results.
     */
    private function isRoundCompleteWithResults(\App\Domain\Competition\Entities\Round $round): bool
    {
        return $round->status()->isCompleted() && $round->roundResults() !== null;
    }

    /**
     * Execute a callback with retry logic for unique constraint violations.
     *
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     *
     * @throws Throwable
     */
    private function executeWithRetry(callable $callback, int $maxRetries = 3): mixed
    {
        $attempt = 1;
        while (true) {
            try {
                return $callback();
            } catch (QueryException $e) {
                // Check for unique constraint violation (MySQL: 23000, PostgreSQL: 23505)
                if ($attempt < $maxRetries && in_array($e->getCode(), ['23000', '23505'])) {
                    $attempt++;

                    continue;
                }
                throw $e;
            }
        }
    }

    /**
     * Dispatch domain events.
     */
    private function dispatchEvents(Season $season): void
    {
        $events = $season->releaseEvents();

        foreach ($events as $event) {
            Event::dispatch($event);
        }
    }

    /**
     * Copy default tiebreaker rules to a season.
     * This is called when a season is created with tiebreaker rules enabled.
     */
    private function copyDefaultTiebreakerRules(Season $season): void
    {
        if ($season->id() === null) {
            throw new \LogicException('Cannot copy tiebreaker rules to unpersisted season');
        }

        // Get all active tiebreaker rules ordered by default_order
        $defaultRules = $this->tiebreakerRuleRepository->getAllActive();

        if (empty($defaultRules)) {
            return; // No default rules to copy
        }

        // Build configuration from default rules
        $ruleReferences = [];
        foreach ($defaultRules as $index => $rule) {
            $ruleReferences[] = new TiebreakerRuleReference(
                id: $rule->id() ?? 0,
                slug: $rule->slug(),
                order: $index + 1, // Order starts at 1
            );
        }

        $configuration = TiebreakerRuleConfiguration::from($ruleReferences);

        // Enable tiebreaker rules on the season
        $season->enableTiebreakerRules($configuration);

        // Save the updated season
        $this->seasonRepository->save($season);
        $this->dispatchEvents($season);
    }

    /**
     * Update the order of tiebreaker rules for a season.
     *
     * @param  array<array{id: int, order: int}>  $rulesOrder  Array of rule IDs with their new order
     *
     * @throws SeasonNotFoundException
     */
    public function updateTiebreakerRulesOrder(int $seasonId, array $rulesOrder): void
    {
        DB::transaction(function () use ($seasonId, $rulesOrder): void {
            // Load season
            $season = $this->seasonRepository->findById($seasonId);

            // Build new configuration
            $ruleReferences = [];
            foreach ($rulesOrder as $ruleData) {
                $rule = $this->tiebreakerRuleRepository->findById($ruleData['id']);
                $ruleReferences[] = new TiebreakerRuleReference(
                    id: $rule->id() ?? 0,
                    slug: $rule->slug(),
                    order: $ruleData['order'],
                );
            }

            $configuration = TiebreakerRuleConfiguration::from($ruleReferences);

            // Update season
            $season->updateTiebreakerRules($configuration);

            // Save
            $this->seasonRepository->save($season);
            $this->dispatchEvents($season);
        });
    }
}
