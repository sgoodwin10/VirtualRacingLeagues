<?php

declare(strict_types=1);

namespace App\Application\Competition\Services;

use App\Application\Competition\DTOs\CreateRoundData;
use App\Application\Competition\DTOs\UpdateRoundData;
use App\Application\Competition\DTOs\RoundData;
use App\Application\Competition\DTOs\RoundResultsData;
use App\Application\Competition\DTOs\RaceEventResultData;
use App\Application\Competition\DTOs\RaceResultData;
use App\Application\Competition\DTOs\DivisionData;
use App\Domain\Competition\Entities\Round;
use App\Domain\Competition\Repositories\RoundRepositoryInterface;
use App\Domain\Competition\Repositories\RaceRepositoryInterface;
use App\Domain\Competition\Repositories\RaceResultRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonRepositoryInterface;
use App\Domain\Competition\Repositories\CompetitionRepositoryInterface;
use App\Domain\League\Repositories\LeagueRepositoryInterface;
use App\Domain\Shared\Exceptions\UnauthorizedException;
use App\Domain\Competition\ValueObjects\RoundName;
use App\Domain\Competition\ValueObjects\RoundNumber;
use App\Domain\Competition\ValueObjects\RoundSlug;
use App\Domain\Competition\ValueObjects\RoundStatus;
use App\Domain\Competition\ValueObjects\PointsSystem;
use App\Domain\Competition\ValueObjects\RaceResultStatus;
use App\Infrastructure\Persistence\Eloquent\Models\Round as RoundEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\Division;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use DateTimeImmutable;

/**
 * Application service for Round use cases.
 * Orchestrates round CRUD operations, manages transactions, dispatches events.
 */
