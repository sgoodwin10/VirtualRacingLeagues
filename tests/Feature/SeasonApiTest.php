<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\Division;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Infrastructure\Persistence\Eloquent\Models\Race;
use App\Infrastructure\Persistence\Eloquent\Models\RaceResult;
use App\Infrastructure\Persistence\Eloquent\Models\Round;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeasonApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that the Season API endpoint returns nested league information for breadcrumbs.
     */
    public function test_season_api_returns_nested_league_information(): void
    {
        // 1. Create test data
        $user = UserEloquent::factory()->create();

        $platform = Platform::create([
            'name' => 'Test Platform',
            'slug' => 'test-platform',
            'logo_url' => '',
        ]);

        $league = League::create([
            'name' => 'Test League',
            'slug' => 'test-league',
            'owner_user_id' => $user->id,
            'description' => null,
            'logo_path' => 'test/logo.png',
        ]);

        $competition = Competition::create([
            'league_id' => $league->id,
            'platform_id' => $platform->id,
            'name' => 'Test Competition',
            'slug' => 'test-competition',
            'description' => null,
            'logo_path' => null,
            'competition_colour' => '{"r":100,"g":102,"b":241}',
            'status' => 'active',
            'created_by_user_id' => $user->id,
        ]);

        $season = SeasonEloquent::create([
            'competition_id' => $competition->id,
            'name' => 'Test Season',
            'slug' => 'test-season',
            'car_class' => null,
            'description' => null,
            'technical_specs' => null,
            'logo_path' => null,
            'banner_path' => null,
            'team_championship_enabled' => false,
            'status' => 'setup',
            'created_by_user_id' => $user->id,
        ]);

        // 2. Authenticate as the user
        $this->actingAs($user, 'web');

        // 3. Call the API endpoint (on app subdomain)
        $response = $this->getJson("http://app.virtualracingleagues.localhost/api/seasons/{$season->id}");

        // 4. Assert response structure
        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'data' => [
                'id',
                'competition_id',
                'competition' => [
                    'id',
                    'name',
                    'slug',
                    'platform_id',
                    'competition_colour',
                    'league' => [
                        'id',
                        'name',
                        'slug',
                    ],
                ],
                'name',
                'slug',
                'stats' => [
                    'total_drivers',
                    'active_drivers',
                    'total_races',
                    'completed_races',
                ],
            ],
        ]);

        // 5. Assert the league data is correctly populated
        $data = $response->json('data');
        $this->assertEquals('Test League', $data['competition']['league']['name']);
        $this->assertEquals('test-league', $data['competition']['league']['slug']);
        $this->assertEquals($league->id, $data['competition']['league']['id']);

        // 6. Assert the competition data is correctly populated
        $this->assertEquals('Test Competition', $data['competition']['name']);
        $this->assertEquals('test-competition', $data['competition']['slug']);
        $this->assertEquals($competition->id, $data['competition']['id']);

        // 7. Assert the competition_colour is correctly populated
        $this->assertEquals('{"r":100,"g":102,"b":241}', $data['competition']['competition_colour']);
    }

    /**
     * Test that deleting a season permanently deletes all related data (cascade delete).
     */
    public function test_deleting_season_cascades_to_all_related_data(): void
    {
        // 1. Create test data hierarchy
        $user = UserEloquent::factory()->create();

        $platform = Platform::create([
            'name' => 'Test Platform',
            'slug' => 'test-platform',
            'logo_url' => '',
        ]);

        $league = League::create([
            'name' => 'Test League',
            'slug' => 'test-league',
            'owner_user_id' => $user->id,
            'description' => null,
            'logo_path' => null,
        ]);

        $competition = Competition::create([
            'league_id' => $league->id,
            'platform_id' => $platform->id,
            'name' => 'Test Competition',
            'slug' => 'test-competition',
            'description' => null,
            'logo_path' => null,
            'competition_colour' => '{"r":100,"g":102,"b":241}',
            'status' => 'active',
            'created_by_user_id' => $user->id,
        ]);

        $season = SeasonEloquent::create([
            'competition_id' => $competition->id,
            'name' => 'Test Season',
            'slug' => 'test-season',
            'car_class' => null,
            'description' => null,
            'technical_specs' => null,
            'logo_path' => null,
            'banner_path' => null,
            'team_championship_enabled' => false,
            'status' => 'setup',
            'created_by_user_id' => $user->id,
        ]);

        // 2. Create season drivers
        $leagueDriver = LeagueDriverEloquent::factory()->create([
            'league_id' => $league->id,
            'status' => 'active',
        ]);

        $seasonDriver = SeasonDriverEloquent::create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver->id,
            'driver_number' => 1,
            'status' => 'active',
        ]);

        // 3. Create division
        $division = Division::create([
            'season_id' => $season->id,
            'name' => 'Division A',
            'slug' => 'division-a',
            'created_by_user_id' => $user->id,
        ]);

        // 4. Create rounds with races and race results
        $round1 = Round::create([
            'season_id' => $season->id,
            'round_number' => 1,
            'name' => 'Round 1',
            'slug' => 'round-1',
            'scheduled_at' => now(),
            'timezone' => 'UTC',
            'status' => 'scheduled',
            'created_by_user_id' => $user->id,
        ]);

        $round2 = Round::create([
            'season_id' => $season->id,
            'round_number' => 2,
            'name' => 'Round 2',
            'slug' => 'round-2',
            'scheduled_at' => now()->addWeek(),
            'timezone' => 'UTC',
            'status' => 'scheduled',
            'created_by_user_id' => $user->id,
        ]);

        // 5. Create races for round 1
        $race1 = Race::factory()->create([
            'round_id' => $round1->id,
            'race_number' => 1,
            'name' => 'Race 1',
        ]);

        $race2 = Race::factory()->create([
            'round_id' => $round1->id,
            'race_number' => 2,
            'name' => 'Race 2',
        ]);

        // 6. Create race results
        $raceResult1 = RaceResult::create([
            'race_id' => $race1->id,
            'driver_id' => $seasonDriver->id,
            'division_id' => $division->id,
            'position' => 1,
            'race_time' => '01:30:00',
            'has_fastest_lap' => true,
            'has_pole' => true,
            'dnf' => false,
            'status' => 'confirmed',
            'race_points' => 25,
        ]);

        $raceResult2 = RaceResult::create([
            'race_id' => $race2->id,
            'driver_id' => $seasonDriver->id,
            'division_id' => $division->id,
            'position' => 2,
            'race_time' => '01:32:00',
            'has_fastest_lap' => false,
            'has_pole' => false,
            'dnf' => false,
            'status' => 'confirmed',
            'race_points' => 18,
        ]);

        // 7. Verify all data exists before deletion
        $this->assertDatabaseHas('seasons', ['id' => $season->id]);
        $this->assertDatabaseHas('season_drivers', ['id' => $seasonDriver->id]);
        $this->assertDatabaseHas('divisions', ['id' => $division->id]);
        $this->assertDatabaseHas('rounds', ['id' => $round1->id]);
        $this->assertDatabaseHas('rounds', ['id' => $round2->id]);
        $this->assertDatabaseHas('races', ['id' => $race1->id]);
        $this->assertDatabaseHas('races', ['id' => $race2->id]);
        $this->assertDatabaseHas('race_results', ['id' => $raceResult1->id]);
        $this->assertDatabaseHas('race_results', ['id' => $raceResult2->id]);

        // 8. Authenticate as the league owner
        $this->actingAs($user, 'web');

        // 9. Delete the season via API
        $response = $this->deleteJson("http://app.virtualracingleagues.localhost/api/seasons/{$season->id}");

        // 10. Assert successful deletion
        $response->assertOk();
        $response->assertJson([
            'success' => true,
        ]);

        // 11. Verify season is permanently deleted (not just soft-deleted)
        $this->assertEquals(0, SeasonEloquent::withTrashed()->where('id', $season->id)->count());

        // 12. Verify all related data is permanently deleted
        $this->assertDatabaseMissing('season_drivers', ['id' => $seasonDriver->id]);
        $this->assertDatabaseMissing('rounds', ['id' => $round1->id]);
        $this->assertDatabaseMissing('rounds', ['id' => $round2->id]);
        $this->assertDatabaseMissing('races', ['id' => $race1->id]);
        $this->assertDatabaseMissing('races', ['id' => $race2->id]);
        $this->assertDatabaseMissing('race_results', ['id' => $raceResult1->id]);
        $this->assertDatabaseMissing('race_results', ['id' => $raceResult2->id]);

        // 13. Verify division is also deleted (divisions have CASCADE constraint on season_id)
        $this->assertDatabaseMissing('divisions', ['id' => $division->id]);
    }

    /**
     * Test that only league owner can delete a season.
     */
    public function test_only_league_owner_can_delete_season(): void
    {
        // 1. Create test data
        $owner = UserEloquent::factory()->create();
        $otherUser = UserEloquent::factory()->create();

        $platform = Platform::create([
            'name' => 'Test Platform',
            'slug' => 'test-platform',
            'logo_url' => '',
        ]);

        $league = League::create([
            'name' => 'Test League',
            'slug' => 'test-league',
            'owner_user_id' => $owner->id,
            'description' => null,
            'logo_path' => null,
        ]);

        $competition = Competition::create([
            'league_id' => $league->id,
            'platform_id' => $platform->id,
            'name' => 'Test Competition',
            'slug' => 'test-competition',
            'description' => null,
            'logo_path' => null,
            'competition_colour' => '{"r":100,"g":102,"b":241}',
            'status' => 'active',
            'created_by_user_id' => $owner->id,
        ]);

        $season = SeasonEloquent::create([
            'competition_id' => $competition->id,
            'name' => 'Test Season',
            'slug' => 'test-season',
            'car_class' => null,
            'description' => null,
            'technical_specs' => null,
            'logo_path' => null,
            'banner_path' => null,
            'team_championship_enabled' => false,
            'status' => 'setup',
            'created_by_user_id' => $owner->id,
        ]);

        // 2. Authenticate as non-owner
        $this->actingAs($otherUser, 'web');

        // 3. Attempt to delete the season
        $response = $this->deleteJson("http://app.virtualracingleagues.localhost/api/seasons/{$season->id}");

        // 4. Assert unauthorized
        $response->assertStatus(403);

        // 5. Verify season still exists
        $this->assertDatabaseHas('seasons', ['id' => $season->id]);
    }
}
