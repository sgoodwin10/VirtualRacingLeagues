<?php

declare(strict_types=1);

namespace App\Application\Competition\Services;

use App\Application\Competition\DTOs\CreateRoundData;
use App\Application\Competition\DTOs\UpdateRoundData;
use App\Application\Competition\DTOs\CompleteRoundData;
use App\Application\Competition\DTOs\RoundData;
use App\Application\Competition\DTOs\RoundResultsData;
use App\Application\Competition\DTOs\RaceEventResultData;
use App\Application\Competition\DTOs\RaceResultData;
use App\Application\Competition\DTOs\DivisionData;
use Spatie\LaravelData\DataCollection;
use App\Domain\Competition\Entities\Round;
use App\Domain\Competition\Entities\Race;
use App\Domain\Competition\Entities\RaceResult;
use App\Domain\Competition\Entities\Season;
use App\Domain\Competition\Repositories\RoundRepositoryInterface;
use App\Domain\Competition\Repositories\RaceRepositoryInterface;
use App\Domain\Competition\Repositories\RaceResultRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonDriverRepositoryInterface;
use App\Domain\Competition\Repositories\CompetitionRepositoryInterface;
use App\Domain\Division\Repositories\DivisionRepositoryInterface;
use App\Domain\League\Repositories\LeagueRepositoryInterface;
use App\Domain\Team\Repositories\TeamRepositoryInterface;
use App\Domain\Shared\Exceptions\UnauthorizedException;
use App\Domain\Competition\ValueObjects\RoundName;
use App\Domain\Competition\ValueObjects\RoundNumber;
use App\Domain\Competition\ValueObjects\RoundSlug;
use App\Domain\Competition\ValueObjects\RoundStatus;
use App\Domain\Competition\ValueObjects\PointsSystem;
use App\Domain\Competition\ValueObjects\RaceResultStatus;
use App\Application\Competition\Traits\BatchFetchHelpersTrait;
use App\Infrastructure\Cache\RoundResultsCacheService;
use App\Domain\Competition\Services\RoundTiebreakerDomainService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use DateTimeImmutable;

/**
 * Application service for Round use cases.
 * Orchestrates round CRUD operations, manages transactions, dispatches events.
 */
final class RoundApplicationService
{
    use BatchFetchHelpersTrait;

    /**
     * Top positions limit for bonus points eligibility (e.g., top 10).
     */
    private const TOP_POSITIONS_LIMIT = 10;

    public function __construct(
        private readonly RoundRepositoryInterface $roundRepository,
        private readonly RaceRepositoryInterface $raceRepository,
        private readonly RaceResultRepositoryInterface $raceResultRepository,
        private readonly SeasonRepositoryInterface $seasonRepository,
        private readonly SeasonDriverRepositoryInterface $seasonDriverRepository,
        private readonly CompetitionRepositoryInterface $competitionRepository,
        private readonly DivisionRepositoryInterface $divisionRepository,
        private readonly LeagueRepositoryInterface $leagueRepository,
        private readonly TeamRepositoryInterface $teamRepository,
        private readonly RaceApplicationService $raceApplicationService,
        private readonly RoundResultsCacheService $roundResultsCache,
        private readonly RoundTiebreakerDomainService $tiebreakerDomainService,
    ) {
    }

    /**
     * Create a new round.
     *
     * @throws UnauthorizedException
     */
    public function createRound(
        CreateRoundData $data,
        int $seasonId,
        int $userId,
    ): RoundData {
        return DB::transaction(function () use ($data, $seasonId, $userId) {
            // Authorize and get timezone from league
            $season = $this->seasonRepository->findById($seasonId);
            $competition = $this->competitionRepository->findById($season->competitionId());
            $league = $this->leagueRepository->findById($competition->leagueId());

            if ($league->ownerUserId() !== $userId) {
                throw new UnauthorizedException('Only league owner can manage rounds');
            }

            // Get timezone from league (or use UTC as fallback)
            $timezone = $league->timezone() ?? 'UTC';

            // Generate slug
            $slug = RoundSlug::fromName($data->name, $data->round_number);
            $uniqueSlug = RoundSlug::from(
                $this->roundRepository->generateUniqueSlug($slug->value(), $seasonId)
            );

            // Create entity
            $round = Round::create(
                seasonId: $seasonId,
                roundNumber: RoundNumber::from($data->round_number),
                name: $data->name ? RoundName::from($data->name) : null,
                slug: $uniqueSlug,
                scheduledAt: $data->scheduled_at ? new DateTimeImmutable($data->scheduled_at) : null,
                timezone: $timezone,
                platformTrackId: $data->platform_track_id,
                trackLayout: $data->track_layout,
                trackConditions: $data->track_conditions,
                technicalNotes: $data->technical_notes,
                streamUrl: $data->stream_url,
                internalNotes: $data->internal_notes,
                fastestLap: $data->fastest_lap,
                fastestLapTop10: $data->fastest_lap_top_10,
                qualifyingPole: $data->qualifying_pole,
                qualifyingPoleTop10: $data->qualifying_pole_top_10,
                pointsSystem: $data->points_system ? PointsSystem::fromJson($data->points_system) : null,
                roundPoints: $data->round_points,
                createdByUserId: $userId,
            );

            // Save (sets ID)
            $this->roundRepository->save($round);

            // Record creation event (now has ID)
            $round->recordCreationEvent();

            // Dispatch events
            $this->dispatchEvents($round);

            return RoundData::fromEntity($round);
        });
    }

    /**
     * Update an existing round.
     *
     * @param array<string, mixed> $requestData Raw request data to check field presence
     * @throws UnauthorizedException
     */
    public function updateRound(
        int $roundId,
        UpdateRoundData $data,
        int $userId,
        array $requestData = []
    ): RoundData {
        return DB::transaction(function () use ($roundId, $data, $requestData, $userId) {
            $round = $this->roundRepository->findById($roundId);

            // Authorize - ALWAYS required, no bypassing with userId = 0
            $this->authorizeLeagueOwner($round->seasonId(), $userId);

            Log::info('Round update started', [
                'round_id' => $roundId,
                'user_id' => $userId,
            ]);

            // Determine round number (use existing if not provided)
            $roundNumber = $data->round_number !== null
                ? $data->round_number
                : $round->roundNumber()->value();

            // Generate slug if name changed
            $slug = $data->name !== null
                ? RoundSlug::fromName($data->name, $roundNumber)
                : $round->slug();

            $uniqueSlug = RoundSlug::from(
                $this->roundRepository->generateUniqueSlug(
                    $slug->value(),
                    $round->seasonId(),
                    $roundId
                )
            );

            // Determine scheduled_at: if field provided in request, update it (even to null); otherwise keep existing
            $scheduledAt = $round->scheduledAt();
            if (array_key_exists('scheduled_at', $requestData)) {
                $scheduledAt = $data->scheduled_at ? new DateTimeImmutable($data->scheduled_at) : null;
            }

            // Determine fastest_lap and fastest_lap_top_10:
            // if field provided in request, update it; otherwise keep existing
            $fastestLap = $round->fastestLap();
            if (array_key_exists('fastest_lap', $requestData)) {
                $fastestLap = $data->fastest_lap;
            }

            $fastestLapTop10 = $round->fastestLapTop10();
            if (array_key_exists('fastest_lap_top_10', $requestData)) {
                $fastestLapTop10 = $data->fastest_lap_top_10 ?? false;
            }

            // Determine qualifying_pole and qualifying_pole_top_10:
            // if field provided in request, update it; otherwise keep existing
            $qualifyingPole = $round->qualifyingPole();
            if (array_key_exists('qualifying_pole', $requestData)) {
                $qualifyingPole = $data->qualifying_pole;
            }

            $qualifyingPoleTop10 = $round->qualifyingPoleTop10();
            if (array_key_exists('qualifying_pole_top_10', $requestData)) {
                $qualifyingPoleTop10 = $data->qualifying_pole_top_10 ?? false;
            }

            // Determine nullable string fields:
            // if field provided in request, update it (even to null); otherwise keep existing
            $name = array_key_exists('name', $requestData)
                ? ($data->name !== null ? RoundName::from($data->name) : null)
                : $round->name();

            $trackLayout = array_key_exists('track_layout', $requestData)
                ? $data->track_layout
                : $round->trackLayout();

            $trackConditions = array_key_exists('track_conditions', $requestData)
                ? $data->track_conditions
                : $round->trackConditions();

            $technicalNotes = array_key_exists('technical_notes', $requestData)
                ? $data->technical_notes
                : $round->technicalNotes();

            $streamUrl = array_key_exists('stream_url', $requestData)
                ? $data->stream_url
                : $round->streamUrl();

            $internalNotes = array_key_exists('internal_notes', $requestData)
                ? $data->internal_notes
                : $round->internalNotes();

            // Determine points_system: if field provided in request, update it (even to null); otherwise keep existing
            $pointsSystem = $round->pointsSystem();
            if (array_key_exists('points_system', $requestData)) {
                $pointsSystem = $data->points_system ? PointsSystem::fromJson($data->points_system) : null;
            }

            // Determine round_points: if field provided in request, update it; otherwise keep existing
            $roundPoints = $round->roundPoints();
            if (array_key_exists('round_points', $requestData)) {
                $roundPoints = $data->round_points ?? false;
            }

            $round->updateDetails(
                roundNumber: $data->round_number !== null
                    ? RoundNumber::from($data->round_number)
                    : $round->roundNumber(),
                name: $name,
                slug: $uniqueSlug,
                scheduledAt: $scheduledAt,
                platformTrackId: $data->platform_track_id ?? $round->platformTrackId(),
                trackLayout: $trackLayout,
                trackConditions: $trackConditions,
                technicalNotes: $technicalNotes,
                streamUrl: $streamUrl,
                internalNotes: $internalNotes,
                fastestLap: $fastestLap,
                fastestLapTop10: $fastestLapTop10,
                qualifyingPole: $qualifyingPole,
                qualifyingPoleTop10: $qualifyingPoleTop10,
                pointsSystem: $pointsSystem,
                roundPoints: $roundPoints,
            );

            $this->roundRepository->save($round);
            $this->dispatchEvents($round);

            Log::info('Round updated successfully', [
                'round_id' => $roundId,
                'user_id' => $userId,
            ]);

            return RoundData::fromEntity($round);
        });
    }

