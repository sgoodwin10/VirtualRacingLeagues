<?php

declare(strict_types=1);

namespace App\Application\Activity\Services;

use App\Application\Activity\DTOs\LeagueActivityData;
use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\Division;
use App\Infrastructure\Persistence\Eloquent\Models\Driver;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\Race;
use App\Infrastructure\Persistence\Eloquent\Models\Round;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\Team;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Spatie\Activitylog\Models\Activity;

/**
 * Service for logging league-related activities.
 *
 * All activities are logged under the 'league' log name and include
 * league_id in properties for filtering.
 */
class LeagueActivityLogService
{
    /**
     * Log a league activity.
     *
     * @param  UserEloquent  $user  The user performing the action
     * @param  string  $description  Human-readable description
     * @param  Model|null  $subject  The model being acted upon
     * @param  array<string, mixed>  $properties  Additional properties
     */
    private function logActivity(
        UserEloquent $user,
        string $description,
        ?Model $subject,
        array $properties
    ): Activity {
        // Add user context
        $request = request();
        if ($request !== null) {
            $properties['ip_address'] = $request->ip();
            $properties['user_agent'] = $request->userAgent();
        }

        $activityBuilder = activity('league')
            ->causedBy($user)
            ->withProperties($properties);

        if ($subject !== null) {
            $activityBuilder->performedOn($subject);
        }

        /** @var Activity $activity */
        $activity = $activityBuilder->log($description);

        return $activity;
    }

    // =============================================================================
    // LEAGUE ACTIVITIES
    // =============================================================================

    /**
     * Log league created.
     */
    public function logLeagueCreated(UserEloquent $user, League $league): Activity
    {
        return $this->logActivity(
            $user,
            "Created league: {$league->name}",
            $league,
            [
                'league_id' => $league->id,
                'league_name' => $league->name,
                'action' => 'create',
                'entity_type' => 'league',
                'entity_id' => $league->id,
                'entity_name' => $league->name,
            ]
        );
    }

    /**
     * Log league updated.
     *
     * @param  array<string, mixed>  $changes
     */
    public function logLeagueUpdated(
        UserEloquent $user,
        League $league,
        array $changes
    ): Activity {
        return $this->logActivity(
            $user,
            "Updated league: {$league->name}",
            $league,
            [
                'league_id' => $league->id,
                'league_name' => $league->name,
                'action' => 'update',
                'entity_type' => 'league',
                'entity_id' => $league->id,
                'entity_name' => $league->name,
                'changes' => $changes,
            ]
        );
    }

    // =============================================================================
    // DRIVER ACTIVITIES (League Drivers)
    // =============================================================================

    /**
     * Log driver added to league.
     */
    public function logDriverAdded(
        UserEloquent $user,
        int $leagueId,
        LeagueDriverEloquent $leagueDriver
    ): Activity {
        $leagueDriver->load(['driver', 'league']);
        $driverName = $leagueDriver->driver->name;

        return $this->logActivity(
            $user,
            "Added driver to league: {$driverName}",
            $leagueDriver,
            [
                'league_id' => $leagueId,
                'league_name' => $leagueDriver->league->name,
                'action' => 'add',
                'entity_type' => 'driver',
                'entity_id' => $leagueDriver->id,
                'entity_name' => $driverName,
            ]
        );
    }

    /**
     * Log driver updated in league.
     *
     * @param  array<string, mixed>  $changes
     */
    public function logDriverUpdated(
        UserEloquent $user,
        int $leagueId,
        LeagueDriverEloquent $leagueDriver,
        array $changes
    ): Activity {
        $leagueDriver->load(['driver', 'league']);
        $driverName = $leagueDriver->driver->name;

        return $this->logActivity(
            $user,
            "Updated league driver: {$driverName}",
            $leagueDriver,
            [
                'league_id' => $leagueId,
                'league_name' => $leagueDriver->league->name,
                'action' => 'update',
                'entity_type' => 'driver',
                'entity_id' => $leagueDriver->id,
                'entity_name' => $driverName,
                'changes' => $changes,
            ]
        );
    }

