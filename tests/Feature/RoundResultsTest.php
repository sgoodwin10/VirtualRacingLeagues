<?php

declare(strict_types=1);

namespace Tests\Feature;

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
use Tests\TestCase;

final class RoundResultsTest extends TestCase
{
    use RefreshDatabase;

    private const APP_URL = 'http://app.virtualracingleagues.localhost';

    public function test_authenticated_user_can_get_round_results(): void
    {
        // Arrange: Create user and authenticate
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        // Create league, competition, season
        $league = League::factory()->create(['owner_user_id' => $user->id]);
        $competition = Competition::factory()->create([
            'league_id' => $league->id,
            'created_by_user_id' => $user->id,
        ]);
        $season = SeasonEloquent::factory()->create([
            'competition_id' => $competition->id,
            'race_divisions_enabled' => true,
            'created_by_user_id' => $user->id,
        ]);

        // Create divisions
        $division1 = Division::factory()->create([
            'season_id' => $season->id,
            'name' => 'Division 1',
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
            'division_id' => $division1->id,
        ]);

        // Create round
        $round = Round::factory()->create([
            'season_id' => $season->id,
            'round_number' => 1,
            'name' => 'Round 1',
            'status' => 'completed',
            'created_by_user_id' => $user->id,
        ]);

        // Create qualifying race
        $qualifying = Race::factory()->create([
            'round_id' => $round->id,
            'is_qualifier' => true,
            'race_number' => 0,
            'name' => 'Qualifying',
            'status' => 'completed',
        ]);

        // Create race results for qualifying
        RaceResult::create([
            'race_id' => $qualifying->id,
            'driver_id' => $seasonDriver1->id,
            'division_id' => $division1->id,
            'position' => 1,
            'original_race_time' => '01:23:45.678',
            'original_race_time_difference' => null,
            'fastest_lap' => '01:12:34.567',
            'penalties' => null,
            'has_fastest_lap' => true,
            'has_pole' => true,
            'dnf' => false,
            'status' => 'confirmed',
            'race_points' => 25,
        ]);

        RaceResult::create([
            'race_id' => $qualifying->id,
            'driver_id' => $seasonDriver2->id,
            'division_id' => $division1->id,
            'position' => 2,
            'original_race_time' => '01:24:00.000',
            'original_race_time_difference' => '00:00:14.322',
            'fastest_lap' => '01:13:00.000',
            'penalties' => null,
            'has_fastest_lap' => false,
            'has_pole' => false,
            'dnf' => false,
            'status' => 'confirmed',
            'race_points' => 18,
        ]);

        // Create main race
        $race = Race::factory()->create([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
            'name' => 'Sprint Race',
            'status' => 'completed',
        ]);

        // Create race results for main race
        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $seasonDriver1->id,
            'division_id' => $division1->id,
            'position' => 1,
            'original_race_time' => '00:45:30.123',
            'original_race_time_difference' => null,
            'fastest_lap' => '01:10:00.000',
            'penalties' => null,
            'has_fastest_lap' => true,
            'has_pole' => false,
            'dnf' => false,
            'status' => 'confirmed',
            'race_points' => 25,
        ]);

        // Act: Make request to endpoint
        $response = $this->getJson(self::APP_URL . "/api/rounds/{$round->id}/results");

        // Assert: Check response structure
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'round' => [
                    'id',
                    'round_number',
                    'name',
                    'status',
                ],
                'divisions' => [
                    '*' => [
                        'id',
                        'name',
                        'description',
                    ],
                ],
                'race_events' => [
                    '*' => [
                        'id',
                        'race_number',
                        'name',
                        'is_qualifier',
                        'status',
                        'results' => [
                            '*' => [
                                'id',
                                'driver_id',
                                'position',
                                'original_race_time',
                                'final_race_time',
                                'original_race_time_difference',
                                'final_race_time_difference',
                                'fastest_lap',
                                'has_fastest_lap',
                                'has_pole',
                                'dnf',
                                'race_points',
                                'driver' => [
                                    'id',
                                    'name',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        // Assert: Check data values
        $data = $response->json('data');
        $this->assertEquals($round->id, $data['round']['id']);
        $this->assertEquals(1, $data['round']['round_number']);
        $this->assertEquals('Round 1', $data['round']['name']);
        $this->assertEquals('completed', $data['round']['status']);

        // Check divisions
        $this->assertCount(1, $data['divisions']);
        $this->assertEquals('Division 1', $data['divisions'][0]['name']);

        // Check race events (should have 2: qualifying and main race)
        $this->assertCount(2, $data['race_events']);

        // Check qualifying event
        $qualifyingEvent = $data['race_events'][0];
        $this->assertEquals('Qualifying', $qualifyingEvent['name']);
        $this->assertTrue($qualifyingEvent['is_qualifier']);
        $this->assertCount(2, $qualifyingEvent['results']);
        $this->assertEquals('John Doe', $qualifyingEvent['results'][0]['driver']['name']);
        $this->assertEquals(1, $qualifyingEvent['results'][0]['position']);
        $this->assertTrue($qualifyingEvent['results'][0]['has_fastest_lap']);
        $this->assertTrue($qualifyingEvent['results'][0]['has_pole']);

        // Check main race event
        $raceEvent = $data['race_events'][1];
        $this->assertEquals('Sprint Race', $raceEvent['name']);
        $this->assertFalse($raceEvent['is_qualifier']);
        $this->assertCount(1, $raceEvent['results']);
        $this->assertEquals('John Doe', $raceEvent['results'][0]['driver']['name']);
    }

    public function test_unauthenticated_user_cannot_get_round_results(): void
    {
        // Arrange: Create a round without authentication
        $user = User::factory()->create();
        $league = League::factory()->create(['owner_user_id' => $user->id]);
        $competition = Competition::factory()->create([
            'league_id' => $league->id,
            'created_by_user_id' => $user->id,
        ]);
        $season = SeasonEloquent::factory()->create([
            'competition_id' => $competition->id,
            'created_by_user_id' => $user->id,
        ]);
        $round = Round::factory()->create([
            'season_id' => $season->id,
            'created_by_user_id' => $user->id,
        ]);

        // Act: Make request without authentication
        $response = $this->getJson(self::APP_URL . "/api/rounds/{$round->id}/results");

        // Assert: Should be unauthorized
        $response->assertStatus(401);
    }

    public function test_returns_404_for_nonexistent_round(): void
    {
        // Arrange: Create and authenticate user
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        // Act: Request non-existent round
        $response = $this->getJson(self::APP_URL . '/api/rounds/99999/results');

        // Assert: Should return 404 for non-existent round
        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
            ])
            ->assertJsonPath('message', 'Round with ID 99999 not found');
    }
}
