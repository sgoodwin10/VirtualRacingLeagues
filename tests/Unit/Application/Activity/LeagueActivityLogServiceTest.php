<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Activity;

use App\Application\Activity\Services\LeagueActivityLogService;
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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

/**
 * Unit tests for LeagueActivityLogService.
 *
 * Tests all logging methods and query functionality.
 */
class LeagueActivityLogServiceTest extends TestCase
{
    use RefreshDatabase;

    private LeagueActivityLogService $service;
    private UserEloquent $user;
    private League $league;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new LeagueActivityLogService();

        // Create a test user
        $this->user = UserEloquent::factory()->create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
        ]);

        // Create a test league
        $this->league = League::factory()->create([
            'name' => 'Test League',
            'owner_user_id' => $this->user->id,
        ]);
    }

    // =============================================================================
    // LEAGUE ACTIVITIES
    // =============================================================================

    public function test_log_league_created(): void
    {
        $activity = $this->service->logLeagueCreated($this->user, $this->league);

        $this->assertInstanceOf(Activity::class, $activity);
        $this->assertEquals('league', $activity->log_name);
        $this->assertEquals("Created league: {$this->league->name}", $activity->description);
        $this->assertEquals($this->league->id, $activity->subject_id);
        $this->assertEquals($this->user->id, $activity->causer_id);
        $this->assertEquals('create', $activity->properties['action']);
        $this->assertEquals('league', $activity->properties['entity_type']);
        $this->assertEquals($this->league->id, $activity->properties['league_id']);
    }

    public function test_log_league_updated(): void
    {
        $changes = [
            'old' => ['name' => 'Old Name'],
            'new' => ['name' => 'New Name'],
        ];

        $activity = $this->service->logLeagueUpdated($this->user, $this->league, $changes);

        $this->assertInstanceOf(Activity::class, $activity);
        $this->assertEquals('update', $activity->properties['action']);
        $this->assertEquals($changes, $activity->properties['changes']);
    }

    // =============================================================================
    // DRIVER ACTIVITIES
    // =============================================================================

    public function test_log_driver_added(): void
    {
        $driver = Driver::factory()->create(['nickname' => 'TestDriver']);
        $leagueDriver = LeagueDriverEloquent::factory()->create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
        ]);

        $activity = $this->service->logDriverAdded(
            $this->user,
            $this->league->id,
            $leagueDriver
        );

        $this->assertEquals('league', $activity->log_name);
        $this->assertEquals('add', $activity->properties['action']);
        $this->assertEquals('driver', $activity->properties['entity_type']);
        $this->assertStringContainsString('TestDriver', $activity->description);
    }

    public function test_log_driver_updated(): void
    {
        $driver = Driver::factory()->create(['nickname' => 'TestDriver']);
        $leagueDriver = LeagueDriverEloquent::factory()->create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
        ]);

        $changes = ['old' => ['driver_number' => 1], 'new' => ['driver_number' => 99]];

        $activity = $this->service->logDriverUpdated(
            $this->user,
            $this->league->id,
            $leagueDriver,
            $changes
        );

        $this->assertEquals('update', $activity->properties['action']);
        $this->assertEquals($changes, $activity->properties['changes']);
    }

    public function test_log_driver_removed(): void
    {
        $driver = Driver::factory()->create(['nickname' => 'TestDriver']);

        $activity = $this->service->logDriverRemoved(
            $this->user,
            $this->league->id,
            $this->league->name,
            $driver
        );

        $this->assertEquals('delete', $activity->properties['action']);
        $this->assertStringContainsString('Removed driver', $activity->description);
    }

    public function test_log_drivers_imported(): void
    {
        $activity = $this->service->logDriversImported(
            $this->user,
            $this->league->id,
            $this->league->name,
            10
        );

        $this->assertEquals('import', $activity->properties['action']);
        $this->assertEquals(10, $activity->properties['count']);
        $this->assertStringContainsString('count: 10', $activity->description);
    }

    // =============================================================================
    // COMPETITION ACTIVITIES
    // =============================================================================

    public function test_log_competition_created(): void
    {
        $competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'name' => 'Test Competition',
        ]);

        $activity = $this->service->logCompetitionCreated($this->user, $competition);

        $this->assertEquals('league', $activity->log_name);
        $this->assertEquals('create', $activity->properties['action']);
        $this->assertEquals('competition', $activity->properties['entity_type']);
        $this->assertEquals($competition->id, $activity->properties['entity_id']);
        $this->assertStringContainsString('Test Competition', $activity->description);
    }

    public function test_log_competition_updated(): void
    {
        $competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'name' => 'Test Competition',
        ]);

        $changes = ['old' => ['name' => 'Old'], 'new' => ['name' => 'New']];

        $activity = $this->service->logCompetitionUpdated($this->user, $competition, $changes);

        $this->assertEquals('update', $activity->properties['action']);
        $this->assertEquals($changes, $activity->properties['changes']);
    }

    public function test_log_competition_deleted(): void
    {
        $competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'name' => 'Test Competition',
        ]);

        $activity = $this->service->logCompetitionDeleted($this->user, $competition);

        $this->assertEquals('delete', $activity->properties['action']);
        $this->assertStringContainsString('Deleted competition', $activity->description);
    }

    // =============================================================================
    // SEASON ACTIVITIES
    // =============================================================================

    public function test_log_season_created(): void
    {
        $competition = Competition::factory()->create(['league_id' => $this->league->id]);
        $season = SeasonEloquent::factory()->create([
            'competition_id' => $competition->id,
            'name' => 'Season 1',
        ]);

        $activity = $this->service->logSeasonCreated($this->user, $season);

        $this->assertEquals('create', $activity->properties['action']);
        $this->assertEquals('season', $activity->properties['entity_type']);
        $this->assertEquals($competition->id, $activity->properties['context']['competition_id']);
    }

    public function test_log_season_updated(): void
    {
        $competition = Competition::factory()->create(['league_id' => $this->league->id]);
        $season = SeasonEloquent::factory()->create(['competition_id' => $competition->id]);

        $changes = ['old' => ['name' => 'S1'], 'new' => ['name' => 'Season 1']];

        $activity = $this->service->logSeasonUpdated($this->user, $season, $changes);

        $this->assertEquals('update', $activity->properties['action']);
        $this->assertEquals($changes, $activity->properties['changes']);
    }

    public function test_log_season_completed(): void
    {
        $competition = Competition::factory()->create(['league_id' => $this->league->id]);
        $season = SeasonEloquent::factory()->create(['competition_id' => $competition->id]);

        $activity = $this->service->logSeasonCompleted($this->user, $season);

        $this->assertEquals('complete', $activity->properties['action']);
        $this->assertStringContainsString('Completed season', $activity->description);
    }

    public function test_log_season_archived(): void
    {
        $competition = Competition::factory()->create(['league_id' => $this->league->id]);
        $season = SeasonEloquent::factory()->create(['competition_id' => $competition->id]);

        $activity = $this->service->logSeasonArchived($this->user, $season);

        $this->assertEquals('archive', $activity->properties['action']);
    }

    public function test_log_season_deleted(): void
    {
        $competition = Competition::factory()->create(['league_id' => $this->league->id]);
        $season = SeasonEloquent::factory()->create(['competition_id' => $competition->id]);

        $activity = $this->service->logSeasonDeleted($this->user, $season);

        $this->assertEquals('delete', $activity->properties['action']);
    }

    // =============================================================================
    // ROUND ACTIVITIES
    // =============================================================================

    public function test_log_round_created(): void
    {
        $competition = Competition::factory()->create(['league_id' => $this->league->id]);
        $season = SeasonEloquent::factory()->create(['competition_id' => $competition->id]);
        $round = Round::factory()->create([
            'season_id' => $season->id,
            'name' => 'Round 1',
        ]);

        $activity = $this->service->logRoundCreated($this->user, $round);

        $this->assertEquals('create', $activity->properties['action']);
        $this->assertEquals('round', $activity->properties['entity_type']);
        $this->assertEquals($round->id, $activity->properties['entity_id']);
        $this->assertEquals($season->id, $activity->properties['context']['season_id']);
    }

    public function test_log_round_completed(): void
    {
        $competition = Competition::factory()->create(['league_id' => $this->league->id]);
        $season = SeasonEloquent::factory()->create(['competition_id' => $competition->id]);
        $round = Round::factory()->create(['season_id' => $season->id]);

        $activity = $this->service->logRoundCompleted($this->user, $round);

        $this->assertEquals('complete', $activity->properties['action']);
    }

    // =============================================================================
    // RACE ACTIVITIES
    // =============================================================================

    public function test_log_race_created(): void
    {
        $competition = Competition::factory()->create(['league_id' => $this->league->id]);
        $season = SeasonEloquent::factory()->create(['competition_id' => $competition->id]);
        $round = Round::factory()->create(['season_id' => $season->id]);
        $race = Race::factory()->create([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
        ]);

        $activity = $this->service->logRaceCreated($this->user, $race);

        $this->assertEquals('create', $activity->properties['action']);
        $this->assertEquals('race', $activity->properties['entity_type']);
        $this->assertStringContainsString('Race 1', $activity->description);
    }

    public function test_log_qualifier_created(): void
    {
        $competition = Competition::factory()->create(['league_id' => $this->league->id]);
        $season = SeasonEloquent::factory()->create(['competition_id' => $competition->id]);
        $round = Round::factory()->create(['season_id' => $season->id]);
        $qualifier = Race::factory()->create([
            'round_id' => $round->id,
            'is_qualifier' => true,
        ]);

        $activity = $this->service->logRaceCreated($this->user, $qualifier);

        $this->assertEquals('qualifier', $activity->properties['entity_type']);
        $this->assertStringContainsString('qualifier', $activity->description);
    }

    public function test_log_race_results_entered(): void
    {
        $competition = Competition::factory()->create(['league_id' => $this->league->id]);
        $season = SeasonEloquent::factory()->create(['competition_id' => $competition->id]);
        $round = Round::factory()->create(['season_id' => $season->id]);
        $race = Race::factory()->create([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
        ]);

        $activity = $this->service->logRaceResultsEntered($this->user, $race, 20);

        $this->assertEquals('enter_results', $activity->properties['action']);
        $this->assertEquals(20, $activity->properties['result_count']);
    }

    // =============================================================================
    // DIVISION & TEAM ACTIVITIES
    // =============================================================================

    public function test_log_division_created(): void
    {
        $competition = Competition::factory()->create(['league_id' => $this->league->id]);
        $season = SeasonEloquent::factory()->create(['competition_id' => $competition->id]);
        $division = Division::factory()->create([
            'season_id' => $season->id,
            'name' => 'Division A',
        ]);

        $activity = $this->service->logDivisionCreated($this->user, $division);

        $this->assertEquals('create', $activity->properties['action']);
        $this->assertEquals('division', $activity->properties['entity_type']);
    }

    public function test_log_team_created(): void
    {
        $competition = Competition::factory()->create(['league_id' => $this->league->id]);
        $season = SeasonEloquent::factory()->create(['competition_id' => $competition->id]);
        $team = Team::factory()->create([
            'season_id' => $season->id,
            'name' => 'Team A',
        ]);

        $activity = $this->service->logTeamCreated($this->user, $team);

        $this->assertEquals('create', $activity->properties['action']);
        $this->assertEquals('team', $activity->properties['entity_type']);
    }

    // =============================================================================
    // QUERY METHODS
    // =============================================================================

    public function test_get_activities_for_league(): void
    {
        // Create some activities
        $this->service->logLeagueCreated($this->user, $this->league);

        $competition = Competition::factory()->create(['league_id' => $this->league->id]);
        $this->service->logCompetitionCreated($this->user, $competition);

        // Get activities
        $activities = $this->service->getActivitiesForLeague($this->league->id);

        $this->assertCount(2, $activities);
        $this->assertEquals('league', $activities->first()->log_name);
    }

    public function test_get_activities_with_limit(): void
    {
        // Create 5 activities
        for ($i = 0; $i < 5; $i++) {
            $competition = Competition::factory()->create([
                'league_id' => $this->league->id,
                'name' => "Competition {$i}",
            ]);
            $this->service->logCompetitionCreated($this->user, $competition);
        }

        // Get with limit
        $activities = $this->service->getActivitiesForLeague($this->league->id, 3);

        $this->assertCount(3, $activities);
    }

    public function test_get_activities_filtered_by_entity_type(): void
    {
        // Create different types
        $this->service->logLeagueCreated($this->user, $this->league);

        $competition = Competition::factory()->create(['league_id' => $this->league->id]);
        $this->service->logCompetitionCreated($this->user, $competition);

        // Filter by competition
        $activities = $this->service->getActivitiesForLeague(
            $this->league->id,
            null,
            'competition'
        );

        $this->assertCount(1, $activities);
        $this->assertEquals('competition', $activities->first()->entity_type);
    }

    public function test_get_activities_filtered_by_action(): void
    {
        $competition = Competition::factory()->create(['league_id' => $this->league->id]);

        $this->service->logCompetitionCreated($this->user, $competition);
        $this->service->logCompetitionUpdated($this->user, $competition, []);

        // Filter by create action
        $activities = $this->service->getActivitiesForLeague(
            $this->league->id,
            null,
            null,
            'create'
        );

        $this->assertCount(1, $activities);
        $this->assertEquals('create', $activities->first()->action);
    }

    public function test_activities_include_user_context(): void
    {
        $this->service->logLeagueCreated($this->user, $this->league);

        $activity = Activity::query()->where('log_name', 'league')->first();

        $this->assertNotNull($activity);
        $this->assertArrayHasKey('ip_address', $activity->properties->toArray());
        $this->assertArrayHasKey('user_agent', $activity->properties->toArray());
    }
}