    /**
     * Log driver removed from league.
     */
    public function logDriverRemoved(
        UserEloquent $user,
        int $leagueId,
        string $leagueName,
        Driver $driver
    ): Activity {
        return $this->logActivity(
            $user,
            "Removed driver from league: {$driver->name}",
            $driver,
            [
                'league_id' => $leagueId,
                'league_name' => $leagueName,
                'action' => 'delete',
                'entity_type' => 'driver',
                'entity_id' => $driver->id,
                'entity_name' => $driver->name,
            ]
        );
    }

    /**
     * Log driver restored.
     */
    public function logDriverRestored(
        UserEloquent $user,
        int $leagueId,
        string $leagueName,
        Driver $driver
    ): Activity {
        return $this->logActivity(
            $user,
            "Restored driver in league: {$driver->name}",
            $driver,
            [
                'league_id' => $leagueId,
                'league_name' => $leagueName,
                'action' => 'restore',
                'entity_type' => 'driver',
                'entity_id' => $driver->id,
                'entity_name' => $driver->name,
            ]
        );
    }

    /**
     * Log drivers imported to league.
     */
    public function logDriversImported(
        UserEloquent $user,
        int $leagueId,
        string $leagueName,
        int $count
    ): Activity {
        return $this->logActivity(
            $user,
            "Imported drivers to league (count: {$count})",
            null,
            [
                'league_id' => $leagueId,
                'league_name' => $leagueName,
                'action' => 'import',
                'entity_type' => 'driver',
                'entity_id' => null,
                'entity_name' => null,
                'count' => $count,
            ]
        );
    }

    // =============================================================================
    // COMPETITION ACTIVITIES
    // =============================================================================

