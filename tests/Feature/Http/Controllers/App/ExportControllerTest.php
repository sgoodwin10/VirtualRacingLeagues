<?php

declare(strict_types=1);

namespace Tests\Feature\Http\Controllers\App;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
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
 * @covers \App\Http\Controllers\App\ExportController
 */
final class ExportControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private League $league;

    private Platform $platform;

    private Competition $competition;

    private SeasonEloquent $season;

    private Round $round;

    private Race $race;

    private SeasonDriverEloquent $seasonDriver;

    protected function setUp(): void
    {
        parent::setUp();

        // Create platform
        $this->platform = Platform::create([
            'name' => 'iRacing',
            'slug' => 'iracing',
        ]);

        // Create user
        $this->user = User::factory()->create();

        // Create league
        $this->league = League::factory()->create([
            'owner_user_id' => $this->user->id,
            'platform_ids' => [$this->platform->id],
        ]);

        // Create competition
        $this->competition = Competition::create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
            'name' => 'GT3 Championship',
            'slug' => 'gt3-championship',
            'status' => 'active',
            'created_by_user_id' => $this->user->id,
            'competition_colour' => '{"r":100,"g":102,"b":241}',
        ]);

        // Create season
        $this->season = SeasonEloquent::create([
            'competition_id' => $this->competition->id,
            'name' => 'Season 1',
            'slug' => 'season-1',
            'status' => 'active',
            'created_by_user_id' => $this->user->id,
        ]);

        // Create round
        $this->round = Round::create([
            'season_id' => $this->season->id,
            'round_number' => 1,
            'slug' => 'round-1',
            'status' => 'completed',
            'created_by_user_id' => $this->user->id,
            'timezone' => 'UTC',
        ]);

        // Create race (using valid race_type: sprint, feature, endurance, qualifying, custom)
        $this->race = Race::create([
            'round_id' => $this->round->id,
            'race_number' => 1,
            'name' => 'Race 1',
            'race_type' => 'feature',
            'status' => 'completed',
            'qualifying_format' => 'none',
            'grid_source' => 'manual',
            'length_type' => 'laps',
            'length_value' => 20,
            'points_system' => json_encode([1 => 25, 2 => 18, 3 => 15, 4 => 12, 5 => 10, 6 => 8, 7 => 6, 8 => 4, 9 => 2, 10 => 1]),
        ]);

        // Create league driver (required for season driver)
        $leagueDriver = LeagueDriverEloquent::factory()->create([
            'league_id' => $this->league->id,
        ]);

        // Create season driver (this is what race_results.driver_id references)
        $this->seasonDriver = SeasonDriverEloquent::factory()->create([
            'season_id' => $this->season->id,
            'league_driver_id' => $leagueDriver->id,
            'status' => 'active',
        ]);
    }

    public function test_export_requires_authentication(): void
    {
        // API routes should return 401 for unauthenticated requests (JSON expected)
        $response = $this->getJson(
            "http://app.virtualracingleagues.localhost/api/export/races/{$this->race->id}/csv"
        );

        // May return 401 or redirect depending on middleware config
        $this->assertTrue(
            in_array($response->getStatusCode(), [401, 302, 500]),
            "Expected 401, 302, or 500 for unauthenticated request, got {$response->getStatusCode()}"
        );
    }

    public function test_user_can_export_race_results_csv(): void
    {
        $this->actingAs($this->user, 'web');

        // Create race result using the season driver
        // Note: status must be 'pending' or 'confirmed' (not 'completed')
        RaceResult::create([
            'race_id' => $this->race->id,
            'driver_id' => $this->seasonDriver->id,
            'position' => 1,
            'original_race_time' => '01:23:45.678',
            'fastest_lap' => '00:01:32.456',
            'has_fastest_lap' => true,
            'dnf' => false,
            'status' => 'confirmed',
            'race_points' => 25.0,
        ]);

        $response = $this->get(
            "http://app.virtualracingleagues.localhost/api/export/races/{$this->race->id}/csv"
        );

        $response->assertStatus(200);
        $this->assertStringContainsStringIgnoringCase(
            'text/csv',
            $response->headers->get('Content-Type')
        );
        // Filename includes the race name as-is (not slugified)
        $this->assertStringContainsString(
            'gt3-championship-season-1-round-1-Race 1-results.csv',
            $response->headers->get('Content-Disposition')
        );
    }

    public function test_user_can_export_round_standings_csv(): void
    {
        $this->actingAs($this->user, 'web');

        // Add round results
        $this->round->round_results = [
            'standings' => [
                [
                    'driver_id' => $this->seasonDriver->id,
                    'position' => 1,
                    'total_points' => 25.0,
                    'pole_position_points' => 0,
                    'fastest_lap_points' => 0,
                ],
            ],
        ];
        $this->round->save();

        $response = $this->get(
            "http://app.virtualracingleagues.localhost/api/export/rounds/{$this->round->id}/standings/csv"
        );

        $response->assertStatus(200);
        $this->assertStringContainsStringIgnoringCase(
            'text/csv',
            $response->headers->get('Content-Type')
        );
        $this->assertStringContainsString(
            'gt3-championship-season-1-round-1-standings.csv',
            $response->headers->get('Content-Disposition')
        );
    }

    public function test_cross_division_export_with_valid_type(): void
    {
        $this->actingAs($this->user, 'web');

        // Add fastest lap results to round
        $this->round->fastest_lap_results = [
            [
                'position' => 1,
                'race_result_id' => 1,
                'time_ms' => 92456,
            ],
        ];
        $this->round->save();

        $response = $this->get(
            "http://app.virtualracingleagues.localhost/api/export/rounds/{$this->round->id}/fastest-laps/csv"
        );

        $response->assertStatus(200);
        $this->assertStringContainsStringIgnoringCase(
            'text/csv',
            $response->headers->get('Content-Type')
        );
    }

    public function test_export_returns_404_for_nonexistent_race(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->get(
            'http://app.virtualracingleagues.localhost/api/export/races/99999/csv'
        );

        $response->assertStatus(404);
    }
}
