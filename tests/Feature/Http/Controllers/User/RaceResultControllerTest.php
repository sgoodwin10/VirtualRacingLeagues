<?php

declare(strict_types=1);

namespace Tests\Feature\Http\Controllers\User;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\Division;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\Race;
use App\Infrastructure\Persistence\Eloquent\Models\Round;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RaceResultControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private League $league;
    private Competition $competition;
    private SeasonEloquent $season;
    private Division $division;
    private Round $round;
    private Race $race;
    private SeasonDriverEloquent $driver1;
    private SeasonDriverEloquent $driver2;

    protected string $appDomain = 'http://app.virtualracingleagues.localhost';

    protected function setUp(): void
    {
        parent::setUp();

        // Create user
        /** @var User $user */
        $user = User::factory()->create();
        $this->user = $user;

        // Create league
        /** @var League $league */
        $league = League::factory()->create([
            'owner_user_id' => $this->user->id,
        ]);
        $this->league = $league;

        // Create competition
        /** @var Competition $competition */
        $competition = Competition::factory()->create([
            'league_id' => $this->league->id,
        ]);
        $this->competition = $competition;

        // Create season
        /** @var SeasonEloquent $season */
        $season = SeasonEloquent::factory()->create([
            'competition_id' => $this->competition->id,
        ]);
        $this->season = $season;

        // Create division
        /** @var Division $division */
        $division = Division::factory()->create([
            'season_id' => $this->season->id,
        ]);
        $this->division = $division;

        // Create drivers
        /** @var SeasonDriverEloquent $driver1 */
        $driver1 = SeasonDriverEloquent::factory()->create([
            'season_id' => $this->season->id,
        ]);
        $this->driver1 = $driver1;

        /** @var SeasonDriverEloquent $driver2 */
        $driver2 = SeasonDriverEloquent::factory()->create([
            'season_id' => $this->season->id,
        ]);
        $this->driver2 = $driver2;

        // Create round
        /** @var Round $round */
        $round = Round::factory()->create([
            'season_id' => $this->season->id,
        ]);
        $this->round = $round;

        // Create race
        /** @var Race $race */
        $race = Race::factory()->create([
            'round_id' => $this->round->id,
        ]);
        $this->race = $race;
    }

    public function test_can_store_race_results_with_dnf(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson("{$this->appDomain}/api/races/{$this->race->id}/results", [
                'results' => [
                    [
                        'driver_id' => $this->driver1->id,
                        'division_id' => $this->division->id,
                        'position' => 1,
                        'race_time' => '1:23:45.678',
                        'race_time_difference' => '0:00:00.000',
                        'fastest_lap' => '1:23:45.678',
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => true,
                        'has_pole' => true,
                        'dnf' => false,
                    ],
                    [
                        'driver_id' => $this->driver2->id,
                        'division_id' => $this->division->id,
                        'position' => 2,
                        'race_time' => '1:23:50.678',
                        'race_time_difference' => '+0:00:05.000',
                        'fastest_lap' => '1:23:46.678',
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => false,
                        'has_pole' => false,
                        'dnf' => true,
                    ],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.dnf', false)
            ->assertJsonPath('data.1.dnf', true);

        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver1->id,
            'dnf' => false,
        ]);

        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver2->id,
            'dnf' => true,
        ]);
    }

    public function test_dnf_defaults_to_false_when_not_provided(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson("{$this->appDomain}/api/races/{$this->race->id}/results", [
                'results' => [
                    [
                        'driver_id' => $this->driver1->id,
                        'division_id' => $this->division->id,
                        'position' => 1,
                        'race_time' => '1:23:45.678',
                        'race_time_difference' => '0:00:00.000',
                        'fastest_lap' => '1:23:45.678',
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => true,
                        'has_pole' => false,
                        // dnf not provided
                    ],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.0.dnf', false);

        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver1->id,
            'dnf' => false,
        ]);
    }

    public function test_can_retrieve_race_results_with_dnf(): void
    {
        // First, create some results
        $this->actingAs($this->user)
            ->postJson("{$this->appDomain}/api/races/{$this->race->id}/results", [
                'results' => [
                    [
                        'driver_id' => $this->driver1->id,
                        'division_id' => $this->division->id,
                        'position' => 1,
                        'race_time' => '1:23:45.678',
                        'race_time_difference' => '0:00:00.000',
                        'fastest_lap' => '1:23:45.678',
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => true,
                        'has_pole' => false,
                        'dnf' => false,
                    ],
                    [
                        'driver_id' => $this->driver2->id,
                        'division_id' => $this->division->id,
                        'position' => 2,
                        'race_time' => '1:23:50.678',
                        'race_time_difference' => '+0:00:05.000',
                        'fastest_lap' => '1:23:46.678',
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => false,
                        'has_pole' => false,
                        'dnf' => true,
                    ],
                ],
            ]);

        // Now retrieve them
        $response = $this->actingAs($this->user)
            ->getJson("{$this->appDomain}/api/races/{$this->race->id}/results");

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.dnf', false)
            ->assertJsonPath('data.1.dnf', true);
    }

    public function test_can_update_race_results_dnf_status(): void
    {
        // Create initial results
        $this->actingAs($this->user)
            ->postJson("{$this->appDomain}/api/races/{$this->race->id}/results", [
                'results' => [
                    [
                        'driver_id' => $this->driver1->id,
                        'division_id' => $this->division->id,
                        'position' => 1,
                        'race_time' => '1:23:45.678',
                        'race_time_difference' => '0:00:00.000',
                        'fastest_lap' => '1:23:45.678',
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => true,
                        'has_pole' => false,
                        'dnf' => false,
                    ],
                ],
            ]);

        // Update with DNF
        $response = $this->actingAs($this->user)
            ->postJson("{$this->appDomain}/api/races/{$this->race->id}/results", [
                'results' => [
                    [
                        'driver_id' => $this->driver1->id,
                        'division_id' => $this->division->id,
                        'position' => null,
                        'race_time' => null,
                        'race_time_difference' => null,
                        'fastest_lap' => null,
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => false,
                        'has_pole' => false,
                        'dnf' => true,
                    ],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.0.dnf', true);

        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver1->id,
            'dnf' => true,
        ]);
    }

    public function test_dnf_field_must_be_boolean(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson("{$this->appDomain}/api/races/{$this->race->id}/results", [
                'results' => [
                    [
                        'driver_id' => $this->driver1->id,
                        'division_id' => $this->division->id,
                        'position' => 1,
                        'race_time' => '1:23:45.678',
                        'race_time_difference' => '0:00:00.000',
                        'fastest_lap' => '1:23:45.678',
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => true,
                        'has_pole' => false,
                        'dnf' => 'not-a-boolean',
                    ],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['results.0.dnf']);
    }

    public function test_can_delete_race_results(): void
    {
        // Create results
        $this->actingAs($this->user)
            ->postJson("{$this->appDomain}/api/races/{$this->race->id}/results", [
                'results' => [
                    [
                        'driver_id' => $this->driver1->id,
                        'division_id' => $this->division->id,
                        'position' => 1,
                        'race_time' => '1:23:45.678',
                        'race_time_difference' => '0:00:00.000',
                        'fastest_lap' => '1:23:45.678',
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => true,
                        'has_pole' => false,
                        'dnf' => false,
                    ],
                ],
            ]);

        // Delete them
        $response = $this->actingAs($this->user)
            ->deleteJson("{$this->appDomain}/api/races/{$this->race->id}/results");

        $response->assertStatus(204);

        $this->assertDatabaseMissing('race_results', [
            'race_id' => $this->race->id,
        ]);
    }

    public function test_backend_calculates_fastest_lap_automatically(): void
    {
        // Frontend sends has_fastest_lap = true for wrong driver
        // Backend should ignore it and calculate correctly
        $response = $this->actingAs($this->user)
            ->postJson("{$this->appDomain}/api/races/{$this->race->id}/results", [
                'results' => [
                    [
                        'driver_id' => $this->driver1->id,
                        'division_id' => $this->division->id,
                        'position' => 1,
                        'race_time' => '1:23:45.678',
                        'race_time_difference' => '0:00:00.000',
                        'fastest_lap' => '0:01:43.500', // Slower lap
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => true, // Frontend says true (WRONG)
                        'has_pole' => true,
                        'dnf' => false,
                    ],
                    [
                        'driver_id' => $this->driver2->id,
                        'division_id' => $this->division->id,
                        'position' => 2,
                        'race_time' => '1:23:50.678',
                        'race_time_difference' => '+0:00:05.000',
                        'fastest_lap' => '0:01:42.044', // Faster lap (should win)
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => false, // Frontend says false (WRONG)
                        'has_pole' => false,
                        'dnf' => false,
                    ],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.0.has_fastest_lap', false) // Driver1 should NOT have fastest
            ->assertJsonPath('data.1.has_fastest_lap', true); // Driver2 SHOULD have fastest

        // Verify in database
        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver1->id,
            'has_fastest_lap' => false,
        ]);

        $this->assertDatabaseHas('race_results', [
            'race_id' => $this->race->id,
            'driver_id' => $this->driver2->id,
            'has_fastest_lap' => true,
        ]);
    }

    public function test_fastest_lap_handles_ties(): void
    {
        // Both drivers have same fastest lap - both should be marked
        $response = $this->actingAs($this->user)
            ->postJson("{$this->appDomain}/api/races/{$this->race->id}/results", [
                'results' => [
                    [
                        'driver_id' => $this->driver1->id,
                        'division_id' => $this->division->id,
                        'position' => 1,
                        'race_time' => '1:23:45.678',
                        'race_time_difference' => '0:00:00.000',
                        'fastest_lap' => '0:01:42.044', // Same time
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => false,
                        'has_pole' => true,
                        'dnf' => false,
                    ],
                    [
                        'driver_id' => $this->driver2->id,
                        'division_id' => $this->division->id,
                        'position' => 2,
                        'race_time' => '1:23:50.678',
                        'race_time_difference' => '+0:00:05.000',
                        'fastest_lap' => '0:01:42.044', // Same time
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => false,
                        'has_pole' => false,
                        'dnf' => false,
                    ],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.0.has_fastest_lap', true) // Both should have it
            ->assertJsonPath('data.1.has_fastest_lap', true);
    }

    public function test_fastest_lap_calculated_per_division(): void
    {
        // Create second division
        /** @var Division $division2 */
        $division2 = Division::factory()->create([
            'season_id' => $this->season->id,
        ]);

        // Create drivers in different divisions
        /** @var SeasonDriverEloquent $driver3 */
        $driver3 = SeasonDriverEloquent::factory()->create([
            'season_id' => $this->season->id,
        ]);

        /** @var SeasonDriverEloquent $driver4 */
        $driver4 = SeasonDriverEloquent::factory()->create([
            'season_id' => $this->season->id,
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("{$this->appDomain}/api/races/{$this->race->id}/results", [
                'results' => [
                    // Division 1 - fastest: 1:42.044
                    [
                        'driver_id' => $this->driver1->id,
                        'division_id' => $this->division->id,
                        'position' => 1,
                        'race_time' => '1:23:45.678',
                        'race_time_difference' => '0:00:00.000',
                        'fastest_lap' => '0:01:42.044', // Fastest in division 1
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => false,
                        'has_pole' => false,
                        'dnf' => false,
                    ],
                    [
                        'driver_id' => $this->driver2->id,
                        'division_id' => $this->division->id,
                        'position' => 2,
                        'race_time' => '1:23:50.678',
                        'race_time_difference' => '+0:00:05.000',
                        'fastest_lap' => '0:01:43.000', // Slower in division 1
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => false,
                        'has_pole' => false,
                        'dnf' => false,
                    ],
                    // Division 2 - fastest: 1:41.000
                    [
                        'driver_id' => $driver3->id,
                        'division_id' => $division2->id,
                        'position' => 1,
                        'race_time' => '1:23:40.000',
                        'race_time_difference' => '0:00:00.000',
                        'fastest_lap' => '0:01:41.000', // Fastest in division 2 (and overall!)
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => false,
                        'has_pole' => false,
                        'dnf' => false,
                    ],
                    [
                        'driver_id' => $driver4->id,
                        'division_id' => $division2->id,
                        'position' => 2,
                        'race_time' => '1:23:45.000',
                        'race_time_difference' => '+0:00:05.000',
                        'fastest_lap' => '0:01:42.000', // Slower in division 2
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => false,
                        'has_pole' => false,
                        'dnf' => false,
                    ],
                ],
            ]);

        $response->assertStatus(201);

        // Driver1 should have fastest in division 1 (even though driver3 was faster overall)
        $this->assertDatabaseHas('race_results', [
            'driver_id' => $this->driver1->id,
            'division_id' => $this->division->id,
            'has_fastest_lap' => true,
        ]);

        // Driver2 should NOT have fastest in division 1
        $this->assertDatabaseHas('race_results', [
            'driver_id' => $this->driver2->id,
            'division_id' => $this->division->id,
            'has_fastest_lap' => false,
        ]);

        // Driver3 should have fastest in division 2
        $this->assertDatabaseHas('race_results', [
            'driver_id' => $driver3->id,
            'division_id' => $division2->id,
            'has_fastest_lap' => true,
        ]);

        // Driver4 should NOT have fastest in division 2
        $this->assertDatabaseHas('race_results', [
            'driver_id' => $driver4->id,
            'division_id' => $division2->id,
            'has_fastest_lap' => false,
        ]);
    }

    public function test_fastest_lap_not_calculated_for_qualifiers(): void
    {
        // Create a qualifier race
        /** @var Race $qualifier */
        $qualifier = Race::factory()->create([
            'round_id' => $this->round->id,
            'is_qualifier' => true,
            'race_number' => null,
        ]);

        // Submit results with has_fastest_lap = true
        $response = $this->actingAs($this->user)
            ->postJson("{$this->appDomain}/api/races/{$qualifier->id}/results", [
                'results' => [
                    [
                        'driver_id' => $this->driver1->id,
                        'division_id' => $this->division->id,
                        'position' => 1,
                        'race_time' => '0:01:42.044',
                        'race_time_difference' => '0:00:00.000',
                        'fastest_lap' => '0:01:42.044',
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => true, // Frontend sends true
                        'has_pole' => true,
                        'dnf' => false,
                    ],
                    [
                        'driver_id' => $this->driver2->id,
                        'division_id' => $this->division->id,
                        'position' => 2,
                        'race_time' => '0:01:43.000',
                        'race_time_difference' => '+0:00:00.956',
                        'fastest_lap' => '0:01:43.000',
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => false,
                        'has_pole' => false,
                        'dnf' => false,
                    ],
                ],
            ]);

        $response->assertStatus(201);

        // Backend should ignore and set all to false for qualifiers
        $this->assertDatabaseHas('race_results', [
            'race_id' => $qualifier->id,
            'driver_id' => $this->driver1->id,
            'has_fastest_lap' => false,
        ]);

        $this->assertDatabaseHas('race_results', [
            'race_id' => $qualifier->id,
            'driver_id' => $this->driver2->id,
            'has_fastest_lap' => false,
        ]);
    }

    public function test_fastest_lap_skips_null_times(): void
    {
        // Driver1 has DNF with no fastest lap
        // Driver2 should get fastest lap
        $response = $this->actingAs($this->user)
            ->postJson("{$this->appDomain}/api/races/{$this->race->id}/results", [
                'results' => [
                    [
                        'driver_id' => $this->driver1->id,
                        'division_id' => $this->division->id,
                        'position' => null,
                        'race_time' => null,
                        'race_time_difference' => null,
                        'fastest_lap' => null, // No time
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => false,
                        'has_pole' => false,
                        'dnf' => true,
                    ],
                    [
                        'driver_id' => $this->driver2->id,
                        'division_id' => $this->division->id,
                        'position' => 1,
                        'race_time' => '1:23:45.678',
                        'race_time_difference' => '0:00:00.000',
                        'fastest_lap' => '0:01:42.044', // Only valid time
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => false,
                        'has_pole' => false,
                        'dnf' => false,
                    ],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.0.has_fastest_lap', false) // DNF driver
            ->assertJsonPath('data.1.has_fastest_lap', true); // Should win by default
    }
}
