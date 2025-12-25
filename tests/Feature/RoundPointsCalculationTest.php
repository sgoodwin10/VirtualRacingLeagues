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

final class RoundPointsCalculationTest extends TestCase
{
    use RefreshDatabase;

    private const APP_URL = 'http://app.virtualracingleagues.localhost';

    private User $user;
    private League $league;
    private Competition $competition;
    private SeasonEloquent $season;

    protected function setUp(): void
    {
        parent::setUp();

        // Create base test data
        /** @var User $user */
        $user = User::factory()->create();
        $this->user = $user;
        $this->actingAs($this->user, 'web');

        /** @var League $league */
        $league = League::factory()->create(['owner_user_id' => $this->user->id]);
        $this->league = $league;

        /** @var Competition $competition */
        $competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'created_by_user_id' => $this->user->id,
        ]);
        $this->competition = $competition;

        /** @var SeasonEloquent $season */
        $season = SeasonEloquent::factory()->create([
            'competition_id' => $this->competition->id,
            'race_divisions_enabled' => false,
            'created_by_user_id' => $this->user->id,
        ]);
        $this->season = $season;
    }

    public function test_basic_round_completion_calculates_and_stores_round_results(): void
    {
        // Arrange: Create round with races and results
        $round = Round::factory()->create([
            'season_id' => $this->season->id,
            'round_number' => 1,
            'status' => 'scheduled',
            'fastest_lap' => null,
            'qualifying_pole' => null,
            'round_points' => false,
            'created_by_user_id' => $this->user->id,
        ]);

        [$driver1, $driver2] = $this->createDrivers(2);

        $race = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
            'status' => 'scheduled',
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver1->id,
            'division_id' => null,
            'position' => 1,
            'original_race_time' => '00:45:30.123',
            'fastest_lap' => '01:10:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 25,
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver2->id,
            'division_id' => null,
            'position' => 2,
            'original_race_time' => '00:45:45.000',
            'fastest_lap' => '01:11:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 18,
        ]);

        // Act: Complete the round
        $response = $this->putJson(self::APP_URL . "/api/rounds/{$round->id}/complete");

        // Assert: Round is completed and has round_results
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'status' => 'completed',
            ],
        ]);

        $round->refresh();
        $this->assertEquals('completed', $round->status);
        $this->assertNotNull($round->round_results);

        $results = $round->round_results;
        $this->assertIsArray($results);
        $this->assertArrayHasKey('standings', $results);
        $this->assertCount(2, $results['standings']);
    }

    public function test_points_aggregation_sums_race_points_from_all_sessions(): void
    {
        // Arrange: Create round with qualifying and two races
        $round = Round::factory()->create([
            'season_id' => $this->season->id,
            'round_number' => 1,
            'status' => 'scheduled',
            'fastest_lap' => null, // No bonuses for this test
            'qualifying_pole' => null,
            'round_points' => false,
            'created_by_user_id' => $this->user->id,
        ]);

        [$driver1, $driver2] = $this->createDrivers(2);

        // Qualifying (worth points)
        $qualifying = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => true,
            'race_number' => 0,
            'status' => 'scheduled',
        ]);

        RaceResult::create([
            'race_id' => $qualifying->id,
            'driver_id' => $driver1->id,
            'position' => 1,
            'fastest_lap' => '01:12:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 10, // Qualifying points
        ]);

        RaceResult::create([
            'race_id' => $qualifying->id,
            'driver_id' => $driver2->id,
            'position' => 2,
            'fastest_lap' => '01:13:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 8,
        ]);

        // Sprint Race
        $sprint = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
            'status' => 'scheduled',
        ]);

        RaceResult::create([
            'race_id' => $sprint->id,
            'driver_id' => $driver1->id,
            'position' => 1,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:10:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 15,
        ]);

        RaceResult::create([
            'race_id' => $sprint->id,
            'driver_id' => $driver2->id,
            'position' => 2,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:11:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 12,
        ]);

        // Feature Race
        $feature = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 2,
            'status' => 'scheduled',
        ]);

        RaceResult::create([
            'race_id' => $feature->id,
            'driver_id' => $driver1->id,
            'position' => 2,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:09:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 18, // Second place
        ]);

        RaceResult::create([
            'race_id' => $feature->id,
            'driver_id' => $driver2->id,
            'position' => 1,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:10:30.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 25, // First place
        ]);

        // Act: Complete the round
        $response = $this->putJson(self::APP_URL . "/api/rounds/{$round->id}/complete");

        // Assert: Points are aggregated correctly
        $response->assertStatus(200);

        $round->refresh();
        $results = $round->round_results;

        // Driver1: 10 + 15 + 18 = 43 points
        // Driver2: 8 + 12 + 25 = 45 points
        // Driver2 should be first due to higher total
        $this->assertEquals(1, $results['standings'][0]['position']);
        $this->assertEquals($driver2->id, $results['standings'][0]['driver_id']);
        $this->assertEquals(45, $results['standings'][0]['total_points']);
        $this->assertEquals(45, $results['standings'][0]['race_points']);

        $this->assertEquals(2, $results['standings'][1]['position']);
        $this->assertEquals($driver1->id, $results['standings'][1]['driver_id']);
        $this->assertEquals(43, $results['standings'][1]['total_points']);
        $this->assertEquals(43, $results['standings'][1]['race_points']);
    }

    public function test_tie_breaking_uses_best_single_race_result(): void
    {
        // Enable tiebreaker rules for this test
        // When tiebreaker is enabled, tied drivers should be assigned sequential positions
        $this->season->update(['round_totals_tiebreaker_rules_enabled' => true]);

        // Arrange: Two drivers with same total points but different best results
        $round = Round::factory()->create([
            'season_id' => $this->season->id,
            'round_number' => 1,
            'status' => 'scheduled',
            'fastest_lap' => null, // No bonuses for this test
            'qualifying_pole' => null,
            'round_points' => false,
            'created_by_user_id' => $this->user->id,
        ]);

        [$driver1, $driver2] = $this->createDrivers(2);

        // Race 1
        $race1 = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
            'status' => 'scheduled',
        ]);

        // Driver1 wins race 1 (25 points)
        RaceResult::create([
            'race_id' => $race1->id,
            'driver_id' => $driver1->id,
            'position' => 1,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:10:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 25,
        ]);

        // Driver2 gets 3rd in race 1 (15 points)
        RaceResult::create([
            'race_id' => $race1->id,
            'driver_id' => $driver2->id,
            'position' => 3,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:11:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 15,
        ]);

        // Race 2
        $race2 = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 2,
            'status' => 'scheduled',
        ]);

        // Driver1 gets 10th in race 2 (1 point) - Total: 26
        RaceResult::create([
            'race_id' => $race2->id,
            'driver_id' => $driver1->id,
            'position' => 10,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:15:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 1,
        ]);

        // Driver2 gets 6th in race 2 (8 points) - Total: 23
        RaceResult::create([
            'race_id' => $race2->id,
            'driver_id' => $driver2->id,
            'position' => 6,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:12:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 8,
        ]);

        // Race 3
        $race3 = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 3,
            'status' => 'scheduled',
        ]);

        // Driver1 gets 12th (0 points) - Total: 26
        RaceResult::create([
            'race_id' => $race3->id,
            'driver_id' => $driver1->id,
            'position' => 12,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:16:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        // Driver2 gets 3rd in race 3 (3 points)
        // Final totals:
        // Driver1: 25 + 1 + 0 = 26 (best result: 25)
        // Driver2: 15 + 8 + 3 = 26 (best result: 15)
        RaceResult::create([
            'race_id' => $race3->id,
            'driver_id' => $driver2->id,
            'position' => 3,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:13:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 3,
        ]);

        // Act: Complete the round
        $response = $this->putJson(self::APP_URL . "/api/rounds/{$round->id}/complete");

        // Assert: Driver1 wins on tie-break (best result of 25 vs 15)
        $response->assertStatus(200);

        $round->refresh();
        $results = $round->round_results;

        // Both have 26 points total, but driver1 has better best result (25 vs 15)
        $this->assertEquals(1, $results['standings'][0]['position']);
        $this->assertEquals($driver1->id, $results['standings'][0]['driver_id']);
        $this->assertEquals(26, $results['standings'][0]['total_points']);

        $this->assertEquals(2, $results['standings'][1]['position']);
        $this->assertEquals($driver2->id, $results['standings'][1]['driver_id']);
        $this->assertEquals(26, $results['standings'][1]['total_points']);
    }

    public function test_without_round_points_enabled_total_equals_race_points(): void
    {
        // Arrange: Round without round_points enabled
        $round = Round::factory()->create([
            'season_id' => $this->season->id,
            'round_number' => 1,
            'status' => 'scheduled',
            'round_points' => false, // No round points
            'points_system' => null,
            'fastest_lap' => null, // No bonuses
            'qualifying_pole' => null,
            'created_by_user_id' => $this->user->id,
        ]);

        [$driver1] = $this->createDrivers(1);

        $race = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
            'status' => 'scheduled',
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver1->id,
            'position' => 1,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:10:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 25,
        ]);

        // Act: Complete the round
        $response = $this->putJson(self::APP_URL . "/api/rounds/{$round->id}/complete");

        // Assert: total_points equals race_points (no additional round points)
        $response->assertStatus(200);

        $round->refresh();
        $results = $round->round_results;

        $this->assertEquals(25, $results['standings'][0]['race_points']);
        $this->assertEquals(25, $results['standings'][0]['total_points']);
        $this->assertEquals(0, $results['standings'][0]['fastest_lap_points']);
        $this->assertEquals(0, $results['standings'][0]['pole_position_points']);
    }

    public function test_with_round_points_enabled_assigns_additional_points(): void
    {
        // Arrange: Round with round_points enabled and F1 standard points system
        $pointsSystem = json_encode([
            1 => 25,
            2 => 18,
            3 => 15,
            4 => 12,
            5 => 10,
        ]);

        $round = Round::factory()->create([
            'season_id' => $this->season->id,
            'round_number' => 1,
            'status' => 'scheduled',
            'round_points' => true,
            'points_system' => $pointsSystem,
            'fastest_lap' => null, // No bonuses for this test
            'qualifying_pole' => null,
            'created_by_user_id' => $this->user->id,
        ]);

        [$driver1, $driver2, $driver3] = $this->createDrivers(3);

        $race = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
            'status' => 'scheduled',
        ]);

        // Driver1: 20 race points
        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver1->id,
            'position' => 1,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:10:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 20,
        ]);

        // Driver2: 15 race points
        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver2->id,
            'position' => 2,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:11:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 15,
        ]);

        // Driver3: 10 race points
        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver3->id,
            'position' => 3,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:12:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 10,
        ]);

        // Act: Complete the round
        $response = $this->putJson(self::APP_URL . "/api/rounds/{$round->id}/complete");

        // Assert: With round_points enabled:
        // - race_points = sum of all race/qualifying points
        // - round_points = points based on position (from points_system)
        // - total_points = round_points + fastest_lap_points + pole_position_points (NOT race_points)
        $response->assertStatus(200);

        $round->refresh();
        $results = $round->round_results;

        // Driver1: 20 race points, 25 round points, no bonuses
        // total_points = 25 (round_points only, no bonuses)
        $this->assertEquals($driver1->id, $results['standings'][0]['driver_id']);
        $this->assertEquals(20, $results['standings'][0]['race_points']);
        $this->assertEquals(25, $results['standings'][0]['round_points']);
        $this->assertEquals(25, $results['standings'][0]['total_points']); // round_points only

        // Driver2: 15 race points, 18 round points
        // total_points = 18 (round_points only)
        $this->assertEquals($driver2->id, $results['standings'][1]['driver_id']);
        $this->assertEquals(15, $results['standings'][1]['race_points']);
        $this->assertEquals(18, $results['standings'][1]['round_points']);
        $this->assertEquals(18, $results['standings'][1]['total_points']); // round_points only

        // Driver3: 10 race points, 15 round points
        // total_points = 15 (round_points only)
        $this->assertEquals($driver3->id, $results['standings'][2]['driver_id']);
        $this->assertEquals(10, $results['standings'][2]['race_points']);
        $this->assertEquals(15, $results['standings'][2]['round_points']);
        $this->assertEquals(15, $results['standings'][2]['total_points']); // round_points only
    }

    public function test_fastest_lap_bonus_awards_points_to_fastest_race_lap(): void
    {
        // Arrange: Round with fastest lap bonus and round_points ENABLED
        // This test verifies round-level fastest lap bonus when round_points is enabled
        $pointsSystem = json_encode([1 => 25, 2 => 18]);

        $round = Round::factory()->create([
            'season_id' => $this->season->id,
            'round_number' => 1,
            'status' => 'scheduled',
            'fastest_lap' => 5, // 5 bonus points
            'fastest_lap_top_10' => false,
            'qualifying_pole' => null, // No pole bonus
            'round_points' => true, // Round points ENABLED
            'points_system' => $pointsSystem,
            'created_by_user_id' => $this->user->id,
        ]);

        [$driver1, $driver2] = $this->createDrivers(2);

        // Qualifying (should NOT count for fastest lap bonus)
        $qualifying = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => true,
            'race_number' => 0,
            'status' => 'scheduled',
        ]);

        RaceResult::create([
            'race_id' => $qualifying->id,
            'driver_id' => $driver1->id,
            'position' => 1,
            'fastest_lap' => '01:08:00.000', // Fastest overall, but in qualifying
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 10,
        ]);

        // Race 1
        $race1 = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
            'status' => 'scheduled',
        ]);

        RaceResult::create([
            'race_id' => $race1->id,
            'driver_id' => $driver1->id,
            'position' => 2,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:10:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 18,
        ]);

        RaceResult::create([
            'race_id' => $race1->id,
            'driver_id' => $driver2->id,
            'position' => 1,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:09:00.000', // Fastest in races
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 25,
        ]);

        // Act: Complete the round
        $response = $this->putJson(self::APP_URL . "/api/rounds/{$round->id}/complete");

        // Assert: Driver2 gets fastest lap bonus
        // With round_points enabled: total_points = round_points + fastest_lap_points + pole_position_points
        $response->assertStatus(200);

        $round->refresh();
        $results = $round->round_results;

        // Driver1 has more race_points (10 + 18 = 28) so is in position 1
        // Driver2 has race_points (25) so is in position 2
        // Find driver2 in standings
        $driver2Standing = collect($results['standings'])
            ->firstWhere('driver_id', $driver2->id);

        // Driver2: position 2, gets 18 round_points + 5 fastest_lap = 23 total_points
        $this->assertEquals(5, $driver2Standing['fastest_lap_points']);
        $this->assertEquals(18, $driver2Standing['round_points']); // position 2
        $this->assertEquals(23, $driver2Standing['total_points']); // 18 round + 5 fastest lap (NOT race_points)
    }

    public function test_fastest_lap_top_10_restriction_only_awards_if_in_top_10(): void
    {
        // Arrange: Round with fastest lap bonus restricted to top 10, round_points ENABLED
        $pointsSystem = json_encode([
            1 => 25, 2 => 18, 3 => 15, 4 => 12, 5 => 10,
            6 => 8, 7 => 6, 8 => 4, 9 => 2, 10 => 1,
        ]);

        $round = Round::factory()->create([
            'season_id' => $this->season->id,
            'round_number' => 1,
            'status' => 'scheduled',
            'fastest_lap' => 3,
            'fastest_lap_top_10' => true, // Restricted to top 10
            'qualifying_pole' => null,
            'round_points' => true, // Round points ENABLED
            'points_system' => $pointsSystem,
            'created_by_user_id' => $this->user->id,
        ]);

        // Create 12 drivers
        $drivers = $this->createDrivers(12);

        $race = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
            'status' => 'scheduled',
        ]);

        // Create race results - driver 11 (position 11) has fastest lap
        // But since they're outside top 10 by race_points, they won't get the bonus
        foreach ($drivers as $index => $driver) {
            $position = $index + 1;
            RaceResult::create([
                'race_id' => $race->id,
                'driver_id' => $driver->id,
                'position' => $position,
            'original_race_time' => '00:30:00.000',
                'fastest_lap' => $position === 11 ? '01:09:00.000' : '01:10:00.000', // Position 11 has fastest
                'dnf' => false,
                'status' => 'pending',
                'race_points' => match ($position) {
                    1 => 25, 2 => 18, 3 => 15, 4 => 12, 5 => 10,
                    6 => 8, 7 => 6, 8 => 4, 9 => 2, 10 => 1,
                    default => 0,
                },
            ]);
        }

        // Act: Complete the round
        $response = $this->putJson(self::APP_URL . "/api/rounds/{$round->id}/complete");

        // Assert: Driver who was in position 11 does NOT get fastest lap bonus
        // because positions are fixed by race_points and they're outside top 10
        $response->assertStatus(200);

        $round->refresh();
        $results = $round->round_results;

        // Find driver 11 in standings (should still be in position 11)
        $driver11Standing = collect($results['standings'])
            ->firstWhere('driver_id', $drivers[10]->id);

        // Driver stays in position 11, no bonus awarded (outside top 10)
        $this->assertEquals(11, $driver11Standing['position']);
        $this->assertEquals(0, $driver11Standing['fastest_lap_points']); // No bonus - outside top 10
        $this->assertEquals(0, $driver11Standing['total_points']); // 0 round_points (outside system) + 0 bonus
    }

    public function test_pole_position_bonus_awards_points_to_fastest_qualifying_time(): void
    {
        // Arrange: Round with pole position bonus and round_points ENABLED
        $pointsSystem = json_encode([1 => 25, 2 => 18, 3 => 15]);

        $round = Round::factory()->create([
            'season_id' => $this->season->id,
            'round_number' => 1,
            'status' => 'scheduled',
            'qualifying_pole' => 3, // 3 bonus points
            'qualifying_pole_top_10' => false,
            'fastest_lap' => null, // No fastest lap bonus for this test
            'round_points' => true, // Round points ENABLED
            'points_system' => $pointsSystem,
            'created_by_user_id' => $this->user->id,
        ]);

        [$driver1, $driver2, $driver3] = $this->createDrivers(3);

        // Qualifying 1
        $qualifying1 = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => true,
            'race_number' => 0,
            'status' => 'scheduled',
        ]);

        RaceResult::create([
            'race_id' => $qualifying1->id,
            'driver_id' => $driver1->id,
            'position' => 1,
            'fastest_lap' => '01:11:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 10,
        ]);

        RaceResult::create([
            'race_id' => $qualifying1->id,
            'driver_id' => $driver2->id,
            'position' => 2,
            'fastest_lap' => '01:10:00.000', // Fastest qualifying time overall
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 8,
        ]);

        // Qualifying 2
        $qualifying2 = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => true,
            'race_number' => 0,
            'status' => 'scheduled',
        ]);

        RaceResult::create([
            'race_id' => $qualifying2->id,
            'driver_id' => $driver1->id,
            'position' => 1,
            'fastest_lap' => '01:12:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 10,
        ]);

        RaceResult::create([
            'race_id' => $qualifying2->id,
            'driver_id' => $driver3->id,
            'position' => 2,
            'fastest_lap' => '01:13:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 8,
        ]);

        // Race (should NOT count for pole position)
        $race = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
            'status' => 'scheduled',
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver1->id,
            'position' => 1,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:09:00.000', // Fastest overall, but in race
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 25,
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver2->id,
            'position' => 2,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:10:30.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 18,
        ]);

        // Act: Complete the round
        $response = $this->putJson(self::APP_URL . "/api/rounds/{$round->id}/complete");

        // Assert: Driver2 gets pole position bonus
        // With round_points enabled: total_points = round_points + fastest_lap_points + pole_position_points
        $response->assertStatus(200);

        $round->refresh();
        $results = $round->round_results;

        // Driver1 has most race_points (10 + 10 + 25 = 45), so position 1
        // Driver2 has (8 + 18 = 26), so position 2
        // Driver3 has (8), so position 3

        // Find driver2 in standings
        $driver2Standing = collect($results['standings'])
            ->firstWhere('driver_id', $driver2->id);

        $this->assertEquals(3, $driver2Standing['pole_position_points']);
        $this->assertEquals(26, $driver2Standing['race_points']);
        // Driver2 is position 2, gets 18 round_points + 3 pole = 21 total
        $this->assertEquals(18, $driver2Standing['round_points']);
        $this->assertEquals(21, $driver2Standing['total_points']); // 18 round + 3 pole (NOT race_points)
    }

    public function test_pole_position_top_10_restriction_only_awards_if_in_top_10(): void
    {
        // Arrange: Round with pole position bonus restricted to top 10, round_points ENABLED
        $pointsSystem = json_encode([
            1 => 25, 2 => 18, 3 => 15, 4 => 12, 5 => 10,
            6 => 8, 7 => 6, 8 => 4, 9 => 2, 10 => 1,
        ]);

        $round = Round::factory()->create([
            'season_id' => $this->season->id,
            'round_number' => 1,
            'status' => 'scheduled',
            'qualifying_pole' => 2,
            'qualifying_pole_top_10' => true, // Restricted to top 10
            'fastest_lap' => null,
            'round_points' => true, // Round points ENABLED
            'points_system' => $pointsSystem,
            'created_by_user_id' => $this->user->id,
        ]);

        // Create 12 drivers
        $drivers = $this->createDrivers(12);

        // Qualifying - driver 11 gets pole
        $qualifying = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => true,
            'race_number' => 0,
            'status' => 'scheduled',
        ]);

        foreach ($drivers as $index => $driver) {
            $position = $index + 1;
            RaceResult::create([
                'race_id' => $qualifying->id,
                'driver_id' => $driver->id,
                'position' => $position,
                'fastest_lap' => $position === 11 ? '01:09:00.000' : '01:10:00.000', // Position 11 has pole
                'dnf' => false,
                'status' => 'pending',
                'race_points' => 0,
            ]);
        }

        // Race - same order as qualifying
        $race = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
            'status' => 'scheduled',
        ]);

        foreach ($drivers as $index => $driver) {
            $position = $index + 1;
            RaceResult::create([
                'race_id' => $race->id,
                'driver_id' => $driver->id,
                'position' => $position,
            'original_race_time' => '00:30:00.000',
                'fastest_lap' => '01:10:00.000',
                'dnf' => false,
                'status' => 'pending',
                'race_points' => match ($position) {
                    1 => 25, 2 => 18, 3 => 15, 4 => 12, 5 => 10,
                    6 => 8, 7 => 6, 8 => 4, 9 => 2, 10 => 1,
                    default => 0,
                },
            ]);
        }

        // Act: Complete the round
        $response = $this->putJson(self::APP_URL . "/api/rounds/{$round->id}/complete");

        // Assert: Driver who was in position 11 does NOT get pole position bonus
        // because positions are fixed by race_points and they're outside top 10
        $response->assertStatus(200);

        $round->refresh();
        $results = $round->round_results;

        $driver11Standing = collect($results['standings'])
            ->firstWhere('driver_id', $drivers[10]->id);

        // Driver stays in position 11, no bonus awarded (outside top 10)
        $this->assertEquals(11, $driver11Standing['position']);
        $this->assertEquals(0, $driver11Standing['pole_position_points']); // No bonus - outside top 10
        $this->assertEquals(0, $driver11Standing['total_points']); // 0 round_points (outside system) + 0 bonus
    }

    public function test_with_divisions_calculates_results_separately_per_division(): void
    {
        // Arrange: Season with divisions enabled
        $this->season->update(['race_divisions_enabled' => true]);

        $division1 = Division::factory()->create([
            'season_id' => $this->season->id,
            'name' => 'Division A',
        ]);

        $division2 = Division::factory()->create([
            'season_id' => $this->season->id,
            'name' => 'Division B',
        ]);

        $round = Round::factory()->create([
            'season_id' => $this->season->id,
            'round_number' => 1,
            'status' => 'scheduled',
            'fastest_lap' => null,
            'qualifying_pole' => null,
            'round_points' => false,
            'created_by_user_id' => $this->user->id,
        ]);

        // Create drivers for each division
        [$driver1, $driver2] = $this->createDriversInDivision($division1->id, 2);
        [$driver3, $driver4] = $this->createDriversInDivision($division2->id, 2);

        $race = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
            'status' => 'scheduled',
        ]);

        // Division 1 results
        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver1->id,
            'division_id' => $division1->id,
            'position' => 1,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:10:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 25,
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver2->id,
            'division_id' => $division1->id,
            'position' => 2,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:11:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 18,
        ]);

        // Division 2 results
        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver3->id,
            'division_id' => $division2->id,
            'position' => 1,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:12:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 25,
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver4->id,
            'division_id' => $division2->id,
            'position' => 2,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:13:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 18,
        ]);

        // Act: Complete the round
        $response = $this->putJson(self::APP_URL . "/api/rounds/{$round->id}/complete");

        // Assert: Results are separated by division
        $response->assertStatus(200);

        $round->refresh();
        $results = $round->round_results;

        $this->assertArrayHasKey('standings', $results);
        $this->assertIsArray($results['standings']);
        $this->assertCount(2, $results['standings']); // Two divisions

        // Check Division 1
        $div1Results = collect($results['standings'])
            ->firstWhere('division_id', $division1->id);

        $this->assertNotNull($div1Results);
        $this->assertEquals('Division A', $div1Results['division_name']);
        $this->assertCount(2, $div1Results['results']);
        $this->assertEquals($driver1->id, $div1Results['results'][0]['driver_id']);
        $this->assertEquals(1, $div1Results['results'][0]['position']);

        // Check Division 2
        $div2Results = collect($results['standings'])
            ->firstWhere('division_id', $division2->id);

        $this->assertNotNull($div2Results);
        $this->assertEquals('Division B', $div2Results['division_name']);
        $this->assertCount(2, $div2Results['results']);
        $this->assertEquals($driver3->id, $div2Results['results'][0]['driver_id']);
        $this->assertEquals(1, $div2Results['results'][0]['position']);
    }

    public function test_complex_scenario_with_all_bonuses_and_round_points(): void
    {
        // Arrange: Round with all features enabled
        $pointsSystem = json_encode([
            1 => 25,
            2 => 18,
            3 => 15,
        ]);

        $round = Round::factory()->create([
            'season_id' => $this->season->id,
            'round_number' => 1,
            'status' => 'scheduled',
            'fastest_lap' => 2,
            'fastest_lap_top_10' => true,
            'qualifying_pole' => 1,
            'qualifying_pole_top_10' => true,
            'round_points' => true,
            'points_system' => $pointsSystem,
            'created_by_user_id' => $this->user->id,
        ]);

        [$driver1, $driver2, $driver3] = $this->createDrivers(3);

        // Qualifying
        $qualifying = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => true,
            'race_number' => 0,
            'status' => 'scheduled',
        ]);

        RaceResult::create([
            'race_id' => $qualifying->id,
            'driver_id' => $driver1->id,
            'position' => 1,
            'fastest_lap' => '01:09:00.000', // Pole position
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 5,
        ]);

        RaceResult::create([
            'race_id' => $qualifying->id,
            'driver_id' => $driver2->id,
            'position' => 2,
            'fastest_lap' => '01:10:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 3,
        ]);

        RaceResult::create([
            'race_id' => $qualifying->id,
            'driver_id' => $driver3->id,
            'position' => 3,
            'fastest_lap' => '01:11:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 1,
        ]);

        // Race
        $race = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
            'status' => 'scheduled',
        ]);

        // Driver2 wins the race with fastest lap
        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver2->id,
            'position' => 1,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:08:00.000', // Fastest lap in race
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 25,
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver1->id,
            'position' => 2,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:09:30.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 18,
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver3->id,
            'position' => 3,
            'original_race_time' => '00:30:00.000',
            'fastest_lap' => '01:10:30.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 15,
        ]);

        // Act: Complete the round
        $response = $this->putJson(self::APP_URL . "/api/rounds/{$round->id}/complete");

        // Assert: All points are calculated correctly
        // With round_points ENABLED:
        // - Positions determined by race_points
        // - total_points = round_points + fastest_lap_points + pole_position_points (NOT race_points!)
        $response->assertStatus(200);

        $round->refresh();
        $results = $round->round_results;

        // Expected final standings:
        // Driver2: race_points = 28 (3 + 25), position = 1
        //          fastest_lap = 2 (fastest in race), pole = 0
        //          round_points = 25 (position 1)
        //          total_points = 25 + 2 + 0 = 27
        // Driver1: race_points = 23 (5 + 18), position = 2
        //          fastest_lap = 0, pole = 1 (fastest in qualifying)
        //          round_points = 18 (position 2)
        //          total_points = 18 + 0 + 1 = 19
        // Driver3: race_points = 16 (1 + 15), position = 3
        //          fastest_lap = 0, pole = 0
        //          round_points = 15 (position 3)
        //          total_points = 15 + 0 + 0 = 15

        // Driver2 - 1st place
        $this->assertEquals($driver2->id, $results['standings'][0]['driver_id']);
        $this->assertEquals(1, $results['standings'][0]['position']);
        $this->assertEquals(28, $results['standings'][0]['race_points']);
        $this->assertEquals(2, $results['standings'][0]['fastest_lap_points']);
        $this->assertEquals(0, $results['standings'][0]['pole_position_points']);
        $this->assertEquals(25, $results['standings'][0]['round_points']);
        $this->assertEquals(27, $results['standings'][0]['total_points']); // 25 round + 2 fastest_lap + 0 pole

        // Driver1 - 2nd place
        $this->assertEquals($driver1->id, $results['standings'][1]['driver_id']);
        $this->assertEquals(2, $results['standings'][1]['position']);
        $this->assertEquals(23, $results['standings'][1]['race_points']);
        $this->assertEquals(0, $results['standings'][1]['fastest_lap_points']);
        $this->assertEquals(1, $results['standings'][1]['pole_position_points']);
        $this->assertEquals(18, $results['standings'][1]['round_points']);
        $this->assertEquals(19, $results['standings'][1]['total_points']); // 18 round + 0 fastest_lap + 1 pole

        // Driver3 - 3rd place
        $this->assertEquals($driver3->id, $results['standings'][2]['driver_id']);
        $this->assertEquals(3, $results['standings'][2]['position']);
        $this->assertEquals(16, $results['standings'][2]['race_points']);
        $this->assertEquals(0, $results['standings'][2]['fastest_lap_points']);
        $this->assertEquals(0, $results['standings'][2]['pole_position_points']);
        $this->assertEquals(15, $results['standings'][2]['round_points']);
        $this->assertEquals(15, $results['standings'][2]['total_points']); // 15 round + 0 fastest_lap + 0 pole
    }

    public function test_round_points_enabled_with_zero_race_points_uses_actual_race_positions(): void
    {
        // This test covers the bug where driver with best qualifying position
        // was placed first in standings even though they finished last in the main race.

        // Arrange: Create a round with round_points enabled
        $round = Round::factory()->create([
            'season_id' => $this->season->id,
            'round_number' => 1,
            'status' => 'scheduled',
            'fastest_lap' => 1, // 1 point for fastest lap
            'qualifying_pole' => 1, // 1 point for pole
            'round_points' => true, // ENABLED: Award points based on standings position
            'points_system' => json_encode([
                '1' => 25,
                '2' => 20,
                '3' => 16,
            ]),
            'created_by_user_id' => $this->user->id,
        ]);

        [$driver1, $driver2, $driver3] = $this->createDrivers(3);

        // Qualifier race
        $qualifier = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => true,
            'race_number' => null,
            'status' => 'scheduled',
        ]);

        // Driver1 gets pole position (P1 in qualifying)
        RaceResult::create([
            'race_id' => $qualifier->id,
            'driver_id' => $driver1->id,
            'position' => 1,
            'fastest_lap' => '00:00:50.100',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0, // No race points in qualifier
            'has_pole' => true,
        ]);

        // Driver2 qualifies P2
        RaceResult::create([
            'race_id' => $qualifier->id,
            'driver_id' => $driver2->id,
            'position' => 2,
            'fastest_lap' => '00:00:50.200',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        // Driver3 qualifies P3
        RaceResult::create([
            'race_id' => $qualifier->id,
            'driver_id' => $driver3->id,
            'position' => 3,
            'fastest_lap' => '00:00:50.300',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        // Main race
        $mainRace = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
            'status' => 'scheduled',
        ]);

        // Driver2 wins the main race (P1)
        RaceResult::create([
            'race_id' => $mainRace->id,
            'driver_id' => $driver2->id,
            'position' => 1,
            'original_race_time' => '00:58:50.000',
            'fastest_lap' => '00:00:49.500', // Fastest lap
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0, // No race points when round_points is enabled
            'has_fastest_lap' => true,
            'positions_gained' => 1, // Started P2, finished P1
        ]);

        // Driver3 finishes P2 in main race
        RaceResult::create([
            'race_id' => $mainRace->id,
            'driver_id' => $driver3->id,
            'position' => 2,
            'original_race_time' => '00:59:00.000',
            'fastest_lap' => '00:00:50.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
            'positions_gained' => 1, // Started P3, finished P2
        ]);

        // Driver1 finishes LAST in main race (P3) despite having pole
        RaceResult::create([
            'race_id' => $mainRace->id,
            'driver_id' => $driver1->id,
            'position' => 3,
            'original_race_time' => '01:00:30.000',
            'fastest_lap' => '00:00:51.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
            'positions_gained' => -2, // Started P1, finished P3
        ]);

        // Act: Complete the round
        $response = $this->putJson(self::APP_URL . "/api/rounds/{$round->id}/complete");

        // Assert: Standings should be based on main race positions, NOT qualifying
        $response->assertStatus(200);

        $round->refresh();
        $results = $round->round_results;

        // Verify positions are based on main race finish, not qualifying
        $this->assertEquals(1, $results['standings'][0]['position'], 'Position 1 should go to race winner');
        $this->assertEquals($driver2->id, $results['standings'][0]['driver_id'], 'Driver2 won the race');
        $this->assertEquals(0, $results['standings'][0]['race_points'], 'No race points awarded');
        $this->assertEquals(1, $results['standings'][0]['fastest_lap_points'], 'Fastest lap bonus');
        $this->assertEquals(0, $results['standings'][0]['pole_position_points'], 'Driver2 did not get pole');
        $this->assertEquals(25, $results['standings'][0]['round_points'], 'P1 gets 25 round points');
        $this->assertEquals(26, $results['standings'][0]['total_points'], '25 + 1 = 26');

        $this->assertEquals(2, $results['standings'][1]['position'], 'Position 2 should go to P2 finisher');
        $this->assertEquals($driver3->id, $results['standings'][1]['driver_id'], 'Driver3 finished P2');
        $this->assertEquals(20, $results['standings'][1]['round_points'], 'P2 gets 20 round points');

        $this->assertEquals(3, $results['standings'][2]['position'], 'Position 3 should go to last place finisher');
        $this->assertEquals($driver1->id, $results['standings'][2]['driver_id'], 'Driver1 finished last despite pole');
        $this->assertEquals(1, $results['standings'][2]['pole_position_points'], 'Driver1 gets pole bonus');
        $this->assertEquals(16, $results['standings'][2]['round_points'], 'P3 gets 16 round points');
        $this->assertEquals(17, $results['standings'][2]['total_points'], '16 + 1 = 17');
        $this->assertEquals(-2, $results['standings'][2]['total_positions_gained'], 'Driver1 lost 2 positions');
    }

    public function test_single_race_round_with_dnf_receives_zero_round_points(): void
    {
        // Arrange: Create a single-race round with round_points enabled
        $round = Round::factory()->create([
            'season_id' => $this->season->id,
            'round_number' => 1,
            'status' => 'scheduled',
            'fastest_lap' => 1,
            'qualifying_pole' => 1,
            'round_points' => true,
            'points_system' => json_encode([1 => 25, 2 => 20, 3 => 16, 4 => 13, 5 => 11]),
            'created_by_user_id' => $this->user->id,
        ]);

        [$driver1, $driver2, $driver3, $driver4] = $this->createDrivers(4);

        // Create qualifying session
        $qualifying = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => true,
            'race_number' => 0,
            'status' => 'scheduled',
        ]);

        // Qualifying results (Driver1 gets pole)
        RaceResult::create([
            'race_id' => $qualifying->id,
            'driver_id' => $driver1->id,
            'position' => 1,
            'fastest_lap' => '00:00:45.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        RaceResult::create([
            'race_id' => $qualifying->id,
            'driver_id' => $driver2->id,
            'position' => 2,
            'fastest_lap' => '00:00:46.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        RaceResult::create([
            'race_id' => $qualifying->id,
            'driver_id' => $driver3->id,
            'position' => 3,
            'fastest_lap' => '00:00:47.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        RaceResult::create([
            'race_id' => $qualifying->id,
            'driver_id' => $driver4->id,
            'position' => 4,
            'fastest_lap' => '00:00:48.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        // Create main race
        $mainRace = $this->createRace([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
            'status' => 'scheduled',
        ]);

        // Main race results - Driver1 DNFs, others finish
        // Driver1 DNFs (should get 0 round_points)
        RaceResult::create([
            'race_id' => $mainRace->id,
            'driver_id' => $driver1->id,
            'position' => 4, // DNF'd but still has a position
            'original_race_time' => null,
            'fastest_lap' => null,
            'dnf' => true,
            'status' => 'pending',
            'race_points' => 0,
            'positions_gained' => -3,
        ]);

        // Driver2 wins the race and gets fastest lap
        RaceResult::create([
            'race_id' => $mainRace->id,
            'driver_id' => $driver2->id,
            'position' => 1,
            'original_race_time' => '00:45:30.000',
            'fastest_lap' => '00:00:50.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
            'positions_gained' => 1,
        ]);

        // Driver3 finishes P2
        RaceResult::create([
            'race_id' => $mainRace->id,
            'driver_id' => $driver3->id,
            'position' => 2,
            'original_race_time' => '00:45:35.000',
            'fastest_lap' => '00:00:51.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
            'positions_gained' => 1,
        ]);

        // Driver4 finishes P3
        RaceResult::create([
            'race_id' => $mainRace->id,
            'driver_id' => $driver4->id,
            'position' => 3,
            'original_race_time' => '00:45:40.000',
            'fastest_lap' => '00:00:52.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
            'positions_gained' => 1,
        ]);

        // Act: Complete the round
        $response = $this->putJson(self::APP_URL . "/api/rounds/{$round->id}/complete");

        // Assert: Verify DNF driver gets 0 round_points
        $response->assertStatus(200);

        $round->refresh();
        $results = $round->round_results;

        // Verify finishers get round points
        $this->assertEquals(1, $results['standings'][0]['position'], 'Driver2 should be P1');
        $this->assertEquals($driver2->id, $results['standings'][0]['driver_id']);
        $this->assertEquals(25, $results['standings'][0]['round_points'], 'P1 gets 25 round points');
        $this->assertEquals(1, $results['standings'][0]['fastest_lap_points'], 'Fastest lap bonus');
        $this->assertEquals(26, $results['standings'][0]['total_points'], '25 + 1 = 26');

        $this->assertEquals(2, $results['standings'][1]['position'], 'Driver3 should be P2');
        $this->assertEquals($driver3->id, $results['standings'][1]['driver_id']);
        $this->assertEquals(20, $results['standings'][1]['round_points'], 'P2 gets 20 round points');

        $this->assertEquals(3, $results['standings'][2]['position'], 'Driver4 should be P3');
        $this->assertEquals($driver4->id, $results['standings'][2]['driver_id']);
        $this->assertEquals(16, $results['standings'][2]['round_points'], 'P3 gets 16 round points');

        // CRITICAL: DNF driver should be at bottom with 0 round_points
        $this->assertEquals(4, $results['standings'][3]['position'], 'Driver1 (DNF) should be P4');
        $this->assertEquals($driver1->id, $results['standings'][3]['driver_id']);
        $this->assertEquals(0, $results['standings'][3]['round_points'], 'DNF driver gets 0 round points');
        $this->assertEquals(1, $results['standings'][3]['pole_position_points'], 'Still gets pole bonus');
        $this->assertEquals(1, $results['standings'][3]['total_points'], 'Only pole bonus, no round points');
        $this->assertTrue($results['standings'][3]['has_any_dnf'], 'DNF flag should be true');
    }

    /**
     * Helper: Create a race without race-level bonuses (tests round-level bonuses)
     * Also disables automatic race point calculation since tests set race_points manually
     *
     * @param array<string, mixed> $attributes
     */
    private function createRace(array $attributes = []): Race
    {
        /** @var Race $race */
        $race = Race::factory()->create(array_merge([
            'fastest_lap' => null, // No race-level bonuses
            'qualifying_pole' => null,
            'race_points' => false, // Don't auto-calculate race points (tests set manually)
        ], $attributes));

        return $race;
    }

    /**
     * Helper: Create N drivers and season drivers
     *
     * @return array<SeasonDriverEloquent>
     */
    private function createDrivers(int $count): array
    {
        $seasonDrivers = [];

        for ($i = 0; $i < $count; $i++) {
            /** @var Driver $driver */
            $driver = Driver::factory()->create([
                'first_name' => "Driver",
                'last_name' => "Number " . ($i + 1),
                'nickname' => null,
            ]);

            /** @var LeagueDriverEloquent $leagueDriver */
            $leagueDriver = LeagueDriverEloquent::factory()->create([
                'league_id' => $this->league->id,
                'driver_id' => $driver->id,
            ]);

            /** @var SeasonDriverEloquent $seasonDriver */
            $seasonDriver = SeasonDriverEloquent::factory()->create([
                'season_id' => $this->season->id,
                'league_driver_id' => $leagueDriver->id,
                'division_id' => null,
            ]);

            $seasonDrivers[] = $seasonDriver;
        }

        return $seasonDrivers;
    }

    /**
     * Helper: Create N drivers in a specific division
     *
     * @return array<SeasonDriverEloquent>
     */
    private function createDriversInDivision(int $divisionId, int $count): array
    {
        $seasonDrivers = [];

        for ($i = 0; $i < $count; $i++) {
            /** @var Driver $driver */
            $driver = Driver::factory()->create([
                'first_name' => "Driver",
                'last_name' => "Div{$divisionId} " . ($i + 1),
                'nickname' => null,
            ]);

            /** @var LeagueDriverEloquent $leagueDriver */
            $leagueDriver = LeagueDriverEloquent::factory()->create([
                'league_id' => $this->league->id,
                'driver_id' => $driver->id,
            ]);

            /** @var SeasonDriverEloquent $seasonDriver */
            $seasonDriver = SeasonDriverEloquent::factory()->create([
                'season_id' => $this->season->id,
                'league_driver_id' => $leagueDriver->id,
                'division_id' => $divisionId,
            ]);

            $seasonDrivers[] = $seasonDriver;
        }

        return $seasonDrivers;
    }
}