    /**
     * Get a single round.
     *
     * Note: This is a public read method. No authorization required as round results
     * are meant to be publicly viewable.
     */
    public function getRound(int $roundId): RoundData
    {
        $round = $this->roundRepository->findById($roundId);
        return RoundData::fromEntity($round);
    }

    /**
     * Get all rounds for a season.
     *
     * Note: This is a public read method. No authorization required as round listings
     * are meant to be publicly viewable.
     *
     * @return array<RoundData>
     */
    public function getRoundsBySeason(int $seasonId): array
    {
        $rounds = $this->roundRepository->findBySeasonId($seasonId);
        return array_map(
            fn(Round $round) => RoundData::fromEntity($round),
            $rounds
        );
    }

    /**
     * Delete a round (hard delete with cascade).
     * All related races and race results are automatically deleted via database foreign key constraints.
     *
     * @throws UnauthorizedException
     */
    public function deleteRound(int $roundId, int $userId): void
    {
        DB::transaction(function () use ($roundId, $userId) {
            $round = $this->roundRepository->findById($roundId);

            // Authorize
            $this->authorizeLeagueOwner($round->seasonId(), $userId);

            Log::info('Round deleted', [
                'round_id' => $roundId,
                'user_id' => $userId,
            ]);

            $round->delete();
            $this->roundRepository->delete($round);
            $this->dispatchEvents($round);
        });
    }

    /**
     * Change round status.
     *
     * @throws UnauthorizedException
     */
    public function changeRoundStatus(int $roundId, string $status, int $userId): RoundData
    {
        return DB::transaction(function () use ($roundId, $status, $userId) {
            $round = $this->roundRepository->findById($roundId);

            // Authorize - only league owner can change round status
            $this->authorizeLeagueOwner($round->seasonId(), $userId);

            Log::info('Round status changed', [
                'round_id' => $roundId,
                'old_status' => $round->status()->value,
                'new_status' => $status,
                'user_id' => $userId,
            ]);

            $round->changeStatus(RoundStatus::from($status));
            $this->roundRepository->save($round);
            $this->dispatchEvents($round);
            return RoundData::fromEntity($round);
        });
    }

    /**
     * Get the next round number for a season.
     */
    public function getNextRoundNumber(int $seasonId): int
    {
        return $this->roundRepository->getNextRoundNumber($seasonId);
    }

    /**
     * Mark round as completed.
     * Also marks all associated races and race results as completed/confirmed.
     * Calculates and stores round results in the round_results field.
     * Optionally accepts cross-division results from frontend.
     *
     * @throws UnauthorizedException
     */
    public function completeRound(int $roundId, int $userId, ?CompleteRoundData $data = null): RoundData
    {
        $result = DB::transaction(function () use ($roundId, $userId, $data) {
            // Fetch round and authorize
            $round = $this->roundRepository->findById($roundId);
            $this->authorizeLeagueOwner($round->seasonId(), $userId);

            Log::info('Round completion started', [
                'round_id' => $roundId,
                'user_id' => $userId,
            ]);

            // Fetch season to check divisions
            $season = $this->seasonRepository->findById($round->seasonId());
            $hasDivisions = $season->raceDivisionsEnabled();

            // Get all races sorted by race_number
            $races = $this->raceRepository->findAllByRoundId($roundId);

            // Cascade completion to all races
            $this->cascadeRaceCompletion($races, $roundId);

            // Calculate and store round results
            $this->calculateAndStoreRoundResults($round, $races, $hasDivisions, $data);

            // Calculate and store team championship results
            $this->calculateTeamChampionshipResults($round);

            // Mark round as completed
            $round->complete();
            $this->roundRepository->save($round);
            $this->dispatchEvents($round);

            Log::info('Round completed successfully', [
                'round_id' => $roundId,
                'user_id' => $userId,
            ]);

            return RoundData::fromEntity($round);
        });

        // Invalidate cache AFTER successful transaction commit
        $this->roundResultsCache->forget($roundId);

        return $result;
    }

    /**
     * Cascade completion to all races (including qualifiers).
     * Uses batch fetching to avoid N+1 queries.
     *
     * @param array<Race> $races
     * @param int $roundId Round ID for batch fetching results
     */
    private function cascadeRaceCompletion(array $races, int $roundId): void
    {
        // Sort races by race_number to ensure qualifiers are processed first
        // This is important because non-qualifier races may depend on qualifier positions for grid_source
        usort($races, fn($a, $b) => $a->raceNumber() <=> $b->raceNumber());

        // Batch fetch all race results for the round to avoid N+1 queries
        $allRaceResults = $this->raceResultRepository->findByRoundId($roundId);

        // Group results by race_id for efficient lookup
        $resultsByRaceId = [];
        foreach ($allRaceResults as $result) {
            $raceId = $result->raceId();
            if (!isset($resultsByRaceId[$raceId])) {
                $resultsByRaceId[$raceId] = [];
            }
            $resultsByRaceId[$raceId][] = $result;
        }

        foreach ($races as $race) {
            // Mark race as completed
            $race->markAsCompleted();
            $this->raceRepository->save($race);

            // Calculate race points (this also assigns positions and calculates positions_gained)
            // Only call if race_points is enabled
            $raceId = $race->id();
            if ($raceId !== null && $race->racePoints()) {
                $this->raceApplicationService->calculateRacePoints($raceId);
            }

            // Mark all race results as confirmed
            // IMPORTANT: Fetch fresh results after calculateRacePoints to avoid overwriting updated positions
            if ($raceId !== null) {
                $freshResults = $this->raceResultRepository->findByRaceId($raceId);
                foreach ($freshResults as $result) {
                    if ($result->status() !== RaceResultStatus::CONFIRMED) {
                        $result->updateStatus(RaceResultStatus::CONFIRMED);
                        $this->raceResultRepository->save($result);
                    }
                }
            }
        }
    }

    /**
     * Calculate and store round results with cross-division results.
     *
     * @param Round $round
     * @param array<Race> $races
     * @param bool $hasDivisions
     * @param CompleteRoundData|null $data Optional data from frontend
     */
    private function calculateAndStoreRoundResults(
        Round $round,
        array $races,
        bool $hasDivisions,
        ?CompleteRoundData $data = null
    ): void {
        // Fetch season to check tiebreaker configuration
        $season = $this->seasonRepository->findById($round->seasonId());

        // Fetch all race results for the round (now with calculated race points)
        $allRaceResults = [];
        foreach ($races as $race) {
            $raceId = $race->id();
            if ($raceId !== null) {
                $raceResults = $this->raceResultRepository->findByRaceId($raceId);
                foreach ($raceResults as $result) {
                    $allRaceResults[] = [
                        'race' => $race,
                        'result' => $result,
                    ];
                }
            }
        }

        // Calculate round results (now with tiebreaker support)
        $roundResults = $this->calculateRoundResults($round, $allRaceResults, $hasDivisions, $season);

        // Use provided cross-division results if available, otherwise calculate them
        if ($data !== null && $this->hasAnyCrossDivisionResults($data)) {
            $qualifyingResults = $data->qualifying_results ?? [];
            $raceTimeResults = $data->race_time_results ?? [];
            $fastestLapResults = $data->fastest_lap_results ?? [];
        } else {
            // Calculate cross-division results (qualifying, race time, fastest lap)
            $crossDivisionResults = $this->calculateCrossDivisionResults($allRaceResults);
            $qualifyingResults = $crossDivisionResults['qualifying_results'];
            $raceTimeResults = $crossDivisionResults['race_time_results'];
            $fastestLapResults = $crossDivisionResults['fastest_lap_results'];
        }

        // Set round results and cross-division results
        $round->setRoundResults($roundResults);
        $round->setCrossDivisionResults(
            $qualifyingResults,
            $raceTimeResults,
            $fastestLapResults
        );
    }

    /**
     * Mark round as not completed (scheduled).
     * Does NOT affect associated races or race results - only changes round status.
     *
     * @throws UnauthorizedException
     */
    public function uncompleteRound(int $roundId, int $userId): RoundData
    {
        $result = DB::transaction(function () use ($roundId, $userId) {
            $round = $this->roundRepository->findById($roundId);

            // Authorize
            $this->authorizeLeagueOwner($round->seasonId(), $userId);

            Log::info('Round uncompleted', [
                'round_id' => $roundId,
                'user_id' => $userId,
            ]);

            $round->uncomplete();
            $this->roundRepository->save($round);
            $this->dispatchEvents($round);
            return RoundData::fromEntity($round);
        });

        // Invalidate cache AFTER successful transaction commit
        $this->roundResultsCache->forget($roundId);

        return $result;
    }

