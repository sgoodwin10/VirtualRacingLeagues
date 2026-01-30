<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\Driver;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Test available drivers endpoint search and response fields.
 */
class AvailableDriversSearchTest extends TestCase
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

    public function test_response_includes_all_required_fields(): void
    {
        $driver = Driver::create([
            'first_name' => 'Lewis',
            'last_name' => 'Hamilton',
            'nickname' => 'LH44',
            'slug' => 'lewis-hamilton',
            'psn_id' => 'hamilton_lewis',
            'iracing_id' => 'lewis_hamilton',
            'discord_id' => 'hamilton#4444',
        ]);

        $leagueDriver = LeagueDriverEloquent::create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'driver_number' => 44,
            'status' => 'active',
        ]);

        $this->actingAs($this->user, 'web');

        $response = $this->onAppDomain()->getJson("/api/seasons/{$this->season->id}/available-drivers");

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);

        // Assert all required fields are present
        $this->assertArrayHasKey('id', $data[0]);
        $this->assertArrayHasKey('driver_id', $data[0]);
        $this->assertArrayHasKey('driver_name', $data[0]);
        $this->assertArrayHasKey('number', $data[0]);
        $this->assertArrayHasKey('team_name', $data[0]);
        $this->assertArrayHasKey('discord', $data[0]);
        $this->assertArrayHasKey('psn_id', $data[0]);
        $this->assertArrayHasKey('iracing_id', $data[0]);

        // Assert field values
        $this->assertEquals($driver->id, $data[0]['driver_id']);
        $this->assertEquals('44', $data[0]['number']);
        $this->assertEquals('hamilton#4444', $data[0]['discord']);
        $this->assertEquals('hamilton_lewis', $data[0]['psn_id']);
        $this->assertEquals('lewis_hamilton', $data[0]['iracing_id']);
    }

    public function test_search_by_driver_number(): void
    {
        $driver1 = Driver::create([
            'first_name' => 'Lewis',
            'last_name' => 'Hamilton',
            'nickname' => 'LH44',
            'slug' => 'lewis-hamilton',
            'discord_id' => 'hamilton#4444',
        ]);

        LeagueDriverEloquent::create([
            'league_id' => $this->league->id,
            'driver_id' => $driver1->id,
            'driver_number' => 44,
            'status' => 'active',
        ]);

        $driver2 = Driver::create([
            'first_name' => 'Max',
            'last_name' => 'Verstappen',
            'nickname' => 'MV1',
            'slug' => 'max-verstappen',
            'discord_id' => 'verstappen#3333',
        ]);

        LeagueDriverEloquent::create([
            'league_id' => $this->league->id,
            'driver_id' => $driver2->id,
            'driver_number' => 1,
            'status' => 'active',
        ]);

        $this->actingAs($this->user, 'web');

        // Search by number "44"
        $response = $this->onAppDomain()->getJson(
            "/api/seasons/{$this->season->id}/available-drivers?search=44"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($driver1->id, $data[0]['driver_id']);
        $this->assertEquals('44', $data[0]['number']);
    }

    public function test_search_by_discord_id(): void
    {
        $driver = Driver::create([
            'first_name' => 'Carlos',
            'last_name' => 'Sainz',
            'nickname' => 'CS55',
            'slug' => 'carlos-sainz',
            'psn_id' => 'sainz_carlos',
            'iracing_id' => 'carlos_sainz',
            'discord_id' => 'sainz#5555',
        ]);

        LeagueDriverEloquent::create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'driver_number' => 55,
            'status' => 'active',
        ]);

        $this->actingAs($this->user, 'web');

        $response = $this->onAppDomain()->getJson(
            "/api/seasons/{$this->season->id}/available-drivers?search=sainz#5555"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($driver->id, $data[0]['driver_id']);
        $this->assertEquals('sainz#5555', $data[0]['discord']);
    }

    public function test_search_by_psn_id(): void
    {
        $driver = Driver::create([
            'first_name' => 'Charles',
            'last_name' => 'Leclerc',
            'nickname' => 'CL16',
            'slug' => 'charles-leclerc',
            'psn_id' => 'leclerc_charles',
            'iracing_id' => 'charles_leclerc',
            'discord_id' => 'leclerc#1616',
        ]);

        LeagueDriverEloquent::create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'driver_number' => 16,
            'status' => 'active',
        ]);

        $this->actingAs($this->user, 'web');

        $response = $this->onAppDomain()->getJson(
            "/api/seasons/{$this->season->id}/available-drivers?search=leclerc_charles"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($driver->id, $data[0]['driver_id']);
        $this->assertEquals('leclerc_charles', $data[0]['psn_id']);
    }

    public function test_search_by_iracing_id(): void
    {
        $driver = Driver::create([
            'first_name' => 'Lando',
            'last_name' => 'Norris',
            'nickname' => 'LN4',
            'slug' => 'lando-norris',
            'psn_id' => 'norris_lando',
            'iracing_id' => 'lando_norris',
            'discord_id' => 'norris#0044',
        ]);

        LeagueDriverEloquent::create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'driver_number' => 4,
            'status' => 'active',
        ]);

        $this->actingAs($this->user, 'web');

        $response = $this->onAppDomain()->getJson(
            "/api/seasons/{$this->season->id}/available-drivers?search=lando_norris"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($driver->id, $data[0]['driver_id']);
        $this->assertEquals('lando_norris', $data[0]['iracing_id']);
    }

    public function test_search_by_first_name(): void
    {
        $driver = Driver::create([
            'first_name' => 'Sebastian',
            'last_name' => 'Vettel',
            'nickname' => 'Seb',
            'slug' => 'sebastian-vettel',
            'psn_id' => 'vettel_seb',
            'iracing_id' => 'seb_vettel',
            'discord_id' => 'vettel#1234',
        ]);

        LeagueDriverEloquent::create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'driver_number' => 5,
            'status' => 'active',
        ]);

        $this->actingAs($this->user, 'web');

        $response = $this->onAppDomain()->getJson(
            "/api/seasons/{$this->season->id}/available-drivers?search=Sebastian"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($driver->id, $data[0]['driver_id']);
    }

    public function test_search_by_last_name(): void
    {
        $driver = Driver::create([
            'first_name' => 'Fernando',
            'last_name' => 'Alonso',
            'nickname' => 'ElPlan',
            'slug' => 'fernando-alonso',
            'psn_id' => 'alonso_fernando',
            'iracing_id' => 'fernando_alonso',
            'discord_id' => 'alonso#1414',
        ]);

        LeagueDriverEloquent::create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'driver_number' => 14,
            'status' => 'active',
        ]);

        $this->actingAs($this->user, 'web');

        $response = $this->onAppDomain()->getJson(
            "/api/seasons/{$this->season->id}/available-drivers?search=Alonso"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($driver->id, $data[0]['driver_id']);
    }

    public function test_search_by_nickname(): void
    {
        $driver = Driver::create([
            'first_name' => 'George',
            'last_name' => 'Russell',
            'nickname' => 'GR63',
            'slug' => 'george-russell',
            'psn_id' => 'russell_george',
            'iracing_id' => 'george_russell',
            'discord_id' => 'russell#6363',
        ]);

        LeagueDriverEloquent::create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'driver_number' => 63,
            'status' => 'active',
        ]);

        $this->actingAs($this->user, 'web');

        $response = $this->onAppDomain()->getJson(
            "/api/seasons/{$this->season->id}/available-drivers?search=GR63"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($driver->id, $data[0]['driver_id']);
    }

    public function test_search_partial_match(): void
    {
        $driver = Driver::create([
            'first_name' => 'Daniel',
            'last_name' => 'Ricciardo',
            'nickname' => 'DR3',
            'slug' => 'daniel-ricciardo',
            'psn_id' => 'ricciardo_daniel',
            'iracing_id' => 'daniel_ricciardo',
            'discord_id' => 'ricciardo#0303',
        ]);

        LeagueDriverEloquent::create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'driver_number' => 3,
            'status' => 'active',
        ]);

        $this->actingAs($this->user, 'web');

        // Search with partial string "al" should match "Daniel"
        $response = $this->onAppDomain()->getJson(
            "/api/seasons/{$this->season->id}/available-drivers?search=al"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($driver->id, $data[0]['driver_id']);
    }

    public function test_search_is_case_insensitive(): void
    {
        $driver = Driver::create([
            'first_name' => 'Oscar',
            'last_name' => 'Piastri',
            'nickname' => 'OP81',
            'slug' => 'oscar-piastri',
            'psn_id' => 'piastri_oscar',
            'iracing_id' => 'oscar_piastri',
            'discord_id' => 'piastri#8181',
        ]);

        LeagueDriverEloquent::create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'driver_number' => 81,
            'status' => 'active',
        ]);

        $this->actingAs($this->user, 'web');

        // Test lowercase
        $response = $this->onAppDomain()->getJson(
            "/api/seasons/{$this->season->id}/available-drivers?search=oscar"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($driver->id, $data[0]['driver_id']);

        // Test uppercase
        $response = $this->onAppDomain()->getJson(
            "/api/seasons/{$this->season->id}/available-drivers?search=OSCAR"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($driver->id, $data[0]['driver_id']);
    }

    public function test_null_fields_are_handled_correctly(): void
    {
        $driver = Driver::create([
            'first_name' => 'Yuki',
            'last_name' => 'Tsunoda',
            'nickname' => null,
            'slug' => 'yuki-tsunoda',
            'psn_id' => null,
            'iracing_id' => null,
            'discord_id' => null,
        ]);

        LeagueDriverEloquent::create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'driver_number' => null,
            'status' => 'active',
        ]);

        $this->actingAs($this->user, 'web');

        $response = $this->onAppDomain()->getJson("/api/seasons/{$this->season->id}/available-drivers");

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);

        // Assert null values are properly returned
        $this->assertNull($data[0]['discord']);
        $this->assertNull($data[0]['psn_id']);
        $this->assertNull($data[0]['iracing_id']);
        $this->assertNull($data[0]['number']);
    }

    public function test_multiple_drivers_can_be_found_by_search(): void
    {
        // Create two drivers with similar names containing "al"
        $driver1 = Driver::create([
            'first_name' => 'Alex',
            'last_name' => 'Albon',
            'nickname' => 'AA23',
            'slug' => 'alex-albon',
            'discord_id' => 'albon#2323',
        ]);

        LeagueDriverEloquent::create([
            'league_id' => $this->league->id,
            'driver_id' => $driver1->id,
            'driver_number' => 23,
            'status' => 'active',
        ]);

        $driver2 = Driver::create([
            'first_name' => 'Fernando',
            'last_name' => 'Alonso',
            'nickname' => 'FA14',
            'slug' => 'fernando-alonso',
            'discord_id' => 'alonso#1414',
        ]);

        LeagueDriverEloquent::create([
            'league_id' => $this->league->id,
            'driver_id' => $driver2->id,
            'driver_number' => 14,
            'status' => 'active',
        ]);

        $this->actingAs($this->user, 'web');

        // Search "al" should find both drivers
        $response = $this->onAppDomain()->getJson(
            "/api/seasons/{$this->season->id}/available-drivers?search=al"
        );

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(2, $data);
    }
}
