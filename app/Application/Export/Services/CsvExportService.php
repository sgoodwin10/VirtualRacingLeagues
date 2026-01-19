<?php

declare(strict_types=1);

namespace App\Application\Export\Services;

use App\Application\Competition\Services\RaceResultApplicationService;
use App\Application\Competition\Services\SeasonApplicationService;
use App\Application\Export\DTOs\CrossDivisionExportRow;
use App\Application\Export\DTOs\QualifyingResultExportRow;
use App\Application\Export\DTOs\RaceResultExportRow;
use App\Application\Export\DTOs\RoundStandingExportRow;
use App\Application\Export\DTOs\SeasonStandingExportRow;
use App\Domain\Competition\Repositories\CompetitionRepositoryInterface;
use App\Domain\Competition\Repositories\RaceRepositoryInterface;
use App\Domain\Competition\Repositories\RoundRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonDriverRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonRepositoryInterface;
use App\Domain\Division\Repositories\DivisionRepositoryInterface;
use App\Domain\Driver\Repositories\DriverRepositoryInterface;
use App\Domain\Team\Repositories\TeamRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriver;

/**
 * CSV Export Service.
 * Generates CSV data from race results, round standings, and season standings.
 */
final class CsvExportService
{
    public function __construct(
        private readonly RaceResultApplicationService $raceResultService,
        private readonly SeasonApplicationService $seasonService,
        private readonly RaceRepositoryInterface $raceRepository,
        private readonly RoundRepositoryInterface $roundRepository,
        private readonly SeasonRepositoryInterface $seasonRepository,
        private readonly CompetitionRepositoryInterface $competitionRepository,
        private readonly DriverRepositoryInterface $driverRepository,
        private readonly DivisionRepositoryInterface $divisionRepository,
        private readonly TeamRepositoryInterface $teamRepository,
    ) {
    }

    /**
     * Generate CSV data for race results.
     *
     * @return array{headers: array<string>, rows: array<array<mixed>>, filename: string}
     */
    public function generateRaceResultsCsv(int $raceId): array
    {
        $race = $this->raceRepository->findById($raceId);
        $round = $this->roundRepository->findById($race->roundId());
        $season = $this->seasonRepository->findById($round->seasonId());
        $competition = $this->competitionRepository->findById($season->competitionId());

        $results = $this->raceResultService->getResultsForRace($raceId);

        // Determine if divisions are enabled
        $hasDivisions = $season->raceDivisionsEnabled();

        // Fetch driver, division, and team data
        $driverIds = array_map(fn($result) => $result->driver_id, $results);
        $drivers = $this->batchFetchDrivers($driverIds);

        $divisionIds = array_filter(array_map(fn($result) => $result->division_id, $results));
        $divisions = $hasDivisions ? $this->batchFetchDivisions($divisionIds) : [];

        $driverTeams = $this->batchFetchDriverTeams($season->id() ?? 0, $driverIds);
        $teamIds = array_filter(array_values($driverTeams));
        $teams = !empty($teamIds) ? $this->batchFetchTeams($teamIds) : [];

        // Check if race is a qualifier
        $isQualifier = $race->isQualifier();

        // Build export rows
        $rows = [];
        foreach ($results as $result) {
            $driverId = $result->driver_id;
            $driverName = $drivers[$driverId] ?? 'Unknown Driver';
            $divisionName = $hasDivisions && $result->division_id
                ? ($divisions[$result->division_id] ?? null)
                : null;
            $teamId = $driverTeams[$driverId] ?? null;
            $teamName = $teamId !== null && isset($teams[$teamId]) ? $teams[$teamId] : null;

            if ($isQualifier) {
                $row = new QualifyingResultExportRow(
                    position: $result->position,
                    division: $divisionName,
                    driver_name: $driverName,
                    team: $teamName,
                    qualifying_lap: $result->fastest_lap,
                    time_difference: $result->final_race_time_difference,
                );
            } else {
                $row = new RaceResultExportRow(
                    position: $result->position,
                    division: $divisionName,
                    driver_name: $driverName,
                    team: $teamName,
                    race_time: $result->final_race_time,
                    time_difference: $result->final_race_time_difference,
                    penalties: $result->penalties,
                    fastest_lap: $result->has_fastest_lap ? 'Yes' : null,
                    points: $result->race_points > 0 ? $result->race_points : null,
                );
            }

            $rows[] = $row->toRow();
        }

        // Generate filename
        $competitionSlug = $competition->slug()->value();
        $seasonSlug = $season->slug()->value();
        $roundNumber = $round->roundNumber()->value();
        $raceName = $race->name()?->value() ?? ($isQualifier ? 'qualifying' : 'race');
        $filename = "{$competitionSlug}-{$seasonSlug}-round-{$roundNumber}-{$raceName}-results.csv";

        $headers = $isQualifier
            ? QualifyingResultExportRow::headers()
            : RaceResultExportRow::headers();

        return [
            'headers' => $headers,
            'rows' => $rows,
            'filename' => $filename,
        ];
    }

