<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\Driver;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Test season driver search functionality across all driver fields.
 */
class SeasonDriverSearchTest extends TestCase
{
    use RefreshDatabase;

    private UserEloquent $user;
    private League $league;
    private Competition $competition;
    private SeasonEloquent $season;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test data
        /** @var UserEloquent $user */
        $user = UserEloquent::factory()->create();
        $this->user = $user;

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
    }

    public function test_search_by_first_name(): void
    {
        $driver = $this->createDriverInSeason([
            'first_name' => 'Sebastian',
            'last_name' => 'Vettel',
            'nickname' => 'Seb',
            'psn_id' => 'vettel_seb',
            'iracing_id' => 'seb_vettel',
            'discord_id' => 'vettel#1234',
        ]);

        $this->actingAs($this->user, 'web');

        $response = $this->getJson(
            "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/drivers?search=Sebastian"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($driver->driver_id, $data[0]['driver_id']);
    }

    public function test_search_by_last_name(): void
    {
        $driver = $this->createDriverInSeason([
            'first_name' => 'Lewis',
            'last_name' => 'Hamilton',
            'nickname' => 'LH44',
            'psn_id' => 'hamilton_lewis',
            'iracing_id' => 'lewis_hamilton',
            'discord_id' => 'hamilton#4444',
        ]);

        $this->actingAs($this->user, 'web');

        $response = $this->getJson(
            "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/drivers?search=Hamilton"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($driver->driver_id, $data[0]['driver_id']);
    }

    public function test_search_by_nickname(): void
    {
        $driver = $this->createDriverInSeason([
            'first_name' => 'Max',
            'last_name' => 'Verstappen',
            'nickname' => 'SuperMax',
            'psn_id' => 'verstappen_max',
            'iracing_id' => 'max_verstappen',
            'discord_id' => 'verstappen#3333',
        ]);

        $this->actingAs($this->user, 'web');

        $response = $this->getJson(
            "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/drivers?search=SuperMax"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($driver->driver_id, $data[0]['driver_id']);
    }

    public function test_search_by_psn_id(): void
    {
        $driver = $this->createDriverInSeason([
            'first_name' => 'Charles',
            'last_name' => 'Leclerc',
            'nickname' => 'CL16',
            'psn_id' => 'leclerc_charles',
            'iracing_id' => 'charles_leclerc',
            'discord_id' => 'leclerc#1616',
        ]);

        $this->actingAs($this->user, 'web');

        $response = $this->getJson(
            "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/drivers?search=leclerc_charles"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($driver->driver_id, $data[0]['driver_id']);
    }

    public function test_search_by_iracing_id(): void
    {
        $driver = $this->createDriverInSeason([
            'first_name' => 'Lando',
            'last_name' => 'Norris',
            'nickname' => 'LN4',
            'psn_id' => 'norris_lando',
            'iracing_id' => 'lando_norris',
            'discord_id' => 'norris#0044',
        ]);

        $this->actingAs($this->user, 'web');

        $response = $this->getJson(
            "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/drivers?search=lando_norris"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($driver->driver_id, $data[0]['driver_id']);
    }

    public function test_search_by_discord_id(): void
    {
        $driver = $this->createDriverInSeason([
            'first_name' => 'Carlos',
            'last_name' => 'Sainz',
            'nickname' => 'CS55',
            'psn_id' => 'sainz_carlos',
            'iracing_id' => 'carlos_sainz',
            'discord_id' => 'sainz#5555',
        ]);

        $this->actingAs($this->user, 'web');

        $response = $this->getJson(
            "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/drivers?search=sainz#5555"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($driver->driver_id, $data[0]['driver_id']);
    }

    public function test_search_is_case_insensitive(): void
    {
        $driver = $this->createDriverInSeason([
            'first_name' => 'Fernando',
            'last_name' => 'Alonso',
            'nickname' => 'ElPlan',
            'psn_id' => 'alonso_fernando',
            'iracing_id' => 'fernando_alonso',
            'discord_id' => 'alonso#1414',
        ]);

        $this->actingAs($this->user, 'web');

        // Test lowercase search
        $response = $this->getJson(
            "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/drivers?search=fernando"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($driver->driver_id, $data[0]['driver_id']);

        // Test uppercase search
        $response = $this->getJson(
            "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/drivers?search=FERNANDO"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($driver->driver_id, $data[0]['driver_id']);
    }

    public function test_search_with_partial_match(): void
    {
        $driver = $this->createDriverInSeason([
            'first_name' => 'George',
            'last_name' => 'Russell',
            'nickname' => 'GR63',
            'psn_id' => 'russell_george',
            'iracing_id' => 'george_russell',
            'discord_id' => 'russell#6363',
        ]);

        $this->actingAs($this->user, 'web');

        // Search with partial first name
        $response = $this->getJson(
            "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/drivers?search=Geo"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($driver->driver_id, $data[0]['driver_id']);
    }

    public function test_search_returns_no_results_for_non_matching_query(): void
    {
        $this->createDriverInSeason([
            'first_name' => 'Sergio',
            'last_name' => 'Perez',
            'nickname' => 'Checo',
            'psn_id' => 'perez_sergio',
            'iracing_id' => 'sergio_perez',
            'discord_id' => 'perez#1111',
        ]);

        $this->actingAs($this->user, 'web');

        $response = $this->getJson(
            "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/drivers?search=NonExistentDriver"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(0, $data);
    }

    public function test_search_in_available_drivers_endpoint(): void
    {
        // Create a driver NOT yet added to season
        $driver = Driver::create([
            'first_name' => 'Daniel',
            'last_name' => 'Ricciardo',
            'nickname' => 'DR3',
            'slug' => 'daniel-ricciardo',
            'psn_id' => 'ricciardo_daniel',
            'iracing_id' => 'daniel_ricciardo',
            'discord_id' => 'ricciardo#0303',
        ]);

        $leagueDriver = LeagueDriverEloquent::create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'number' => '3',
            'team_name' => 'McLaren',
        ]);

        $this->actingAs($this->user, 'web');

        // Search for available drivers
        $response = $this->getJson(
            "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/available-drivers?search=Daniel"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($driver->id, $data[0]['driver_id']);
    }

    /**
     * Helper method to create a driver and add them to the season.
     *
     * @param array<string, mixed> $attributes
     */
    private function createDriverInSeason(array $attributes): LeagueDriverEloquent
    {
        $slug = strtolower($attributes['first_name'] . '-' . $attributes['last_name']);

        $driver = Driver::create(array_merge([
            'slug' => $slug,
        ], $attributes));

        $leagueDriver = LeagueDriverEloquent::create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'number' => '1',
            'team_name' => 'Test Team',
        ]);

        SeasonDriverEloquent::create([
            'season_id' => $this->season->id,
            'league_driver_id' => $leagueDriver->id,
            'status' => 'active',
            'notes' => null,
            'added_at' => now(),
        ]);

        return $leagueDriver;
    }
}
