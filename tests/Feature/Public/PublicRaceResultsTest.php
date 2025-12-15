<?php

declare(strict_types=1);

namespace Tests\Feature\Public;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\Division;
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
use Tests\TestCase;

/**
 * @covers \App\Http\Controllers\Public\PublicLeagueController::raceResults
 * @covers \App\Application\League\Services\LeagueApplicationService::getPublicRaceResults
 * @covers \App\Application\League\DTOs\PublicRaceResultsData
 */
class PublicRaceResultsTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_get_race_results_for_public_league(): void
    {
        // Arrange: Create a public league with race results
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
            'race_divisions_enabled' => false,
        ]);

        $round = Round::factory()->create([
            'season_id' => $season->id,
        ]);

        $race = Race::factory()->create([
            'round_id' => $round->id,
            'name' => 'Feature Race',
            'race_type' => 'feature',
        ]);

        // Create drivers and results
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
            'driver_number' => 1,
        ]);

        $leagueDriver2 = LeagueDriverEloquent::factory()->create([
            'league_id' => $league->id,
            'driver_id' => $driver2->id,
            'driver_number' => 2,
        ]);

        $seasonDriver1 = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver1->id,
        ]);

        $seasonDriver2 = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver2->id,
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $seasonDriver1->id,
            'division_id' => null,
            'position' => 1,
            'original_race_time' => '1:23:45.678',
            'final_race_time_difference' => '+0.000',
            'fastest_lap' => '1:12.345',
            'penalties' => null,
            'race_points' => 25,
            'has_fastest_lap' => true,
            'has_pole' => true,
            'dnf' => false,
            'status' => 'confirmed',
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $seasonDriver2->id,
            'division_id' => null,
            'position' => 2,
            'original_race_time' => '1:23:50.123',
            'final_race_time_difference' => '+4.445',
            'fastest_lap' => '1:12.789',
            'penalties' => null,
            'race_points' => 18,
            'has_fastest_lap' => false,
            'has_pole' => false,
            'dnf' => false,
            'status' => 'confirmed',
        ]);

        // Act: Fetch race results
        $response = $this->getJson("/api/public/races/{$race->id}/results");

        // Assert
        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'race' => ['id', 'race_number', 'name', 'race_type', 'status'],
                    'results' => [
                        '*' => [
                            'position',
                            'driver_id',
                            'driver_name',
                            'driver_number',
                            'race_time',
                            'race_time_difference',
                            'fastest_lap',
                            'penalties',
                            'race_points',
                            'has_fastest_lap',
                            'has_pole',
                            'dnf',
                            'status',
                        ],
                    ],
                    'has_divisions',
                ],
            ]);

        $data = $response->json('data');

        $this->assertEquals($race->id, $data['race']['id']);
        $this->assertEquals('Feature Race', $data['race']['name']);
        $this->assertFalse($data['has_divisions']);
        $this->assertCount(2, $data['results']);
        $this->assertEquals('John Doe', $data['results'][0]['driver_name']);
        $this->assertEquals('Jane Smith', $data['results'][1]['driver_name']);
    }

    public function test_can_get_race_results_with_divisions(): void
    {
        // Arrange: Create a league with divisions enabled
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
            'race_divisions_enabled' => true,
        ]);

        $division1 = Division::factory()->create([
            'season_id' => $season->id,
            'name' => 'Division A',
        ]);

        $division2 = Division::factory()->create([
            'season_id' => $season->id,
            'name' => 'Division B',
        ]);

        $round = Round::factory()->create([
            'season_id' => $season->id,
        ]);

        $race = Race::factory()->create([
            'round_id' => $round->id,
        ]);

        // Create drivers in different divisions
        $driver1 = Driver::factory()->create(['nickname' => 'Driver1']);
        $driver2 = Driver::factory()->create(['nickname' => 'Driver2']);

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
        ]);

        $seasonDriver2 = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver2->id,
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $seasonDriver1->id,
            'division_id' => $division1->id,
            'position' => 1,
            'original_race_time' => '1:23:45.678',
            'final_race_time_difference' => '+0.000',
            'race_points' => 25,
            'has_fastest_lap' => false,
            'has_pole' => false,
            'dnf' => false,
            'status' => 'confirmed',
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $seasonDriver2->id,
            'division_id' => $division2->id,
            'position' => 1,
            'original_race_time' => '1:24:00.000',
            'final_race_time_difference' => '+0.000',
            'race_points' => 25,
            'has_fastest_lap' => false,
            'has_pole' => false,
            'dnf' => false,
            'status' => 'confirmed',
        ]);

        // Act
        $response = $this->getJson("/api/public/races/{$race->id}/results");

        // Assert
        $response->assertOk();

        $data = $response->json('data');

        $this->assertTrue($data['has_divisions']);
        $this->assertCount(2, $data['results']);

        // Verify division grouping
        foreach ($data['results'] as $divisionResult) {
            $this->assertArrayHasKey('division_id', $divisionResult);
            $this->assertArrayHasKey('division_name', $divisionResult);
            $this->assertArrayHasKey('results', $divisionResult);
        }
    }

    public function test_returns_404_for_nonexistent_race(): void
    {
        $response = $this->getJson('/api/public/races/99999/results');

        $response->assertNotFound();
    }

    public function test_returns_404_for_private_league_race(): void
    {
        // Arrange: Create a private league
        $user = User::factory()->create();
        $platform = Platform::factory()->create();

        $league = League::factory()->create([
            'owner_user_id' => $user->id,
            'visibility' => 'private',
        ]);

        $competition = Competition::factory()->create([
            'league_id' => $league->id,
            'platform_id' => $platform->id,
        ]);

        $season = SeasonEloquent::factory()->create([
            'competition_id' => $competition->id,
        ]);

        $round = Round::factory()->create([
            'season_id' => $season->id,
        ]);

        $race = Race::factory()->create([
            'round_id' => $round->id,
        ]);

        // Act
        $response = $this->getJson("/api/public/races/{$race->id}/results");

        // Assert
        $response->assertNotFound();
    }

    public function test_handles_race_with_no_results(): void
    {
        // Arrange: Create a race without any results
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
            'race_divisions_enabled' => false,
        ]);

        $round = Round::factory()->create([
            'season_id' => $season->id,
        ]);

        $race = Race::factory()->create([
            'round_id' => $round->id,
        ]);

        // Act
        $response = $this->getJson("/api/public/races/{$race->id}/results");

        // Assert
        $response->assertOk()
            ->assertJsonPath('data.results', [])
            ->assertJsonPath('data.has_divisions', false);
    }

    public function test_unlisted_league_race_is_accessible(): void
    {
        // Arrange: Create an unlisted league (should still be accessible, only private blocked)
        $user = User::factory()->create();
        $platform = Platform::factory()->create();

        $league = League::factory()->create([
            'owner_user_id' => $user->id,
            'visibility' => 'unlisted',
        ]);

        $competition = Competition::factory()->create([
            'league_id' => $league->id,
            'platform_id' => $platform->id,
        ]);

        $season = SeasonEloquent::factory()->create([
            'competition_id' => $competition->id,
        ]);

        $round = Round::factory()->create([
            'season_id' => $season->id,
        ]);

        $race = Race::factory()->create([
            'round_id' => $round->id,
        ]);

        // Act
        $response = $this->getJson("/api/public/races/{$race->id}/results");

        // Assert: Unlisted leagues should still be accessible (only private blocked)
        $response->assertOk();
    }

    public function test_driver_name_uses_nickname_when_available(): void
    {
        // Arrange
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
            'race_divisions_enabled' => false,
        ]);

        $round = Round::factory()->create([
            'season_id' => $season->id,
        ]);

        $race = Race::factory()->create([
            'round_id' => $round->id,
        ]);

        // Driver with nickname should show nickname, not full name
        $driver = Driver::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'nickname' => 'JD Racing',
        ]);

        $leagueDriver = LeagueDriverEloquent::factory()->create([
            'league_id' => $league->id,
            'driver_id' => $driver->id,
        ]);

        $seasonDriver = SeasonDriverEloquent::factory()->create([
            'season_id' => $season->id,
            'league_driver_id' => $leagueDriver->id,
        ]);

        RaceResult::create([
            'race_id' => $race->id,
            'driver_id' => $seasonDriver->id,
            'division_id' => null,
            'position' => 1,
            'race_points' => 25,
            'has_fastest_lap' => false,
            'has_pole' => false,
            'dnf' => false,
            'status' => 'confirmed',
        ]);

        // Act
        $response = $this->getJson("/api/public/races/{$race->id}/results");

        // Assert
        $response->assertOk()
            ->assertJsonPath('data.results.0.driver_name', 'JD Racing');
    }
}