    /**
     * Generate CSV data for round standings.
     *
     * @return array{headers: array<string>, rows: array<array<mixed>>, filename: string}
     */
    public function generateRoundStandingsCsv(int $roundId): array
    {
        $round = $this->roundRepository->findById($roundId);
        $season = $this->seasonRepository->findById($round->seasonId());
        $competition = $this->competitionRepository->findById($season->competitionId());

        $roundResults = $round->roundResults();
        if ($roundResults === null || !isset($roundResults['standings'])) {
            return [
                'headers' => RoundStandingExportRow::headers(),
                'rows' => [],
                'filename' => $this->generateRoundStandingsFilename($competition->slug()->value(), $season->slug()->value(), $round->roundNumber()->value()),
            ];
        }

        $hasDivisions = $season->raceDivisionsEnabled();

        $rows = [];

        if ($hasDivisions) {
            // Process division-based standings
            foreach ($roundResults['standings'] as $divisionStanding) {
                $divisionId = $divisionStanding['division_id'] ?? null;
                $divisionName = $divisionId ? $this->getDivisionName($divisionId) : null;

                foreach ($divisionStanding['results'] as $standing) {
                    $driverId = $standing['driver_id'];
                    $driverName = $this->getDriverName($driverId);
                    $teamName = $this->getDriverTeamName($season->id() ?? 0, $driverId);

                    $row = new RoundStandingExportRow(
                        position: $standing['position'] ?? null,
                        division: $divisionName,
                        driver_name: $driverName,
                        team: $teamName,
                        round_points: (float) $standing['total_points'],
                    );

                    $rows[] = $row->toRow();
                }
            }
        } else {
            // Process flat standings
            foreach ($roundResults['standings'] as $standing) {
                $driverId = $standing['driver_id'];
                $driverName = $this->getDriverName($driverId);
                $teamName = $this->getDriverTeamName($season->id() ?? 0, $driverId);

                $row = new RoundStandingExportRow(
                    position: $standing['position'] ?? null,
                    division: null,
                    driver_name: $driverName,
                    team: $teamName,
                    round_points: (float) $standing['total_points'],
                );

                $rows[] = $row->toRow();
            }
        }

        $filename = $this->generateRoundStandingsFilename(
            $competition->slug()->value(),
            $season->slug()->value(),
            $round->roundNumber()->value()
        );

        return [
            'headers' => RoundStandingExportRow::headers(),
            'rows' => $rows,
            'filename' => $filename,
        ];
    }

