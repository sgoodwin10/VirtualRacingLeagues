<?php

declare(strict_types=1);

namespace Tests\Feature\User;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\Race;
use App\Infrastructure\Persistence\Eloquent\Models\Round;
use App\Infrastructure\Persistence\Eloquent\Models\Season;
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
        $league = League::factory()->create(['user_id' => $this->user->id]);
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
            'race_divisions' => false,
            'points_system' => [1 => 25, 2 => 18, 3 => 15, 4 => 12, 5 => 10],
            'bonus_points' => ['fastest_lap' => 1, 'pole' => 1],
            'dnf_points' => 0,
            'dns_points' => 0,
            'race_notes' => 'Championship round',
        ];

        $response = $this->actingAs($this->user)
            ->postJson("/api/rounds/{$this->round->id}/races", $data);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'status',
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
            ->getJson("/api/rounds/{$this->round->id}/races");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
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
            ->getJson("/api/races/{$race->id}");

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'id' => $race->id,
                    'name' => 'Sprint Race',
                ],
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
            ->putJson("/api/races/{$race->id}", $updateData);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'id' => $race->id,
                    'name' => 'Updated Race Name',
                    'race_type' => 'feature',
                    'length_value' => 60,
                ],
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
            ->deleteJson("/api/races/{$race->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('races', [
            'id' => $race->id,
        ]);
    }

    public function test_cannot_create_race_with_invalid_data(): void
    {
        $data = [
            'race_number' => 0, // Invalid: must be at least 1
            'qualifying_format' => 'invalid_format',
            'grid_source' => 'invalid_source',
            'length_type' => 'invalid_type',
        ];

        $response = $this->actingAs($this->user)
            ->postJson("/api/rounds/{$this->round->id}/races", $data);

        $response->assertStatus(422);
    }

    public function test_unauthenticated_user_cannot_access_races(): void
    {
        $response = $this->getJson("/api/rounds/{$this->round->id}/races");

        $response->assertStatus(401);
    }

    public function test_returns_404_for_nonexistent_race(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/races/99999');

        $response->assertStatus(404);
    }
}
