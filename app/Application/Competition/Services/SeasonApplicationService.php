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
use App\Domain\Competition\Entities\Season;
use App\Domain\Competition\Exceptions\CompetitionNotFoundException;
use App\Domain\Competition\Exceptions\SeasonNotFoundException;
use App\Domain\Competition\Repositories\CompetitionRepositoryInterface;
use App\Domain\Competition\Repositories\RaceRepositoryInterface;
use App\Domain\Competition\Repositories\RaceResultRepositoryInterface;
use App\Domain\Competition\Repositories\RoundRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonDriverRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonRepositoryInterface;
use App\Domain\Competition\ValueObjects\SeasonName;
use App\Domain\Competition\ValueObjects\SeasonSlug;
use App\Domain\Competition\ValueObjects\SeasonStatus;
use App\Domain\Division\Repositories\DivisionRepositoryInterface;
use App\Domain\League\Repositories\LeagueRepositoryInterface;
use App\Domain\Platform\Repositories\PlatformRepositoryInterface;
use App\Domain\Shared\Exceptions\UnauthorizedException;
use App\Domain\Team\Repositories\TeamRepositoryInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;

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
    ) {
    }

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
                    raceDivisionsEnabled: $data->race_divisions_enabled,
                    raceTimesRequired: $data->race_times_required,
                );

                // 7. Save via repository
                $this->seasonRepository->save($season);

                // 8. Record creation event and dispatch
                $league = $this->leagueRepository->findById($competition->leagueId());
                $season->recordCreationEvent($league->id() ?? 0);
                $this->dispatchEvents($season);

                // 9. Return SeasonData DTO
                return $this->toSeasonData($season, $competition->logoPath());
            });
        } catch (\Throwable $e) {
            // Cleanup uploaded files on failure
            // Wrap cleanup in try-catch to prevent cleanup failures from masking the original exception
            if ($logoPath) {
                try {
                    $this->deleteSeasonImage($logoPath);
                } catch (\Throwable $cleanupException) {
                    // Log cleanup failure but don't throw - preserve original exception
                    \Log::warning('Failed to cleanup season logo during error handling', [
                        'logo_path' => $logoPath,
                        'cleanup_error' => $cleanupException->getMessage(),
                        'original_error' => $e->getMessage(),
                    ]);
                }
            }
            if ($bannerPath) {
                try {
                    $this->deleteSeasonImage($bannerPath);
                } catch (\Throwable $cleanupException) {
                    // Log cleanup failure but don't throw - preserve original exception
                    \Log::warning('Failed to cleanup season banner during error handling', [
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
    public function updateSeason(int $id, UpdateSeasonData $data, int $userId): SeasonData
    {
        return DB::transaction(function () use ($id, $data, $userId) {
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

            // 6. Handle logo updates
            if ($data->remove_logo) {
                $this->deleteSeasonImage($season->logoPath());
                $season->updateBranding(null, $season->bannerPath());
            } elseif ($data->logo) {
                $this->deleteSeasonImage($season->logoPath());
                $logoPath = $this->storeSeasonImage($data->logo, 'logo', $season->id());
                $season->updateBranding($logoPath, $season->bannerPath());
            }

            // 7. Handle banner updates
            if ($data->remove_banner) {
                $this->deleteSeasonImage($season->bannerPath());
                $season->updateBranding($season->logoPath(), null);
            } elseif ($data->banner) {
                $this->deleteSeasonImage($season->bannerPath());
                $bannerPath = $this->storeSeasonImage($data->banner, 'banner', $season->id());
                $season->updateBranding($season->logoPath(), $bannerPath);
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
            fn(Season $season) => $this->toSeasonData($season, $competition->logoPath()),
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
        DB::transaction(function () use ($id, $userId) {
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
        if (!$available) {
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

        if (!$path) {
            throw new \RuntimeException("Failed to store season {$type}");
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
        $completedRounds = count(array_filter($rounds, fn($round) => $round->status()->isCompleted()));

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
            ]
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
     * @param int $seasonId
     * @return array{standings: array<mixed>, has_divisions: bool}
     */
    public function getSeasonStandings(int $seasonId): array
    {
        // Fetch season to check if divisions are enabled
        $season = $this->seasonRepository->findById($seasonId);
        $hasDivisions = $season->raceDivisionsEnabled();

        // Fetch all rounds with results (completed rounds only)
        $rounds = $this->roundRepository->findBySeasonId($seasonId);

        // Filter to completed rounds with round_results populated
        $completedRounds = array_filter($rounds, function ($round) {
            return $round->status()->isCompleted() && $round->roundResults() !== null;
        });

        if (empty($completedRounds)) {
            // No completed rounds yet
            return [
                'standings' => $hasDivisions ? [] : [],
                'has_divisions' => $hasDivisions,
            ];
        }

        if ($hasDivisions) {
            return [
                'standings' => $this->aggregateStandingsWithDivisions($completedRounds),
                'has_divisions' => true,
            ];
        }

        return [
            'standings' => $this->aggregateStandingsWithoutDivisions($completedRounds),
            'has_divisions' => false,
        ];
    }

    /**
     * Aggregate standings across rounds without divisions.
     *
     * @param array<\App\Domain\Competition\Entities\Round> $rounds
     * @return array<mixed>
     */
    private function aggregateStandingsWithoutDivisions(array $rounds): array
    {
        // Extract unique driver IDs for batch fetch
        $driverIds = [];
        foreach ($rounds as $round) {
            $roundResults = $round->roundResults();
            if ($roundResults === null || !isset($roundResults['standings'])) {
                continue;
            }

            foreach ($roundResults['standings'] as $standing) {
                $driverIds[$standing['driver_id']] = true;
            }
        }
        $driverIds = array_keys($driverIds);

        // Batch fetch driver names to avoid N+1 queries
        $driverNames = $this->batchFetchDriverNames($driverIds);

        // Aggregate points per driver
        $driverTotals = [];
        $driverRoundData = [];

        foreach ($rounds as $round) {
            $roundResults = $round->roundResults();
            if ($roundResults === null || !isset($roundResults['standings'])) {
                continue;
            }

            $roundId = $round->id();
            $roundNumber = $round->roundNumber()->value();

            foreach ($roundResults['standings'] as $standing) {
                $driverId = $standing['driver_id'];
                $points = $standing['total_points'];
                $hasPole = ($standing['pole_position_points'] ?? 0) > 0;
                $hasFastestLap = ($standing['fastest_lap_points'] ?? 0) > 0;

                if (!isset($driverTotals[$driverId])) {
                    $driverTotals[$driverId] = [
                        'driver_id' => $driverId,
                        'driver_name' => $driverNames[$driverId] ?? 'Unknown Driver',
                        'total_points' => 0,
                    ];
                    $driverRoundData[$driverId] = [];
                }

                $driverTotals[$driverId]['total_points'] += $points;
                $driverRoundData[$driverId][] = [
                    'round_id' => $roundId,
                    'round_number' => $roundNumber,
                    'points' => $points,
                    'has_pole' => $hasPole,
                    'has_fastest_lap' => $hasFastestLap,
                ];
            }
        }

        // Sort by total points descending
        uasort($driverTotals, fn($a, $b) => $b['total_points'] <=> $a['total_points']);

        // Build final standings with positions
        $standings = [];
        $position = 1;
        foreach ($driverTotals as $driverId => $data) {
            $standings[] = [
                'position' => $position++,
                'driver_id' => $data['driver_id'],
                'driver_name' => $data['driver_name'],
                'total_points' => $data['total_points'],
                'rounds' => $driverRoundData[$driverId],
            ];
        }

        return $standings;
    }

    /**
     * Aggregate standings across rounds with divisions.
     *
     * @param array<\App\Domain\Competition\Entities\Round> $rounds
     * @return array<mixed>
     */
    private function aggregateStandingsWithDivisions(array $rounds): array
    {
        // Extract unique driver IDs and division IDs for batch fetch
        $driverIds = [];
        $divisionIds = [];

        foreach ($rounds as $round) {
            $roundResults = $round->roundResults();
            if ($roundResults === null || !isset($roundResults['standings'])) {
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

        // Aggregate points per driver per division
        $divisionDriverTotals = [];
        $divisionDriverRoundData = [];

        foreach ($rounds as $round) {
            $roundResults = $round->roundResults();
            if ($roundResults === null || !isset($roundResults['standings'])) {
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
                $divisionOrder = $divisionId === 0 ? PHP_INT_MAX : ($divisionInfo['order'] ?? 0);

                if (!isset($divisionDriverTotals[$divisionId])) {
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

                    if (!isset($divisionDriverTotals[$divisionId]['drivers'][$driverId])) {
                        $divisionDriverTotals[$divisionId]['drivers'][$driverId] = [
                            'driver_id' => $driverId,
                            'driver_name' => $driverNames[$driverId] ?? 'Unknown Driver',
                            'total_points' => 0,
                        ];
                        $divisionDriverRoundData[$divisionId][$driverId] = [];
                    }

                    $divisionDriverTotals[$divisionId]['drivers'][$driverId]['total_points'] += $points;
                    $divisionDriverRoundData[$divisionId][$driverId][] = [
                        'round_id' => $roundId,
                        'round_number' => $roundNumber,
                        'points' => $points,
                        'has_pole' => $hasPole,
                        'has_fastest_lap' => $hasFastestLap,
                    ];
                }
            }
        }

        // Build final standings with positions per division
        $standings = [];
        foreach ($divisionDriverTotals as $divisionId => $divisionTotals) {
            // Sort drivers by total points descending
            uasort($divisionTotals['drivers'], fn($a, $b) => $b['total_points'] <=> $a['total_points']);

            // Build driver standings with positions
            $drivers = [];
            $position = 1;
            foreach ($divisionTotals['drivers'] as $driverId => $driverData) {
                $drivers[] = [
                    'position' => $position++,
                    'driver_id' => $driverData['driver_id'],
                    'driver_name' => $driverData['driver_name'],
                    'total_points' => $driverData['total_points'],
                    'rounds' => $divisionDriverRoundData[$divisionId][$driverId],
                ];
            }

            $standings[] = [
                'division_id' => $divisionTotals['division_id'],
                'division_name' => $divisionTotals['division_name'],
                'order' => $divisionTotals['order'],
                'drivers' => $drivers,
            ];
        }

        // Sort standings by division order
        usort($standings, fn($a, $b) => $a['order'] <=> $b['order']);

        return $standings;
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
}
