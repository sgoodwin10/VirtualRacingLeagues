<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
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
use Tests\TestCase;

final class PositionsGainedCalculationTest extends TestCase
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
        $this->user = User::factory()->create();
        $this->actingAs($this->user, 'web');

        $this->league = League::factory()->create(['owner_user_id' => $this->user->id]);
        $this->competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'created_by_user_id' => $this->user->id,
        ]);
        $this->season = SeasonEloquent::factory()->create([
            'competition_id' => $this->competition->id,
            'race_divisions_enabled' => false,
            'created_by_user_id' => $this->user->id,
        ]);
    }

    public function test_positions_gained_is_null_for_manual_grid_source(): void
    {
        // Arrange: Create race with manual grid source
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

        $race = Race::factory()->create([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
            'status' => 'scheduled',
            'grid_source' => 'manual',
            'grid_source_race_id' => null,
            'race_points' => true,
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver1->id,
            'position' => null,
            'original_race_time' => '00:45:30.123',
            'fastest_lap' => '01:10:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver2->id,
            'position' => null,
            'original_race_time' => '00:45:45.000',
            'fastest_lap' => '01:11:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        // Act: Complete the round (triggers race completion and calculateRacePoints)
        $response = $this->putJson(self::APP_URL . "/api/rounds/{$round->id}/complete");

        // Assert: positions_gained should be null for manual grid source
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'status' => 'completed',
            ],
        ]);

        // Verify database state after completion
        $round->refresh();
        $results = RaceResult::where('race_id', $race->id)->get();
        foreach ($results as $result) {
            $this->assertNull($result->positions_gained);
        }
    }

    public function test_driver_gains_positions(): void
    {
        // Arrange: Qualifying and race where driver gains positions
        $round = Round::factory()->create([
            'season_id' => $this->season->id,
            'round_number' => 1,
            'status' => 'scheduled',
            'fastest_lap' => null,
            'qualifying_pole' => null,
            'round_points' => false,
            'created_by_user_id' => $this->user->id,
        ]);

        [$driver1, $driver2, $driver3] = $this->createDrivers(3);

        // Qualifying - driver1 qualifies 3rd
        $qualifying = Race::factory()->create([
            'round_id' => $round->id,
            'is_qualifier' => true,
            'race_number' => 0,
            'status' => 'scheduled',
            'race_points' => true, // Enable to calculate positions
        ]);

        RaceResult::create([
            'race_id' => $qualifying->id,
            'driver_id' => $driver1->id,
            'position' => null,
            'original_race_time' => '01:11:00.000', // Slowest - will qualify 3rd
            'fastest_lap' => '01:11:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        RaceResult::create([
            'race_id' => $qualifying->id,
            'driver_id' => $driver2->id,
            'position' => null,
            'original_race_time' => '01:09:00.000', // Fastest - will qualify 1st
            'fastest_lap' => '01:09:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        RaceResult::create([
            'race_id' => $qualifying->id,
            'driver_id' => $driver3->id,
            'position' => null,
            'original_race_time' => '01:10:00.000', // Middle - will qualify 2nd
            'fastest_lap' => '01:10:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        // Race - driver1 finishes 1st (gained 2 positions from 3rd)
        $race = Race::factory()->create([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
            'status' => 'scheduled',
            'grid_source' => 'qualifying',
            'grid_source_race_id' => $qualifying->id,
            'race_points' => true,
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver1->id,
            'position' => null,
            'original_race_time' => '00:45:30.123',
            'fastest_lap' => '01:10:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver2->id,
            'position' => null,
            'original_race_time' => '00:45:40.000',
            'fastest_lap' => '01:11:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver3->id,
            'position' => null,
            'original_race_time' => '00:45:50.000',
            'fastest_lap' => '01:12:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        // Act: Complete the round (this triggers both races to be marked complete and calculate points)
        $response = $this->putJson(self::APP_URL . "/api/rounds/{$round->id}/complete");

        // Assert: API response is successful
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'status' => 'completed',
            ],
        ]);

        // Verify database state: Driver1 qualified 3rd, finished 1st = +2 positions gained
        $round->refresh();
        $result1 = RaceResult::where('race_id', $race->id)
            ->where('driver_id', $driver1->id)
            ->first();
        $this->assertEquals(2, $result1->positions_gained); // Started 3rd, finished 1st = 3 - 1 = +2

        // Driver2 qualified 1st, finished 2nd = -1 position
        $result2 = RaceResult::where('race_id', $race->id)
            ->where('driver_id', $driver2->id)
            ->first();
        $this->assertEquals(-1, $result2->positions_gained); // Started 1st, finished 2nd = 1 - 2 = -1

        // Driver3 qualified 2nd, finished 3rd = -1 position
        $result3 = RaceResult::where('race_id', $race->id)
            ->where('driver_id', $driver3->id)
            ->first();
        $this->assertEquals(-1, $result3->positions_gained); // Started 2nd, finished 3rd = 2 - 3 = -1
    }

    public function test_dnf_driver_has_negative_positions_gained(): void
    {
        // Arrange: Driver DNFs after starting well
        $round = Round::factory()->create([
            'season_id' => $this->season->id,
            'round_number' => 1,
            'status' => 'scheduled',
            'fastest_lap' => null,
            'qualifying_pole' => null,
            'round_points' => false,
            'created_by_user_id' => $this->user->id,
        ]);

        [$driver1, $driver2, $driver3] = $this->createDrivers(3);

        // Qualifying
        $qualifying = Race::factory()->create([
            'round_id' => $round->id,
            'is_qualifier' => true,
            'race_number' => 0,
            'status' => 'scheduled',
            'race_points' => true, // Enable to calculate positions
        ]);

        RaceResult::create([
            'race_id' => $qualifying->id,
            'driver_id' => $driver1->id,
            'position' => null,
            'original_race_time' => '01:09:00.000',
            'fastest_lap' => '01:09:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        RaceResult::create([
            'race_id' => $qualifying->id,
            'driver_id' => $driver2->id,
            'position' => null,
            'original_race_time' => '01:10:00.000',
            'fastest_lap' => '01:10:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        RaceResult::create([
            'race_id' => $qualifying->id,
            'driver_id' => $driver3->id,
            'position' => null,
            'original_race_time' => '01:11:00.000',
            'fastest_lap' => '01:11:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        // Race - driver1 DNFs (started 1st, DNF = position 3)
        $race = Race::factory()->create([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
            'status' => 'scheduled',
            'grid_source' => 'qualifying',
            'grid_source_race_id' => $qualifying->id,
            'race_points' => true,
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver1->id,
            'position' => null,
            'original_race_time' => null,
            'fastest_lap' => null,
            'dnf' => true,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver2->id,
            'position' => null,
            'original_race_time' => '00:45:30.000',
            'fastest_lap' => '01:10:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $driver3->id,
            'position' => null,
            'original_race_time' => '00:45:40.000',
            'fastest_lap' => '01:11:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        // Act: Complete the round
        $response = $this->putJson(self::APP_URL . "/api/rounds/{$round->id}/complete");

        // Assert: API response is successful
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'status' => 'completed',
            ],
        ]);

        // Verify database state: Driver1 qualified 1st, DNF finishes 3rd = -2 positions
        $round->refresh();
        $result1 = RaceResult::where('race_id', $race->id)
            ->where('driver_id', $driver1->id)
            ->first();
        $this->assertEquals(-2, $result1->positions_gained); // Started 1st, finished 3rd (DNF) = 1 - 3 = -2
    }

    public function test_round_standings_include_total_positions_gained(): void
    {
        // Arrange: Round with multiple races
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

        // Qualifying
        $qualifying = Race::factory()->create([
            'round_id' => $round->id,
            'is_qualifier' => true,
            'race_number' => 0,
            'status' => 'scheduled',
            'race_points' => true, // Enable to calculate positions
        ]);

        RaceResult::create([
            'race_id' => $qualifying->id,
            'driver_id' => $driver1->id,
            'position' => null,
            'original_race_time' => '01:10:00.000',
            'fastest_lap' => '01:10:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        RaceResult::create([
            'race_id' => $qualifying->id,
            'driver_id' => $driver2->id,
            'position' => null,
            'original_race_time' => '01:09:00.000',
            'fastest_lap' => '01:09:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        // Race 1 - driver1 gains 1 position
        $race1 = Race::factory()->create([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 1,
            'status' => 'scheduled',
            'grid_source' => 'qualifying',
            'grid_source_race_id' => $qualifying->id,
            'race_points' => true,
        ]);

        RaceResult::create([
            'race_id' => $race1->id,
            'driver_id' => $driver1->id,
            'position' => null,
            'original_race_time' => '00:45:30.000',
            'fastest_lap' => '01:10:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        RaceResult::create([
            'race_id' => $race1->id,
            'driver_id' => $driver2->id,
            'position' => null,
            'original_race_time' => '00:45:40.000',
            'fastest_lap' => '01:11:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        // Race 2 - driver1 gains another 1 position
        $race2 = Race::factory()->create([
            'round_id' => $round->id,
            'is_qualifier' => false,
            'race_number' => 2,
            'status' => 'scheduled',
            'grid_source' => 'qualifying',
            'grid_source_race_id' => $qualifying->id,
            'race_points' => true,
        ]);

        RaceResult::create([
            'race_id' => $race2->id,
            'driver_id' => $driver1->id,
            'position' => null,
            'original_race_time' => '00:45:25.000',
            'fastest_lap' => '01:10:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        RaceResult::create([
            'race_id' => $race2->id,
            'driver_id' => $driver2->id,
            'position' => null,
            'original_race_time' => '00:45:35.000',
            'fastest_lap' => '01:11:00.000',
            'dnf' => false,
            'status' => 'pending',
            'race_points' => 0,
        ]);

        // Act: Complete the round
        $response = $this->putJson(self::APP_URL . "/api/rounds/{$round->id}/complete");

        // Assert: API response is successful and round standings include total_positions_gained
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'status' => 'completed',
            ],
        ]);

        // Verify database state
        $round->refresh();
        $results = $round->round_results;

        $this->assertArrayHasKey('standings', $results);

        // Find driver1's standing
        $driver1Standing = collect($results['standings'])
            ->firstWhere('driver_id', $driver1->id);

        $this->assertNotNull($driver1Standing);
        $this->assertArrayHasKey('total_positions_gained', $driver1Standing);
        // Driver1 qualified 2nd, won both races = +1 per race = +2 total
        $this->assertEquals(2, $driver1Standing['total_positions_gained']);

        // Find driver2's standing
        $driver2Standing = collect($results['standings'])
            ->firstWhere('driver_id', $driver2->id);

        $this->assertNotNull($driver2Standing);
        $this->assertArrayHasKey('total_positions_gained', $driver2Standing);
        // Driver2 qualified 1st, finished 2nd in both races = -1 per race = -2 total
        $this->assertEquals(-2, $driver2Standing['total_positions_gained']);
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
            $driver = Driver::factory()->create([
                'first_name' => 'Driver',
                'last_name' => 'Number ' . ($i + 1),
                'nickname' => null,
            ]);

            $leagueDriver = LeagueDriverEloquent::factory()->create([
                'league_id' => $this->league->id,
                'driver_id' => $driver->id,
            ]);

            $seasonDrivers[] = SeasonDriverEloquent::factory()->create([
                'season_id' => $this->season->id,
                'league_driver_id' => $leagueDriver->id,
                'division_id' => null,
            ]);
        }

        return $seasonDrivers;
    }
}