    /**
     * Generate CSV data for cross-division results.
     *
     * @param string $type One of: 'fastest-laps', 'race-times', 'qualifying-times'
     * @return array{headers: array<string>, rows: array<array<mixed>>, filename: string}
     */
    public function generateCrossDivisionCsv(int $roundId, string $type): array
    {
        $round = $this->roundRepository->findById($roundId);
        $season = $this->seasonRepository->findById($round->seasonId());
        $competition = $this->competitionRepository->findById($season->competitionId());

        $hasDivisions = $season->raceDivisionsEnabled();

        // Get the appropriate results based on type
        // Data format: [{position, race_result_id, time_ms}, ...]
        $results = match ($type) {
            'fastest-laps' => $round->fastestLapResults(),
            'race-times' => $round->raceTimeResults(),
            'qualifying-times' => $round->qualifyingResults(),
            default => null,
        };

        if ($results === null || empty($results)) {
            return [
                'headers' => CrossDivisionExportRow::headers(),
                'rows' => [],
                'filename' => $this->generateCrossDivisionFilename($competition->slug()->value(), $season->slug()->value(), $round->roundNumber()->value(), $type),
            ];
        }

        // Collect race result IDs to fetch driver/division info
        $raceResultIds = array_column($results, 'race_result_id');
        $raceResultsData = $this->fetchRaceResultsById($raceResultIds);

        // Calculate first position time for differences
        $firstTimeMs = $results[0]['time_ms'] ?? 0;

        $rows = [];
        foreach ($results as $result) {
            $position = $result['position'] ?? (count($rows) + 1);
            $raceResultId = $result['race_result_id'];
            $timeMs = $result['time_ms'] ?? 0;

            // Get driver info from race result
            $raceResultInfo = $raceResultsData[$raceResultId] ?? null;
            $seasonDriverId = $raceResultInfo['driver_id'] ?? null;
            $divisionId = $raceResultInfo['division_id'] ?? null;

            $driverName = $seasonDriverId ? $this->getDriverNameBySeasonDriverId($seasonDriverId) : 'Unknown Driver';
            $divisionName = $hasDivisions && $divisionId ? $this->getDivisionName($divisionId) : null;
            $teamName = $seasonDriverId ? $this->getTeamNameBySeasonDriverId($seasonDriverId) : null;

            // Format time
            $formattedTime = $this->formatMillisecondsToTime($timeMs);

            // Calculate time difference (null for first position)
            $timeDifference = null;
            if ($position > 1 && $timeMs > 0 && $firstTimeMs > 0) {
                $diffMs = $timeMs - $firstTimeMs;
                $timeDifference = '+' . $this->formatMillisecondsToTime($diffMs);
            }

            $row = new CrossDivisionExportRow(
                position: $position,
                division: $divisionName,
                driver_name: $driverName,
                team: $teamName,
                time: $formattedTime,
                time_difference: $timeDifference,
            );

            $rows[] = $row->toRow();
        }

        $filename = $this->generateCrossDivisionFilename(
            $competition->slug()->value(),
            $season->slug()->value(),
            $round->roundNumber()->value(),
            $type
        );

        return [
            'headers' => CrossDivisionExportRow::headers(),
            'rows' => $rows,
            'filename' => $filename,
        ];
    }

    /**
     * Generate CSV data for season standings.
     *
     * @return array{headers: array<string>, rows: array<array<mixed>>, filename: string}
     */
    public function generateSeasonStandingsCsv(int $seasonId, ?int $divisionId = null): array
    {
        $season = $this->seasonRepository->findById($seasonId);
        $competition = $this->competitionRepository->findById($season->competitionId());

        $standingsData = $this->seasonService->getSeasonStandings($seasonId);
        $hasDivisions = $standingsData['has_divisions'];
        $dropRoundEnabled = $standingsData['drop_round_enabled'];

        // Get all completed rounds for headers
        $rounds = $this->roundRepository->findBySeasonId($seasonId);
        $completedRounds = array_filter($rounds, fn($round) => $round->status()->isCompleted() && $round->roundResults() !== null);
        usort($completedRounds, fn($a, $b) => $a->roundNumber()->value() <=> $b->roundNumber()->value());

        // Build round headers
        $roundHeaders = [];
        foreach ($completedRounds as $round) {
            $roundNum = $round->roundNumber()->value();
            $roundHeaders[] = "R{$roundNum} Points";
            $roundHeaders[] = "R{$roundNum} FL";
            $roundHeaders[] = "R{$roundNum} Pole";
        }

        $rows = [];

        if ($hasDivisions) {
            // Process division-based standings
            $standings = $standingsData['standings'];

            // Filter by division if specified
            if ($divisionId !== null) {
                $standings = array_filter($standings, fn($div) => $div['division_id'] === $divisionId);
            }

            foreach ($standings as $divisionStanding) {
                $divisionName = $divisionStanding['division_name'];

                foreach ($divisionStanding['drivers'] as $standing) {
                    $roundColumns = $this->buildRoundColumns($standing['rounds'], $completedRounds);

                    $row = new SeasonStandingExportRow(
                        position: $standing['position'],
                        division: $divisionName,
                        driver_name: $standing['driver_name'],
                        team: $standing['team_name'],
                        round_columns: $roundColumns,
                        total_points: $standing['total_points'],
                        drop_round_total: $dropRoundEnabled ? ($standing['drop_total'] ?? null) : null,
                    );

                    $rows[] = $row->toRow();
                }
            }
        } else {
            // Process flat standings
            foreach ($standingsData['standings'] as $standing) {
                $roundColumns = $this->buildRoundColumns($standing['rounds'], $completedRounds);

                $row = new SeasonStandingExportRow(
                    position: $standing['position'],
                    division: null,
                    driver_name: $standing['driver_name'],
                    team: $standing['team_name'] ?? null,
                    round_columns: $roundColumns,
                    total_points: $standing['total_points'],
                    drop_round_total: $dropRoundEnabled ? ($standing['drop_total'] ?? null) : null,
                );

                $rows[] = $row->toRow();
            }
        }

        $headers = SeasonStandingExportRow::headers($roundHeaders, $dropRoundEnabled);

        $filename = $this->generateSeasonStandingsFilename(
            $competition->slug()->value(),
            $season->slug()->value()
        );

        return [
            'headers' => $headers,
            'rows' => $rows,
            'filename' => $filename,
        ];
    }