    /**
     * Get round results with all race events and their results.
     * Fetches the round with races, divisions, and race results with driver names.
     * Results are cached in Redis for cross-subdomain access.
     *
     * Note: This is a public read method. No authorization required as round results
     * are meant to be publicly viewable (for displaying on public site).
     */
    public function getRoundResults(int $roundId): RoundResultsData
    {
        // Try to get from cache first
        $cached = $this->roundResultsCache->get($roundId);
        if ($cached !== null) {
            return $cached;
        }

        // Fetch round with season data using repository
        $roundData = $this->roundRepository->findByIdWithRelations($roundId);
        $round = $roundData['round'];
        $season = $roundData['season'];

        // Get all races for the round
        $races = $this->raceRepository->findAllByRoundId($roundId);

        // Batch fetch all race results for the round to avoid N+1 queries
        $allRaceResults = $this->raceResultRepository->findByRoundId($roundId);

        // Group results by race_id for efficient lookup
        $resultsByRaceId = [];
        foreach ($allRaceResults as $result) {
            $raceId = $result->raceId();
            if (!isset($resultsByRaceId[$raceId])) {
                $resultsByRaceId[$raceId] = [];
            }
            $resultsByRaceId[$raceId][] = $result;
        }

        // Batch fetch driver names
        $driverIds = array_unique(array_map(fn($r) => $r->driverId(), $allRaceResults));
        $driverNames = $this->batchFetchDriverNames($driverIds);

        // Fetch divisions for the season using repository
        $divisions = [];
        $hasOrphanedResults = false;
        if ($season['race_divisions_enabled']) {
            $divisionEntities = $this->divisionRepository->findBySeasonId($season['id']);

            foreach ($divisionEntities as $divisionEntity) {
                $divisions[] = new DivisionData(
                    id: $divisionEntity->id() ?? 0,
                    name: $divisionEntity->name()->value(),
                    description: $divisionEntity->description()->value(),
                );
            }

            // Check for orphaned results (only relevant when divisions are enabled)
            $hasOrphanedResults = $this->raceResultRepository->hasOrphanedResultsForRound($roundId);
        }

        // Build round summary from entity
        $roundSummary = [
            'id' => $round->id(),
            'round_number' => $round->roundNumber()->value(),
            'name' => $round->name()?->value(),
            'status' => $round->status()->value,
            'round_results' => $round->roundResults(),
            'qualifying_results' => $round->qualifyingResults(),
            'race_time_results' => $round->raceTimeResults(),
            'fastest_lap_results' => $round->fastestLapResults(),
        ];

        // Build race events with results using entities
        $raceEvents = [];
        foreach ($races as $race) {
            $raceId = $race->id();
            if ($raceId === null) {
                continue;
            }

            // Get results for this race from pre-fetched data
            $raceResults = $resultsByRaceId[$raceId] ?? [];

            // Sort results by position
            usort($raceResults, function ($a, $b) {
                $posA = $a->position() ?? PHP_INT_MAX;
                $posB = $b->position() ?? PHP_INT_MAX;
                return $posA <=> $posB;
            });

            // Build result DTOs
            $resultDtos = [];
            foreach ($raceResults as $result) {
                $driverId = $result->driverId();
                $driverName = $driverNames[$driverId] ?? 'Unknown';

                $resultDtos[] = RaceResultData::fromEntity(
                    $result,
                    [
                        'id' => $driverId,
                        'name' => $driverName,
                    ]
                );
            }

            $raceName = $race->name();
            $raceEvents[] = new RaceEventResultData(
                id: $raceId,
                race_number: $race->raceNumber() ?? 0,
                name: $raceName !== null ? $raceName->value() : '',
                is_qualifier: $race->isQualifier(),
                status: $race->status()->value,
                race_points: $race->racePoints(),
                results: $resultDtos,
            );
        }

        // Ensure round ID is set (should always be the case for fetched entities)
        $roundIdValue = $round->id();
        if ($roundIdValue === null) {
            throw new \RuntimeException('Round ID cannot be null when fetching results');
        }

        /** @var array{id: int, round_number: int, name: string|null, status: string, round_results: array<mixed>|null, qualifying_results: array<mixed>|null, race_time_results: array<mixed>|null, fastest_lap_results: array<mixed>|null} $roundSummaryTyped */
        $roundSummaryTyped = [
            'id' => $roundIdValue,
            'round_number' => $roundSummary['round_number'],
            'name' => $roundSummary['name'],
            'status' => $roundSummary['status'],
            'round_results' => $roundSummary['round_results'],
            'qualifying_results' => $roundSummary['qualifying_results'],
            'race_time_results' => $roundSummary['race_time_results'],
            'fastest_lap_results' => $roundSummary['fastest_lap_results'],
        ];

        $resultData = new RoundResultsData(
            round: $roundSummaryTyped,
            divisions: new DataCollection(DivisionData::class, $divisions),
            race_events: new DataCollection(RaceEventResultData::class, $raceEvents),
            has_orphaned_results: $hasOrphanedResults,
        );

        // Cache the results for cross-subdomain access
        $this->roundResultsCache->put($roundId, $resultData);

        return $resultData;
    }

    /**
     * Calculate round results by aggregating race points.
     *
     * @param Round $round
     * @param array<array{
     *     race: Race,
     *     result: RaceResult
     * }> $allRaceResults
     * @param bool $hasDivisions
     * @param Season $season
     * @return array<mixed>
     */
    private function calculateRoundResults(Round $round, array $allRaceResults, bool $hasDivisions, Season $season): array
    {
        if ($hasDivisions) {
            return $this->calculateRoundResultsWithDivisions($round, $allRaceResults, $season);
        }

        return $this->calculateRoundResultsWithoutDivisions($round, $allRaceResults, $season);
    }

    /**
     * Calculate round results without divisions.
     *
     * When round_points is ENABLED:
     * - race_points: Sum of all race + qualifying points from individual races
     * - fastest_lap_points: Single bonus for fastest lap time across ALL races (excluding qualifying)
     * - pole_position_points: Single bonus for fastest qualifying lap across ALL qualifiers
     * - round_points: Points awarded based on final position in standings (by race_points)
     * - total_points: round_points + fastest_lap_points + pole_position_points (NOT including race_points)
     *
     * When round_points is DISABLED:
     * - race_points: Sum of all race + qualifying points (includes race-level bonuses already)
     * - fastest_lap_points: Tally of all fastest lap bonuses awarded in individual races
     * - pole_position_points: Tally of all pole bonuses awarded in individual races
     * - round_points: 0
     * - total_points: Same as race_points
     *
     * @param Round $round
     * @param array<array{
     *     race: Race,
     *     result: RaceResult
     * }> $allRaceResults
     * @param Season $season
     * @return array<mixed>
     */
    private function calculateRoundResultsWithoutDivisions(Round $round, array $allRaceResults, Season $season): array
    {
        $roundPointsEnabled = $round->roundPoints();

        // Batch fetch driver names
        $driverNames = $this->fetchDriverNamesFromResults($allRaceResults);

        // Aggregate driver points and statistics
        $aggregatedData = $this->aggregateDriverPoints($allRaceResults, $driverNames);

        // Check if we should use race positions instead of points
        // This happens when round_points is enabled and all race_points are 0
        $allZeroPoints = !empty($aggregatedData['driverPoints']) && array_sum($aggregatedData['driverPoints']) === 0.0;
        $useRacePositions = $roundPointsEnabled && $allZeroPoints;

        if ($useRacePositions) {
            // When round_points is enabled and no race points are awarded,
            // determine standings based on actual race finishing positions
            $standings = $this->buildStandingsFromRacePositions(
                $allRaceResults,
                $aggregatedData['driverData'],
                $aggregatedData['driverPositionsGained'],
                $aggregatedData['driverHasDnfOrDns'],
                $aggregatedData['driverTotalPenalties']
            );
            $tiebreakerInfo = null;
        } else {
            // Traditional points-based sorting with tie-breaking
            $sortResult = $this->sortDriversWithTieBreaking(
                $aggregatedData['driverPoints'],
                $aggregatedData['raceResultsByDriver'],
                $aggregatedData['driverBestTimes'],
                $aggregatedData['driverHasDnfOrDns'],
                $season,
                $allRaceResults
            );

            $sortedDriverPoints = $sortResult['sortedDriverPoints'];
            $tiebreakerInfo = $sortResult['tiebreakerInfo'];

            // Determine if tiebreaker rules are enabled for this season
            $tiebreakerEnabled = $season->hasTiebreakerRulesEnabled();

            // Build initial standings
            $standings = $this->buildStandingsFromSortedPoints(
                $sortedDriverPoints,
                $aggregatedData['driverData'],
                $aggregatedData['driverPositionsGained'],
                $aggregatedData['driverHasDnfOrDns'],
                $roundPointsEnabled,
                $tiebreakerEnabled,
                $aggregatedData['driverTotalPenalties']
            );
        }

        // Apply round or race-level bonuses
        $standings = $this->applyBonusPoints($round, $allRaceResults, $standings, $roundPointsEnabled);

        // Store tiebreaker information on the round if tiebreaker was used
        if ($tiebreakerInfo !== null) {
            $round->setTiebreakerInformation($tiebreakerInfo);
        }

        return ['standings' => $standings];
    }

    /**
     * Extract and batch fetch driver names from race results.
     *
     * @param array<array{race: Race, result: RaceResult}> $allRaceResults
     * @return array<int, string>
     */
    private function fetchDriverNamesFromResults(array $allRaceResults): array
    {
        $driverIds = [];
        foreach ($allRaceResults as $item) {
            $driverIds[$item['result']->driverId()] = true;
        }

        return $this->batchFetchDriverNames(array_keys($driverIds));
    }

