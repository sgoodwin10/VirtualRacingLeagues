<?php

declare(strict_types=1);

namespace Tests\Feature\Public;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\Driver;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Infrastructure\Persistence\Eloquent\Models\Race;
use App\Infrastructure\Persistence\Eloquent\Models\RaceResult;
use App\Infrastructure\Persistence\Eloquent\Models\Round;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\CoversClass;
use Tests\TestCase;

#[CoversClass(\App\Http\Controllers\Public\PublicDriverController::class)]
#[CoversClass(\App\Application\League\Services\LeagueApplicationService::class)]
#[CoversClass(\App\Application\Driver\DTOs\PublicDriverProfileData::class)]
class PublicDriverProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_get_driver_profile_by_season_driver_id(): void
    {
        // Arrange: Create a public league with driver data
        $user = User::factory()->create();
        $platform = Platform::factory()->create();

        $league = League::factory()->create([
            'owner_user_id' => $user->id,
            'visibility' => 'public',
            'name' => 'Test League',
            'slug' => 'test-league',
        ]);

        $competition = Competition::factory()->create([
            'league_id' => $league->id,
            'platform_id' => $platform->id,
        ]);

        $season = SeasonEloquent::factory()->create([
            'competition_id' => $competition->id,
            'name' => 'Season 1',
            'slug' => 'season-1',
        ]);

        // Create driver with platform accounts
        $driver = Driver::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'nickname' => 'SpeedDemon',
            'psn_id' => 'speeddemon123',
            'discord_id' => 'speeddemon#1234',
            'iracing_id' => '12345',
        ]);

        $leagueDriver = LeagueDriverEloquent::factory()->create([
            'league_id' => $league->id,
            'driver_id' => $driver->id,
            'driver_number' => 99,
        ]);

        $seasonDriver = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver->id,
            'status' => 'active',
        ]);

        // Create race results for stats (poles and podiums)
        $round = Round::factory()->create(['season_id' => $season->id]);
        $race = Race::factory()->create(['round_id' => $round->id]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $seasonDriver->id,
            'position' => 1,
            'has_pole' => true,
            'race_points' => 25,
        ]);

        // Act: Request driver profile
        $response = $this->getJson("/api/public/drivers/{$seasonDriver->id}");

        // Assert: Verify response structure and data
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'nickname' => 'SpeedDemon',
                'driver_number' => 99,
                'platform_accounts' => [
                    'psn_id' => 'speeddemon123',
                    'discord_id' => 'speeddemon#1234',
                    'iracing_id' => '12345',
                ],
                'career_stats' => [
                    'total_poles' => 1,
                    'total_podiums' => 1,
                ],
                'competitions' => [
                    [
                        'league_name' => 'Test League',
                        'league_slug' => 'test-league',
                        'season_name' => 'Season 1',
                        'season_slug' => 'season-1',
                        'status' => 'active',
                    ],
                ],
            ],
        ]);

        // Verify first_name and last_name are NOT included in response
        $data = $response->json('data');
        $this->assertArrayNotHasKey('first_name', $data);
        $this->assertArrayNotHasKey('last_name', $data);
    }

    public function test_driver_profile_excludes_null_platform_accounts(): void
    {
        // Arrange: Create driver with only some platform accounts
        $user = User::factory()->create();
        $platform = Platform::factory()->create();

        $league = League::factory()->create([
            'owner_user_id' => $user->id,
            'visibility' => 'public',
        ]);

        $competition = Competition::factory()->create([
            'league_id' => $league->id,
            'platform_id' => $platform->id,
        ]);

        $season = SeasonEloquent::factory()->create([
            'competition_id' => $competition->id,
        ]);

        $driver = Driver::factory()->create([
            'nickname' => 'TestDriver',
            'psn_id' => 'testpsn',
            'discord_id' => null,  // null
            'iracing_id' => null,  // null
        ]);

        $leagueDriver = LeagueDriverEloquent::factory()->create([
            'league_id' => $league->id,
            'driver_id' => $driver->id,
            'driver_number' => 1,
        ]);

        $seasonDriver = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver->id,
        ]);

        // Act
        $response = $this->getJson("/api/public/drivers/{$seasonDriver->id}");

        // Assert: Only psn_id should be in platform_accounts
        $response->assertStatus(200);
        $platformAccounts = $response->json('data.platform_accounts');
        $this->assertArrayHasKey('psn_id', $platformAccounts);
        $this->assertArrayNotHasKey('discord_id', $platformAccounts);
        $this->assertArrayNotHasKey('iracing_id', $platformAccounts);
    }

    public function test_returns_404_for_nonexistent_driver(): void
    {
        // Act
        $response = $this->getJson('/api/public/drivers/99999');

        // Assert
        $response->assertStatus(404);
        $response->assertJson([
            'success' => false,
            'message' => 'Driver not found',
        ]);
    }

    public function test_returns_404_for_private_league_driver(): void
    {
        // Arrange: Create a PRIVATE league
        $user = User::factory()->create();
        $platform = Platform::factory()->create();

        $league = League::factory()->create([
            'owner_user_id' => $user->id,
            'visibility' => 'private',  // Private league
        ]);

        $competition = Competition::factory()->create([
            'league_id' => $league->id,
            'platform_id' => $platform->id,
        ]);

        $season = SeasonEloquent::factory()->create([
            'competition_id' => $competition->id,
        ]);

        $driver = Driver::factory()->create([
            'nickname' => 'PrivateDriver',
        ]);

        $leagueDriver = LeagueDriverEloquent::factory()->create([
            'league_id' => $league->id,
            'driver_id' => $driver->id,
        ]);

        $seasonDriver = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver->id,
        ]);

        // Act: Try to access driver from private league
        $response = $this->getJson("/api/public/drivers/{$seasonDriver->id}");

        // Assert: Should return 404
        $response->assertStatus(404);
    }

    public function test_driver_profile_aggregates_stats_across_multiple_seasons(): void
    {
        // Arrange: Create driver with multiple seasons and results
        $user = User::factory()->create();
        $platform = Platform::factory()->create();

        $league = League::factory()->create([
            'owner_user_id' => $user->id,
            'visibility' => 'public',
        ]);

        $competition = Competition::factory()->create([
            'league_id' => $league->id,
            'platform_id' => $platform->id,
        ]);

        $season1 = SeasonEloquent::factory()->create(['competition_id' => $competition->id]);
        $season2 = SeasonEloquent::factory()->create(['competition_id' => $competition->id]);

        $driver = Driver::factory()->create(['nickname' => 'MultiSeason']);

        $leagueDriver = LeagueDriverEloquent::factory()->create([
            'league_id' => $league->id,
            'driver_id' => $driver->id,
        ]);

        $seasonDriver1 = SeasonDriverEloquent::factory()->create([
            'season_id' => $season1->id,
            'league_driver_id' => $leagueDriver->id,
        ]);

        $seasonDriver2 = SeasonDriverEloquent::factory()->create([
            'season_id' => $season2->id,
            'league_driver_id' => $leagueDriver->id,
        ]);

        // Season 1: 2 poles, 2 podiums
        $round1 = Round::factory()->create(['season_id' => $season1->id]);
        $race1 = Race::factory()->create(['round_id' => $round1->id]);
        RaceResult::create([
            'race_id' => $race1->id,
            'driver_id' => $seasonDriver1->id,
            'position' => 1,
            'has_pole' => true,
        ]);

        $race2 = Race::factory()->create(['round_id' => $round1->id]);
        RaceResult::create([
            'race_id' => $race2->id,
            'driver_id' => $seasonDriver1->id,
            'position' => 2,
            'has_pole' => true,
        ]);

        // Season 2: 1 pole, 1 podium
        $round2 = Round::factory()->create(['season_id' => $season2->id]);
        $race3 = Race::factory()->create(['round_id' => $round2->id]);
        RaceResult::create([
            'race_id' => $race3->id,
            'driver_id' => $seasonDriver2->id,
            'position' => 3,
            'has_pole' => true,
        ]);

        // Act: Request profile from first season driver
        $response = $this->getJson("/api/public/drivers/{$seasonDriver1->id}");

        // Assert: Stats should aggregate from BOTH seasons
        $response->assertStatus(200);
        $response->assertJson([
            'data' => [
                'career_stats' => [
                    'total_poles' => 3,  // 2 from season1 + 1 from season2
                    'total_podiums' => 3,  // All 3 finishes were podiums (1st, 2nd, 3rd)
                ],
            ],
        ]);

        // Assert: Should list both seasons in competitions
        $competitions = $response->json('data.competitions');
        $this->assertCount(2, $competitions);
    }

    public function test_driver_profile_is_cached_for_one_hour(): void
    {
        // Arrange
        Cache::flush();

        $user = User::factory()->create();
        $platform = Platform::factory()->create();

        $league = League::factory()->create([
            'owner_user_id' => $user->id,
            'visibility' => 'public',
        ]);

        $competition = Competition::factory()->create([
            'league_id' => $league->id,
            'platform_id' => $platform->id,
        ]);

        $season = SeasonEloquent::factory()->create([
            'competition_id' => $competition->id,
        ]);

        $driver = Driver::factory()->create(['nickname' => 'CachedDriver']);

        $leagueDriver = LeagueDriverEloquent::factory()->create([
            'league_id' => $league->id,
            'driver_id' => $driver->id,
        ]);

        $seasonDriver = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver->id,
        ]);

        $cacheKey = "public_driver_profile_{$seasonDriver->id}";

        // Act: First request (should cache)
        $this->assertFalse(Cache::has($cacheKey));
        $response1 = $this->getJson("/api/public/drivers/{$seasonDriver->id}");
        $response1->assertStatus(200);

        // Assert: Cache should now exist
        $this->assertTrue(Cache::has($cacheKey));

        // Act: Second request (should use cache)
        $response2 = $this->getJson("/api/public/drivers/{$seasonDriver->id}");
        $response2->assertStatus(200);

        // Assert: Both responses should be identical
        $this->assertEquals($response1->json('data'), $response2->json('data'));
    }

    public function test_driver_with_no_nickname_uses_full_name(): void
    {
        // Arrange: Driver without nickname
        $user = User::factory()->create();
        $platform = Platform::factory()->create();

        $league = League::factory()->create([
            'owner_user_id' => $user->id,
            'visibility' => 'public',
        ]);

        $competition = Competition::factory()->create([
            'league_id' => $league->id,
            'platform_id' => $platform->id,
        ]);

        $season = SeasonEloquent::factory()->create([
            'competition_id' => $competition->id,
        ]);

        $driver = Driver::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Smith',
            'nickname' => null,  // No nickname
        ]);

        $leagueDriver = LeagueDriverEloquent::factory()->create([
            'league_id' => $league->id,
            'driver_id' => $driver->id,
        ]);

        $seasonDriver = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver->id,
        ]);

        // Act
        $response = $this->getJson("/api/public/drivers/{$seasonDriver->id}");

        // Assert: Should use full name as nickname
        $response->assertStatus(200);
        $response->assertJson([
            'data' => [
                'nickname' => 'John Smith',
            ],
        ]);
    }
}
