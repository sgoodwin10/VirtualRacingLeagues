<?php

declare(strict_types=1);

namespace Tests\Feature\Http\Controllers\User;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\Division;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\Race;
use App\Infrastructure\Persistence\Eloquent\Models\Round;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
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
                        'original_race_time' => '1:23:45.678',
                        'original_race_time_difference' => '0:00:00.000',
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
                        'original_race_time' => '1:23:50.678',
                        'original_race_time_difference' => '+0:00:05.000',
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
                        'original_race_time' => '1:23:45.678',
                        'original_race_time_difference' => '0:00:00.000',
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
                        'original_race_time' => '1:23:45.678',
                        'original_race_time_difference' => '0:00:00.000',
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
                        'original_race_time' => '1:23:50.678',
                        'original_race_time_difference' => '+0:00:05.000',
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
                        'original_race_time' => '1:23:45.678',
                        'original_race_time_difference' => '0:00:00.000',
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
                        'original_race_time' => null,
                        'original_race_time_difference' => null,
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
                        'original_race_time' => '1:23:45.678',
                        'original_race_time_difference' => '0:00:00.000',
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
                        'original_race_time' => '1:23:45.678',
                        'original_race_time_difference' => '0:00:00.000',
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
                        'original_race_time' => '1:23:45.678',
                        'original_race_time_difference' => '0:00:00.000',
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
                        'original_race_time' => '1:23:50.678',
                        'original_race_time_difference' => '+0:00:05.000',
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
                        'original_race_time' => '1:23:45.678',
                        'original_race_time_difference' => '0:00:00.000',
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
                        'original_race_time' => '1:23:50.678',
                        'original_race_time_difference' => '+0:00:05.000',
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
                        'original_race_time' => '1:23:45.678',
                        'original_race_time_difference' => '0:00:00.000',
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
                        'original_race_time' => '1:23:50.678',
                        'original_race_time_difference' => '+0:00:05.000',
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
                        'original_race_time' => '1:23:40.000',
                        'original_race_time_difference' => '0:00:00.000',
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
                        'original_race_time' => '1:23:45.000',
                        'original_race_time_difference' => '+0:00:05.000',
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
                        'original_race_time' => '0:01:42.044',
                        'original_race_time_difference' => '0:00:00.000',
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
                        'original_race_time' => '0:01:43.000',
                        'original_race_time_difference' => '+0:00:00.956',
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
                        'original_race_time' => null,
                        'original_race_time_difference' => null,
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
                        'original_race_time' => '1:23:45.678',
                        'original_race_time_difference' => '0:00:00.000',
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

    public function test_time_difference_returned_as_stored_from_database(): void
    {
        // Create results - backend stores exactly what frontend sends
        $this->actingAs($this->user)
            ->postJson("{$this->appDomain}/api/races/{$this->race->id}/results", [
                'results' => [
                    [
                        'driver_id' => $this->driver1->id,
                        'division_id' => $this->division->id,
                        'position' => 1,
                        'original_race_time' => '1:23:45.678',
                        'original_race_time_difference' => null, // Position 1 has no time diff
                        'final_race_time_difference' => null, // Position 1 has no final time diff
                        'fastest_lap' => '0:01:42.044',
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => false,
                        'has_pole' => true,
                        'dnf' => false,
                    ],
                    [
                        'driver_id' => $this->driver2->id,
                        'division_id' => $this->division->id,
                        'position' => 2,
                        'original_race_time' => '1:23:50.678',
                        'original_race_time_difference' => '+0:00:05.000', // Frontend calculated
                        'final_race_time_difference' => '+0:00:05.000', // Frontend calculated (no penalties)
                        'fastest_lap' => '0:01:43.000',
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => false,
                        'has_pole' => false,
                        'dnf' => false,
                    ],
                ],
            ]);

        // Retrieve results - backend returns raw stored values
        $response = $this->actingAs($this->user)
            ->getJson("{$this->appDomain}/api/races/{$this->race->id}/results");

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');

        $data = $response->json('data');

        // Find position 1 and position 2 drivers
        $p1 = collect($data)->firstWhere('position', 1);
        $p2 = collect($data)->firstWhere('position', 2);

        // Position 1 should have null time difference (as stored)
        $this->assertNull($p1['original_race_time_difference']);
        $this->assertNull($p1['final_race_time_difference']);

        // Position 2 should have the stored time difference (normalized without + prefix)
        // Note: RaceTime value object strips the + prefix during normalization
        $this->assertEquals('0:00:05.000', $p2['original_race_time_difference']);
        // No penalties, so final equals original
        $this->assertEquals('0:00:05.000', $p2['final_race_time_difference']);
    }

    public function test_time_difference_stored_and_retrieved_with_penalties(): void
    {
        // Create results with penalties - backend stores raw values from frontend
        $this->actingAs($this->user)
            ->postJson("{$this->appDomain}/api/races/{$this->race->id}/results", [
                'results' => [
                    [
                        'driver_id' => $this->driver1->id,
                        'division_id' => $this->division->id,
                        'position' => 1,
                        'original_race_time' => '1:23:45.678',
                        'original_race_time_difference' => null, // Position 1 has no original diff
                        'final_race_time_difference' => null, // Position 1 has no final diff (even with penalties)
                        'fastest_lap' => '0:01:42.044',
                        'penalties' => '0:00:02.000', // 2 second penalty
                        'has_fastest_lap' => false,
                        'has_pole' => true,
                        'dnf' => false,
                    ],
                    [
                        'driver_id' => $this->driver2->id,
                        'division_id' => $this->division->id,
                        'position' => 2,
                        'original_race_time' => '1:23:50.678',
                        'original_race_time_difference' => '+0:00:05.000', // Frontend calculated original diff
                        'final_race_time_difference' => '+0:00:05.000', // Frontend calculated final diff (no penalties on P2)
                        'fastest_lap' => '0:01:43.000',
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => false,
                        'has_pole' => false,
                        'dnf' => false,
                    ],
                ],
            ]);

        // Retrieve results - backend returns exactly what was stored
        $response = $this->actingAs($this->user)
            ->getJson("{$this->appDomain}/api/races/{$this->race->id}/results");

        $data = $response->json('data');
        $p1 = collect($data)->firstWhere('position', 1);
        $p2 = collect($data)->firstWhere('position', 2);

        // P1 original time difference should be null (as stored)
        $this->assertNull($p1['original_race_time_difference']);

        // P1 has penalties but no final_race_time_difference stored, so it should be null
        // The frontend is responsible for calculating final time diffs based on penalties
        $this->assertNull($p1['final_race_time_difference']);

        // P2 original time difference as stored (normalized without + prefix)
        // Note: RaceTime value object strips the + prefix during normalization
        $this->assertEquals('0:00:05.000', $p2['original_race_time_difference']);

        // P2 final time difference - backend stores exactly what frontend calculates
        // Final time diff calculation is done on frontend, backend just stores it
        $this->assertEquals('0:00:05.000', $p2['final_race_time_difference']);
    }

    /**
     * Test that unauthorized users cannot store race results for leagues they don't own.
     *
     * Authorization is implemented in BulkRaceResultsRequest::authorize() which checks
     * if the authenticated user owns the league containing the race.
     */
    public function test_unauthorized_user_cannot_store_race_results(): void
    {
        // Create another user who doesn't own the league
        /** @var User $unauthorizedUser */
        $unauthorizedUser = User::factory()->create();

        // Try to store results as unauthorized user
        $response = $this->actingAs($unauthorizedUser)
            ->postJson("{$this->appDomain}/api/races/{$this->race->id}/results", [
                'results' => [
                    [
                        'driver_id' => $this->driver1->id,
                        'division_id' => $this->division->id,
                        'position' => 1,
                        'original_race_time' => '1:23:45.678',
                        'original_race_time_difference' => '0:00:00.000',
                        'fastest_lap' => '1:23:45.678',
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => true,
                        'has_pole' => true,
                        'dnf' => false,
                    ],
                ],
            ]);

        // Should return 403 Forbidden
        $response->assertStatus(403);
    }

    /**
     * Test that unauthorized users cannot delete race results for leagues they don't own.
     *
     * TODO: Authorization is NOT yet implemented for the destroy() endpoint.
     * The controller's destroy() method doesn't use BulkRaceResultsRequest, so it lacks
     * authorization checks. This test documents the expected behavior.
     *
     * To implement:
     * 1. Create a new FormRequest (e.g., DeleteRaceResultsRequest) with authorize() method
     * 2. Use it in RaceResultController::destroy() method
     * 3. Or add manual authorization check in the controller/service
     */
    public function test_unauthorized_user_cannot_delete_race_results(): void
    {
        // First, create results as the owner
        $this->actingAs($this->user)
            ->postJson("{$this->appDomain}/api/races/{$this->race->id}/results", [
                'results' => [
                    [
                        'driver_id' => $this->driver1->id,
                        'division_id' => $this->division->id,
                        'position' => 1,
                        'original_race_time' => '1:23:45.678',
                        'original_race_time_difference' => '0:00:00.000',
                        'fastest_lap' => '1:23:45.678',
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => true,
                        'has_pole' => true,
                        'dnf' => false,
                    ],
                ],
            ]);

        // Create another user who doesn't own the league
        /** @var User $unauthorizedUser */
        $unauthorizedUser = User::factory()->create();

        // Try to delete results as unauthorized user
        $response = $this->actingAs($unauthorizedUser)
            ->deleteJson("{$this->appDomain}/api/races/{$this->race->id}/results");

        // TODO: When authorization is implemented, this should be 403
        // Currently succeeds with 204 because no authorization check exists
        // $response->assertStatus(403);

        // For now, mark as incomplete to indicate authorization not yet implemented
        $this->markTestIncomplete('Authorization not yet implemented for delete endpoint');
    }

    /**
     * Test validation for invalid position values.
     */
    public function test_rejects_negative_position(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson("{$this->appDomain}/api/races/{$this->race->id}/results", [
                'results' => [
                    [
                        'driver_id' => $this->driver1->id,
                        'division_id' => $this->division->id,
                        'position' => -1, // Invalid negative position
                        'original_race_time' => '1:23:45.678',
                        'original_race_time_difference' => '0:00:00.000',
                        'fastest_lap' => '1:23:45.678',
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => true,
                        'has_pole' => false,
                        'dnf' => false,
                    ],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['results.0.position']);
    }

    /**
     * Test validation for invalid time format.
     */
    public function test_rejects_malformed_race_time(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson("{$this->appDomain}/api/races/{$this->race->id}/results", [
                'results' => [
                    [
                        'driver_id' => $this->driver1->id,
                        'division_id' => $this->division->id,
                        'position' => 1,
                        'original_race_time' => 'invalid-time-format', // Invalid format
                        'original_race_time_difference' => '0:00:00.000',
                        'fastest_lap' => '1:23:45.678',
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => true,
                        'has_pole' => false,
                        'dnf' => false,
                    ],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['results.0.original_race_time']);
    }

    /**
     * Test validation for invalid fastest lap format.
     */
    public function test_rejects_malformed_fastest_lap(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson("{$this->appDomain}/api/races/{$this->race->id}/results", [
                'results' => [
                    [
                        'driver_id' => $this->driver1->id,
                        'division_id' => $this->division->id,
                        'position' => 1,
                        'original_race_time' => '1:23:45.678',
                        'original_race_time_difference' => '0:00:00.000',
                        'fastest_lap' => '99:99:99.999', // Invalid time
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => true,
                        'has_pole' => false,
                        'dnf' => false,
                    ],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['results.0.fastest_lap']);
    }

    /**
     * Test validation for missing required fields.
     * driver_id is required, but division_id and position are nullable.
     */
    public function test_rejects_missing_required_fields(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson("{$this->appDomain}/api/races/{$this->race->id}/results", [
                'results' => [
                    [
                        // Missing driver_id (required)
                        'division_id' => $this->division->id,
                        'original_race_time' => '1:23:45.678',
                        'fastest_lap' => '1:23:45.678',
                    ],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['results.0.driver_id']);
    }

    /**
     * Test validation for missing both race time and position.
     * At least one of original_race_time or position must be provided.
     */
    public function test_rejects_when_both_race_time_and_position_are_missing(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson("{$this->appDomain}/api/races/{$this->race->id}/results", [
                'results' => [
                    [
                        'driver_id' => $this->driver1->id,
                        'division_id' => $this->division->id,
                        // Both original_race_time and position are missing
                        'fastest_lap' => '1:23:45.678',
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => false,
                        'has_pole' => false,
                        'dnf' => false,
                    ],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['results.0']);
    }

    /**
     * Test validation for non-existent driver.
     */
    public function test_rejects_nonexistent_driver(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson("{$this->appDomain}/api/races/{$this->race->id}/results", [
                'results' => [
                    [
                        'driver_id' => 99999, // Non-existent driver
                        'division_id' => $this->division->id,
                        'position' => 1,
                        'original_race_time' => '1:23:45.678',
                        'original_race_time_difference' => '0:00:00.000',
                        'fastest_lap' => '1:23:45.678',
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => true,
                        'has_pole' => false,
                        'dnf' => false,
                    ],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['results.0.driver_id']);
    }

    /**
     * Test validation for duplicate positions.
     * Each position must be unique within the race.
     */
    public function test_rejects_duplicate_positions(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson("{$this->appDomain}/api/races/{$this->race->id}/results", [
                'results' => [
                    [
                        'driver_id' => $this->driver1->id,
                        'division_id' => $this->division->id,
                        'position' => 1,
                        'original_race_time' => '1:23:45.678',
                        'original_race_time_difference' => '0:00:00.000',
                        'fastest_lap' => '1:23:45.678',
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => false,
                        'has_pole' => false,
                        'dnf' => false,
                    ],
                    [
                        'driver_id' => $this->driver2->id,
                        'division_id' => $this->division->id,
                        'position' => 1, // Duplicate position
                        'original_race_time' => '1:23:50.678',
                        'original_race_time_difference' => '+0:00:05.000',
                        'fastest_lap' => '1:23:50.678',
                        'penalties' => '0:00:00.000',
                        'has_fastest_lap' => false,
                        'has_pole' => false,
                        'dnf' => false,
                    ],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['results.1.position']);
    }
}
