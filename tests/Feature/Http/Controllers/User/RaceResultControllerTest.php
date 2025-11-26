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
            ->postJson("http://app.virtualracingleagues.localhost/api/races/{$this->race->id}/results", [
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
            ->postJson("http://app.virtualracingleagues.localhost/api/races/{$this->race->id}/results", [
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
            ->postJson("http://app.virtualracingleagues.localhost/api/races/{$this->race->id}/results", [
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
            ->getJson("http://app.virtualracingleagues.localhost/api/races/{$this->race->id}/results");

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.dnf', false)
            ->assertJsonPath('data.1.dnf', true);
    }

    public function test_can_update_race_results_dnf_status(): void
    {
        // Create initial results
        $this->actingAs($this->user)
            ->postJson("http://app.virtualracingleagues.localhost/api/races/{$this->race->id}/results", [
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
            ->postJson("http://app.virtualracingleagues.localhost/api/races/{$this->race->id}/results", [
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
            ->postJson("http://app.virtualracingleagues.localhost/api/races/{$this->race->id}/results", [
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
            ->postJson("http://app.virtualracingleagues.localhost/api/races/{$this->race->id}/results", [
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
            ->deleteJson("http://app.virtualracingleagues.localhost/api/races/{$this->race->id}/results");

        $response->assertStatus(204);

        $this->assertDatabaseMissing('race_results', [
            'race_id' => $this->race->id,
        ]);
    }
}
