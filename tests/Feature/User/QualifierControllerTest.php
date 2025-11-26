<?php

declare(strict_types=1);

namespace Tests\Feature\User;

use App\Infrastructure\Persistence\Eloquent\Models\Round;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class QualifierControllerTest extends TestCase
{
    use RefreshDatabase;

    private const APP_URL = 'http://app.virtualracingleagues.localhost';

    private User $user;
    private Round $round;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->round = \Database\Factories\RoundFactory::new()->create();
    }

    public function test_creates_qualifier(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'Qualifying Session',
                'qualifying_format' => 'standard',
                'qualifying_length' => 20,
                'qualifying_tire' => 'soft',
                'weather' => 'clear',
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'bonus_points' => ['pole' => 1],
                'race_notes' => null,
            ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'round_id',
                'name',
                'qualifying_format',
                'qualifying_length',
                'bonus_points',
            ],
        ]);

        $this->assertDatabaseHas('races', [
            'round_id' => $this->round->id,
            'is_qualifier' => true,
            'race_number' => null,
            'name' => 'Qualifying Session',
        ]);
    }

    public function test_prevents_duplicate_qualifiers(): void
    {
        // Create first qualifier
        $this->actingAs($this->user)
            ->postJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'Qualifying 1',
                'qualifying_format' => 'standard',
                'qualifying_length' => 15,
                'qualifying_tire' => null,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'bonus_points' => null,
                'race_notes' => null,
            ]);

        // Attempt to create second qualifier
        $response = $this->actingAs($this->user)
            ->postJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'Qualifying 2',
                'qualifying_format' => 'standard',
                'qualifying_length' => 15,
                'qualifying_tire' => null,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'bonus_points' => null,
                'race_notes' => null,
            ]);

        $response->assertStatus(422);
        $response->assertJson([
            'message' => "A qualifier already exists for round {$this->round->id}. Only one qualifier is allowed per round.",
        ]);
    }

    public function test_validates_bonus_points(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'Invalid Qualifier',
                'qualifying_format' => 'standard',
                'qualifying_length' => 15,
                'qualifying_tire' => null,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'bonus_points' => ['pole' => 1, 'fastest_lap' => 1],
                'race_notes' => null,
            ]);

        $response->assertStatus(422);
    }

    public function test_retrieves_qualifier_by_round(): void
    {
        // Create qualifier
        $createResponse = $this->actingAs($this->user)
            ->postJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'Test Qualifying',
                'qualifying_format' => 'standard',
                'qualifying_length' => 15,
                'qualifying_tire' => null,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'bonus_points' => null,
                'race_notes' => null,
            ]);

        // Retrieve qualifier
        $response = $this->actingAs($this->user)
            ->getJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier");

        $response->assertStatus(200);
        $response->assertJson([
            'data' => [
                'round_id' => $this->round->id,
                'name' => 'Test Qualifying',
            ],
        ]);
    }

    public function test_returns_null_when_no_qualifier_exists(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier");

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);
    }

    public function test_updates_qualifier(): void
    {
        // Create qualifier
        $createResponse = $this->actingAs($this->user)
            ->postJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'Original',
                'qualifying_format' => 'standard',
                'qualifying_length' => 15,
                'qualifying_tire' => null,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'bonus_points' => null,
                'race_notes' => null,
            ]);

        $qualifierId = $createResponse->json('data.id');

        // Update qualifier
        $response = $this->actingAs($this->user)
            ->putJson(self::APP_URL . "/api/qualifiers/{$qualifierId}", [
                'name' => 'Updated',
                'qualifying_length' => 20,
            ]);

        $response->assertStatus(200);
        $response->assertJson([
            'data' => [
                'name' => 'Updated',
                'qualifying_length' => 20,
            ],
        ]);
    }

    public function test_deletes_qualifier(): void
    {
        // Create qualifier
        $createResponse = $this->actingAs($this->user)
            ->postJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'To Delete',
                'qualifying_format' => 'standard',
                'qualifying_length' => 15,
                'qualifying_tire' => null,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'bonus_points' => null,
                'race_notes' => null,
            ]);

        $qualifierId = $createResponse->json('data.id');

        // Delete qualifier
        $response = $this->actingAs($this->user)
            ->deleteJson(self::APP_URL . "/api/qualifiers/{$qualifierId}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('races', ['id' => $qualifierId]);
    }

    public function test_requires_authentication(): void
    {
        $response = $this->postJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier", [
            'name' => 'Test',
            'qualifying_format' => 'standard',
            'qualifying_length' => 15,
            'qualifying_tire' => null,
            'weather' => null,
            'tire_restrictions' => null,
            'fuel_usage' => null,
            'damage_model' => null,
            'track_limits_enforced' => true,
            'false_start_detection' => true,
            'collision_penalties' => true,
            'assists_restrictions' => null,
            'bonus_points' => null,
            'race_notes' => null,
        ]);

        $response->assertStatus(401);
    }

    public function test_validates_required_fields(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier", [
                // Missing required fields
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors([
            'qualifying_format',
            'qualifying_length',
            'track_limits_enforced',
            'false_start_detection',
            'collision_penalties',
        ]);
    }
}
