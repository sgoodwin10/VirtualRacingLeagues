<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\Round;
use App\Infrastructure\Persistence\Eloquent\Models\Race;
use App\Infrastructure\Persistence\Eloquent\Models\RaceResult;
use App\Infrastructure\Persistence\Eloquent\Models\Team;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\Driver;
use App\Infrastructure\Persistence\Eloquent\Models\Division;
use App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent;
use App\Models\User;
use App\Application\Competition\Services\RoundApplicationService;

/**
 * Test team championship calculation using total_points from round_results.
 */
class TeamChampionshipCalculationTest extends TestCase
{
    use RefreshDatabase;

    private RoundApplicationService $roundService;
    private int $userId;
    private int $roundId;
    private int $team1Id;
    private int $team2Id;
    private int $seasonDriver1Id;
    private int $seasonDriver2Id;
    private int $seasonDriver3Id;
    private int $seasonDriver4Id;

    protected function setUp(): void
    {
        parent::setUp();

        $this->roundService = app(RoundApplicationService::class);

        // Create test user
        $user = User::factory()->create();
        $this->userId = $user->id;

        // Create league, competition, season with team championship enabled
        $league = League::factory()->create([
            'owner_user_id' => $this->userId,
        ]);

        $competition = Competition::factory()->create([
            'league_id' => $league->id,
        ]);

        $season = SeasonEloquent::factory()->create([
            'competition_id' => $competition->id,
            'team_championship_enabled' => true,
            'teams_drivers_for_calculation' => 2, // Only top 2 drivers per team
            'race_divisions_enabled' => false, // Explicitly disable divisions for base tests
        ]);

        // Create two teams
        $team1 = Team::factory()->create([
            'season_id' => $season->id,
            'name' => 'Alpha Racing',
        ]);
        $this->team1Id = $team1->id;

        $team2 = Team::factory()->create([
            'season_id' => $season->id,
            'name' => 'Beta Motorsport',
        ]);
        $this->team2Id = $team2->id;

        // Create drivers
        $driver1 = Driver::factory()->create();
        $driver2 = Driver::factory()->create();
        $driver3 = Driver::factory()->create();
        $driver4 = Driver::factory()->create();

        // Create league drivers (bridge between driver and league)
        $leagueDriver1 = LeagueDriverEloquent::factory()->create([
            'league_id' => $league->id,
            'driver_id' => $driver1->id,
        ]);

        $leagueDriver2 = LeagueDriverEloquent::factory()->create([
            'league_id' => $league->id,
            'driver_id' => $driver2->id,
        ]);

        $leagueDriver3 = LeagueDriverEloquent::factory()->create([
            'league_id' => $league->id,
            'driver_id' => $driver3->id,
        ]);

        $leagueDriver4 = LeagueDriverEloquent::factory()->create([
            'league_id' => $league->id,
            'driver_id' => $driver4->id,
        ]);

        // Assign drivers to teams via season_drivers
        $seasonDriver1 = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver1->id,
            'team_id' => $team1->id,
        ]);
        $this->seasonDriver1Id = $seasonDriver1->id;

        $seasonDriver2 = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver2->id,
            'team_id' => $team1->id,
        ]);
        $this->seasonDriver2Id = $seasonDriver2->id;

        $seasonDriver3 = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver3->id,
            'team_id' => $team2->id,
        ]);
        $this->seasonDriver3Id = $seasonDriver3->id;

        $seasonDriver4 = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver4->id,
            'team_id' => $team2->id,
        ]);
        $this->seasonDriver4Id = $seasonDriver4->id;

        // Create round with round points enabled
        $round = Round::factory()->create([
            'season_id' => $season->id,
            'round_number' => 1,
            'round_points' => true,
            'points_system' => json_encode([
                1 => 25,
                2 => 18,
                3 => 15,
                4 => 12,
            ]),
            'fastest_lap' => 1,
            'fastest_lap_top_10' => false,
        ]);
        $this->roundId = $round->id;

        // Create a race
        $race = Race::factory()->create([
            'round_id' => $round->id,
            'race_number' => 1,
            'is_qualifier' => false,
            'race_points' => true,
            'points_system' => json_encode([
                1 => 10,
                2 => 8,
                3 => 6,
                4 => 4,
            ]),
            'status' => 'scheduled',
        ]);

        // Create race results with race_points
        // Team 1: Driver 1 (P1, 10 points) + Driver 2 (P2, 8 points) = 18 race points
        // Team 2: Driver 3 (P3, 6 points) + Driver 4 (P4, 4 points) = 10 race points
        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $this->seasonDriver1Id, // Team 1, Driver 1
            'position' => 1,
            'race_points' => 10,
            'fastest_lap' => '00:01:30.000', // Fastest lap
            'status' => 'pending',
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $this->seasonDriver2Id, // Team 1, Driver 2
            'position' => 2,
            'race_points' => 8,
            'fastest_lap' => '00:01:31.000',
            'status' => 'pending',
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $this->seasonDriver3Id, // Team 2, Driver 3
            'position' => 3,
            'race_points' => 6,
            'fastest_lap' => '00:01:32.000',
            'status' => 'pending',
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $this->seasonDriver4Id, // Team 2, Driver 4
            'position' => 4,
            'race_points' => 4,
            'fastest_lap' => '00:01:33.000',
            'status' => 'pending',
        ]);
    }

    public function test_team_championship_uses_total_points_from_round_results(): void
    {
        // Complete the round which calculates round results and team championship
        $this->roundService->completeRound($this->roundId, $this->userId);

        // Fetch the updated round
        $round = Round::find($this->roundId);

        // Verify round_results exists
        $this->assertNotNull($round->round_results);
        $this->assertIsArray($round->round_results);
        $this->assertArrayHasKey('standings', $round->round_results);

        // Verify team_championship_results exists
        $this->assertNotNull($round->team_championship_results);
        $this->assertIsArray($round->team_championship_results);
        $this->assertArrayHasKey('standings', $round->team_championship_results);

        $teamStandings = $round->team_championship_results['standings'];
        $this->assertCount(2, $teamStandings);

        // Get team standings by team_id
        $team1Standing = collect($teamStandings)->firstWhere('team_id', $this->team1Id);
        $team2Standing = collect($teamStandings)->firstWhere('team_id', $this->team2Id);

        $this->assertNotNull($team1Standing);
        $this->assertNotNull($team2Standing);

        // Verify structure
        $this->assertArrayHasKey('team_id', $team1Standing);
        $this->assertArrayHasKey('total_points', $team1Standing);
        $this->assertArrayHasKey('driver_ids', $team1Standing);

        // Expected calculation with round_points enabled:
        // NOTE: When round_points is enabled, total_points = round_points + fastest_lap_points + pole_position_points
        // race_points is NOT included in total_points calculation
        //
        // Driver 1: round_points=25 (P1), fastest_lap=1, pole=0 => total_points=26
        // Driver 2: round_points=18 (P2), fastest_lap=0, pole=0 => total_points=18
        // Driver 3: round_points=15 (P3), fastest_lap=0, pole=0 => total_points=15
        // Driver 4: round_points=12 (P4), fastest_lap=0, pole=0 => total_points=12
        //
        // With teams_drivers_for_calculation=2:
        // Team 1 (Alpha Racing): top 2 drivers = Driver 1 (26) + Driver 2 (18) = 44 points
        // Team 2 (Beta Motorsport): top 2 drivers = Driver 3 (15) + Driver 4 (12) = 27 points

        $this->assertEquals(44, $team1Standing['total_points'], 'Team 1 should have 44 total points');
        $this->assertEquals(27, $team2Standing['total_points'], 'Team 2 should have 27 total points');

        // Verify driver_ids are stored correctly
        $this->assertContains($this->seasonDriver1Id, $team1Standing['driver_ids']);
        $this->assertContains($this->seasonDriver2Id, $team1Standing['driver_ids']);
        $this->assertContains($this->seasonDriver3Id, $team2Standing['driver_ids']);
        $this->assertContains($this->seasonDriver4Id, $team2Standing['driver_ids']);

        // Verify sorting (Team 1 should be first)
        $this->assertEquals($this->team1Id, $teamStandings[0]['team_id']);
        $this->assertEquals($this->team2Id, $teamStandings[1]['team_id']);
    }

    public function test_team_championship_excludes_privateer_drivers(): void
    {
        // Create a privateer driver (no team assignment)
        $round = Round::find($this->roundId);
        $season = SeasonEloquent::find($round->season_id);
        $league = League::find(Competition::find($season->competition_id)->league_id);

        $privateerDriver = Driver::factory()->create();
        $privateerLeagueDriver = LeagueDriverEloquent::factory()->create([
            'league_id' => $league->id,
            'driver_id' => $privateerDriver->id,
        ]);

        $privateerSeasonDriver = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $privateerLeagueDriver->id,
            'team_id' => null, // Privateer - no team
        ]);

        // Add a race result for the privateer
        $race = Race::where('round_id', $this->roundId)->first();
        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $privateerSeasonDriver->id,
            'position' => 5,
            'race_points' => 2,
            'fastest_lap' => '00:01:34.000',
            'status' => 'pending',
        ]);

        // Complete the round
        $this->roundService->completeRound($this->roundId, $this->userId);

        // Fetch the updated round
        $round = Round::find($this->roundId);
        $teamStandings = $round->team_championship_results['standings'];

        // Should still only have 2 teams (privateer excluded)
        $this->assertCount(2, $teamStandings);

        // Verify privateer driver is NOT in any team's driver_ids
        foreach ($teamStandings as $standing) {
            $this->assertNotContains($privateerSeasonDriver->id, $standing['driver_ids']);
        }
    }

    public function test_team_championship_respects_drivers_for_calculation_limit(): void
    {
        // Add a third driver to Team 1
        $round = Round::find($this->roundId);
        $season = SeasonEloquent::find($round->season_id);
        $league = League::find(Competition::find($season->competition_id)->league_id);

        $driver5 = Driver::factory()->create();
        $leagueDriver5 = LeagueDriverEloquent::factory()->create([
            'league_id' => $league->id,
            'driver_id' => $driver5->id,
        ]);

        $seasonDriver5 = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver5->id,
            'team_id' => $this->team1Id,
        ]);

        // Add race result for third driver
        $race = Race::where('round_id', $this->roundId)->first();
        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $seasonDriver5->id,
            'position' => 5,
            'race_points' => 2,
            'fastest_lap' => '00:01:35.000',
            'status' => 'pending',
        ]);

        // Complete the round
        $this->roundService->completeRound($this->roundId, $this->userId);

        // Fetch the updated round
        $round = Round::find($this->roundId);
        $teamStandings = $round->team_championship_results['standings'];

        $team1Standing = collect($teamStandings)->firstWhere('team_id', $this->team1Id);

        // Should only count top 2 drivers (teams_drivers_for_calculation = 2)
        $this->assertCount(2, $team1Standing['driver_ids']);

        // Should be the top 2 drivers by total_points (Driver 1 and Driver 2, not Driver 5)
        $this->assertContains($this->seasonDriver1Id, $team1Standing['driver_ids']);
        $this->assertContains($this->seasonDriver2Id, $team1Standing['driver_ids']);
        $this->assertNotContains($seasonDriver5->id, $team1Standing['driver_ids']);
    }

    public function test_team_championship_handles_divisions_correctly(): void
    {
        // Enable divisions for the season
        $round = Round::find($this->roundId);
        $season = SeasonEloquent::find($round->season_id);
        $season->update(['race_divisions_enabled' => true]);

        // Create a division
        $division = Division::factory()->create([
            'season_id' => $season->id,
        ]);

        // Update race results to have division_id
        RaceResult::where('race_id', Race::where('round_id', $this->roundId)->first()->id)
            ->update(['division_id' => $division->id]);

        // Complete the round
        $this->roundService->completeRound($this->roundId, $this->userId);

        // Fetch the updated round
        $round = Round::find($this->roundId);

        // Should still calculate team championship correctly even with divisions
        $this->assertNotNull($round->team_championship_results);
        $teamStandings = $round->team_championship_results['standings'];

        $this->assertCount(2, $teamStandings);
        $team1Standing = collect($teamStandings)->firstWhere('team_id', $this->team1Id);
        $team2Standing = collect($teamStandings)->firstWhere('team_id', $this->team2Id);

        $this->assertNotNull($team1Standing);
        $this->assertNotNull($team2Standing);
    }

    public function test_team_championship_not_calculated_when_disabled(): void
    {
        // Disable team championship
        $round = Round::find($this->roundId);
        $season = SeasonEloquent::find($round->season_id);
        $season->update(['team_championship_enabled' => false]);

        // Complete the round
        $this->roundService->completeRound($this->roundId, $this->userId);

        // Fetch the updated round
        $round = Round::find($this->roundId);

        // team_championship_results should be null when team championship is disabled
        $this->assertNull($round->team_championship_results);
    }
}
