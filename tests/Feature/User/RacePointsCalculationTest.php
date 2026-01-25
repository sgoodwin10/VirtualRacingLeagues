<?php

declare(strict_types=1);

namespace Tests\Feature\User;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\Division;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\Race;
use App\Infrastructure\Persistence\Eloquent\Models\RaceResult;
use App\Infrastructure\Persistence\Eloquent\Models\Round;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent as Season;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class RacePointsCalculationTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private League $league;

    private Competition $competition;

    private Season $season;

    private Round $round;

    private Race $race;

    private SeasonDriverEloquent $driver1;

    private SeasonDriverEloquent $driver2;

    private SeasonDriverEloquent $driver3;

    private SeasonDriverEloquent $driver4;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->league = League::factory()->create(['owner_user_id' => $this->user->id]);
        $this->competition = Competition::factory()->create(['league_id' => $this->league->id]);
        $this->season = Season::factory()->create([
            'competition_id' => $this->competition->id,
            'race_divisions_enabled' => false,
        ]);
        $this->round = Round::factory()->create(['season_id' => $this->season->id]);
        $this->race = Race::factory()->create([
            'round_id' => $this->round->id,
            'race_points' => true,
            'points_system' => [
                1 => 25, 2 => 18, 3 => 15, 4 => 12, 5 => 10,
                6 => 8, 7 => 6, 8 => 4, 9 => 2, 10 => 1,
            ],
            'dnf_points' => 0,
            'dns_points' => 0,
            'fastest_lap' => null,
            'fastest_lap_top_10' => false,
            'status' => 'scheduled',
        ]);

        // Create drivers
        $this->driver1 = SeasonDriverEloquent::factory()->create(['season_id' => $this->season->id]);
        $this->driver2 = SeasonDriverEloquent::factory()->create(['season_id' => $this->season->id]);
        $this->driver3 = SeasonDriverEloquent::factory()->create(['season_id' => $this->season->id]);
        $this->driver4 = SeasonDriverEloquent::factory()->create(['season_id' => $this->season->id]);
    }

    public function test_calculates_basic_position_points(): void
    {
        // Create race results with different race times
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $this->driver1->id,
            'original_race_time' => '00:30:15.250',
            'fastest_lap' => '00:01:25.500',
            'dnf' => false,
            'status' => 'pending',
        ]);
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $this->driver2->id,
            'original_race_time' => '00:30:20.500',
            'fastest_lap' => '00:01:26.000',
            'dnf' => false,
            'status' => 'pending',
        ]);
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $this->driver3->id,
            'original_race_time' => '00:30:25.750',
            'fastest_lap' => '00:01:27.000',
            'dnf' => false,
            'status' => 'pending',
        ]);

        // Mark race as completed (this triggers points calculation)
        $response = $this->actingAs($this->user)
            ->putJson("http://app.virtualracingleagues.localhost/api/races/{$this->race->id}", [
                'status' => 'completed',
            ]);

        $response->assertStatus(200);

        // Verify positions and points were calculated correctly
        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver1->id,
            'position' => 1,
            'race_points' => 25, // P1 = 25 points
        ]);

        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver2->id,
            'position' => 2,
            'race_points' => 18, // P2 = 18 points
        ]);

        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver3->id,
            'position' => 3,
            'race_points' => 15, // P3 = 15 points
        ]);
    }

    public function test_handles_dnf_drivers(): void
    {
        // Create race results with one DNF
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $this->driver1->id,
            'original_race_time' => '00:30:15.250',
            'dnf' => false,
        ]);
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $this->driver2->id,
            'original_race_time' => '00:15:00.000', // DNF - incomplete race time
            'dnf' => true,
        ]);

        // Update race with DNF points
        $this->race->update(['dnf_points' => 5]);

        // Mark race as completed
        $response = $this->actingAs($this->user)
            ->putJson("http://app.virtualracingleagues.localhost/api/races/{$this->race->id}", [
                'status' => 'completed',
            ]);

        $response->assertStatus(200);

        // Verify DNF driver is placed after finishers with DNF points
        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver1->id,
            'position' => 1,
            'race_points' => 25,
        ]);

        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver2->id,
            'position' => 2, // DNF placed after finishers
            'race_points' => 5, // DNF points
            'dnf' => true,
        ]);
    }

    public function test_handles_dns_drivers(): void
    {
        // Create race results with one DNS (no race_time, not DNF)
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $this->driver1->id,
            'original_race_time' => '00:30:15.250',
            'dnf' => false,
        ]);
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $this->driver2->id,
            'original_race_time' => null, // DNS - no race time
            'dnf' => false,
        ]);

        // Update race with DNS points
        $this->race->update(['dns_points' => 3]);

        // Mark race as completed
        $response = $this->actingAs($this->user)
            ->putJson("http://app.virtualracingleagues.localhost/api/races/{$this->race->id}", [
                'status' => 'completed',
            ]);

        $response->assertStatus(200);

        // Verify DNS driver is placed last with DNS points
        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver1->id,
            'position' => 1,
            'race_points' => 25,
        ]);

        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver2->id,
            'position' => 2, // DNS placed after all finishers
            'race_points' => 3, // DNS points
            'dnf' => false,
        ]);
    }

    public function test_awards_fastest_lap_bonus(): void
    {
        // Update race to include fastest lap bonus
        $this->race->update([
            'fastest_lap' => 1,
            'fastest_lap_top_10' => false,
        ]);

        // Create race results with different fastest lap times
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $this->driver1->id,
            'original_race_time' => '00:30:15.250',
            'fastest_lap' => '00:01:26.000',
            'dnf' => false,
        ]);
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $this->driver2->id,
            'original_race_time' => '00:30:20.500',
            'fastest_lap' => '00:01:25.500', // Fastest lap
            'dnf' => false,
        ]);
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $this->driver3->id,
            'original_race_time' => '00:30:25.750',
            'fastest_lap' => '00:01:27.000',
            'dnf' => false,
        ]);

        // Mark race as completed
        $response = $this->actingAs($this->user)
            ->putJson("http://app.virtualracingleagues.localhost/api/races/{$this->race->id}", [
                'status' => 'completed',
            ]);

        $response->assertStatus(200);

        // Verify driver2 got fastest lap bonus
        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver2->id,
            'position' => 2,
            'race_points' => 19, // 18 (P2) + 1 (fastest lap bonus)
            'has_fastest_lap' => true,
        ]);

        // Verify others didn't get fastest lap flag
        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver1->id,
            'has_fastest_lap' => false,
        ]);
    }

    public function test_dnf_drivers_excluded_from_fastest_lap(): void
    {
        // Update race to include fastest lap bonus
        $this->race->update([
            'fastest_lap' => 1,
            'fastest_lap_top_10' => false,
        ]);

        // Create race results where DNF driver has the fastest lap
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $this->driver1->id,
            'original_race_time' => '00:30:15.250',
            'fastest_lap' => '00:01:26.000',
            'dnf' => false,
        ]);
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $this->driver2->id,
            'original_race_time' => '00:15:00.000',
            'fastest_lap' => '00:01:20.000', // DNF driver with fastest lap
            'dnf' => true,
        ]);

        // Mark race as completed
        $response = $this->actingAs($this->user)
            ->putJson("http://app.virtualracingleagues.localhost/api/races/{$this->race->id}", [
                'status' => 'completed',
            ]);

        $response->assertStatus(200);

        // Verify DNF driver did NOT get fastest lap bonus
        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver2->id,
            'dnf' => true,
            'has_fastest_lap' => false,
        ]);

        // Verify P1 finisher got fastest lap instead
        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver1->id,
            'position' => 1,
            'race_points' => 26, // 25 (P1) + 1 (fastest lap bonus)
            'has_fastest_lap' => true,
        ]);
    }

    public function test_division_based_calculation(): void
    {
        // Enable divisions on season
        $this->season->update(['race_divisions_enabled' => true]);

        // Create two divisions
        $division1 = Division::factory()->create(['season_id' => $this->season->id, 'name' => 'Pro']);
        $division2 = Division::factory()->create(['season_id' => $this->season->id, 'name' => 'Am']);

        // Create race results for each division
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $this->driver1->id,
            'division_id' => $division1->id,
            'original_race_time' => '00:30:15.250',
            'dnf' => false,
        ]);
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $this->driver2->id,
            'division_id' => $division1->id,
            'original_race_time' => '00:30:20.500',
            'dnf' => false,
        ]);
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $this->driver3->id,
            'division_id' => $division2->id,
            'original_race_time' => '00:30:25.750', // Slower than division1 drivers
            'dnf' => false,
        ]);
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $this->driver4->id,
            'division_id' => $division2->id,
            'original_race_time' => '00:30:30.000',
            'dnf' => false,
        ]);

        // Mark race as completed
        $response = $this->actingAs($this->user)
            ->putJson("http://app.virtualracingleagues.localhost/api/races/{$this->race->id}", [
                'status' => 'completed',
            ]);

        $response->assertStatus(200);

        // Verify division 1 results - each division has independent positions
        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver1->id,
            'division_id' => $division1->id,
            'position' => 1, // P1 in division 1
            'race_points' => 25,
        ]);

        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver2->id,
            'division_id' => $division1->id,
            'position' => 2, // P2 in division 1
            'race_points' => 18,
        ]);

        // Verify division 2 results - independent positions even though slower overall
        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver3->id,
            'division_id' => $division2->id,
            'position' => 1, // P1 in division 2 (gets full 25 points)
            'race_points' => 25,
        ]);

        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver4->id,
            'division_id' => $division2->id,
            'position' => 2, // P2 in division 2
            'race_points' => 18,
        ]);
    }

    public function test_does_not_calculate_points_when_race_points_disabled(): void
    {
        // Disable race points
        $this->race->update(['race_points' => false]);

        // Create race results
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $this->driver1->id,
            'original_race_time' => '00:30:15.250',
            'dnf' => false,
        ]);

        // Mark race as completed
        $response = $this->actingAs($this->user)
            ->putJson("http://app.virtualracingleagues.localhost/api/races/{$this->race->id}", [
                'status' => 'completed',
            ]);

        $response->assertStatus(200);

        // Verify points were not calculated (should remain 0)
        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver1->id,
            'race_points' => 0,
        ]);
    }

    public function test_mixed_dnf_dns_and_finishers_ordering(): void
    {
        // Create a mix of finishers, DNF, and DNS
        $driver5 = SeasonDriverEloquent::factory()->create(['season_id' => $this->season->id]);
        $driver6 = SeasonDriverEloquent::factory()->create(['season_id' => $this->season->id]);

        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $this->driver1->id,
            'original_race_time' => '00:30:15.250',
            'dnf' => false,
        ]);
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $this->driver2->id,
            'original_race_time' => '00:30:20.500',
            'dnf' => false,
        ]);
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $this->driver3->id,
            'original_race_time' => '00:15:00.000',
            'dnf' => true, // DNF
        ]);
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $this->driver4->id,
            'original_race_time' => '00:10:00.000',
            'dnf' => true, // DNF
        ]);
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $driver5->id,
            'original_race_time' => null,
            'dnf' => false, // DNS
        ]);
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $driver6->id,
            'original_race_time' => null,
            'dnf' => false, // DNS
        ]);

        // Update race with DNF and DNS points
        $this->race->update(['dnf_points' => 5, 'dns_points' => 2]);

        // Mark race as completed
        $response = $this->actingAs($this->user)
            ->putJson("http://app.virtualracingleagues.localhost/api/races/{$this->race->id}", [
                'status' => 'completed',
            ]);

        $response->assertStatus(200);

        // Verify ordering: finishers (1-2), DNF (3-4), DNS (5-6)
        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver1->id,
            'position' => 1,
            'race_points' => 25,
        ]);

        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver2->id,
            'position' => 2,
            'race_points' => 18,
        ]);

        // DNF drivers at positions 3-4
        $result3 = RaceResult::where('race_id', $this->race->id)
            ->where('driver_id', $this->driver3->id)
            ->first();
        $this->assertTrue(in_array($result3->position, [3, 4]));
        $this->assertEquals(5, $result3->race_points);

        $result4 = RaceResult::where('race_id', $this->race->id)
            ->where('driver_id', $this->driver4->id)
            ->first();
        $this->assertTrue(in_array($result4->position, [3, 4]));
        $this->assertEquals(5, $result4->race_points);

        // DNS drivers at positions 5-6
        $result5 = RaceResult::where('race_id', $this->race->id)
            ->where('driver_id', $driver5->id)
            ->first();
        $this->assertTrue(in_array($result5->position, [5, 6]));
        $this->assertEquals(2, $result5->race_points);

        $result6 = RaceResult::where('race_id', $this->race->id)
            ->where('driver_id', $driver6->id)
            ->first();
        $this->assertTrue(in_array($result6->position, [5, 6]));
        $this->assertEquals(2, $result6->race_points);
    }

    public function test_calculates_positions_gained_when_race_points_disabled(): void
    {
        // Create a qualifying race (grid source)
        $qualifier = Race::factory()->create([
            'round_id' => $this->round->id,
            'race_number' => 0, // Qualifier
            'race_points' => false,
            'status' => 'completed',
        ]);

        // Create qualifying results
        RaceResult::create([
            'race_id' => $qualifier->id,
            'driver_id' => $this->driver1->id,
            'position' => 1,
            'original_race_time' => '00:01:25.500',
            'fastest_lap' => '00:01:25.500',
            'dnf' => false,
            'status' => 'confirmed',
        ]);
        RaceResult::create([
            'race_id' => $qualifier->id,
            'driver_id' => $this->driver2->id,
            'position' => 2,
            'original_race_time' => '00:01:26.000',
            'fastest_lap' => '00:01:26.000',
            'dnf' => false,
            'status' => 'confirmed',
        ]);
        RaceResult::create([
            'race_id' => $qualifier->id,
            'driver_id' => $this->driver3->id,
            'position' => 3,
            'original_race_time' => '00:01:27.000',
            'fastest_lap' => '00:01:27.000',
            'dnf' => false,
            'status' => 'confirmed',
        ]);

        // Create a race with grid_source from qualifier and race_points disabled
        $raceWithoutPoints = Race::factory()->create([
            'round_id' => $this->round->id,
            'race_number' => 1,
            'grid_source' => 'qualifying',
            'grid_source_race_id' => $qualifier->id,
            'race_points' => false, // Points disabled
            'status' => 'scheduled',
        ]);

        // Create race results (driver2 wins, driver1 comes 2nd, driver3 comes 3rd)
        RaceResult::create([
            'race_id' => $raceWithoutPoints->id,
            'driver_id' => $this->driver2->id,
            'original_race_time' => '00:30:15.250',
            'fastest_lap' => '00:01:25.500',
            'dnf' => false,
        ]);
        RaceResult::create([
            'race_id' => $raceWithoutPoints->id,
            'driver_id' => $this->driver1->id,
            'original_race_time' => '00:30:20.500',
            'fastest_lap' => '00:01:26.000',
            'dnf' => false,
        ]);
        RaceResult::create([
            'race_id' => $raceWithoutPoints->id,
            'driver_id' => $this->driver3->id,
            'original_race_time' => '00:30:25.750',
            'fastest_lap' => '00:01:27.000',
            'dnf' => false,
        ]);

        // Mark race as completed
        $response = $this->actingAs($this->user)
            ->putJson("http://app.virtualracingleagues.localhost/api/races/{$raceWithoutPoints->id}", [
                'status' => 'completed',
            ]);

        $response->assertStatus(200);

        // Verify positions_gained was calculated even though race_points is disabled
        // Driver2: started P2, finished P1 -> gained 1 position (2 - 1 = 1)
        $this->assertDatabaseHas('race_results', [
            'race_id' => $raceWithoutPoints->id,
            'driver_id' => $this->driver2->id,
            'position' => 1,
            'positions_gained' => 1,
            'race_points' => 0, // No points because race_points is disabled
        ]);

        // Driver1: started P1, finished P2 -> lost 1 position (1 - 2 = -1)
        $this->assertDatabaseHas('race_results', [
            'race_id' => $raceWithoutPoints->id,
            'driver_id' => $this->driver1->id,
            'position' => 2,
            'positions_gained' => -1,
            'race_points' => 0,
        ]);

        // Driver3: started P3, finished P3 -> no change (3 - 3 = 0)
        $this->assertDatabaseHas('race_results', [
            'race_id' => $raceWithoutPoints->id,
            'driver_id' => $this->driver3->id,
            'position' => 3,
            'positions_gained' => 0,
            'race_points' => 0,
        ]);
    }

    public function test_positions_gained_null_when_no_grid_source(): void
    {
        // Create a race with manual grid (no grid source)
        $raceManualGrid = Race::factory()->create([
            'round_id' => $this->round->id,
            'race_number' => 1,
            'grid_source' => 'manual',
            'grid_source_race_id' => null,
            'race_points' => false,
            'status' => 'scheduled',
        ]);

        // Create race results
        RaceResult::create([
            'race_id' => $raceManualGrid->id,
            'driver_id' => $this->driver1->id,
            'original_race_time' => '00:30:15.250',
            'dnf' => false,
        ]);

        // Mark race as completed
        $response = $this->actingAs($this->user)
            ->putJson("http://app.virtualracingleagues.localhost/api/races/{$raceManualGrid->id}", [
                'status' => 'completed',
            ]);

        $response->assertStatus(200);

        // Verify positions_gained is NULL when no grid source
        $this->assertDatabaseHas('race_results', [
            'race_id' => $raceManualGrid->id,
            'driver_id' => $this->driver1->id,
            'position' => 1,
            'positions_gained' => null,
        ]);
    }
}
