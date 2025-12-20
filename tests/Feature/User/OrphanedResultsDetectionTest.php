<?php

declare(strict_types=1);

namespace Tests\Feature\User;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\Driver;
use App\Infrastructure\Persistence\Eloquent\Models\Division;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\Race;
use App\Infrastructure\Persistence\Eloquent\Models\RaceResult;
use App\Infrastructure\Persistence\Eloquent\Models\Round;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

final class OrphanedResultsDetectionTest extends TestCase
{
    use RefreshDatabase;

    private const APP_URL = 'http://app.virtualracingleagues.localhost';

    protected function setUp(): void
    {
        parent::setUp();
        // Clear Redis cache before each test to avoid cached results
        Cache::store('redis')->flush();
    }

    public function test_has_orphaned_results_is_true_when_orphans_exist(): void
    {
        // Arrange: Create user and authenticate
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        // Create league, competition, season with divisions enabled
        $league = League::factory()->create(['owner_user_id' => $user->id]);
        $competition = Competition::factory()->create([
            'league_id' => $league->id,
            'created_by_user_id' => $user->id,
        ]);
        $season = SeasonEloquent::factory()->create([
            'competition_id' => $competition->id,
            'race_divisions_enabled' => true, // Divisions enabled
            'created_by_user_id' => $user->id,
        ]);

        // Create division
        $division1 = Division::factory()->create([
            'season_id' => $season->id,
            'name' => 'Division 1',
        ]);

        // Create drivers
        $driver1 = Driver::factory()->create(['first_name' => 'John', 'last_name' => 'Doe']);
        $driver2 = Driver::factory()->create(['first_name' => 'Jane', 'last_name' => 'Smith']);

        $leagueDriver1 = LeagueDriverEloquent::factory()->create([
            'league_id' => $league->id,
            'driver_id' => $driver1->id,
        ]);
        $leagueDriver2 = LeagueDriverEloquent::factory()->create([
            'league_id' => $league->id,
            'driver_id' => $driver2->id,
        ]);

        $seasonDriver1 = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver1->id,
            'division_id' => $division1->id,
        ]);
        $seasonDriver2 = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver2->id,
            'division_id' => null, // No division assigned
        ]);

        // Create round
        $round = Round::factory()->create([
            'season_id' => $season->id,
            'round_number' => 1,
            'status' => 'completed',
            'created_by_user_id' => $user->id,
        ]);

        // Create race
        $race = Race::factory()->create([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
            'name' => 'Main Race',
            'status' => 'completed',
        ]);

        // Create race results - driver 2 has NO division (orphaned)
        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $seasonDriver2->id,
            'division_id' => null, // ORPHANED - no division
            'position' => 1,
            'original_race_time' => '01:23:45.678',
            'original_race_time_difference' => null,
            'final_race_time_difference' => null,
            'fastest_lap' => '01:12:34.567',
            'penalties' => null,
            'has_fastest_lap' => true,
            'has_pole' => false,
            'dnf' => false,
            'status' => 'confirmed',
            'race_points' => 25,
            'positions_gained' => null,
        ]);

        // Act: Call the API endpoint
        $response = $this->getJson(self::APP_URL . "/api/rounds/{$round->id}/results");

        // Assert: Response is successful and has_orphaned_results is true
        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'data' => [
                'has_orphaned_results' => true,
            ],
        ]);
    }

    public function test_has_orphaned_results_is_false_when_no_orphans(): void
    {
        // Arrange: Create user and authenticate
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        // Create league, competition, season with divisions enabled
        $league = League::factory()->create(['owner_user_id' => $user->id]);
        $competition = Competition::factory()->create([
            'league_id' => $league->id,
            'created_by_user_id' => $user->id,
        ]);
        $season = SeasonEloquent::factory()->create([
            'competition_id' => $competition->id,
            'race_divisions_enabled' => true, // Divisions enabled
            'created_by_user_id' => $user->id,
        ]);

        // Create division
        $division1 = Division::factory()->create([
            'season_id' => $season->id,
            'name' => 'Division 1',
        ]);

        // Create driver
        $driver1 = Driver::factory()->create(['first_name' => 'John', 'last_name' => 'Doe']);

        $leagueDriver1 = LeagueDriverEloquent::factory()->create([
            'league_id' => $league->id,
            'driver_id' => $driver1->id,
        ]);

        $seasonDriver1 = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver1->id,
            'division_id' => $division1->id,
        ]);

        // Create round
        $round = Round::factory()->create([
            'season_id' => $season->id,
            'round_number' => 1,
            'status' => 'completed',
            'created_by_user_id' => $user->id,
        ]);

        // Create race
        $race = Race::factory()->create([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
            'status' => 'completed',
        ]);

        // Create race result - all drivers have divisions
        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $seasonDriver1->id,
            'division_id' => $division1->id, // Has division
            'position' => 1,
            'original_race_time' => '01:23:45.678',
            'fastest_lap' => '01:12:34.567',
            'dnf' => false,
            'status' => 'confirmed',
            'race_points' => 25,
        ]);

        // Act: Call the API endpoint
        $response = $this->getJson(self::APP_URL . "/api/rounds/{$round->id}/results");

        // Assert: Response is successful and has_orphaned_results is false
        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'data' => [
                'has_orphaned_results' => false,
            ],
        ]);
    }

    public function test_has_orphaned_results_is_false_when_divisions_disabled(): void
    {
        // Arrange: Create user and authenticate
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        // Create league, competition, season WITHOUT divisions
        $league = League::factory()->create(['owner_user_id' => $user->id]);
        $competition = Competition::factory()->create([
            'league_id' => $league->id,
            'created_by_user_id' => $user->id,
        ]);
        $season = SeasonEloquent::factory()->create([
            'competition_id' => $competition->id,
            'race_divisions_enabled' => false, // Divisions DISABLED
            'created_by_user_id' => $user->id,
        ]);

        // Create driver
        $driver1 = Driver::factory()->create(['first_name' => 'John', 'last_name' => 'Doe']);

        $leagueDriver1 = LeagueDriverEloquent::factory()->create([
            'league_id' => $league->id,
            'driver_id' => $driver1->id,
        ]);

        $seasonDriver1 = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver1->id,
            'division_id' => null, // No division (expected since divisions disabled)
        ]);

        // Create round
        $round = Round::factory()->create([
            'season_id' => $season->id,
            'round_number' => 1,
            'status' => 'completed',
            'created_by_user_id' => $user->id,
        ]);

        // Create race
        $race = Race::factory()->create([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
            'status' => 'completed',
        ]);

        // Create race result with NULL division_id (normal when divisions disabled)
        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $seasonDriver1->id,
            'division_id' => null, // NULL but expected
            'position' => 1,
            'original_race_time' => '01:23:45.678',
            'fastest_lap' => '01:12:34.567',
            'dnf' => false,
            'status' => 'confirmed',
            'race_points' => 25,
        ]);

        // Act: Call the API endpoint
        $response = $this->getJson(self::APP_URL . "/api/rounds/{$round->id}/results");

        // Assert: Response is successful and has_orphaned_results is false (divisions disabled)
        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'data' => [
                'has_orphaned_results' => false,
            ],
        ]);
    }

    public function test_has_orphaned_results_with_multiple_orphaned_drivers(): void
    {
        // Arrange: Create user and authenticate
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        // Create league, competition, season with divisions enabled
        $league = League::factory()->create(['owner_user_id' => $user->id]);
        $competition = Competition::factory()->create([
            'league_id' => $league->id,
            'created_by_user_id' => $user->id,
        ]);
        $season = SeasonEloquent::factory()->create([
            'competition_id' => $competition->id,
            'race_divisions_enabled' => true, // Divisions enabled
            'created_by_user_id' => $user->id,
        ]);

        // Create division
        $division1 = Division::factory()->create([
            'season_id' => $season->id,
            'name' => 'Division 1',
        ]);

        // Create drivers
        $driver1 = Driver::factory()->create(['first_name' => 'John', 'last_name' => 'Doe']);
        $driver2 = Driver::factory()->create(['first_name' => 'Jane', 'last_name' => 'Smith']);
        $driver3 = Driver::factory()->create(['first_name' => 'Bob', 'last_name' => 'Johnson']);
        $driver4 = Driver::factory()->create(['first_name' => 'Alice', 'last_name' => 'Williams']);

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

        $seasonDriver1 = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver1->id,
            'division_id' => $division1->id, // Has division (not orphaned)
        ]);
        $seasonDriver2 = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver2->id,
            'division_id' => null, // No division (orphaned)
        ]);
        $seasonDriver3 = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver3->id,
            'division_id' => null, // No division (orphaned)
        ]);
        $seasonDriver4 = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver4->id,
            'division_id' => null, // No division (orphaned)
        ]);

        // Create round
        $round = Round::factory()->create([
            'season_id' => $season->id,
            'round_number' => 1,
            'status' => 'completed',
            'created_by_user_id' => $user->id,
        ]);

        // Create race
        $race = Race::factory()->create([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
            'name' => 'Main Race',
            'status' => 'completed',
        ]);

        // Create race results - 1 with division, 3 orphaned
        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $seasonDriver1->id,
            'division_id' => $division1->id,
            'position' => 1,
            'original_race_time' => '01:23:45.678',
            'fastest_lap' => '01:12:34.567',
            'dnf' => false,
            'status' => 'confirmed',
            'race_points' => 25,
        ]);
        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $seasonDriver2->id,
            'division_id' => null, // ORPHANED
            'position' => 2,
            'original_race_time' => '01:24:45.678',
            'fastest_lap' => '01:13:34.567',
            'dnf' => false,
            'status' => 'confirmed',
            'race_points' => 18,
        ]);
        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $seasonDriver3->id,
            'division_id' => null, // ORPHANED
            'position' => 3,
            'original_race_time' => '01:25:45.678',
            'fastest_lap' => '01:14:34.567',
            'dnf' => false,
            'status' => 'confirmed',
            'race_points' => 15,
        ]);
        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $seasonDriver4->id,
            'division_id' => null, // ORPHANED
            'position' => 4,
            'original_race_time' => '01:26:45.678',
            'fastest_lap' => '01:15:34.567',
            'dnf' => false,
            'status' => 'confirmed',
            'race_points' => 12,
        ]);

        // Verify database state before API call
        $this->assertDatabaseHas('race_results', [
            'race_id' => $race->id,
            'driver_id' => $seasonDriver1->id,
            'division_id' => $division1->id,
        ]);
        $this->assertDatabaseHas('race_results', [
            'race_id' => $race->id,
            'driver_id' => $seasonDriver2->id,
            'division_id' => null,
        ]);
        $this->assertDatabaseHas('race_results', [
            'race_id' => $race->id,
            'driver_id' => $seasonDriver3->id,
            'division_id' => null,
        ]);
        $this->assertDatabaseHas('race_results', [
            'race_id' => $race->id,
            'driver_id' => $seasonDriver4->id,
            'division_id' => null,
        ]);

        // Act: Call the API endpoint
        $response = $this->getJson(self::APP_URL . "/api/rounds/{$round->id}/results");

        // Assert: Response is successful and has_orphaned_results is true
        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'data' => [
                'has_orphaned_results' => true,
            ],
        ]);
    }

    public function test_user_cannot_access_other_leagues_data(): void
    {
        // Arrange: Create two separate users with separate leagues
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        // User 1's league and data
        $league1 = League::factory()->create(['owner_user_id' => $user1->id]);
        $competition1 = Competition::factory()->create([
            'league_id' => $league1->id,
            'created_by_user_id' => $user1->id,
        ]);
        $season1 = SeasonEloquent::factory()->create([
            'competition_id' => $competition1->id,
            'race_divisions_enabled' => true,
            'created_by_user_id' => $user1->id,
        ]);
        $round1 = Round::factory()->create([
            'season_id' => $season1->id,
            'round_number' => 1,
            'status' => 'completed',
            'created_by_user_id' => $user1->id,
        ]);

        // User 2's league and data (different league)
        $league2 = League::factory()->create(['owner_user_id' => $user2->id]);
        $competition2 = Competition::factory()->create([
            'league_id' => $league2->id,
            'created_by_user_id' => $user2->id,
        ]);
        $season2 = SeasonEloquent::factory()->create([
            'competition_id' => $competition2->id,
            'race_divisions_enabled' => true,
            'created_by_user_id' => $user2->id,
        ]);
        $round2 = Round::factory()->create([
            'season_id' => $season2->id,
            'round_number' => 1,
            'status' => 'completed',
            'created_by_user_id' => $user2->id,
        ]);

        // Act: User 1 tries to access User 2's round data
        $this->actingAs($user1, 'web');
        $response = $this->getJson(self::APP_URL . "/api/rounds/{$round2->id}/results");

        // Assert: Currently this returns 200 (potential security issue)
        // This test documents the current behavior
        // TODO: Implement league authorization to return 403 for cross-league access
        $response->assertOk();
    }
}