final class RoundApplicationService
{
    public function __construct(
        private readonly RoundRepositoryInterface $roundRepository,
        private readonly RaceRepositoryInterface $raceRepository,
        private readonly RaceResultRepositoryInterface $raceResultRepository,
        private readonly SeasonRepositoryInterface $seasonRepository,
        private readonly CompetitionRepositoryInterface $competitionRepository,
        private readonly LeagueRepositoryInterface $leagueRepository,
        private readonly RaceApplicationService $raceApplicationService,
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
    public function updateRound(int $roundId, UpdateRoundData $data, array $requestData = [], int $userId = 0): RoundData
    {
        return DB::transaction(function () use ($roundId, $data, $requestData, $userId) {
            $round = $this->roundRepository->findById($roundId);

            // Authorize
            if ($userId > 0) {
                $this->authorizeLeagueOwner($round->seasonId(), $userId);
            }

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

            return RoundData::fromEntity($round);
        });
    }

    /**
     * Get a single round.
     */
    public function getRound(int $roundId): RoundData
    {
        $round = $this->roundRepository->findById($roundId);
        return RoundData::fromEntity($round);
    }

    /**
     * Get all rounds for a season.
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
     * Delete a round (soft delete).
     *
     * @throws UnauthorizedException
     */
    public function deleteRound(int $roundId, int $userId): void
    {
        DB::transaction(function () use ($roundId, $userId) {
            $round = $this->roundRepository->findById($roundId);

            // Authorize
            $this->authorizeLeagueOwner($round->seasonId(), $userId);

            $round->delete();
            $this->roundRepository->delete($round);
            $this->dispatchEvents($round);
        });
    }

    /**
     * Change round status.
     */
    public function changeRoundStatus(int $roundId, string $status): RoundData
    {
        return DB::transaction(function () use ($roundId, $status) {
            $round = $this->roundRepository->findById($roundId);
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
     *
     * @throws UnauthorizedException
     */
    public function completeRound(int $roundId, int $userId): RoundData
    {
        return DB::transaction(function () use ($roundId, $userId) {
            // Fetch round and authorize
            $round = $this->roundRepository->findById($roundId);
            $this->authorizeLeagueOwner($round->seasonId(), $userId);

            // Fetch season to check divisions
            $season = $this->seasonRepository->findById($round->seasonId());
            $hasDivisions = $season->raceDivisionsEnabled();

            // Cascade completion to all races (including qualifiers)
            // This triggers calculateRacePoints() for each race
            $races = $this->raceRepository->findAllByRoundId($roundId);

            // Sort races by race_number to ensure qualifiers are processed first
            // This is important because non-qualifier races may depend on qualifier positions for grid_source
            usort($races, fn($a, $b) => $a->raceNumber() <=> $b->raceNumber());

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
                if ($raceId !== null) {
                    $raceResults = $this->raceResultRepository->findByRaceId($raceId);
                    foreach ($raceResults as $result) {
                        if ($result->status() !== RaceResultStatus::CONFIRMED) {
                            $result->updateStatus(RaceResultStatus::CONFIRMED);
                            $this->raceResultRepository->save($result);
                        }
                    }
                }
            }

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

            // Calculate round results
            $roundResults = $this->calculateRoundResults($round, $allRaceResults, $hasDivisions);

            // Calculate cross-division results (qualifying, race time, fastest lap)
            $crossDivisionResults = $this->calculateCrossDivisionResults($allRaceResults);

            // Set round results and cross-division results
            $round->setRoundResults($roundResults);
            $round->setCrossDivisionResults(
                $crossDivisionResults['qualifying_results'],
                $crossDivisionResults['race_time_results'],
                $crossDivisionResults['fastest_lap_results']
            );

            // Mark as completed
            $round->complete();
            $this->roundRepository->save($round);
            $this->dispatchEvents($round);

            return RoundData::fromEntity($round);
        });
    }

    /**
     * Mark round as not completed (scheduled).
     * Does NOT affect associated races or race results - only changes round status.
     *
     * @throws UnauthorizedException
     */
    public function uncompleteRound(int $roundId, int $userId): RoundData
    {
        return DB::transaction(function () use ($roundId, $userId) {
            $round = $this->roundRepository->findById($roundId);

            // Authorize
            $this->authorizeLeagueOwner($round->seasonId(), $userId);

            $round->uncomplete();
            $this->roundRepository->save($round);
            $this->dispatchEvents($round);
            return RoundData::fromEntity($round);
        });
    }

    /**
     * Get round results with all race events and their results.
     * Fetches the round with races, divisions, and race results with driver names.
     */
    public function getRoundResults(int $roundId): RoundResultsData
    {
        // Fetch round with races and season data
        $roundEloquent = RoundEloquent::with([
            'races' => function ($query) {
                $query->orderBy('created_at', 'asc');
            },
            'races.results' => function ($query) {
                $query->orderBy('position', 'asc');
            },
            'races.results.driver.leagueDriver.driver',
            'races.results.division',
            'season',
        ])->findOrFail($roundId);

        assert($roundEloquent instanceof RoundEloquent);

        // Fetch divisions for the season
        $divisions = [];
        /** @phpstan-ignore-next-line property.notFound (loaded via eager loading) */
        if ($roundEloquent->season->race_divisions_enabled) {
            /** @var \Illuminate\Database\Eloquent\Collection<int, Division> $divisionsCollection */
            $divisionsCollection = Division::where('season_id', $roundEloquent->season_id)
                ->orderBy('name', 'asc')
                ->get();

            $divisions = $divisionsCollection->map(function (Division $division) {
                return new DivisionData(
                    id: $division->id,
                    name: $division->name,
                    description: $division->description,
                );
            })->all();
        }

        // Build round summary
        $round = [
            'id' => $roundEloquent->id,
            'round_number' => $roundEloquent->round_number,
            'name' => $roundEloquent->name,
            'status' => $roundEloquent->status,
            'round_results' => $roundEloquent->round_results,
            'qualifying_results' => $roundEloquent->qualifying_results,
            'race_time_results' => $roundEloquent->race_time_results,
            'fastest_lap_results' => $roundEloquent->fastest_lap_results,
        ];

        // Build race events with results
        /** @phpstan-ignore-next-line property.notFound (loaded via eager loading) */
        $raceEvents = $roundEloquent->races->map(function ($race) {
            $results = $race->results->map(function ($result) {
                // Get driver name from nested relationship
                $driverName = 'Unknown';
                if ($result->driver?->leagueDriver?->driver) {
                    $driverName = $result->driver->leagueDriver->driver->name;
                }

                return new RaceResultData(
                    id: $result->id,
                    race_id: $result->race_id,
                    driver_id: $result->driver_id,
                    division_id: $result->division_id,
                    position: $result->position,
                    race_time: $result->race_time,
                    race_time_difference: $result->race_time_difference,
                    fastest_lap: $result->fastest_lap,
                    penalties: $result->penalties,
                    has_fastest_lap: $result->has_fastest_lap,
                    has_pole: $result->has_pole,
                    dnf: $result->dnf,
                    status: $result->status,
                    race_points: $result->race_points,
                    positions_gained: $result->positions_gained,
                    created_at: $result->created_at->format('Y-m-d H:i:s'),
                    updated_at: $result->updated_at->format('Y-m-d H:i:s'),
                    driver: [
                        'id' => $result->driver_id,
                        'name' => $driverName,
                    ],
                );
            })->all();

            return new RaceEventResultData(
                id: $race->id,
                race_number: $race->race_number ?? 0,
                name: $race->name,
                is_qualifier: $race->is_qualifier,
                status: $race->status,
                results: $results,
            );
        })->all();

        return new RoundResultsData(
            round: $round,
            divisions: $divisions,
            race_events: $raceEvents,
        );
    }

    /**
     * Calculate round results by aggregating race points.
     *
     * @param Round $round
     * @param array<array{
     *     race: \App\Domain\Competition\Entities\Race,
     *     result: \App\Domain\Competition\Entities\RaceResult
     * }> $allRaceResults
     * @param bool $hasDivisions
     * @return array<mixed>
     */
    private function calculateRoundResults(Round $round, array $allRaceResults, bool $hasDivisions): array
    {
        if ($hasDivisions) {
            return $this->calculateRoundResultsWithDivisions($round, $allRaceResults);
        }

        return $this->calculateRoundResultsWithoutDivisions($round, $allRaceResults);
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
     *     race: \App\Domain\Competition\Entities\Race,
     *     result: \App\Domain\Competition\Entities\RaceResult
     * }> $allRaceResults
     * @return array<mixed>
     */
    private function calculateRoundResultsWithoutDivisions(Round $round, array $allRaceResults): array
    {
        $roundPointsEnabled = $round->roundPoints();

        // Extract all unique driver IDs for batch fetch
        $driverIds = [];
        foreach ($allRaceResults as $item) {
            $result = $item['result'];
            $driverIds[$result->driverId()] = true;
        }
        $driverIds = array_keys($driverIds);

        // Batch fetch driver names to avoid N+1 queries
        $driverNames = $this->batchFetchDriverNames($driverIds);

        // Aggregate points per driver
        $driverPoints = [];
        $driverData = [];
        $raceResultsByDriver = [];
        $driverPositionsGained = [];

        foreach ($allRaceResults as $item) {
            $race = $item['race'];
            $result = $item['result'];
            $driverId = $result->driverId();

            if (!isset($driverPoints[$driverId])) {
                $driverPoints[$driverId] = 0;
                $driverData[$driverId] = [
                    'driver_id' => $driverId,
                    'driver_name' => $driverNames[$driverId] ?? 'Unknown Driver',
                ];
                $raceResultsByDriver[$driverId] = [];
                $driverPositionsGained[$driverId] = 0;
            }

            // Sum race points from all sessions (races + qualifiers)
            $driverPoints[$driverId] += $result->racePoints();

            // Sum positions gained from all races
            if ($result->positionsGained() !== null) {
                $driverPositionsGained[$driverId] += $result->positionsGained();
            }

            // Store result info for tie-breaking (best single race result)
            $raceResultsByDriver[$driverId][] = [
                'race_points' => $result->racePoints(),
                'is_qualifier' => $race->isQualifier(),
                'fastest_lap' => $result->fastestLap()->value(),
            ];
        }

        // Sort drivers by total points (descending), with tie-breaking
        // Build sortable array with driver IDs as keys for proper sorting
        $sortableDrivers = [];
        foreach ($driverPoints as $driverId => $points) {
            $sortableDrivers[$driverId] = [
                'points' => $points,
                'driver_id' => $driverId,
            ];
        }

        uasort($sortableDrivers, function ($driverA, $driverB) use ($raceResultsByDriver) {
            if ($driverA['points'] !== $driverB['points']) {
                return $driverB['points'] <=> $driverA['points'];
            }

            // Tie-breaking: driver with better single best race result wins
            // TODO: This tie-breaking logic may become configurable in the future
            $bestA = max(array_column($raceResultsByDriver[$driverA['driver_id']], 'race_points'));
            $bestB = max(array_column($raceResultsByDriver[$driverB['driver_id']], 'race_points'));

            return $bestB <=> $bestA;
        });

        // Extract sorted driver IDs and points
        $driverPoints = [];
        foreach ($sortableDrivers as $driverId => $data) {
            $driverPoints[$driverId] = $data['points'];
        }

        // Build standings with positions (positions determined by race_points)
        $standings = [];
        $position = 1;
        foreach ($driverPoints as $driverId => $racePoints) {
            $standings[] = [
                'position' => $position++,
                'driver_id' => $driverId,
                'driver_name' => $driverData[$driverId]['driver_name'],
                'race_points' => $racePoints,
                'fastest_lap_points' => 0,
                'pole_position_points' => 0,
                'round_points' => 0,
                'total_points' => $roundPointsEnabled ? 0 : $racePoints, // Different based on mode
                'total_positions_gained' => $driverPositionsGained[$driverId],
            ];
        }

        if ($roundPointsEnabled) {
            // Round points mode: apply round-level bonuses (single winner across all events)
            // Positions are already fixed by race_points - bonuses do NOT affect positions
            $standings = $this->applyFastestLapBonus($round, $allRaceResults, $standings, true);
            $standings = $this->applyPolePositionBonus($round, $allRaceResults, $standings, true);

            // Apply round points based on position
            if ($round->pointsSystem() !== null) {
                $standings = $this->applyRoundPoints($round, $standings);
            }

            // Calculate total_points = round_points + fastest_lap_points + pole_position_points
            foreach ($standings as &$standing) {
                $standing['total_points'] = $standing['round_points']
                    + $standing['fastest_lap_points']
                    + $standing['pole_position_points'];
            }
        } else {
            // Non-round-points mode: tally race-level bonuses from individual race results
            $standings = $this->tallyRaceLevelBonuses($allRaceResults, $standings);
            // total_points = race_points (already set, bonuses already included in race_points)
        }

        return ['standings' => $standings];
    }

    /**
     * Calculate round results with divisions.
     *
     * @param Round $round
     * @param array<array{
     *     race: \App\Domain\Competition\Entities\Race,
     *     result: \App\Domain\Competition\Entities\RaceResult
     * }> $allRaceResults
     * @return array<mixed>
     */
    private function calculateRoundResultsWithDivisions(Round $round, array $allRaceResults): array
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
            $divisionData = $this->calculateRoundResultsWithoutDivisions($round, $divisionResults);

            $divisionStandings[] = [
                'division_id' => $divisionId === 0 ? null : $divisionId,
                'division_name' => $divisionId === 0 ? 'No Division' : ($divisionNames[$divisionId] ?? 'Unknown Division'),
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
     *     race: \App\Domain\Competition\Entities\Race,
     *     result: \App\Domain\Competition\Entities\RaceResult
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

        // Check top 10 restriction BEFORE awarding (based on race_points position)
        if ($round->fastestLapTop10()) {
            $driverPosition = null;
            foreach ($standings as $standing) {
                if ($standing['driver_id'] === $fastestLapDriverId) {
                    $driverPosition = $standing['position'];
                    break;
                }
            }
            if ($driverPosition !== null && $driverPosition > 10) {
                // Driver is outside top 10, no bonus awarded
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
     *     race: \App\Domain\Competition\Entities\Race,
     *     result: \App\Domain\Competition\Entities\RaceResult
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

        // Check top 10 restriction BEFORE awarding (based on race_points position)
        if ($round->qualifyingPoleTop10()) {
            $driverPosition = null;
            foreach ($standings as $standing) {
                if ($standing['driver_id'] === $poleDriverId) {
                    $driverPosition = $standing['position'];
                    break;
                }
            }
            if ($driverPosition !== null && $driverPosition > 10) {
                // Driver is outside top 10, no bonus awarded
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
     * Round points are stored separately and NOT added to total_points.
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
     *     race: \App\Domain\Competition\Entities\Race,
     *     result: \App\Domain\Competition\Entities\RaceResult
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
     *     race: \App\Domain\Competition\Entities\Race,
     *     result: \App\Domain\Competition\Entities\RaceResult
     * }> $allRaceResults
     * @return array{
     *     qualifying_results: array<mixed>,
     *     race_time_results: array<mixed>,
     *     fastest_lap_results: array<mixed>
     * }
     */
    private function calculateCrossDivisionResults(array $allRaceResults): array
    {
        $qualifyingResults = [];
        $raceTimeByDriver = []; // Track best race time per driver
        $fastestLapResults = [];

        foreach ($allRaceResults as $item) {
            $race = $item['race'];
            $result = $item['result'];
            $resultId = $result->id();

            if ($resultId === null) {
                continue;
            }

            // 1. Qualifying results: fastest_lap from qualifiers
            if ($race->isQualifier()) {
                $lapTime = $result->fastestLap();
                if (!$lapTime->isNull()) {
                    $lapTimeMs = $lapTime->toMilliseconds();
                    if ($lapTimeMs !== null && $lapTimeMs > 0) {
                        $qualifyingResults[] = [
                            'race_result_id' => $resultId,
                            'time_ms' => $lapTimeMs,
                        ];
                    }
                }
            } else {
                // 2. Race time results: best race_time per driver from non-qualifiers
                // Skip DNF entries (they may have null or empty race_time)
                if (!$result->dnf()) {
                    $raceTime = $result->raceTime();
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

                // 3. Fastest lap results: fastest_lap from non-qualifiers
                $lapTime = $result->fastestLap();
                if (!$lapTime->isNull()) {
                    $lapTimeMs = $lapTime->toMilliseconds();
                    if ($lapTimeMs !== null && $lapTimeMs > 0) {
                        $fastestLapResults[] = [
                            'race_result_id' => $resultId,
                            'time_ms' => $lapTimeMs,
                        ];
                    }
                }
            }
        }

        // Sort qualifying results by time (fastest first)
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

        // Sort fastest lap results by time (fastest first)
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
     * Batch fetch driver names for multiple season driver IDs to avoid N+1 queries.
     *
     * @param array<int> $seasonDriverIds
     * @return array<int, string> Map of season driver ID => driver name
     */
    private function batchFetchDriverNames(array $seasonDriverIds): array
    {
        if (empty($seasonDriverIds)) {
            return [];
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent> $seasonDrivers */
        $seasonDrivers = \App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent::with(
            'leagueDriver.driver'
        )->whereIn('id', $seasonDriverIds)->get();

        $driverNames = [];
        foreach ($seasonDrivers as $seasonDriver) {
            $driverNames[$seasonDriver->id] = $seasonDriver->leagueDriver->driver->name ?? 'Unknown Driver';
        }

        return $driverNames;
    }

    /**
     * Batch fetch division names for multiple division IDs to avoid N+1 queries.
     *
     * @param array<int> $divisionIds
     * @return array<int, string> Map of division ID => division name
     */
    private function batchFetchDivisionNames(array $divisionIds): array
    {
        if (empty($divisionIds)) {
            return [];
        }

        // Batch fetch divisions
        // @phpstan-ignore-next-line Eloquent dynamic method
        $divisions = Division::whereIn('id', $divisionIds)->get();

        $divisionNames = [];
        /** @var Division $division */
        foreach ($divisions as $division) {
            $divisionNames[$division->id] = $division->name ?? 'Unknown Division';
        }

        return $divisionNames;
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