    /**
     * Aggregate driver points, positions gained, and race results.
     *
     * @param array<array{race: Race, result: RaceResult}> $allRaceResults
     * @param array<int, string> $driverNames
     * @return array{driverPoints: array<int, float>, driverData: array<int, array<string, mixed>>, raceResultsByDriver: array<int, array<mixed>>, driverPositionsGained: array<int, int>, driverBestTimes: array<int, array<string, int|null>>, driverHasDnfOrDns: array<int, bool>, driverTotalPenalties: array<int, int>}
     */
    private function aggregateDriverPoints(array $allRaceResults, array $driverNames): array
    {
        $driverPoints = [];
        $driverData = [];
        $raceResultsByDriver = [];
        $driverPositionsGained = [];
        $driverBestTimes = [];
        $driverHasDnfOrDns = [];
        $driverTotalPenalties = [];

        foreach ($allRaceResults as $item) {
            $race = $item['race'];
            $result = $item['result'];
            $driverId = $result->driverId();

            // Having a race_result record means the driver participated in the race.
            // No participation check needed - only drivers who competed have records.

            // Initialize driver data if not already set
            if (!isset($driverPoints[$driverId])) {
                $driverPoints[$driverId] = 0;
                $driverData[$driverId] = [
                    'driver_id' => $driverId,
                    'driver_name' => $driverNames[$driverId] ?? 'Unknown Driver',
                ];
                $raceResultsByDriver[$driverId] = [];
                $driverPositionsGained[$driverId] = 0;
                $driverBestTimes[$driverId] = [
                    'race_time_ms' => null,
                    'qualifier_time_ms' => null,
                    'fastest_lap_ms' => null,
                ];
                $driverHasDnfOrDns[$driverId] = false;
                $driverTotalPenalties[$driverId] = 0;
            }

            // Check for DNF - driver gets 0 points for this race
            if ($result->dnf()) {
                $driverHasDnfOrDns[$driverId] = true;
                // Store result for reference but with 0 points
                $raceResultsByDriver[$driverId][] = [
                    'race_points' => 0,
                    'is_qualifier' => $race->isQualifier(),
                    'fastest_lap' => null,
                    'is_dnf' => true,
                    'is_dns' => false,
                ];
                continue;
            }

            // Note: Previously checked for DNS (no valid race time) but now having a race_result
            // means the driver participated. Points are stored in racePoints field regardless
            // of whether time data exists. Time data is only used for tie-breaking.

            // Accumulate points for valid finishes
            $driverPoints[$driverId] += $result->racePoints();

            // Accumulate positions gained
            if ($result->positionsGained() !== null) {
                $driverPositionsGained[$driverId] += $result->positionsGained();
            }

            // Accumulate total penalties (in milliseconds)
            $penaltyMs = $result->penalties()->toMilliseconds();
            if ($penaltyMs !== null && $penaltyMs > 0) {
                $driverTotalPenalties[$driverId] += $penaltyMs;
            }

            // Store result for tie-breaking
            $raceResultsByDriver[$driverId][] = [
                'race_points' => $result->racePoints(),
                'is_qualifier' => $race->isQualifier(),
                'fastest_lap' => $result->fastestLap()->value(),
                'is_dnf' => false,
                'is_dns' => false,
            ];

            // Track best times for time-based sorting (when no round_points)
            if ($race->isQualifier()) {
                // For qualifiers, track the best qualifying time (fastest_lap field)
                $qualifierTimeMs = $result->fastestLap()->toMilliseconds();
                if ($qualifierTimeMs !== null && $qualifierTimeMs > 0) {
                    $currentBest = $driverBestTimes[$driverId]['qualifier_time_ms'];
                    if ($currentBest === null || $qualifierTimeMs < $currentBest) {
                        $driverBestTimes[$driverId]['qualifier_time_ms'] = $qualifierTimeMs;
                    }
                }
            } else {
                // For races, track the best race time (including penalties)
                $raceTimeMs = $result->finalRaceTime()->toMilliseconds();
                if ($raceTimeMs !== null && $raceTimeMs > 0) {
                    $currentBest = $driverBestTimes[$driverId]['race_time_ms'];
                    if ($currentBest === null || $raceTimeMs < $currentBest) {
                        $driverBestTimes[$driverId]['race_time_ms'] = $raceTimeMs;
                    }
                }

                // Track the best fastest lap from races
                $fastestLapMs = $result->fastestLap()->toMilliseconds();
                if ($fastestLapMs !== null && $fastestLapMs > 0) {
                    $currentBest = $driverBestTimes[$driverId]['fastest_lap_ms'];
                    if ($currentBest === null || $fastestLapMs < $currentBest) {
                        $driverBestTimes[$driverId]['fastest_lap_ms'] = $fastestLapMs;
                    }
                }
            }
        }

        return [
            'driverPoints' => $driverPoints,
            'driverData' => $driverData,
            'raceResultsByDriver' => $raceResultsByDriver,
            'driverPositionsGained' => $driverPositionsGained,
            'driverBestTimes' => $driverBestTimes,
            'driverHasDnfOrDns' => $driverHasDnfOrDns,
            'driverTotalPenalties' => $driverTotalPenalties,
        ];
    }

    /**
     * Sort drivers by points with tie-breaking logic.
     *
     * BUSINESS RULES:
     * - When tiebreaker DISABLED (Mode 1): Tied drivers share SAME position and SAME points, next driver skips positions
     * - When tiebreaker ENABLED (Mode 2): Apply configured tiebreaker rules to resolve ties
     * - Drivers with only DNF/DNS results (no valid finishes) are placed at the bottom
     * - When all drivers have 0 points (no round_points configured), sort by time-based ordering
     *
     * @param array<int, float> $driverPoints
     * @param array<int, array<mixed>> $raceResultsByDriver
     * @param array<int, array<string, int|null>> $driverBestTimes
     * @param array<int, bool> $driverHasDnfOrDns
     * @param Season $season
     * @param array<array{race: Race, result: RaceResult}> $allRaceResults
     * @return array{sortedDriverPoints: array<int, float>, tiebreakerInfo: \App\Domain\Competition\ValueObjects\TiebreakerInformation|null}
     */
    private function sortDriversWithTieBreaking(
        array $driverPoints,
        array $raceResultsByDriver,
        array $driverBestTimes = [],
        array $driverHasDnfOrDns = [],
        ?Season $season = null,
        array $allRaceResults = []
    ): array {
        $sortableDrivers = [];
        foreach ($driverPoints as $driverId => $points) {
            // Check if driver has ONLY DNF/DNS (no valid times at all)
            $hasOnlyDnfOrDns = ($driverHasDnfOrDns[$driverId] ?? false)
                && ($driverBestTimes[$driverId]['race_time_ms'] ?? null) === null
                && ($driverBestTimes[$driverId]['qualifier_time_ms'] ?? null) === null
                && ($driverBestTimes[$driverId]['fastest_lap_ms'] ?? null) === null;

            $sortableDrivers[$driverId] = [
                'points' => $points,
                'driver_id' => $driverId,
                'has_only_dnf_or_dns' => $hasOnlyDnfOrDns,
            ];
        }

        // Check if all drivers have 0 points (no round_points on races)
        $allZeroPoints = !empty($driverPoints) && array_sum($driverPoints) === 0.0;

        // Check if tiebreaker is enabled
        $tiebreakerEnabled = $season !== null && $season->hasTiebreakerRulesEnabled();
        $tiebreakerInfo = null;

        if ($tiebreakerEnabled && !empty($allRaceResults)) {
            // MODE 2: Tiebreaker ENABLED - Apply tiebreaker rules to resolve ties
            // First, sort by points to create initial standings
            uasort($sortableDrivers, function ($driverA, $driverB) {
                // Drivers with only DNF/DNS go to the bottom
                $aOnlyDnfDns = $driverA['has_only_dnf_or_dns'];
                $bOnlyDnfDns = $driverB['has_only_dnf_or_dns'];

                if ($aOnlyDnfDns !== $bOnlyDnfDns) {
                    return $aOnlyDnfDns ? 1 : -1;
                }

                if ($aOnlyDnfDns && $bOnlyDnfDns) {
                    return 0;
                }

                // Sort by points (descending)
                return $driverB['points'] <=> $driverA['points'];
            });

            // Build initial standings for tiebreaker service
            $initialStandings = [];
            foreach ($sortableDrivers as $driverId => $data) {
                $initialStandings[] = [
                    'driver_id' => $driverId,
                    'total_points' => $data['points'],
                ];
            }

            // Apply tiebreaker rules
            $tiebreakerRules = $season->getTiebreakerRules();
            $result = $this->tiebreakerDomainService->resolveTies(
                $initialStandings,
                $tiebreakerRules,
                $allRaceResults
            );

            $resolvedStandings = $result['standings'];
            $tiebreakerInfo = $result['tiebreakerInfo'];

            // Re-sort sortableDrivers based on resolved standings order
            $positionMap = [];
            foreach ($resolvedStandings as $index => $standing) {
                $positionMap[$standing['driver_id']] = $index;
            }

            uasort($sortableDrivers, function ($driverA, $driverB) use ($positionMap) {
                $posA = $positionMap[$driverA['driver_id']] ?? PHP_INT_MAX;
                $posB = $positionMap[$driverB['driver_id']] ?? PHP_INT_MAX;
                return $posA <=> $posB;
            });
        } else {
            // MODE 1: Tiebreaker DISABLED - Drivers with same points share position
            // Sort using traditional tie-breaking (best race result, then time)
            uasort($sortableDrivers, function ($driverA, $driverB) use ($raceResultsByDriver, $driverBestTimes, $allZeroPoints) {
                // First: Drivers with only DNF/DNS go to the bottom
                $aOnlyDnfDns = $driverA['has_only_dnf_or_dns'];
                $bOnlyDnfDns = $driverB['has_only_dnf_or_dns'];

                if ($aOnlyDnfDns !== $bOnlyDnfDns) {
                    return $aOnlyDnfDns ? 1 : -1;
                }

                if ($aOnlyDnfDns && $bOnlyDnfDns) {
                    return 0;
                }

                // Primary sort: by points (descending)
                if ($driverA['points'] !== $driverB['points']) {
                    return $driverB['points'] <=> $driverA['points'];
                }

                // IMPORTANT: When tiebreaker is DISABLED, tied drivers should share position
                // We return 0 to indicate they are equal (will be handled in position assignment)
                // However, we still need a stable sort order for display purposes

                // When all drivers have 0 points, sort by time for stable ordering
                if ($allZeroPoints && !empty($driverBestTimes)) {
                    return $this->compareDriversByTime(
                        $driverA['driver_id'],
                        $driverB['driver_id'],
                        $driverBestTimes
                    );
                }

                // For non-zero points ties, use best race result for stable ordering (but they'll share position)
                $racePointsA = array_column($raceResultsByDriver[$driverA['driver_id']], 'race_points');
                $racePointsB = array_column($raceResultsByDriver[$driverB['driver_id']], 'race_points');

                $bestA = !empty($racePointsA) ? max($racePointsA) : 0;
                $bestB = !empty($racePointsB) ? max($racePointsB) : 0;

                if ($bestA !== $bestB) {
                    return $bestB <=> $bestA;
                }

                // Final stable sort: compare by time if available
                if (!empty($driverBestTimes)) {
                    return $this->compareDriversByTime(
                        $driverA['driver_id'],
                        $driverB['driver_id'],
                        $driverBestTimes
                    );
                }

                return 0;
            });
        }

        // Extract sorted driver points
        $sorted = [];
        foreach ($sortableDrivers as $driverId => $data) {
            $sorted[$driverId] = $data['points'];
        }

        return [
            'sortedDriverPoints' => $sorted,
            'tiebreakerInfo' => $tiebreakerInfo,
        ];
    }

