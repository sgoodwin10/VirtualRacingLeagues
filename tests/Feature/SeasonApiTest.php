<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
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
}
