<?php

declare(strict_types=1);

namespace Tests\Feature\User;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\Race;
use App\Infrastructure\Persistence\Eloquent\Models\Round;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent as Season;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class RaceApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Round $round;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $league = League::factory()->create(['owner_user_id' => $this->user->id]);
        $competition = Competition::factory()->create(['league_id' => $league->id]);
        $season = Season::factory()->create(['competition_id' => $competition->id]);
        $this->round = Round::factory()->create(['season_id' => $season->id]);
    }

    public function test_can_create_race(): void
    {
        $data = [
            'race_number' => 1,
            'name' => 'Monaco Grand Prix',
            'race_type' => 'feature',
            'qualifying_format' => 'standard',
            'qualifying_length' => 15,
            'qualifying_tire' => 'soft',
            'grid_source' => 'qualifying',
            'grid_source_race_id' => null,
            'length_type' => 'laps',
            'length_value' => 50,
            'extra_lap_after_time' => false,
            'weather' => 'clear',
            'tire_restrictions' => 'multiple_required',
            'fuel_usage' => 'limited',
            'damage_model' => 'full',
            'track_limits_enforced' => true,
            'false_start_detection' => true,
            'collision_penalties' => true,
            'mandatory_pit_stop' => true,
            'minimum_pit_time' => 60,
            'assists_restrictions' => 'none',
            'points_system' => [1 => 25, 2 => 18, 3 => 15, 4 => 12, 5 => 10],
            'bonus_points' => ['fastest_lap' => 1, 'pole' => 1],
            'dnf_points' => 0,
            'dns_points' => 0,
            'race_notes' => 'Championship round',
        ];

        $response = $this->actingAs($this->user)
            ->postJson("http://app.virtualracingleagues.localhost/api/rounds/{$this->round->id}/races", $data);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'round_id',
                    'race_number',
                    'name',
                    'race_type',
                    'qualifying_format',
                    'grid_source',
                    'length_type',
                    'points_system',
                    'created_at',
                    'updated_at',
                ],
            ]);

        $this->assertDatabaseHas('races', [
            'round_id' => $this->round->id,
            'race_number' => 1,
            'name' => 'Monaco Grand Prix',
            'race_type' => 'feature',
        ]);
    }

    public function test_can_list_races_for_round(): void
    {
        Race::factory()->count(3)->create(['round_id' => $this->round->id]);

        $response = $this->actingAs($this->user)
            ->getJson("http://app.virtualracingleagues.localhost/api/rounds/{$this->round->id}/races");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'round_id',
                        'race_number',
                        'name',
                        'race_type',
                    ],
                ],
            ])
            ->assertJsonCount(3, 'data');
    }

    public function test_can_show_race(): void
    {
        $race = Race::factory()->create([
            'round_id' => $this->round->id,
            'name' => 'Sprint Race',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("http://app.virtualracingleagues.localhost/api/races/{$race->id}");

        $response->assertStatus(200)
            ->assertJsonFragment([
                'id' => $race->id,
                'name' => 'Sprint Race',
            ]);
    }

    public function test_can_update_race(): void
    {
        $race = Race::factory()->create([
            'round_id' => $this->round->id,
            'name' => 'Original Name',
            'race_type' => 'sprint',
        ]);

        $updateData = [
            'name' => 'Updated Race Name',
            'race_type' => 'feature',
            'length_value' => 60,
        ];

        $response = $this->actingAs($this->user)
            ->putJson("http://app.virtualracingleagues.localhost/api/races/{$race->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'id' => $race->id,
                'name' => 'Updated Race Name',
                'race_type' => 'feature',
                'length_value' => 60,
            ]);

        $this->assertDatabaseHas('races', [
            'id' => $race->id,
            'name' => 'Updated Race Name',
            'race_type' => 'feature',
        ]);
    }

    public function test_can_delete_race(): void
    {
        $race = Race::factory()->create(['round_id' => $this->round->id]);

        $response = $this->actingAs($this->user)
            ->deleteJson("http://app.virtualracingleagues.localhost/api/races/{$race->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('races', [
            'id' => $race->id,
        ]);
    }

    public function test_can_create_qualifier_via_race_endpoint_with_race_number_zero(): void
    {
        // race_number=0 is valid and indicates a qualifying race
        // The validation allows Min(0), so 0 is accepted
        $data = [
            'race_number' => 0, // 0 is valid for qualifying races
            'name' => 'Qualifying Session',
            'race_type' => null,
            'qualifying_format' => 'standard',
            'qualifying_length' => 20,
            'qualifying_tire' => 'soft',
            'grid_source' => 'qualifying',
            'grid_source_race_id' => null,
            'length_type' => 'time',
            'length_value' => 20,
            'extra_lap_after_time' => false,
            'weather' => 'clear',
            'tire_restrictions' => null,
            'fuel_usage' => null,
            'damage_model' => 'full',
            'track_limits_enforced' => true,
            'false_start_detection' => true,
            'collision_penalties' => true,
            'mandatory_pit_stop' => false,
            'minimum_pit_time' => null,
            'assists_restrictions' => null,
            'points_system' => [1 => 0],
            'bonus_points' => ['pole' => 1],
            'dnf_points' => 0,
            'dns_points' => 0,
            'race_notes' => 'Qualifying session',
        ];

        $response = $this->actingAs($this->user)
            ->postJson("http://app.virtualracingleagues.localhost/api/rounds/{$this->round->id}/races", $data);

        // race_number=0 is valid (Min(0) validation) - creates a qualifier race
        $response->assertStatus(201);

        $this->assertDatabaseHas('races', [
            'round_id' => $this->round->id,
            'is_qualifier' => true,
        ]);
    }

    public function test_cannot_create_qualifier_with_none_qualifying_format(): void
    {
        $data = [
            'race_number' => 0, // 0 indicates this is a qualifier
            'name' => 'Invalid Qualifying',
            'qualifying_format' => 'none', // Invalid for qualifiers
            'qualifying_length' => 20,
            'qualifying_tire' => null,
            'grid_source' => 'qualifying',
            'grid_source_race_id' => null,
            'length_type' => 'time',
            'length_value' => 20,
            'extra_lap_after_time' => false,
            'weather' => null,
            'tire_restrictions' => null,
            'fuel_usage' => null,
            'damage_model' => null,
            'track_limits_enforced' => true,
            'false_start_detection' => true,
            'collision_penalties' => true,
            'mandatory_pit_stop' => false,
            'minimum_pit_time' => null,
            'assists_restrictions' => null,
            'points_system' => [1 => 0],
            'bonus_points' => null,
            'dnf_points' => 0,
            'dns_points' => 0,
            'race_notes' => null,
        ];

        $response = $this->actingAs($this->user)
            ->postJson("http://app.virtualracingleagues.localhost/api/rounds/{$this->round->id}/races", $data);

        $response->assertStatus(422);
    }

    public function test_cannot_create_race_with_invalid_data(): void
    {
        $data = [
            'race_number' => -1, // Invalid: must be at least 0
            'qualifying_format' => 'invalid_format',
            'grid_source' => 'invalid_source',
            'length_type' => 'invalid_type',
        ];

        $response = $this->actingAs($this->user)
            ->postJson("http://app.virtualracingleagues.localhost/api/rounds/{$this->round->id}/races", $data);

        $response->assertStatus(422);
    }

    public function test_unauthenticated_user_cannot_access_races(): void
    {
        $response = $this->getJson("http://app.virtualracingleagues.localhost/api/rounds/{$this->round->id}/races");

        $response->assertStatus(401);
    }

    public function test_returns_404_for_nonexistent_race(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('http://app.virtualracingleagues.localhost/api/races/99999');

        $response->assertStatus(404);
    }

    public function test_can_create_non_qualifying_race_without_length_value(): void
    {
        $data = [
            'race_number' => 1,
            'name' => 'Feature Race',
            'race_type' => 'feature',
            'qualifying_format' => 'standard',
            'qualifying_length' => 15,
            'grid_source' => 'qualifying',
            'length_type' => 'laps',
            // length_value is missing - should succeed as it's now optional
            'points_system' => [1 => 25, 2 => 18, 3 => 15],
            'dnf_points' => 0,
            'dns_points' => 0,
        ];

        $response = $this->actingAs($this->user)
            ->postJson("http://app.virtualracingleagues.localhost/api/rounds/{$this->round->id}/races", $data);

        $response->assertStatus(201);
    }

    public function test_can_create_qualifying_race_without_length_value(): void
    {
        $data = [
            'race_number' => 0,
            'name' => 'Qualifying Session',
            'race_type' => 'qualifying',
            'qualifying_format' => 'standard',
            'qualifying_length' => 20,
            'grid_source' => 'qualifying',
            'length_type' => 'time',
            // length_value is missing - should succeed as it's optional
            'points_system' => [1 => 0],
            'dnf_points' => 0,
            'dns_points' => 0,
        ];

        $response = $this->actingAs($this->user)
            ->postJson("http://app.virtualracingleagues.localhost/api/rounds/{$this->round->id}/races", $data);

        $response->assertStatus(201);
    }

    public function test_can_create_qualifying_race_without_qualifying_length(): void
    {
        $data = [
            'race_number' => 0,
            'name' => 'Qualifying Session',
            'race_type' => 'qualifying',
            'qualifying_format' => 'standard',
            // qualifying_length is missing - should succeed as it's optional
            'grid_source' => 'qualifying',
            'length_type' => 'time',
            'points_system' => [1 => 0],
            'dnf_points' => 0,
            'dns_points' => 0,
        ];

        $response = $this->actingAs($this->user)
            ->postJson("http://app.virtualracingleagues.localhost/api/rounds/{$this->round->id}/races", $data);

        $response->assertStatus(201);
    }

    public function test_can_update_non_qualifying_race_without_length_value(): void
    {
        $race = Race::factory()->create([
            'round_id' => $this->round->id,
            'race_type' => 'feature',
            'length_value' => 50,
        ]);

        $updateData = [
            'race_type' => 'sprint',
            // Intentionally omitting length_value - should succeed as it's optional
        ];

        $response = $this->actingAs($this->user)
            ->putJson("http://app.virtualracingleagues.localhost/api/races/{$race->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'race_type' => 'sprint',
            ]);
    }

    public function test_can_update_qualifying_race_without_length_value(): void
    {
        $race = Race::factory()->create([
            'round_id' => $this->round->id,
            'race_type' => 'feature',
            'length_value' => 50,
        ]);

        $updateData = [
            'race_type' => 'qualifying',
            'name' => 'Updated Qualifying',
            // Omitting length_value - should succeed as it's optional
        ];

        $response = $this->actingAs($this->user)
            ->putJson("http://app.virtualracingleagues.localhost/api/races/{$race->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'race_type' => 'qualifying',
                'name' => 'Updated Qualifying',
            ]);
    }

    public function test_can_create_race_with_decimal_points(): void
    {
        $data = [
            'race_number' => 1,
            'name' => 'Monaco Grand Prix',
            'race_type' => 'feature',
            'qualifying_format' => 'standard',
            'qualifying_length' => 15,
            'grid_source' => 'qualifying',
            'length_type' => 'laps',
            'length_value' => 50,
            'points_system' => [
                1 => 12.5,
                2 => 10,
                3 => 8,
                4 => 6.5,
                5 => 5.5,
                6 => 5,
                7 => 4.5,
                8 => 4,
                9 => 3.5,
                10 => 3,
                11 => 1.5,
                12 => 2,
                13 => 1.5,
                14 => 1,
                15 => 0.5,
                16 => 0,
            ],
            'dnf_points' => 0.5,
            'dns_points' => 0.25,
        ];

        $response = $this->actingAs($this->user)
            ->postJson("http://app.virtualracingleagues.localhost/api/rounds/{$this->round->id}/races", $data);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'round_id',
                    'race_number',
                    'name',
                    'race_type',
                    'points_system',
                    'dnf_points',
                    'dns_points',
                ],
            ]);

        $this->assertDatabaseHas('races', [
            'round_id' => $this->round->id,
            'race_number' => 1,
            'name' => 'Monaco Grand Prix',
        ]);
    }

    public function test_rejects_points_with_more_than_two_decimal_places(): void
    {
        $data = [
            'race_number' => 1,
            'name' => 'Test Race',
            'race_type' => 'feature',
            'points_system' => [
                1 => 12.567, // Invalid: more than 2 decimal places
            ],
        ];

        $response = $this->actingAs($this->user)
            ->postJson("http://app.virtualracingleagues.localhost/api/rounds/{$this->round->id}/races", $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('points_system.1');
    }

    public function test_rejects_invalid_dnf_points_with_more_than_two_decimal_places(): void
    {
        $data = [
            'race_number' => 1,
            'name' => 'Test Race',
            'race_type' => 'feature',
            'dnf_points' => 0.999, // Invalid: more than 2 decimal places
        ];

        $response = $this->actingAs($this->user)
            ->postJson("http://app.virtualracingleagues.localhost/api/rounds/{$this->round->id}/races", $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('dnf_points');
    }

    public function test_can_update_race_with_decimal_points(): void
    {
        $race = Race::factory()->create([
            'round_id' => $this->round->id,
            'name' => 'Original Name',
            'race_type' => 'sprint',
        ]);

        $updateData = [
            'name' => 'Updated Race',
            'points_system' => [
                1 => 10.5,
                2 => 8.75,
                3 => 6.25,
            ],
            'dnf_points' => 0.5,
            'dns_points' => 0.25,
        ];

        $response = $this->actingAs($this->user)
            ->putJson("http://app.virtualracingleagues.localhost/api/races/{$race->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'id' => $race->id,
                'name' => 'Updated Race',
            ]);
    }
}