    /**
     * Compare two drivers by their best times.
     *
     * Priority order:
     * 1. Race time (fastest race finish)
     * 2. Qualifier time (if no race time)
     * 3. Fastest lap (if no race or qualifier time)
     *
     * @param int $driverAId
     * @param int $driverBId
     * @param array<int, array<string, int|null>> $driverBestTimes
     * @return int Comparison result (-1, 0, or 1)
     */
    private function compareDriversByTime(int $driverAId, int $driverBId, array $driverBestTimes): int
    {
        $timesA = $driverBestTimes[$driverAId] ?? ['race_time_ms' => null, 'qualifier_time_ms' => null, 'fastest_lap_ms' => null];
        $timesB = $driverBestTimes[$driverBId] ?? ['race_time_ms' => null, 'qualifier_time_ms' => null, 'fastest_lap_ms' => null];

        // 1. Compare by race time (ascending - lower is better)
        $raceTimeA = $timesA['race_time_ms'];
        $raceTimeB = $timesB['race_time_ms'];

        if ($raceTimeA !== null && $raceTimeB !== null) {
            if ($raceTimeA !== $raceTimeB) {
                return $raceTimeA <=> $raceTimeB;
            }
        } elseif ($raceTimeA !== null) {
            // Driver A has race time, driver B doesn't - A wins
            return -1;
        } elseif ($raceTimeB !== null) {
            // Driver B has race time, driver A doesn't - B wins
            return 1;
        }

        // 2. Compare by qualifier time (ascending - lower is better)
        $qualifierTimeA = $timesA['qualifier_time_ms'];
        $qualifierTimeB = $timesB['qualifier_time_ms'];

        if ($qualifierTimeA !== null && $qualifierTimeB !== null) {
            if ($qualifierTimeA !== $qualifierTimeB) {
                return $qualifierTimeA <=> $qualifierTimeB;
            }
        } elseif ($qualifierTimeA !== null) {
            // Driver A has qualifier time, driver B doesn't - A wins
            return -1;
        } elseif ($qualifierTimeB !== null) {
            // Driver B has qualifier time, driver A doesn't - B wins
            return 1;
        }

        // 3. Compare by fastest lap (ascending - lower is better)
        $fastestLapA = $timesA['fastest_lap_ms'];
        $fastestLapB = $timesB['fastest_lap_ms'];

        if ($fastestLapA !== null && $fastestLapB !== null) {
            return $fastestLapA <=> $fastestLapB;
        } elseif ($fastestLapA !== null) {
            return -1;
        } elseif ($fastestLapB !== null) {
            return 1;
        }

        // No times to compare
        return 0;
    }

    /**
     * Build standings array from sorted driver points.
     *
     * When tiebreaker is DISABLED, drivers with the same race_points share the same
     * position and the next driver skips positions accordingly. For example:
     * - Driver A: 25 pts → Position 1
     * - Driver B: 20 pts → Position 2 (tied)
     * - Driver C: 20 pts → Position 2 (tied, same as Driver B)
     * - Driver D: 15 pts → Position 4 (skips position 3)
     *
     * When tiebreaker is ENABLED, positions are always sequential since the sorting
     * algorithm already determined a winner among tied drivers.
     *
     * @param array<int, float> $sortedDriverPoints
     * @param array<int, array<string, mixed>> $driverData
     * @param array<int, int> $driverPositionsGained
     * @param array<int, bool> $driverHasDnfOrDns
     * @param bool $roundPointsEnabled
     * @param bool $tiebreakerEnabled
     * @param array<int, int> $driverTotalPenalties Total penalties in milliseconds per driver
     * @return array<mixed>
     */
    private function buildStandingsFromSortedPoints(
        array $sortedDriverPoints,
        array $driverData,
        array $driverPositionsGained,
        array $driverHasDnfOrDns,
        bool $roundPointsEnabled,
        bool $tiebreakerEnabled,
        array $driverTotalPenalties = []
    ): array {
        $standings = [];

        // Use sequential positions only when tiebreaker is enabled (sorting already determined a winner)
        // When tiebreaker is disabled, tied drivers should share the same position
        $useSequentialPositions = $tiebreakerEnabled;

        if ($useSequentialPositions) {
            // Positions are always sequential - sorting already determined the order
            $position = 1;
            foreach ($sortedDriverPoints as $driverId => $racePoints) {
                $totalPenaltiesMs = $driverTotalPenalties[$driverId] ?? 0;
                $totalPenaltiesSeconds = $totalPenaltiesMs > 0
                    ? number_format($totalPenaltiesMs / 1000, 3, '.', '')
                    : '0.000';

                $standings[] = [
                    'position' => $position++,
                    'driver_id' => $driverId,
                    'driver_name' => $driverData[$driverId]['driver_name'],
                    'race_points' => $racePoints,
                    'fastest_lap_points' => 0,
                    'pole_position_points' => 0,
                    'round_points' => 0,
                    'total_points' => $roundPointsEnabled ? 0 : $racePoints,
                    'total_positions_gained' => $driverPositionsGained[$driverId],
                    'has_any_dnf' => $driverHasDnfOrDns[$driverId] ?? false,
                    'total_penalties' => $totalPenaltiesSeconds,
                ];
            }
        } else {
            // Tiebreaker DISABLED:
            // Drivers with same race_points share the same position
            // and the next driver with different points skips positions accordingly
            $position = 1;
            $previousPoints = null;
            $driversAtCurrentPosition = 0;

            foreach ($sortedDriverPoints as $driverId => $racePoints) {
                if ($previousPoints !== null && $racePoints !== $previousPoints) {
                    // Points changed, advance position by number of drivers at previous position
                    $position += $driversAtCurrentPosition;
                    $driversAtCurrentPosition = 0;
                }

                $totalPenaltiesMs = $driverTotalPenalties[$driverId] ?? 0;
                $totalPenaltiesSeconds = $totalPenaltiesMs > 0
                    ? number_format($totalPenaltiesMs / 1000, 3, '.', '')
                    : '0.000';

                $standings[] = [
                    'position' => $position,
                    'driver_id' => $driverId,
                    'driver_name' => $driverData[$driverId]['driver_name'],
                    'race_points' => $racePoints,
                    'fastest_lap_points' => 0,
                    'pole_position_points' => 0,
                    'round_points' => 0,
                    'total_points' => $roundPointsEnabled ? 0 : $racePoints,
                    'total_positions_gained' => $driverPositionsGained[$driverId],
                    'has_any_dnf' => $driverHasDnfOrDns[$driverId] ?? false,
                    'total_penalties' => $totalPenaltiesSeconds,
                ];

                $driversAtCurrentPosition++;
                $previousPoints = $racePoints;
            }
        }

        return $standings;
    }

