<?php

declare(strict_types=1);

namespace Tests\Feature\User;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\Division;
use App\Infrastructure\Persistence\Eloquent\Models\Driver;
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

final class RemoveOrphanedRaceResultsTest extends TestCase
{
    use RefreshDatabase;

    private const APP_URL = 'http://app.virtualracingleagues.localhost';

    private User $user;
    private League $league;
    private Competition $competition;
    private SeasonEloquent $season;
    private Round $round;
    private Race $race;

    protected function setUp(): void
    {
        parent::setUp();

        // Create user
        $this->user = User::factory()->create();

        // Create league
        $this->league = League::factory()->create([
            'owner_user_id' => $this->user->id,
        ]);

        // Create competition
        $this->competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'created_by_user_id' => $this->user->id,
        ]);

        // Create season with divisions enabled
        $this->season = SeasonEloquent::factory()->create([
            'competition_id' => $this->competition->id,
            'race_divisions_enabled' => true,
            'created_by_user_id' => $this->user->id,
        ]);

        // Create round
        $this->round = Round::factory()->create([
            'season_id' => $this->season->id,
        ]);

        // Create race
        $this->race = Race::factory()->create([
            'round_id' => $this->round->id,
        ]);
    }

    public function test_removes_orphaned_results_successfully(): void
    {
        // Create division
        $division = Division::factory()->create([
            'season_id' => $this->season->id,
        ]);

        // Create drivers
        $driver1 = Driver::factory()->create();
        $driver2 = Driver::factory()->create();
        $driver3 = Driver::factory()->create();

        $leagueDriver1 = LeagueDriverEloquent::factory()->create([
            'league_id' => $this->league->id,
            'driver_id' => $driver1->id,
        ]);
        $leagueDriver2 = LeagueDriverEloquent::factory()->create([
            'league_id' => $this->league->id,
            'driver_id' => $driver2->id,
        ]);
        $leagueDriver3 = LeagueDriverEloquent::factory()->create([
            'league_id' => $this->league->id,
            'driver_id' => $driver3->id,
        ]);

        // Assign driver1 to division
        $seasonDriver1 = SeasonDriverEloquent::factory()->create([
            'season_id' => $this->season->id,
            'league_driver_id' => $leagueDriver1->id,
            'division_id' => $division->id,
        ]);

        // Create orphaned season drivers (no division assignment)
        $seasonDriver2 = SeasonDriverEloquent::factory()->create([
            'season_id' => $this->season->id,
            'league_driver_id' => $leagueDriver2->id,
            'division_id' => null,
        ]);

        $seasonDriver3 = SeasonDriverEloquent::factory()->create([
            'season_id' => $this->season->id,
            'league_driver_id' => $leagueDriver3->id,
            'division_id' => null,
        ]);

        // Create race results
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $seasonDriver1->id,
            'division_id' => $division->id,
            'position' => 1,
            'race_points' => 25,
            'status' => 'confirmed',
        ]);

        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $seasonDriver2->id,
            'division_id' => null, // Orphaned
            'position' => 2,
            'race_points' => 18,
            'status' => 'confirmed',
        ]);

        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $seasonDriver3->id,
            'division_id' => null, // Orphaned
            'position' => 3,
            'race_points' => 15,
            'status' => 'confirmed',
        ]);

        // Verify we have 3 results total, 2 orphaned
        $this->assertEquals(3, RaceResult::count());
        $this->assertEquals(2, RaceResult::whereNull('division_id')->count());

        // Act - call the endpoint
        $response = $this->actingAs($this->user)->deleteJson(
            self::APP_URL . "/api/races/{$this->race->id}/orphaned-results"
        );

        // Assert
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => '2 orphaned results removed',
            'data' => [
                'count' => 2,
            ],
        ]);

        // Verify orphaned results were deleted
        $this->assertEquals(1, RaceResult::count());
        $this->assertEquals(0, RaceResult::whereNull('division_id')->count());

        // Verify the non-orphaned result still exists
        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $seasonDriver1->id,
            'division_id' => $division->id,
        ]);

        // Verify specific orphaned results were deleted (by driver_id)
        $this->assertDatabaseMissing('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $seasonDriver2->id,
        ]);
        $this->assertDatabaseMissing('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $seasonDriver3->id,
        ]);
    }

    public function test_returns_error_when_divisions_not_enabled(): void
    {
        // Update season to disable divisions
        $this->season->update(['race_divisions_enabled' => false]);

        // Create orphaned result
        $driver = Driver::factory()->create();
        $leagueDriver = LeagueDriverEloquent::factory()->create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
        ]);
        $seasonDriver = SeasonDriverEloquent::factory()->create([
            'season_id' => $this->season->id,
            'league_driver_id' => $leagueDriver->id,
            'division_id' => null,
        ]);
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $seasonDriver->id,
            'division_id' => null,
            'position' => 1,
            'race_points' => 25,
            'status' => 'confirmed',
        ]);

        // Act
        $response = $this->actingAs($this->user)->deleteJson(
            self::APP_URL . "/api/races/{$this->race->id}/orphaned-results"
        );

        // Assert
        $response->assertStatus(422);
        $response->assertJson([
            'success' => false,
            'message' => 'Divisions are not enabled for this season',
        ]);

        // Verify result was not deleted
        $this->assertEquals(1, RaceResult::count());
    }

    public function test_returns_404_when_race_not_found(): void
    {
        // Act
        $response = $this->actingAs($this->user)->deleteJson(
            self::APP_URL . '/api/races/99999/orphaned-results'
        );

        // Assert
        $response->assertStatus(404);
        $response->assertJson([
            'success' => false,
            'message' => 'Race not found',
        ]);
    }

    public function test_returns_zero_count_when_no_orphaned_results(): void
    {
        // Create division
        $division = Division::factory()->create([
            'season_id' => $this->season->id,
        ]);

        // Create driver with division assignment
        $driver = Driver::factory()->create();
        $leagueDriver = LeagueDriverEloquent::factory()->create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
        ]);
        $seasonDriver = SeasonDriverEloquent::factory()->create([
            'season_id' => $this->season->id,
            'league_driver_id' => $leagueDriver->id,
            'division_id' => $division->id,
        ]);

        // Create non-orphaned result
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $seasonDriver->id,
            'division_id' => $division->id,
            'position' => 1,
            'race_points' => 25,
            'status' => 'confirmed',
        ]);

        // Act
        $response = $this->actingAs($this->user)->deleteJson(
            self::APP_URL . "/api/races/{$this->race->id}/orphaned-results"
        );

        // Assert
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => '0 orphaned results removed',
            'data' => [
                'count' => 0,
            ],
        ]);

        // Verify result still exists
        $this->assertEquals(1, RaceResult::count());
    }

    public function test_returns_correct_message_for_single_result(): void
    {
        // Create one orphaned result
        $driver = Driver::factory()->create();
        $leagueDriver = LeagueDriverEloquent::factory()->create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
        ]);
        $seasonDriver = SeasonDriverEloquent::factory()->create([
            'season_id' => $this->season->id,
            'league_driver_id' => $leagueDriver->id,
            'division_id' => null,
        ]);
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $seasonDriver->id,
            'division_id' => null,
            'position' => 1,
            'race_points' => 25,
            'status' => 'confirmed',
        ]);

        // Act
        $response = $this->actingAs($this->user)->deleteJson(
            self::APP_URL . "/api/races/{$this->race->id}/orphaned-results"
        );

        // Assert
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => '1 orphaned result removed',
            'data' => [
                'count' => 1,
            ],
        ]);
    }

    public function test_requires_authentication(): void
    {
        // Act - call without authentication
        $response = $this->deleteJson(
            self::APP_URL . "/api/races/{$this->race->id}/orphaned-results"
        );

        // Assert
        $response->assertStatus(401);
    }

    public function test_get_orphaned_results_returns_driver_list(): void
    {
        // Create division
        $division = Division::factory()->create([
            'season_id' => $this->season->id,
        ]);

        // Create drivers
        $driver1 = Driver::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'nickname' => null,
        ]);
        $driver2 = Driver::factory()->create([
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'nickname' => null,
        ]);
        $driver3 = Driver::factory()->create([
            'nickname' => 'SpeedyGonzales',
        ]);

        $leagueDriver1 = LeagueDriverEloquent::factory()->create([
            'league_id' => $this->league->id,
            'driver_id' => $driver1->id,
        ]);
        $leagueDriver2 = LeagueDriverEloquent::factory()->create([
            'league_id' => $this->league->id,
            'driver_id' => $driver2->id,
        ]);
        $leagueDriver3 = LeagueDriverEloquent::factory()->create([
            'league_id' => $this->league->id,
            'driver_id' => $driver3->id,
        ]);

        // Assign driver1 to division (not orphaned)
        $seasonDriver1 = SeasonDriverEloquent::factory()->create([
            'season_id' => $this->season->id,
            'league_driver_id' => $leagueDriver1->id,
            'division_id' => $division->id,
        ]);

        // Create orphaned season drivers (no division assignment)
        $seasonDriver2 = SeasonDriverEloquent::factory()->create([
            'season_id' => $this->season->id,
            'league_driver_id' => $leagueDriver2->id,
            'division_id' => null,
        ]);

        $seasonDriver3 = SeasonDriverEloquent::factory()->create([
            'season_id' => $this->season->id,
            'league_driver_id' => $leagueDriver3->id,
            'division_id' => null,
        ]);

        // Create race results
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $seasonDriver1->id,
            'division_id' => $division->id,
            'position' => 1,
            'race_points' => 25,
            'status' => 'confirmed',
        ]);

        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $seasonDriver2->id,
            'division_id' => null, // Orphaned
            'position' => 2,
            'race_points' => 18,
            'status' => 'confirmed',
        ]);

        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $seasonDriver3->id,
            'division_id' => null, // Orphaned
            'position' => 3,
            'race_points' => 15,
            'status' => 'confirmed',
        ]);

        // Act - call the GET endpoint
        $response = $this->actingAs($this->user)->getJson(
            self::APP_URL . "/api/races/{$this->race->id}/orphaned-results"
        );

        // Assert
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'count' => 2,
                'drivers' => [
                    [
                        'id' => $driver2->id,
                        'name' => 'Jane Smith',
                    ],
                    [
                        'id' => $driver3->id,
                        'name' => 'SpeedyGonzales',
                    ],
                ],
            ],
        ]);
    }

    public function test_get_orphaned_results_returns_empty_list_when_none(): void
    {
        // Create division
        $division = Division::factory()->create([
            'season_id' => $this->season->id,
        ]);

        // Create driver with division assignment
        $driver = Driver::factory()->create();
        $leagueDriver = LeagueDriverEloquent::factory()->create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
        ]);
        $seasonDriver = SeasonDriverEloquent::factory()->create([
            'season_id' => $this->season->id,
            'league_driver_id' => $leagueDriver->id,
            'division_id' => $division->id,
        ]);

        // Create non-orphaned result
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $seasonDriver->id,
            'division_id' => $division->id,
            'position' => 1,
            'race_points' => 25,
            'status' => 'confirmed',
        ]);

        // Act
        $response = $this->actingAs($this->user)->getJson(
            self::APP_URL . "/api/races/{$this->race->id}/orphaned-results"
        );

        // Assert
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'count' => 0,
                'drivers' => [],
            ],
        ]);
    }

    public function test_get_orphaned_results_returns_404_when_race_not_found(): void
    {
        // Act
        $response = $this->actingAs($this->user)->getJson(
            self::APP_URL . '/api/races/99999/orphaned-results'
        );

        // Assert
        $response->assertStatus(404);
        $response->assertJson([
            'success' => false,
            'message' => 'Race not found',
        ]);
    }

    public function test_get_orphaned_results_requires_authentication(): void
    {
        // Act - call without authentication
        $response = $this->getJson(
            self::APP_URL . "/api/races/{$this->race->id}/orphaned-results"
        );

        // Assert
        $response->assertStatus(401);
    }

    public function test_user_from_different_league_cannot_delete_orphaned_results(): void
    {
        // Arrange: Create a user from a different league
        $otherUser = User::factory()->create();
        $otherLeague = League::factory()->create(['owner_user_id' => $otherUser->id]);

        // Create division for the original league
        $division = Division::factory()->create([
            'season_id' => $this->season->id,
        ]);

        // Create orphaned driver for the original league
        $driver = Driver::factory()->create();
        $leagueDriver = LeagueDriverEloquent::factory()->create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
        ]);
        $seasonDriver = SeasonDriverEloquent::factory()->create([
            'season_id' => $this->season->id,
            'league_driver_id' => $leagueDriver->id,
            'division_id' => null,
        ]);

        // Create orphaned race result
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $seasonDriver->id,
            'division_id' => null, // Orphaned
            'position' => 1,
            'race_points' => 25,
            'status' => 'confirmed',
        ]);

        // Verify the orphaned result exists
        $this->assertEquals(1, RaceResult::whereNull('division_id')->count());

        // Act - other user tries to delete orphaned results from a different league's race
        $response = $this->actingAs($otherUser)->deleteJson(
            self::APP_URL . "/api/races/{$this->race->id}/orphaned-results"
        );

        // Assert: System properly implements authorization - returns 403 Forbidden
        $response->assertStatus(403);

        // Verify the orphaned result was NOT deleted (authorization worked correctly)
        $this->assertEquals(1, RaceResult::whereNull('division_id')->count());
        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $seasonDriver->id,
            'division_id' => null,
        ]);
    }

    public function test_cache_invalidated_after_deletion(): void
    {
        // Create division
        $division = Division::factory()->create([
            'season_id' => $this->season->id,
        ]);

        // Create orphaned driver
        $driver = Driver::factory()->create();
        $leagueDriver = LeagueDriverEloquent::factory()->create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
        ]);
        $seasonDriver = SeasonDriverEloquent::factory()->create([
            'season_id' => $this->season->id,
            'league_driver_id' => $leagueDriver->id,
            'division_id' => null,
        ]);

        // Create orphaned result
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $seasonDriver->id,
            'division_id' => null,
            'position' => 1,
            'race_points' => 25,
            'status' => 'confirmed',
        ]);

        // Pre-populate cache using the same store that RaceResultsCacheService uses
        // (defaults to config('league.cache.store', config('cache.default')))
        $cacheStore = config('league.cache.store', config('cache.default'));
        $cacheKey = "race_results:{$this->race->id}";
        Cache::store($cacheStore)->put($cacheKey, ['test' => 'data'], 3600);

        // Verify cache exists
        $this->assertTrue(Cache::store($cacheStore)->has($cacheKey));

        // Act - delete orphaned results
        $response = $this->actingAs($this->user)->deleteJson(
            self::APP_URL . "/api/races/{$this->race->id}/orphaned-results"
        );

        // Assert response is successful
        $response->assertStatus(200);

        // Verify cache was invalidated
        $this->assertFalse(Cache::store($cacheStore)->has($cacheKey));
    }
}