    /**
     * Build round columns for season standings export.
     *
     * @param array<mixed> $driverRounds Driver's round data
     * @param array<\App\Domain\Competition\Entities\Round> $completedRounds All completed rounds
     * @return array<string|int|null>
     */
    private function buildRoundColumns(array $driverRounds, array $completedRounds): array
    {
        $columns = [];

        // Create a map of round_id => round data
        $roundMap = [];
        foreach ($driverRounds as $roundData) {
            $roundMap[$roundData['round_id']] = $roundData;
        }

        // Process each completed round
        foreach ($completedRounds as $round) {
            $roundId = $round->id();
            $roundData = $roundMap[$roundId] ?? null;

            if ($roundData !== null) {
                $columns[] = $roundData['points'];
                $columns[] = $roundData['has_fastest_lap'] ? '1' : '';
                $columns[] = $roundData['has_pole'] ? '1' : '';
            } else {
                // Driver didn't participate in this round
                $columns[] = '';
                $columns[] = '';
                $columns[] = '';
            }
        }

        return $columns;
    }

    /**
     * Batch fetch drivers by IDs.
     *
     * @param array<int> $driverIds
     * @return array<int, string> Map of driver_id => driver_name
     */
    private function batchFetchDrivers(array $driverIds): array
    {
        if (empty($driverIds)) {
            return [];
        }

        $drivers = [];
        foreach ($driverIds as $driverId) {
            try {
                $driver = $this->driverRepository->findById($driverId);
                $drivers[$driverId] = $driver->name()->displayName();
            } catch (\Exception $e) {
                $drivers[$driverId] = 'Unknown Driver';
            }
        }

        return $drivers;
    }

    /**
     * Batch fetch divisions by IDs.
     *
     * @param array<int> $divisionIds
     * @return array<int, string> Map of division_id => division_name
     */
    private function batchFetchDivisions(array $divisionIds): array
    {
        if (empty($divisionIds)) {
            return [];
        }

        $divisions = [];
        foreach ($divisionIds as $divisionId) {
            try {
                $division = $this->divisionRepository->findById($divisionId);
                $divisions[$divisionId] = $division->name()->value();
            } catch (\Exception $e) {
                $divisions[$divisionId] = 'Unknown Division';
            }
        }

        return $divisions;
    }

    /**
     * Batch fetch teams by IDs.
     *
     * @param array<int> $teamIds
     * @return array<int, string> Map of team_id => team_name
     */
    private function batchFetchTeams(array $teamIds): array
    {
        if (empty($teamIds)) {
            return [];
        }

        $teams = [];
        foreach ($teamIds as $teamId) {
            try {
                $team = $this->teamRepository->findById($teamId);
                $teams[$teamId] = $team->name()->value();
            } catch (\Exception $e) {
                $teams[$teamId] = 'Unknown Team';
            }
        }

        return $teams;
    }

