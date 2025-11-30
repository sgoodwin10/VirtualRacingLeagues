<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\Division;
use App\Infrastructure\Persistence\Eloquent\Models\Driver;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Test season driver filtering and sorting functionality.
 */
class SeasonDriverFilteringSortingTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private League $league;
    private Competition $competition;
    private SeasonEloquent $season;
    private Division $division1;
    private Division $division2;
    private Team $team1;
    private Team $team2;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test data
        $this->user = User::factory()->create();

        $platform = Platform::create([
            'name' => 'Test Platform',
            'slug' => 'test-platform',
            'logo_url' => '',
        ]);

        $this->league = League::create([
            'name' => 'Test League',
            'slug' => 'test-league',
            'owner_user_id' => $this->user->id,
            'description' => null,
            'logo_path' => 'test/logo.png',
        ]);

        $this->competition = Competition::create([
            'league_id' => $this->league->id,
            'platform_id' => $platform->id,
            'name' => 'Test Competition',
            'slug' => 'test-competition',
            'description' => null,
            'logo_path' => null,
            'status' => 'active',
            'created_by_user_id' => $this->user->id,
        ]);

        $this->season = SeasonEloquent::create([
            'competition_id' => $this->competition->id,
            'name' => 'Test Season',
            'slug' => 'test-season',
            'car_class' => null,
            'description' => null,
            'technical_specs' => null,
            'logo_path' => null,
            'banner_path' => null,
            'team_championship_enabled' => false,
            'status' => 'setup',
            'created_by_user_id' => $this->user->id,
        ]);

        // Create divisions
        $this->division1 = Division::create([
            'season_id' => $this->season->id,
            'name' => 'Division A',
            'description' => null,
            'max_drivers' => 20,
        ]);

        $this->division2 = Division::create([
            'season_id' => $this->season->id,
            'name' => 'Division B',
            'description' => null,
            'max_drivers' => 20,
        ]);

        // Create teams
        $this->team1 = Team::create([
            'season_id' => $this->season->id,
            'name' => 'Red Bull Racing',
            'description' => null,
        ]);

        $this->team2 = Team::create([
            'season_id' => $this->season->id,
            'name' => 'Mercedes AMG',
            'description' => null,
        ]);
    }

    public function test_filter_by_division_id(): void
    {
        // Create drivers in different divisions
        $driver1 = $this->createDriverInSeason(['first_name' => 'Max', 'last_name' => 'Verstappen'], [
            'division_id' => $this->division1->id,
        ]);
        $driver2 = $this->createDriverInSeason(['first_name' => 'Lewis', 'last_name' => 'Hamilton'], [
            'division_id' => $this->division2->id,
        ]);
        $driver3 = $this->createDriverInSeason(['first_name' => 'Charles', 'last_name' => 'Leclerc'], [
            'division_id' => $this->division1->id,
        ]);

        $this->actingAs($this->user, 'web');

        // Filter by division1
        $response = $this->getJson(
            "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/drivers" .
            "?division_id={$this->division1->id}"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(2, $data);

        // Verify only drivers from division1 are returned
        $driverIds = array_column($data, 'driver_id');
        $this->assertContains($driver1, $driverIds);
        $this->assertNotContains($driver2, $driverIds);
        $this->assertContains($driver3, $driverIds);
    }

    public function test_filter_by_team_id(): void
    {
        // Create drivers in different teams
        $driver1 = $this->createDriverInSeason(['first_name' => 'Max', 'last_name' => 'Verstappen'], [
            'team_id' => $this->team1->id,
        ]);
        $driver2 = $this->createDriverInSeason(['first_name' => 'Lewis', 'last_name' => 'Hamilton'], [
            'team_id' => $this->team2->id,
        ]);
        $driver3 = $this->createDriverInSeason(['first_name' => 'Sergio', 'last_name' => 'Perez'], [
            'team_id' => $this->team1->id,
        ]);

        $this->actingAs($this->user, 'web');

        // Filter by team1
        $response = $this->getJson(
            "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/drivers" .
            "?team_id={$this->team1->id}"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(2, $data);

        // Verify only drivers from team1 are returned
        $driverIds = array_column($data, 'driver_id');
        $this->assertContains($driver1, $driverIds);
        $this->assertNotContains($driver2, $driverIds);
        $this->assertContains($driver3, $driverIds);
    }

    public function test_sort_by_discord_id(): void
    {
        // Create drivers with different discord IDs
        $this->createDriverInSeason([
            'first_name' => 'Driver',
            'last_name' => 'A',
            'discord_id' => 'charlie#3333',
        ]);
        $this->createDriverInSeason([
            'first_name' => 'Driver',
            'last_name' => 'B',
            'discord_id' => 'alpha#1111',
        ]);
        $this->createDriverInSeason([
            'first_name' => 'Driver',
            'last_name' => 'C',
            'discord_id' => 'bravo#2222',
        ]);

        $this->actingAs($this->user, 'web');

        // Sort by discord_id ascending
        $response = $this->getJson(
            "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/drivers" .
            "?order_by=discord_id&order_direction=asc"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertEquals('alpha#1111', $data[0]['discord_id']);
        $this->assertEquals('bravo#2222', $data[1]['discord_id']);
        $this->assertEquals('charlie#3333', $data[2]['discord_id']);
    }

    public function test_sort_by_driver_number(): void
    {
        // Create drivers with different driver numbers
        $this->createDriverInSeason(['first_name' => 'Driver', 'last_name' => 'A'], ['driver_number' => 33]);
        $this->createDriverInSeason(['first_name' => 'Driver', 'last_name' => 'B'], ['driver_number' => 1]);
        $this->createDriverInSeason(['first_name' => 'Driver', 'last_name' => 'C'], ['driver_number' => 44]);

        $this->actingAs($this->user, 'web');

        // Sort by driver_number ascending
        $response = $this->getJson(
            "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/drivers" .
            "?order_by=driver_number&order_direction=asc"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertEquals('1', $data[0]['driver_number']);
        $this->assertEquals('33', $data[1]['driver_number']);
        $this->assertEquals('44', $data[2]['driver_number']);
    }

    public function test_sort_by_team_name(): void
    {
        // Create drivers with different teams
        $this->createDriverInSeason(['first_name' => 'Driver', 'last_name' => 'A'], [
            'team_id' => $this->team2->id, // Mercedes AMG
        ]);
        $this->createDriverInSeason(['first_name' => 'Driver', 'last_name' => 'B'], [
            'team_id' => $this->team1->id, // Red Bull Racing
        ]);
        $this->createDriverInSeason(['first_name' => 'Driver', 'last_name' => 'C'], [
            'team_id' => null, // No team (Privateer)
        ]);

        $this->actingAs($this->user, 'web');

        // Sort by team_name ascending (NULL values should be last)
        $response = $this->getJson(
            "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/drivers" .
            "?order_by=team_name&order_direction=asc"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertEquals('Mercedes AMG', $data[0]['team_name']);
        $this->assertEquals('Red Bull Racing', $data[1]['team_name']);
        $this->assertNull($data[2]['team_name']); // NULL should be last
    }

    public function test_sort_by_division_name(): void
    {
        // Create drivers with different divisions
        $this->createDriverInSeason(['first_name' => 'Driver', 'last_name' => 'A'], [
            'division_id' => $this->division2->id, // Division B
        ]);
        $this->createDriverInSeason(['first_name' => 'Driver', 'last_name' => 'B'], [
            'division_id' => $this->division1->id, // Division A
        ]);
        $this->createDriverInSeason(['first_name' => 'Driver', 'last_name' => 'C'], [
            'division_id' => null, // No division
        ]);

        $this->actingAs($this->user, 'web');

        // Sort by division_name ascending (NULL values should be last)
        $response = $this->getJson(
            "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/drivers" .
            "?order_by=division_name&order_direction=asc"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertEquals('Division A', $data[0]['division_name']);
        $this->assertEquals('Division B', $data[1]['division_name']);
        $this->assertNull($data[2]['division_name']); // NULL should be last
    }

    public function test_combined_filter_and_sort(): void
    {
        // Create drivers with various attributes
        $this->createDriverInSeason([
            'first_name' => 'Max',
            'last_name' => 'Verstappen',
            'discord_id' => 'max#1',
        ], [
            'division_id' => $this->division1->id,
            'team_id' => $this->team1->id,
            'driver_number' => 1,
        ]);

        $this->createDriverInSeason([
            'first_name' => 'Sergio',
            'last_name' => 'Perez',
            'discord_id' => 'checo#11',
        ], [
            'division_id' => $this->division1->id,
            'team_id' => $this->team1->id,
            'driver_number' => 11,
        ]);

        $this->createDriverInSeason([
            'first_name' => 'Lewis',
            'last_name' => 'Hamilton',
            'discord_id' => 'lewis#44',
        ], [
            'division_id' => $this->division2->id,
            'team_id' => $this->team2->id,
            'driver_number' => 44,
        ]);

        $this->actingAs($this->user, 'web');

        // Filter by division1 and sort by driver_number
        $response = $this->getJson(
            "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/drivers" .
            "?division_id={$this->division1->id}&order_by=driver_number&order_direction=asc"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(2, $data);
        $this->assertEquals('1', $data[0]['driver_number']); // Max (1) should be first
        $this->assertEquals('11', $data[1]['driver_number']); // Sergio (11) should be second
    }

    /**
     * Helper method to create a driver and add them to the season.
     *
     * @param array<string, mixed> $driverAttributes
     * @param array<string, mixed> $seasonDriverAttributes
     * @return int Driver ID
     */
    private function createDriverInSeason(
        array $driverAttributes,
        array $seasonDriverAttributes = []
    ): int {
        $slug = strtolower($driverAttributes['first_name'] . '-' . $driverAttributes['last_name']);

        $driver = Driver::create(array_merge([
            'slug' => $slug,
            'nickname' => null,
            'psn_id' => null,
            'iracing_id' => null,
            'discord_id' => null,
        ], $driverAttributes));

        $leagueDriver = LeagueDriverEloquent::create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'driver_number' => $seasonDriverAttributes['driver_number'] ?? null,
            'status' => 'active',
        ]);

        SeasonDriverEloquent::create(array_merge([
            'season_id' => $this->season->id,
            'league_driver_id' => $leagueDriver->id,
            'status' => 'active',
            'notes' => null,
            'added_at' => now(),
            'team_id' => null,
            'division_id' => null,
        ], $seasonDriverAttributes));

        return $driver->id;
    }
}