    /**
     * Build standings from actual race finishing positions.
     *
     * When round_points is enabled and all race_points are 0, standings should be
     * determined by the actual finishing positions in the main race (non-qualifier).
     * This method finds the main race and uses those positions to create the standings.
     *
     * Business Rules:
     * - Main race is the non-qualifier race (typically race_number = 1 or the last non-qualifier)
     * - If multiple non-qualifier races exist, use the last one (race with highest race_number)
     * - In SINGLE-RACE rounds: DNF drivers receive 0 round_points (filtered out from standings, placed at bottom)
     * - In MULTI-RACE rounds: DNF drivers in one race can still score points if they finished another race
     * - All drivers start with race_points = 0 (will be filled later by applyRoundPoints)
     *
     * @param array<array{race: Race, result: RaceResult}> $allRaceResults
     * @param array<int, array<string, mixed>> $driverData
     * @param array<int, int> $driverPositionsGained
     * @param array<int, bool> $driverHasDnfOrDns
     * @param array<int, int> $driverTotalPenalties Total penalties in milliseconds per driver
     * @return array<mixed>
     */
    private function buildStandingsFromRacePositions(
        array $allRaceResults,
        array $driverData,
        array $driverPositionsGained,
        array $driverHasDnfOrDns,
        array $driverTotalPenalties = []
    ): array {
        // Find the main race (non-qualifier race, preferably race_number = 1)
        // If multiple non-qualifier races exist, use the one with the highest race_number
        $mainRaceResults = [];
        $mainRaceNumber = null;
        $totalRaceCount = 0; // Track total number of races (qualifiers + main races)

        foreach ($allRaceResults as $item) {
            $race = $item['race'];
            $result = $item['result'];

            // Skip qualifiers for main race results, but count them for total
            if ($race->isQualifier()) {
                // Count unique qualifiers
                $raceNumber = $race->raceNumber() ?? 0;
                if ($raceNumber > $totalRaceCount) {
                    $totalRaceCount = $raceNumber;
                }
                continue;
            }

            $raceNumber = $race->raceNumber() ?? 0;

            // Track highest race number for total count
            if ($raceNumber > $totalRaceCount) {
                $totalRaceCount = $raceNumber;
            }

            // If this is the first non-qualifier race, or has a higher race_number, use it
            if ($mainRaceNumber === null || $raceNumber > $mainRaceNumber) {
                $mainRaceNumber = $raceNumber;
                $mainRaceResults = [];
            }

            // Collect results for this race number
            if ($raceNumber === $mainRaceNumber) {
                $mainRaceResults[] = [
                    'driver_id' => $result->driverId(),
                    'position' => $result->position(),
                    'dnf' => $result->dnf(),
                ];
            }
        }

        // If no main race found, return empty standings
        if (empty($mainRaceResults)) {
            return [];
        }

        // Detect if this is a single-race round (1 main race, possibly with 1 qualifier)
        // Count unique main race IDs (non-qualifiers)
        $mainRaceIds = [];
        foreach ($allRaceResults as $item) {
            $race = $item['race'];
            if (!$race->isQualifier()) {
                $raceId = $race->id();
                if ($raceId !== null) {
                    $mainRaceIds[$raceId] = true;
                }
            }
        }

        // Single-race round: exactly 1 main race (qualifiers don't count)
        $isSingleRaceRound = count($mainRaceIds) === 1;

        // In single-race rounds, separate DNF drivers from finishers
        if ($isSingleRaceRound) {
            $finishers = [];
            $dnfDrivers = [];

            foreach ($mainRaceResults as $result) {
                if ($result['dnf']) {
                    $dnfDrivers[] = $result;
                } else {
                    $finishers[] = $result;
                }
            }

            // Sort finishers by race position (ascending - lower is better)
            usort($finishers, function ($a, $b) {
                $posA = $a['position'] ?? PHP_INT_MAX;
                $posB = $b['position'] ?? PHP_INT_MAX;
                return $posA <=> $posB;
            });

            // Sort DNF drivers by race position (they still have positions in the results)
            usort($dnfDrivers, function ($a, $b) {
                $posA = $a['position'] ?? PHP_INT_MAX;
                $posB = $b['position'] ?? PHP_INT_MAX;
                return $posA <=> $posB;
            });

            // Build standings: finishers first, then DNF drivers
            $standings = [];
            $position = 1;

            // Add finishers to standings (they will receive round_points)
            foreach ($finishers as $result) {
                $driverId = $result['driver_id'];
                $totalPenaltiesMs = $driverTotalPenalties[$driverId] ?? 0;
                $totalPenaltiesSeconds = $totalPenaltiesMs > 0
                    ? number_format($totalPenaltiesMs / 1000, 3, '.', '')
                    : '0.000';

                $standings[] = [
                    'position' => $position++,
                    'driver_id' => $driverId,
                    'driver_name' => $driverData[$driverId]['driver_name'] ?? 'Unknown Driver',
                    'race_points' => 0, // Will be populated by applyRoundPoints
                    'fastest_lap_points' => 0,
                    'pole_position_points' => 0,
                    'round_points' => 0,
                    'total_points' => 0,
                    'total_positions_gained' => $driverPositionsGained[$driverId] ?? 0,
                    'has_any_dnf' => $driverHasDnfOrDns[$driverId] ?? false,
                    'should_receive_zero_points' => false, // Flag for applyRoundPoints
                    'total_penalties' => $totalPenaltiesSeconds,
                ];
            }

            // Add DNF drivers at the bottom (they will NOT receive round_points)
            foreach ($dnfDrivers as $result) {
                $driverId = $result['driver_id'];
                $totalPenaltiesMs = $driverTotalPenalties[$driverId] ?? 0;
                $totalPenaltiesSeconds = $totalPenaltiesMs > 0
                    ? number_format($totalPenaltiesMs / 1000, 3, '.', '')
                    : '0.000';

                $standings[] = [
                    'position' => $position++,
                    'driver_id' => $driverId,
                    'driver_name' => $driverData[$driverId]['driver_name'] ?? 'Unknown Driver',
                    'race_points' => 0,
                    'fastest_lap_points' => 0,
                    'pole_position_points' => 0,
                    'round_points' => 0,
                    'total_points' => 0,
                    'total_positions_gained' => $driverPositionsGained[$driverId] ?? 0,
                    'has_any_dnf' => true,
                    'should_receive_zero_points' => true, // Flag for applyRoundPoints to skip awarding points
                    'total_penalties' => $totalPenaltiesSeconds,
                ];
            }
        } else {
            // Multi-race round: existing behavior (DNF in one race but finished another = still gets points)
            // Sort by race position (ascending - lower is better)
            usort($mainRaceResults, function ($a, $b) {
                $posA = $a['position'] ?? PHP_INT_MAX;
                $posB = $b['position'] ?? PHP_INT_MAX;
                return $posA <=> $posB;
            });

            // Build standings from race positions
            $standings = [];
            $position = 1;

            foreach ($mainRaceResults as $result) {
                $driverId = $result['driver_id'];
                $totalPenaltiesMs = $driverTotalPenalties[$driverId] ?? 0;
                $totalPenaltiesSeconds = $totalPenaltiesMs > 0
                    ? number_format($totalPenaltiesMs / 1000, 3, '.', '')
                    : '0.000';

                $standings[] = [
                    'position' => $position++,
                    'driver_id' => $driverId,
                    'driver_name' => $driverData[$driverId]['driver_name'] ?? 'Unknown Driver',
                    'race_points' => 0, // Will be populated by applyRoundPoints
                    'fastest_lap_points' => 0,
                    'pole_position_points' => 0,
                    'round_points' => 0,
                    'total_points' => 0,
                    'total_positions_gained' => $driverPositionsGained[$driverId] ?? 0,
                    'has_any_dnf' => $driverHasDnfOrDns[$driverId] ?? false,
                    'should_receive_zero_points' => false,
                    'total_penalties' => $totalPenaltiesSeconds,
                ];
            }
        }

        return $standings;
    }

    /**
     * Apply bonus points based on round configuration.
     *
     * @param Round $round
     * @param array<array{race: Race, result: RaceResult}> $allRaceResults
     * @param array<mixed> $standings
     * @param bool $roundPointsEnabled
     * @return array<mixed>
     */
    private function applyBonusPoints(Round $round, array $allRaceResults, array $standings, bool $roundPointsEnabled): array
    {
        if ($roundPointsEnabled) {
            // Round points mode: apply round-level bonuses
            $standings = $this->applyFastestLapBonus($round, $allRaceResults, $standings, true);
            $standings = $this->applyPolePositionBonus($round, $allRaceResults, $standings, true);

            // Apply round points based on position
            if ($round->pointsSystem() !== null) {
                $standings = $this->applyRoundPoints($round, $standings);
            }

            // Calculate total points
            foreach ($standings as &$standing) {
                $standing['total_points'] = $standing['round_points']
                    + $standing['fastest_lap_points']
                    + $standing['pole_position_points'];
            }
        } else {
            // Non-round-points mode: tally race-level bonuses
            $standings = $this->tallyRaceLevelBonuses($allRaceResults, $standings);
        }

        return $standings;
    }

    /**
     * Calculate round results with divisions.
     *
     * @param Round $round
     * @param array<array{
     *     race: Race,
     *     result: RaceResult
     * }> $allRaceResults
     * @param Season $season
     * @return array<mixed>
     */
    private function calculateRoundResultsWithDivisions(Round $round, array $allRaceResults, Season $season): array
    {
        // Extract unique division IDs for batch fetch
        $divisionIds = [];
        foreach ($allRaceResults as $item) {
            $result = $item['result'];
            $divisionId = $result->divisionId() ?? 0;
            if ($divisionId > 0) {
                $divisionIds[$divisionId] = true;
            }
        }
        $divisionIds = array_keys($divisionIds);

        // Batch fetch division names to avoid N+1 queries
        $divisionNames = $this->batchFetchDivisionNames($divisionIds);

        // Group results by division
        $resultsByDivision = [];
        foreach ($allRaceResults as $item) {
            $result = $item['result'];
            $divisionId = $result->divisionId() ?? 0;

            if (!isset($resultsByDivision[$divisionId])) {
                $resultsByDivision[$divisionId] = [];
            }

            $resultsByDivision[$divisionId][] = $item;
        }

        // Calculate standings for each division
        $divisionStandings = [];
        foreach ($resultsByDivision as $divisionId => $divisionResults) {
            $divisionData = $this->calculateRoundResultsWithoutDivisions($round, $divisionResults, $season);

            $divisionStandings[] = [
                'division_id' => $divisionId === 0 ? null : $divisionId,
                'division_name' => $divisionId === 0
                    ? 'No Division'
                    : ($divisionNames[$divisionId] ?? 'Unknown Division'),
                'results' => $divisionData['standings'],
            ];
        }

        return ['standings' => $divisionStandings];
    }