    /**
     * Batch fetch driver teams for a season.
     * Note: $seasonDriverIds are the IDs from race_results.driver_id which reference season_drivers.id
     *
     * @param array<int> $seasonDriverIds
     * @return array<int, int|null> Map of season_driver_id => team_id
     */
    private function batchFetchDriverTeams(int $seasonId, array $seasonDriverIds): array
    {
        if (empty($seasonDriverIds)) {
            return [];
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent> $seasonDrivers */
        $seasonDrivers = \App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent::query()
            ->whereIn('id', $seasonDriverIds)
            ->get(['id', 'team_id'])
            ->keyBy('id');

        $driverTeams = [];
        foreach ($seasonDriverIds as $seasonDriverId) {
            $seasonDriver = $seasonDrivers->get($seasonDriverId);
            $driverTeams[$seasonDriverId] = $seasonDriver?->team_id;
        }

        return $driverTeams;
    }

    /**
     * Get driver name by season driver ID.
     * Note: race_results.driver_id references season_drivers.id
     */
    private function getDriverName(int $seasonDriverId): string
    {
        return $this->getDriverNameBySeasonDriverId($seasonDriverId);
    }

    /**
     * Get division name by ID.
     */
    private function getDivisionName(int $divisionId): ?string
    {
        try {
            $division = $this->divisionRepository->findById($divisionId);
            return $division->name()->value();
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Get driver's team name by season driver ID.
     * Note: race_results.driver_id references season_drivers.id
     */
    private function getDriverTeamName(int $seasonId, int $seasonDriverId): ?string
    {
        return $this->getTeamNameBySeasonDriverId($seasonDriverId);
    }

    /**
     * Generate filename for round standings.
     */
    private function generateRoundStandingsFilename(string $competitionSlug, string $seasonSlug, int $roundNumber): string
    {
        return "{$competitionSlug}-{$seasonSlug}-round-{$roundNumber}-standings.csv";
    }

    /**
     * Generate filename for cross-division results.
     */
    private function generateCrossDivisionFilename(string $competitionSlug, string $seasonSlug, int $roundNumber, string $type): string
    {
        return "{$competitionSlug}-{$seasonSlug}-round-{$roundNumber}-{$type}.csv";
    }

    /**
     * Generate filename for season standings.
     */
    private function generateSeasonStandingsFilename(string $competitionSlug, string $seasonSlug): string
    {
        return "{$competitionSlug}-{$seasonSlug}-standings.csv";
    }

    /**
     * Fetch race results by their IDs.
     *
     * @param array<int> $raceResultIds
     * @return array<int, array{driver_id: int, division_id: int|null}>
     */
    private function fetchRaceResultsById(array $raceResultIds): array
    {
        if (empty($raceResultIds)) {
            return [];
        }

        $results = \App\Infrastructure\Persistence\Eloquent\Models\RaceResult::query()
            ->whereIn('id', $raceResultIds)
            ->get(['id', 'driver_id', 'division_id']);

        $data = [];
        foreach ($results as $result) {
            $data[$result->id] = [
                'driver_id' => $result->driver_id,
                'division_id' => $result->division_id,
            ];
        }

        return $data;
    }

    /**
     * Get driver name by season driver ID.
     */
    private function getDriverNameBySeasonDriverId(int $seasonDriverId): string
    {
        try {
            $seasonDriver = \App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent::query()
                ->with(['leagueDriver.driver'])
                ->find($seasonDriverId);

            $driver = $seasonDriver?->leagueDriver?->driver;
            if ($driver !== null) {
                return trim($driver->first_name . ' ' . $driver->last_name);
            }

            return 'Unknown Driver';
        } catch (\Exception $e) {
            return 'Unknown Driver';
        }
    }

    /**
     * Get team name by season driver ID.
     */
    private function getTeamNameBySeasonDriverId(int $seasonDriverId): ?string
    {
        try {
            $seasonDriver = \App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent::query()
                ->with('team')
                ->find($seasonDriverId);

            if ($seasonDriver && $seasonDriver->team) {
                return $seasonDriver->team->name;
            }

            return null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Format milliseconds to time string (mm:ss.fff or hh:mm:ss.fff).
     */
    private function formatMillisecondsToTime(int $milliseconds): string
    {
        if ($milliseconds <= 0) {
            return '';
        }

        $hours = floor($milliseconds / 3600000);
        $minutes = floor(($milliseconds % 3600000) / 60000);
        $seconds = floor(($milliseconds % 60000) / 1000);
        $ms = $milliseconds % 1000;

        if ($hours > 0) {
            return sprintf('%d:%02d:%02d.%03d', $hours, $minutes, $seconds, $ms);
        }

        return sprintf('%d:%02d.%03d', $minutes, $seconds, $ms);
    }
}