    /**
     * Log competition created.
     */
    public function logCompetitionCreated(
        UserEloquent $user,
        Competition $competition
    ): Activity {
        $competition->load('league');

        return $this->logActivity(
            $user,
            "Created competition: {$competition->name}",
            $competition,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'create',
                'entity_type' => 'competition',
                'entity_id' => $competition->id,
                'entity_name' => $competition->name,
            ]
        );
    }

    /**
     * Log competition updated.
     *
     * @param  array<string, mixed>  $changes
     */
    public function logCompetitionUpdated(
        UserEloquent $user,
        Competition $competition,
        array $changes
    ): Activity {
        $competition->load('league');

        return $this->logActivity(
            $user,
            "Updated competition: {$competition->name}",
            $competition,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'update',
                'entity_type' => 'competition',
                'entity_id' => $competition->id,
                'entity_name' => $competition->name,
                'changes' => $changes,
            ]
        );
    }

    /**
     * Log competition deleted.
     */
    public function logCompetitionDeleted(
        UserEloquent $user,
        Competition $competition
    ): Activity {
        $competition->load('league');

        return $this->logActivity(
            $user,
            "Deleted competition: {$competition->name}",
            $competition,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'delete',
                'entity_type' => 'competition',
                'entity_id' => $competition->id,
                'entity_name' => $competition->name,
            ]
        );
    }

    // =============================================================================
    // SEASON ACTIVITIES
    // =============================================================================

    /**
     * Log season created.
     */
    public function logSeasonCreated(
        UserEloquent $user,
        SeasonEloquent $season
    ): Activity {
        $season->loadMissing('competition.league');
        $competition = $season->competition;

        if ($competition === null) {
            throw new \RuntimeException('Season must have a competition');
        }

        $league = $competition->league;
        if ($league === null) {
            throw new \RuntimeException('Competition must have a league');
        }

        return $this->logActivity(
            $user,
            "Created season: {$competition->name} - {$season->name}",
            $season,
            [
                'league_id' => $competition->league_id,
                'league_name' => $league->name,
                'action' => 'create',
                'entity_type' => 'season',
                'entity_id' => $season->id,
                'entity_name' => $season->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                ],
            ]
        );
    }

    /**
     * Log season updated.
     *
     * @param  array<string, mixed>  $changes
     */
    public function logSeasonUpdated(
        UserEloquent $user,
        SeasonEloquent $season,
        array $changes
    ): Activity {
        $season->load('competition.league');
        $competition = $season->competition;

        return $this->logActivity(
            $user,
            "Updated season: {$competition->name} - {$season->name}",
            $season,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'update',
                'entity_type' => 'season',
                'entity_id' => $season->id,
                'entity_name' => $season->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                ],
                'changes' => $changes,
            ]
        );
    }

    /**
     * Log season completed.
     */
    public function logSeasonCompleted(
        UserEloquent $user,
        SeasonEloquent $season
    ): Activity {
        $season->load('competition.league');
        $competition = $season->competition;

        return $this->logActivity(
            $user,
            "Completed season: {$competition->name} - {$season->name}",
            $season,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'complete',
                'entity_type' => 'season',
                'entity_id' => $season->id,
                'entity_name' => $season->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                ],
            ]
        );
    }

    /**
     * Log season archived.
     */
    public function logSeasonArchived(
        UserEloquent $user,
        SeasonEloquent $season
    ): Activity {
        $season->load('competition.league');
        $competition = $season->competition;

        return $this->logActivity(
            $user,
            "Archived season: {$competition->name} - {$season->name}",
            $season,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'archive',
                'entity_type' => 'season',
                'entity_id' => $season->id,
                'entity_name' => $season->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                ],
            ]
        );
    }

    /**
     * Log season deleted.
     */
    public function logSeasonDeleted(
        UserEloquent $user,
        SeasonEloquent $season
    ): Activity {
        $season->load('competition.league');
        $competition = $season->competition;

        return $this->logActivity(
            $user,
            "Deleted season: {$competition->name} - {$season->name}",
            $season,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'delete',
                'entity_type' => 'season',
                'entity_id' => $season->id,
                'entity_name' => $season->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                ],
            ]
        );
    }

    // =============================================================================
    // ROUND ACTIVITIES
    // =============================================================================

    /**
     * Log round created.
     */
    public function logRoundCreated(
        UserEloquent $user,
        Round $round
    ): Activity {
        $round->load('season.competition.league');
        $season = $round->season;
        $competition = $season->competition;

        return $this->logActivity(
            $user,
            "Created round: {$competition->name} - {$season->name}: {$round->name}",
            $round,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'create',
                'entity_type' => 'round',
                'entity_id' => $round->id,
                'entity_name' => $round->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'season_id' => $season->id,
                    'season_name' => $season->name,
                ],
            ]
        );
    }

    /**
     * Log round updated.
     *
     * @param  array<string, mixed>  $changes
     */
    public function logRoundUpdated(
        UserEloquent $user,
        Round $round,
        array $changes
    ): Activity {
        $round->load('season.competition.league');
        $season = $round->season;
        $competition = $season->competition;

        return $this->logActivity(
            $user,
            "Updated round: {$competition->name} - {$season->name}: {$round->name}",
            $round,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'update',
                'entity_type' => 'round',
                'entity_id' => $round->id,
                'entity_name' => $round->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'season_id' => $season->id,
                    'season_name' => $season->name,
                ],
                'changes' => $changes,
            ]
        );
    }

    /**
     * Log round completed.
     */
    public function logRoundCompleted(
        UserEloquent $user,
        Round $round
    ): Activity {
        $round->load('season.competition.league');
        $season = $round->season;
        $competition = $season->competition;

        return $this->logActivity(
            $user,
            "Completed round: {$competition->name} - {$season->name}: {$round->name}",
            $round,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'complete',
                'entity_type' => 'round',
                'entity_id' => $round->id,
                'entity_name' => $round->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'season_id' => $season->id,
                    'season_name' => $season->name,
                ],
            ]
        );
    }

    /**
     * Log round deleted.
     */
    public function logRoundDeleted(
        UserEloquent $user,
        Round $round
    ): Activity {
        $round->load('season.competition.league');
        $season = $round->season;
        $competition = $season->competition;

        return $this->logActivity(
            $user,
            "Deleted round: {$competition->name} - {$season->name}: {$round->name}",
            $round,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'delete',
                'entity_type' => 'round',
                'entity_id' => $round->id,
                'entity_name' => $round->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'season_id' => $season->id,
                    'season_name' => $season->name,
                ],
            ]
        );
    }

    // =============================================================================
    // RACE ACTIVITIES
    // =============================================================================

    /**
     * Log race created.
     */
    public function logRaceCreated(
        UserEloquent $user,
        Race $race
    ): Activity {
        $race->load('round.season.competition.league');
        $round = $race->round;
        $season = $round->season;
        $competition = $season->competition;

        $type = $race->is_qualifier ? 'Qualifier' : "Race {$race->race_number}";

        return $this->logActivity(
            $user,
            $race->is_qualifier
                ? "Added qualifier: {$competition->name} - {$season->name}: {$round->name} Qualifier"
                : "Added race: {$competition->name} - {$season->name}: {$round->name} Race {$race->race_number}",
            $race,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'create',
                'entity_type' => $race->is_qualifier ? 'qualifier' : 'race',
                'entity_id' => $race->id,
                'entity_name' => $type,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'season_id' => $season->id,
                    'season_name' => $season->name,
                    'round_id' => $round->id,
                    'round_name' => $round->name,
                ],
            ]
        );
    }

    /**
     * Log race updated.
     *
     * @param  array<string, mixed>  $changes
     */
    public function logRaceUpdated(
        UserEloquent $user,
        Race $race,
        array $changes
    ): Activity {
        $race->load('round.season.competition.league');
        $round = $race->round;
        $season = $round->season;
        $competition = $season->competition;

        $type = $race->is_qualifier ? 'Qualifier' : "Race {$race->race_number}";

        return $this->logActivity(
            $user,
            "Updated race/qualifier: {$competition->name} - {$season->name}: {$round->name} {$type}",
            $race,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'update',
                'entity_type' => $race->is_qualifier ? 'qualifier' : 'race',
                'entity_id' => $race->id,
                'entity_name' => $type,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'season_id' => $season->id,
                    'season_name' => $season->name,
                    'round_id' => $round->id,
                    'round_name' => $round->name,
                ],
                'changes' => $changes,
            ]
        );
    }

    /**
     * Log race completed.
     */
    public function logRaceCompleted(
        UserEloquent $user,
        Race $race
    ): Activity {
        $race->load('round.season.competition.league');
        $round = $race->round;
        $season = $round->season;
        $competition = $season->competition;

        $type = $race->is_qualifier ? 'Qualifier' : "Race {$race->race_number}";

        return $this->logActivity(
            $user,
            "Completed race/qualifier: {$competition->name} - {$season->name}: {$round->name} {$type}",
            $race,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'complete',
                'entity_type' => $race->is_qualifier ? 'qualifier' : 'race',
                'entity_id' => $race->id,
                'entity_name' => $type,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'season_id' => $season->id,
                    'season_name' => $season->name,
                    'round_id' => $round->id,
                    'round_name' => $round->name,
                ],
            ]
        );
    }

    /**
     * Log race deleted.
     */
    public function logRaceDeleted(
        UserEloquent $user,
        Race $race
    ): Activity {
        $race->load('round.season.competition.league');
        $round = $race->round;
        $season = $round->season;
        $competition = $season->competition;

        $type = $race->is_qualifier ? 'Qualifier' : "Race {$race->race_number}";

        return $this->logActivity(
            $user,
            "Deleted race/qualifier: {$competition->name} - {$season->name}: {$round->name} {$type}",
            $race,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'delete',
                'entity_type' => $race->is_qualifier ? 'qualifier' : 'race',
                'entity_id' => $race->id,
                'entity_name' => $type,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'season_id' => $season->id,
                    'season_name' => $season->name,
                    'round_id' => $round->id,
                    'round_name' => $round->name,
                ],
            ]
        );
    }

    /**
     * Log race results entered.
     */
    public function logRaceResultsEntered(
        UserEloquent $user,
        Race $race,
        int $resultCount
    ): Activity {
        $race->load('round.season.competition.league');
        $round = $race->round;
        $season = $round->season;
        $competition = $season->competition;

        if ($race->is_qualifier) {
            $description = "Entered qualifier results: {$competition->name} - "
                . "{$season->name}: {$round->name}";
        } else {
            $description = "Entered race results: {$competition->name} - "
                . "{$season->name}: {$round->name} Race {$race->race_number}";
        }

        return $this->logActivity(
            $user,
            $description,
            $race,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'enter_results',
                'entity_type' => $race->is_qualifier ? 'qualifier' : 'race',
                'entity_id' => $race->id,
                'entity_name' => $race->is_qualifier ? 'Qualifier' : "Race {$race->race_number}",
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'season_id' => $season->id,
                    'season_name' => $season->name,
                    'round_id' => $round->id,
                    'round_name' => $round->name,
                ],
                'result_count' => $resultCount,
            ]
        );
    }

    // =============================================================================
    // DIVISION ACTIVITIES
    // =============================================================================

    /**
     * Log division created.
     */
    public function logDivisionCreated(
        UserEloquent $user,
        Division $division
    ): Activity {
        $division->load('season.competition.league');
        $season = $division->season;
        $competition = $season->competition;

        return $this->logActivity(
            $user,
            "Created division: {$competition->name} - {$season->name}: {$division->name}",
            $division,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'create',
                'entity_type' => 'division',
                'entity_id' => $division->id,
                'entity_name' => $division->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'season_id' => $season->id,
                    'season_name' => $season->name,
                ],
            ]
        );
    }

    /**
     * Log division updated.
     *
     * @param  array<string, mixed>  $changes
     */
    public function logDivisionUpdated(
        UserEloquent $user,
        Division $division,
        array $changes
    ): Activity {
        $division->load('season.competition.league');
        $season = $division->season;
        $competition = $season->competition;

        return $this->logActivity(
            $user,
            "Updated division: {$competition->name} - {$season->name}: {$division->name}",
            $division,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'update',
                'entity_type' => 'division',
                'entity_id' => $division->id,
                'entity_name' => $division->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'season_id' => $season->id,
                    'season_name' => $season->name,
                ],
                'changes' => $changes,
            ]
        );
    }

    /**
     * Log divisions reordered.
     */
    public function logDivisionsReordered(
        UserEloquent $user,
        SeasonEloquent $season
    ): Activity {
        $season->load('competition.league');
        $competition = $season->competition;

        return $this->logActivity(
            $user,
            "Reordered divisions: {$competition->name} - {$season->name}",
            $season,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'reorder',
                'entity_type' => 'division',
                'entity_id' => null,
                'entity_name' => null,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'season_id' => $season->id,
                    'season_name' => $season->name,
                ],
            ]
        );
    }

    /**
     * Log division deleted.
     */
    public function logDivisionDeleted(
        UserEloquent $user,
        Division $division
    ): Activity {
        $division->load('season.competition.league');
        $season = $division->season;
        $competition = $season->competition;

        return $this->logActivity(
            $user,
            "Deleted division: {$competition->name} - {$season->name}: {$division->name}",
            $division,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'delete',
                'entity_type' => 'division',
                'entity_id' => $division->id,
                'entity_name' => $division->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'season_id' => $season->id,
                    'season_name' => $season->name,
                ],
            ]
        );
    }

    /**
     * Log driver added to division.
     */
    public function logDriverAddedToDivision(
        UserEloquent $user,
        SeasonDriverEloquent $seasonDriver,
        Division $division
    ): Activity {
        $seasonDriver->load(['leagueDriver.driver', 'season.competition.league']);
        $season = $seasonDriver->season;
        $competition = $season->competition;
        $driverName = $seasonDriver->leagueDriver->driver->name;

        return $this->logActivity(
            $user,
            "Added driver to division: {$competition->name} - {$season->name}: {$division->name} - {$driverName}",
            $seasonDriver,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'add_driver',
                'entity_type' => 'division',
                'entity_id' => $division->id,
                'entity_name' => $division->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'season_id' => $season->id,
                    'season_name' => $season->name,
                    'driver_name' => $driverName,
                ],
            ]
        );
    }

    /**
     * Log driver removed from division.
     */
    public function logDriverRemovedFromDivision(
        UserEloquent $user,
        SeasonDriverEloquent $seasonDriver,
        Division $oldDivision
    ): Activity {
        $seasonDriver->load(['leagueDriver.driver', 'season.competition.league']);
        $season = $seasonDriver->season;
        $competition = $season->competition;
        $driverName = $seasonDriver->leagueDriver->driver->name;

        return $this->logActivity(
            $user,
            "Removed driver from division: {$competition->name} - {$season->name}: {$driverName}",
            $seasonDriver,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'remove_driver',
                'entity_type' => 'division',
                'entity_id' => $oldDivision->id,
                'entity_name' => $oldDivision->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'season_id' => $season->id,
                    'season_name' => $season->name,
                    'driver_name' => $driverName,
                ],
            ]
        );
    }

    // =============================================================================
    // TEAM ACTIVITIES
    // =============================================================================

    /**
     * Log team created.
     */
    public function logTeamCreated(
        UserEloquent $user,
        Team $team
    ): Activity {
        $team->load('season.competition.league');
        $season = $team->season;
        $competition = $season->competition;

        return $this->logActivity(
            $user,
            "Created team: {$competition->name} - {$season->name}: {$team->name}",
            $team,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'create',
                'entity_type' => 'team',
                'entity_id' => $team->id,
                'entity_name' => $team->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'season_id' => $season->id,
                    'season_name' => $season->name,
                ],
            ]
        );
    }

    /**
     * Log team updated.
     *
     * @param  array<string, mixed>  $changes
     */
    public function logTeamUpdated(
        UserEloquent $user,
        Team $team,
        array $changes
    ): Activity {
        $team->load('season.competition.league');
        $season = $team->season;
        $competition = $season->competition;

        return $this->logActivity(
            $user,
            "Updated team: {$competition->name} - {$season->name}: {$team->name}",
            $team,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'update',
                'entity_type' => 'team',
                'entity_id' => $team->id,
                'entity_name' => $team->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'season_id' => $season->id,
                    'season_name' => $season->name,
                ],
                'changes' => $changes,
            ]
        );
    }

    /**
     * Log team deleted.
     */
    public function logTeamDeleted(
        UserEloquent $user,
        Team $team
    ): Activity {
        $team->load('season.competition.league');
        $season = $team->season;
        $competition = $season->competition;

        return $this->logActivity(
            $user,
            "Deleted team: {$competition->name} - {$season->name}: {$team->name}",
            $team,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'delete',
                'entity_type' => 'team',
                'entity_id' => $team->id,
                'entity_name' => $team->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'season_id' => $season->id,
                    'season_name' => $season->name,
                ],
            ]
        );
    }

    /**
     * Log driver added to team.
     */
    public function logDriverAddedToTeam(
        UserEloquent $user,
        SeasonDriverEloquent $seasonDriver,
        Team $team
    ): Activity {
        $seasonDriver->load(['leagueDriver.driver', 'season.competition.league']);
        $season = $seasonDriver->season;
        $competition = $season->competition;
        $driverName = $seasonDriver->leagueDriver->driver->name;

        return $this->logActivity(
            $user,
            "Added driver to team: {$competition->name} - {$season->name}: {$team->name} - {$driverName}",
            $seasonDriver,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'add_driver',
                'entity_type' => 'team',
                'entity_id' => $team->id,
                'entity_name' => $team->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'season_id' => $season->id,
                    'season_name' => $season->name,
                    'driver_name' => $driverName,
                ],
            ]
        );
    }

    /**
     * Log driver removed from team.
     */
    public function logDriverRemovedFromTeam(
        UserEloquent $user,
        SeasonDriverEloquent $seasonDriver,
        Team $oldTeam
    ): Activity {
        $seasonDriver->load(['leagueDriver.driver', 'season.competition.league']);
        $season = $seasonDriver->season;
        $competition = $season->competition;
        $driverName = $seasonDriver->leagueDriver->driver->name;

        return $this->logActivity(
            $user,
            "Removed driver from team: {$competition->name} - {$season->name}: {$driverName}",
            $seasonDriver,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'remove_driver',
                'entity_type' => 'team',
                'entity_id' => $oldTeam->id,
                'entity_name' => $oldTeam->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'season_id' => $season->id,
                    'season_name' => $season->name,
                    'driver_name' => $driverName,
                ],
            ]
        );
    }

    // =============================================================================
    // SEASON DRIVER ACTIVITIES
    // =============================================================================

    /**
     * Log season driver added.
     */
    public function logSeasonDriverAdded(
        UserEloquent $user,
        SeasonDriverEloquent $seasonDriver
    ): Activity {
        $seasonDriver->load(['leagueDriver.driver', 'season.competition.league']);
        $season = $seasonDriver->season;
        $competition = $season->competition;
        $driverName = $seasonDriver->leagueDriver->driver->name;

        return $this->logActivity(
            $user,
            "Added driver to season: {$competition->name} - {$season->name}: {$driverName}",
            $seasonDriver,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'add',
                'entity_type' => 'season_driver',
                'entity_id' => $seasonDriver->id,
                'entity_name' => $driverName,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'season_id' => $season->id,
                    'season_name' => $season->name,
                ],
            ]
        );
    }

    /**
     * Log season driver removed.
     */
    public function logSeasonDriverRemoved(
        UserEloquent $user,
        SeasonDriverEloquent $seasonDriver
    ): Activity {
        $seasonDriver->load(['leagueDriver.driver', 'season.competition.league']);
        $season = $seasonDriver->season;
        $competition = $season->competition;
        $driverName = $seasonDriver->leagueDriver->driver->name;

        return $this->logActivity(
            $user,
            "Removed driver from season: {$competition->name} - {$season->name}: {$driverName}",
            $seasonDriver,
            [
                'league_id' => $competition->league_id,
                'league_name' => $competition->league->name,
                'action' => 'remove',
                'entity_type' => 'season_driver',
                'entity_id' => $seasonDriver->id,
                'entity_name' => $driverName,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'season_id' => $season->id,
                    'season_name' => $season->name,
                ],
            ]
        );
    }

    // =============================================================================
    // QUERY METHODS
    // =============================================================================

    /**
     * Get activities for a specific league with optional filters.
     *
     * @param  int|null  $limit  Maximum number of activities to return
     * @param  string|null  $entityType  Filter by entity type
     * @param  string|null  $action  Filter by action
     * @param  Carbon|null  $fromDate  Filter from date
     * @param  Carbon|null  $toDate  Filter to date
     * @return Collection<int, LeagueActivityData>
     */
    public function getActivitiesForLeague(
        int $leagueId,
        ?int $limit = 50,
        ?string $entityType = null,
        ?string $action = null,
        ?Carbon $fromDate = null,
        ?Carbon $toDate = null
    ): Collection {
        /** @var \Illuminate\Database\Eloquent\Builder<Activity> $query */
        $query = Activity::query();

        $query = $query->where('log_name', 'league')
            ->whereJsonContains('properties->league_id', $leagueId)
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($entityType !== null) {
            $query->whereJsonContains('properties->entity_type', $entityType);
        }

        if ($action !== null) {
            $query->whereJsonContains('properties->action', $action);
        }

        if ($fromDate !== null) {
            $query->where('created_at', '>=', $fromDate);
        }

        if ($toDate !== null) {
            $query->where('created_at', '<=', $toDate);
        }

        if ($limit !== null) {
            $query->limit($limit);
        }

        /** @var Collection<int, Activity> $activities */
        $activities = $query->get();

        // Map to DTOs
        return $activities->map(function (Activity $activity): LeagueActivityData {
            return new LeagueActivityData(
                id: $activity->id,
                log_name: $activity->log_name,
                description: $activity->description,
                subject_type: $activity->subject_type,
                subject_id: $activity->subject_id,
                causer_type: $activity->causer_type,
                causer_id: $activity->causer_id,
                causer_name: $activity->causer?->name ?? null,
                properties: $activity->properties?->toArray() ?? [],
                event: $activity->event,
                created_at: $activity->created_at->toISOString(),
            );
        });
    }

    /**
     * Build base query for league activities with filters.
     *
     * @param  array<string, mixed>  $filters
     * @return \Illuminate\Database\Eloquent\Builder<Activity>
     */
    private function buildActivityQuery(League $league, array $filters): \Illuminate\Database\Eloquent\Builder
    {
        /** @var \Illuminate\Database\Eloquent\Builder<Activity> $query */
        $query = Activity::query();

        $query = $query->where('log_name', 'league')
            ->whereJsonContains('properties->league_id', $league->id);

        // Apply entity type filter
        if (isset($filters['entity_type']) && $filters['entity_type'] !== null) {
            $query->whereJsonContains('properties->entity_type', $filters['entity_type']);
        }

        // Apply action filter
        if (isset($filters['action']) && $filters['action'] !== null) {
            $query->whereJsonContains('properties->action', $filters['action']);
        }

        // Apply date filters
        if (isset($filters['from_date']) && $filters['from_date'] instanceof Carbon) {
            $query->where('created_at', '>=', $filters['from_date']);
        }

        if (isset($filters['to_date']) && $filters['to_date'] instanceof Carbon) {
            $query->where('created_at', '<=', $filters['to_date']);
        }

        return $query;
    }

    /**
     * Get paginated activities for a league.
     *
     * @param  array<string, mixed>  $filters  Contains: entity_type, action, from_date, to_date, limit, offset
     * @return array<int, array<string, mixed>>
     */
    public function getActivities(League $league, array $filters): array
    {
        $query = $this->buildActivityQuery($league, $filters);

        $query->orderBy('created_at', 'desc');

        // Apply pagination
        if (isset($filters['offset'])) {
            $query->offset((int) $filters['offset']);
        }

        if (isset($filters['limit'])) {
            $query->limit((int) $filters['limit']);
        }

        // Eager load causer relationship
        $query->with('causer');

        /** @var \Illuminate\Support\Collection<int, Activity> $activities */
        $activities = $query->get();

        // Map to array format
        return $activities->map(function (Activity $activity): array {
            return $this->mapActivityToArray($activity);
        })->toArray();
    }

    /**
     * Count total activities for a league.
     *
     * @param  array<string, mixed>  $filters  Contains: entity_type, action, from_date, to_date
     */
    public function countActivities(League $league, array $filters): int
    {
        $query = $this->buildActivityQuery($league, $filters);

        return $query->count();
    }

    /**
     * Get a single activity by ID.
     *
     * @return array<string, mixed>|null
     */
    public function getActivityById(League $league, int $activityId): ?array
    {
        /** @var Activity|null $activity */
        $activity = Activity::query()
            ->where('id', $activityId)
            ->where('log_name', 'league')
            ->whereJsonContains('properties->league_id', $league->id)
            ->with('causer')
            ->first();

        if ($activity === null) {
            return null;
        }

        return $this->mapActivityToArray($activity);
    }

    /**
     * Map an Activity model to array format.
     *
     * Handles multiple causer types (User and Admin).
     *
     * @return array<string, mixed>
     */
    private function mapActivityToArray(Activity $activity): array
    {
        $properties = $activity->properties?->toArray() ?? [];
        $createdAt = $activity->created_at;

        // Get causer data - handle both User and Admin types
        $causer = $activity->causer;
        $causerData = null;
        $causerName = null;

        if ($causer !== null) {
            // UserEloquent has first_name and last_name
            if ($causer instanceof UserEloquent) {
                $causerData = [
                    'id' => $causer->id,
                    'first_name' => $causer->first_name ?? 'Unknown',
                    'last_name' => $causer->last_name ?? '',
                    'email' => $causer->email ?? '',
                ];
                $causerName = trim(($causer->first_name ?? 'Unknown') . ' ' . ($causer->last_name ?? ''));
            } elseif (
                method_exists($causer, 'getAttribute') && $causer->getAttribute('name') !== null
            ) {
                // AdminEloquent has name property
                $causerData = [
                    'id' => $causer->id,
                    'name' => $causer->name,
                    'email' => $causer->email ?? '',
                ];
                $causerName = $causer->name;
            }
        }

        return [
            'id' => $activity->id,
            'log_name' => $activity->log_name,
            'description' => $activity->description,
            'subject_type' => $activity->subject_type,
            'subject_id' => $activity->subject_id,
            'causer_type' => $activity->causer_type,
            'causer_id' => $activity->causer_id,
            'causer' => $causerData,
            'causer_name' => $causerName,
            'properties' => $properties,
            'event' => $activity->event,
            'created_at' => $createdAt !== null ? $createdAt->toISOString() : null,
            // Computed fields from properties
            'entity_type' => $properties['entity_type'] ?? null,
            'entity_id' => $properties['entity_id'] ?? null,
            'entity_name' => $properties['entity_name'] ?? null,
            'action' => $properties['action'] ?? null,
        ];
    }
}