    /**
     * Apply fastest lap bonus at round level (races only, not qualifiers).
     *
     * When roundPointsEnabled is true:
     * - Find fastest lap across ALL races (excluding qualifiers)
     * - Award bonus to that driver
     * - Positions are NOT re-sorted (they're fixed by race_points)
     * - Check top 10 restriction based on existing position
     *
     * @param Round $round
     * @param array<array{
     *     race: Race,
     *     result: RaceResult
     * }> $allRaceResults
     * @param array<mixed> $standings
     * @param bool $roundPointsEnabled Whether round points mode is enabled
     * @return array<mixed>
     */
    private function applyFastestLapBonus(
        Round $round,
        array $allRaceResults,
        array $standings,
        bool $roundPointsEnabled
    ): array {
        $fastestLapPoints = $round->fastestLap();
        if ($fastestLapPoints === null || $fastestLapPoints === 0) {
            return $standings;
        }

        // Find the fastest lap across ALL races (exclude qualifiers)
        $fastestLapDriverId = null;
        $fastestLapTime = null;

        foreach ($allRaceResults as $item) {
            $race = $item['race'];
            $result = $item['result'];

            // Skip qualifiers
            if ($race->isQualifier()) {
                continue;
            }

            $lapTime = $result->fastestLap();
            if (!$lapTime->isNull()) {
                $lapTimeMs = $lapTime->toMilliseconds();
                if ($lapTimeMs !== null && ($fastestLapTime === null || $lapTimeMs < $fastestLapTime)) {
                    $fastestLapTime = $lapTimeMs;
                    $fastestLapDriverId = $result->driverId();
                }
            }
        }

        if ($fastestLapDriverId === null) {
            return $standings;
        }

        // Check top positions restriction BEFORE awarding (based on race_points position)
        if ($round->fastestLapTop10()) {
            $driverPosition = null;
            foreach ($standings as $standing) {
                if ($standing['driver_id'] === $fastestLapDriverId) {
                    $driverPosition = $standing['position'];
                    break;
                }
            }
            if ($driverPosition !== null && $driverPosition > self::TOP_POSITIONS_LIMIT) {
                // Driver is outside top positions, no bonus awarded
                return $standings;
            }
        }

        // Award fastest lap bonus (positions do NOT change)
        foreach ($standings as &$standing) {
            if ($standing['driver_id'] === $fastestLapDriverId) {
                $standing['fastest_lap_points'] = $fastestLapPoints;
                // Note: total_points is calculated by the caller based on roundPointsEnabled
                break;
            }
        }

        return $standings;
    }

    /**
     * Apply pole position bonus at round level (fastest qualifying time across all qualifiers).
     *
     * When roundPointsEnabled is true:
     * - Find fastest qualifying time across ALL qualifying sessions
     * - Award bonus to that driver
     * - Positions are NOT re-sorted (they're fixed by race_points)
     * - Check top 10 restriction based on existing position
     *
     * @param Round $round
     * @param array<array{
     *     race: Race,
     *     result: RaceResult
     * }> $allRaceResults
     * @param array<mixed> $standings
     * @param bool $roundPointsEnabled Whether round points mode is enabled
     * @return array<mixed>
     */
    private function applyPolePositionBonus(
        Round $round,
        array $allRaceResults,
        array $standings,
        bool $roundPointsEnabled
    ): array {
        $polePoints = $round->qualifyingPole();
        if ($polePoints === null || $polePoints === 0) {
            return $standings;
        }

        // Find the fastest qualifying time across ALL qualifying sessions
        $poleDriverId = null;
        $fastestQualifyingTime = null;

        foreach ($allRaceResults as $item) {
            $race = $item['race'];
            $result = $item['result'];

            // Only consider qualifiers
            if (!$race->isQualifier()) {
                continue;
            }

            $lapTime = $result->fastestLap();
            if (!$lapTime->isNull()) {
                $lapTimeMs = $lapTime->toMilliseconds();
                if ($lapTimeMs !== null && ($fastestQualifyingTime === null || $lapTimeMs < $fastestQualifyingTime)) {
                    $fastestQualifyingTime = $lapTimeMs;
                    $poleDriverId = $result->driverId();
                }
            }
        }

        if ($poleDriverId === null) {
            return $standings;
        }

        // Check top positions restriction BEFORE awarding (based on race_points position)
        if ($round->qualifyingPoleTop10()) {
            $driverPosition = null;
            foreach ($standings as $standing) {
                if ($standing['driver_id'] === $poleDriverId) {
                    $driverPosition = $standing['position'];
                    break;
                }
            }
            if ($driverPosition !== null && $driverPosition > self::TOP_POSITIONS_LIMIT) {
                // Driver is outside top positions, no bonus awarded
                return $standings;
            }
        }

        // Award pole position bonus (positions do NOT change)
        foreach ($standings as &$standing) {
            if ($standing['driver_id'] === $poleDriverId) {
                $standing['pole_position_points'] = $polePoints;
                // Note: total_points is calculated by the caller based on roundPointsEnabled
                break;
            }
        }

        return $standings;
    }

    /**
     * Apply round points based on final standings positions.
     * Round points are stored separately and added to total_points along with bonuses.
     *
     * Note: In multi-race rounds, drivers with DNF in one or more races still receive
     * round_points based on their final position. The DNF already penalizes them by
     * giving 0 race_points for that race, which affects their overall position. This
     * ensures drivers who complete other races successfully are still rewarded.
     *
     * However, in single-race rounds, drivers with DNF receive 0 round_points
     * (flagged by should_receive_zero_points).
     *
     * @param Round $round
     * @param array<mixed> $standings
     * @return array<mixed>
     */
    private function applyRoundPoints(Round $round, array $standings): array
    {
        $pointsSystem = $round->pointsSystem();
        if ($pointsSystem === null) {
            return $standings;
        }

        $pointsArray = $pointsSystem->toArray();

        foreach ($standings as &$standing) {
            // Check if this driver should receive zero points (DNF in single-race round)
            if (isset($standing['should_receive_zero_points']) && $standing['should_receive_zero_points'] === true) {
                $standing['round_points'] = 0;
                continue;
            }

            $position = $standing['position'];
            if (isset($pointsArray[$position])) {
                $roundPoints = $pointsArray[$position];
                $standing['round_points'] = $roundPoints;
            } else {
                $standing['round_points'] = 0;
            }
        }

        return $standings;
    }

    /**
     * Tally race-level bonuses from individual race results.
     * Used when round_points is DISABLED - bonuses are already included in race_points,
     * this method extracts them for display purposes.
     *
     * @param array<array{
     *     race: Race,
     *     result: RaceResult
     * }> $allRaceResults
     * @param array<mixed> $standings
     * @return array<mixed>
     */
    private function tallyRaceLevelBonuses(array $allRaceResults, array $standings): array
    {
        // Count bonus points from race-level awards
        $driverFastestLapPoints = [];
        $driverPolePoints = [];

        foreach ($allRaceResults as $item) {
            $race = $item['race'];
            $result = $item['result'];
            $driverId = $result->driverId();

            // Tally fastest lap bonuses (from non-qualifier races)
            if (!$race->isQualifier() && $result->hasFastestLap()) {
                if (!isset($driverFastestLapPoints[$driverId])) {
                    $driverFastestLapPoints[$driverId] = 0;
                }
                $driverFastestLapPoints[$driverId] += ($race->fastestLap() ?? 0);
            }

            // Tally pole bonuses (from qualifier races)
            if ($race->isQualifier() && $result->hasPole()) {
                if (!isset($driverPolePoints[$driverId])) {
                    $driverPolePoints[$driverId] = 0;
                }
                $driverPolePoints[$driverId] += ($race->qualifyingPole() ?? 0);
            }
        }

        // Update standings with tallied bonuses
        foreach ($standings as &$standing) {
            $driverId = $standing['driver_id'];
            $standing['fastest_lap_points'] = $driverFastestLapPoints[$driverId] ?? 0;
            $standing['pole_position_points'] = $driverPolePoints[$driverId] ?? 0;
        }

        return $standings;
    }

    /**
     * Calculate cross-division results for qualifying, race time, and fastest lap.
     *
     * @param array<array{
     *     race: Race,
     *     result: RaceResult
     * }> $allRaceResults
     * @return array{
     *     qualifying_results: array<mixed>,
     *     race_time_results: array<mixed>,
     *     fastest_lap_results: array<mixed>
     * }
     */
    private function calculateCrossDivisionResults(array $allRaceResults): array
    {
        $qualifyingByDriver = []; // Track best qualifying time per driver
        $raceTimeByDriver = []; // Track best race time per driver
        $fastestLapByDriver = []; // Track best fastest lap per driver

        foreach ($allRaceResults as $item) {
            $race = $item['race'];
            $result = $item['result'];
            $resultId = $result->id();

            if ($resultId === null) {
                continue;
            }

            // 1. Qualifying results: best fastest_lap per driver from qualifiers
            if ($race->isQualifier()) {
                $lapTime = $result->fastestLap();
                if (!$lapTime->isNull()) {
                    $lapTimeMs = $lapTime->toMilliseconds();
                    if ($lapTimeMs !== null && $lapTimeMs > 0) {
                        $driverId = $result->driverId();

                        // Keep only the best (fastest) qualifying time per driver
                        if (
                            !isset($qualifyingByDriver[$driverId]) ||
                            $lapTimeMs < $qualifyingByDriver[$driverId]['time_ms']
                        ) {
                            $qualifyingByDriver[$driverId] = [
                                'race_result_id' => $resultId,
                                'time_ms' => $lapTimeMs,
                            ];
                        }
                    }
                }
            } else {
                // 2. Race time results: best final race_time per driver from non-qualifiers
                // Skip DNF entries (they may have null or empty race_time)
                if (!$result->dnf()) {
                    $raceTime = $result->finalRaceTime();
                    if (!$raceTime->isNull()) {
                        $raceTimeMs = $raceTime->toMilliseconds();
                        if ($raceTimeMs !== null && $raceTimeMs > 0) {
                            $driverId = $result->driverId();

                            // Keep only the best (fastest) time per driver
                            if (
                                !isset($raceTimeByDriver[$driverId]) ||
                                $raceTimeMs < $raceTimeByDriver[$driverId]['time_ms']
                            ) {
                                $raceTimeByDriver[$driverId] = [
                                    'race_result_id' => $resultId,
                                    'time_ms' => $raceTimeMs,
                                ];
                            }
                        }
                    }
                }

                // 3. Fastest lap results: best fastest_lap per driver from non-qualifiers
                $lapTime = $result->fastestLap();
                if (!$lapTime->isNull()) {
                    $lapTimeMs = $lapTime->toMilliseconds();
                    if ($lapTimeMs !== null && $lapTimeMs > 0) {
                        $driverId = $result->driverId();

                        // Keep only the best (fastest) lap per driver
                        if (
                            !isset($fastestLapByDriver[$driverId]) ||
                            $lapTimeMs < $fastestLapByDriver[$driverId]['time_ms']
                        ) {
                            $fastestLapByDriver[$driverId] = [
                                'race_result_id' => $resultId,
                                'time_ms' => $lapTimeMs,
                            ];
                        }
                    }
                }
            }
        }

        // Convert qualifying by driver to array and sort by time (fastest first)
        $qualifyingResults = array_values($qualifyingByDriver);
        usort($qualifyingResults, fn($a, $b) => $a['time_ms'] <=> $b['time_ms']);

        // Add positions to qualifying results
        $position = 1;
        foreach ($qualifyingResults as &$qr) {
            $qr['position'] = $position++;
        }

        // Convert race time by driver to array and sort
        $raceTimeResults = array_values($raceTimeByDriver);
        usort($raceTimeResults, fn($a, $b) => $a['time_ms'] <=> $b['time_ms']);

        // Add positions to race time results
        $position = 1;
        foreach ($raceTimeResults as &$rtr) {
            $rtr['position'] = $position++;
        }

        // Convert fastest lap by driver to array and sort by time (fastest first)
        $fastestLapResults = array_values($fastestLapByDriver);
        usort($fastestLapResults, fn($a, $b) => $a['time_ms'] <=> $b['time_ms']);

        // Add positions to fastest lap results
        $position = 1;
        foreach ($fastestLapResults as &$flr) {
            $flr['position'] = $position++;
        }

        return [
            'qualifying_results' => $qualifyingResults,
            'race_time_results' => $raceTimeResults,
            'fastest_lap_results' => $fastestLapResults,
        ];
    }

    /**
     * Check if any cross-division results are provided in the data.
     */
    private function hasAnyCrossDivisionResults(CompleteRoundData $data): bool
    {
        return $data->qualifying_results !== null
            || $data->race_time_results !== null
            || $data->fastest_lap_results !== null;
    }

    /**
     * Calculate and store team championship results for a round.
     * Aggregates driver points per team from round_results and respects the teams_drivers_for_calculation setting.
     *
     * Business Rules:
     * - Only runs if season.team_championship_enabled = true
     * - Uses total_points from round_results (includes race points, bonuses, round points)
     * - Drivers with team_id = null (privateers) are excluded
     * - Teams with no drivers are excluded from standings
     * - If teams_drivers_for_calculation is set, only top N drivers count
     * - Tie-breaking: Teams with equal points are sorted alphabetically by name
     *
     * NOTE: This method gets driver points from round_results instead of raw race_results.
     * The round_results field contains the final calculated standings with all bonuses applied.
     */
    private function calculateTeamChampionshipResults(Round $round): void
    {
        // Get season to check team championship configuration
        $season = $this->seasonRepository->findById($round->seasonId());

        // Early return if team championship is not enabled
        if (!$season->teamChampionshipEnabled()) {
            return;
        }

        // Get round results which contain the final driver standings
        $roundResults = $round->roundResults();
        if ($roundResults === null || !isset($roundResults['standings']) || empty($roundResults['standings'])) {
            Log::warning('Team championship calculation skipped: no round results available', [
                'round_id' => $round->id(),
            ]);
            return;
        }

        // Get all season drivers with team assignments
        $seasonDrivers = $this->seasonDriverRepository->findBySeason($season->id() ?? 0);

        // Map season_driver_id to team_id
        // Note: round_results uses season_driver_id (stored as driver_id in race_results)
        $driverToTeamMap = [];
        foreach ($seasonDrivers as $seasonDriver) {
            $teamId = $seasonDriver->teamId();
            $seasonDriverId = $seasonDriver->id();
            if ($teamId !== null && $seasonDriverId !== null) {
                $driverToTeamMap[$seasonDriverId] = $teamId;
            }
        }

        // Get all teams for this season
        $teams = $this->teamRepository->findBySeasonId($season->id() ?? 0);
        if (empty($teams)) {
            return;
        }

        // Extract driver standings from round results
        // Handle both division-based and non-division-based results
        $driverStandings = [];
        $standings = $roundResults['standings'];

        if (is_array($standings) && isset($standings[0]['division_id'])) {
            // Division-based results: flatten all division standings
            foreach ($standings as $divisionStanding) {
                foreach ($divisionStanding['results'] ?? [] as $driverResult) {
                    $driverStandings[] = $driverResult;
                }
            }
        } else {
            // Non-division results: use standings directly
            $driverStandings = $standings;
        }

        // Build team standings from round results
        $teamDriverPoints = [];

        foreach ($driverStandings as $driverResult) {
            $driverId = $driverResult['driver_id'];
            $totalPoints = $driverResult['total_points'] ?? 0;

            // Find the team for this driver
            $teamId = $driverToTeamMap[$driverId] ?? null;

            // Skip if driver has no team (privateer)
            if ($teamId === null) {
                continue;
            }

            // Initialize team data if not exists
            if (!isset($teamDriverPoints[$teamId])) {
                $teamDriverPoints[$teamId] = [];
            }

            // Store driver's total points for the team
            $teamDriverPoints[$teamId][] = [
                'driver_id' => $driverId,
                'points' => $totalPoints,
            ];
        }

        // Calculate final standings for each team
        $standings = [];
        $driversForCalculation = $season->getTeamsDriversForCalculation();

        foreach ($teams as $team) {
            $teamId = $team->id();
            if ($teamId === null || !isset($teamDriverPoints[$teamId])) {
                // Skip teams with no results
                continue;
            }

            $driverPoints = $teamDriverPoints[$teamId];

            // Sort drivers by points descending
            usort($driverPoints, fn($a, $b) => $b['points'] <=> $a['points']);

            // Apply teams_drivers_for_calculation limit if set
            if ($driversForCalculation !== null && $driversForCalculation > 0) {
                $driverPoints = array_slice($driverPoints, 0, $driversForCalculation);
            }

            // Sum the points from top drivers
            $totalPoints = array_sum(array_column($driverPoints, 'points'));
            $driverIds = array_column($driverPoints, 'driver_id');

            $standings[] = [
                'team_id' => $teamId,
                'team_name' => $team->name()->value(),
                'total_points' => $totalPoints,
                'driver_ids' => $driverIds, // Store driver IDs instead of race_result_ids
            ];
        }

        // Sort standings: by total_points descending, then by team_name alphabetically
        usort($standings, function ($a, $b) {
            if ($a['total_points'] !== $b['total_points']) {
                return $b['total_points'] <=> $a['total_points'];
            }
            return strcmp($a['team_name'], $b['team_name']);
        });

        // Remove team_name from final output (only needed for sorting)
        foreach ($standings as &$standing) {
            unset($standing['team_name']);
        }

        // Store results in round entity
        $teamChampionshipResults = ['standings' => $standings];
        $round->setTeamChampionshipResults($teamChampionshipResults);
        $this->roundRepository->save($round);

        Log::info('Team championship results calculated', [
            'round_id' => $round->id(),
            'teams_count' => count($standings),
        ]);
    }

    /**
     * Authorize that the user owns the league.
     *
     * @throws UnauthorizedException
     */
    private function authorizeLeagueOwner(int $seasonId, int $userId): void
    {
        $season = $this->seasonRepository->findById($seasonId);
        $competition = $this->competitionRepository->findById($season->competitionId());
        $league = $this->leagueRepository->findById($competition->leagueId());

        if ($league->ownerUserId() !== $userId) {
            throw new UnauthorizedException('Only league owner can manage rounds');
        }
    }

    /**
     * Dispatch all recorded domain events.
     */
    private function dispatchEvents(Round $round): void
    {
        foreach ($round->releaseEvents() as $event) {
            Event::dispatch($event);
        }
    }
}
