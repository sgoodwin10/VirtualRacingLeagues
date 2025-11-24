<?php

declare(strict_types=1);

namespace Tests\Feature\Http\Controllers\User;

use App\Infrastructure\Persistence\Eloquent\Models\Round as RoundEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Models\User;
use Database\Factories\RoundFactory;
use Database\Factories\SeasonFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class RoundControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private SeasonEloquent $season;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a user
        $this->user = User::factory()->create();

        // Create a season
        $this->season = SeasonFactory::new()->create([
            'created_by_user_id' => $this->user->id,
        ]);

        // Authenticate user
        $this->actingAs($this->user, 'web');
    }

    public function test_can_update_round_with_fastest_lap_fields(): void
    {
        // Create a round
        $round = RoundFactory::new()->create([
            'season_id' => $this->season->id,
            'created_by_user_id' => $this->user->id,
            'platform_track_id' => null, // Avoid nested factory issues
            'fastest_lap' => null,
            'fastest_lap_top_10' => false,
        ]);

        // Update the round
        $response = $this->putJson("http://app.virtualracingleagues.localhost/api/rounds/{$round->id}", [
            'fastest_lap' => 5,
            'fastest_lap_top_10' => true,
        ]);

        // Assert response
        $response->assertOk();
        $response->assertJsonPath('data.fastest_lap', 5);
        $response->assertJsonPath('data.fastest_lap_top_10', true);

        // Verify in database
        $this->assertDatabaseHas('rounds', [
            'id' => $round->id,
            'fastest_lap' => 5,
            'fastest_lap_top_10' => true,
        ]);
    }

    public function test_can_update_round_setting_fastest_lap_to_null(): void
    {
        // Create a round with fastest lap
        $round = RoundFactory::new()->create([
            'season_id' => $this->season->id,
            'created_by_user_id' => $this->user->id,
            'platform_track_id' => null, // Avoid nested factory issues
            'fastest_lap' => 5,
            'fastest_lap_top_10' => true,
        ]);

        // Update the round, setting fastest_lap to null
        $response = $this->putJson("http://app.virtualracingleagues.localhost/api/rounds/{$round->id}", [
            'fastest_lap' => null,
            'fastest_lap_top_10' => false,
        ]);

        // Assert response
        $response->assertOk();
        $response->assertJsonPath('data.fastest_lap', null);
        $response->assertJsonPath('data.fastest_lap_top_10', false);

        // Verify in database
        $this->assertDatabaseHas('rounds', [
            'id' => $round->id,
            'fastest_lap' => null,
            'fastest_lap_top_10' => false,
        ]);
    }

    public function test_can_update_round_other_fields_without_fastest_lap(): void
    {
        // Create a round
        $round = RoundFactory::new()->create([
            'season_id' => $this->season->id,
            'created_by_user_id' => $this->user->id,
            'platform_track_id' => null, // Avoid nested factory issues
            'round_number' => 5,
            'fastest_lap' => 3,
            'fastest_lap_top_10' => false,
        ]);

        // Update only the round_number (fastest_lap fields should remain unchanged)
        $response = $this->putJson("http://app.virtualracingleagues.localhost/api/rounds/{$round->id}", [
            'round_number' => 6,
        ]);

        // Assert response
        $response->assertOk();
        $response->assertJsonPath('data.round_number', 6);
        $response->assertJsonPath('data.fastest_lap', 3);
        $response->assertJsonPath('data.fastest_lap_top_10', false);

        // Verify in database
        $this->assertDatabaseHas('rounds', [
            'id' => $round->id,
            'round_number' => 6,
            'fastest_lap' => 3,
            'fastest_lap_top_10' => false,
        ]);
    }

    public function test_can_clear_optional_string_fields_by_sending_empty_string(): void
    {
        // Create a round with all string fields populated
        $round = RoundFactory::new()->create([
            'season_id' => $this->season->id,
            'created_by_user_id' => $this->user->id,
            'platform_track_id' => null, // Avoid nested factory issues
            'name' => 'Season Opener',
            'track_layout' => 'Grand Prix Circuit',
            'track_conditions' => 'Dry, Afternoon',
            'technical_notes' => 'Watch out for turn 3',
            'stream_url' => 'https://twitch.tv/example',
            'internal_notes' => 'Some internal notes',
        ]);

        // Clear all optional string fields by sending empty strings
        $response = $this->putJson("http://app.virtualracingleagues.localhost/api/rounds/{$round->id}", [
            'name' => '',
            'track_layout' => '',
            'track_conditions' => '',
            'technical_notes' => '',
            'stream_url' => '',
            'internal_notes' => '',
        ]);

        // Assert response
        $response->assertOk();
        $response->assertJsonPath('data.name', null);
        $response->assertJsonPath('data.track_layout', null);
        $response->assertJsonPath('data.track_conditions', null);
        $response->assertJsonPath('data.technical_notes', null);
        $response->assertJsonPath('data.stream_url', null);
        $response->assertJsonPath('data.internal_notes', null);

        // Verify in database that fields are actually null
        $this->assertDatabaseHas('rounds', [
            'id' => $round->id,
            'name' => null,
            'track_layout' => null,
            'track_conditions' => null,
            'technical_notes' => null,
            'stream_url' => null,
            'internal_notes' => null,
        ]);

        // Refresh the model and verify it's actually null (not empty string)
        $round->refresh();
        $this->assertNull($round->name);
        $this->assertNull($round->track_layout);
        $this->assertNull($round->track_conditions);
        $this->assertNull($round->technical_notes);
        $this->assertNull($round->stream_url);
        $this->assertNull($round->internal_notes);
    }

    public function test_can_complete_round(): void
    {
        // Create a round with 'scheduled' status
        $round = RoundFactory::new()->create([
            'season_id' => $this->season->id,
            'created_by_user_id' => $this->user->id,
            'platform_track_id' => null,
            'status' => 'scheduled',
        ]);

        // Mark the round as completed
        $response = $this->putJson("http://app.virtualracingleagues.localhost/api/rounds/{$round->id}/complete");

        // Assert response
        $response->assertOk();
        $response->assertJsonPath('data.status', 'completed');
        $response->assertJsonPath('data.status_label', 'Completed');
        $response->assertJson(['message' => 'Round marked as completed']);

        // Verify in database
        $this->assertDatabaseHas('rounds', [
            'id' => $round->id,
            'status' => 'completed',
        ]);
    }

    public function test_can_uncomplete_round(): void
    {
        // Create a round with 'completed' status
        $round = RoundFactory::new()->create([
            'season_id' => $this->season->id,
            'created_by_user_id' => $this->user->id,
            'platform_track_id' => null,
            'status' => 'completed',
        ]);

        // Mark the round as not completed
        $response = $this->putJson("http://app.virtualracingleagues.localhost/api/rounds/{$round->id}/uncomplete");

        // Assert response
        $response->assertOk();
        $response->assertJsonPath('data.status', 'scheduled');
        $response->assertJsonPath('data.status_label', 'Scheduled');
        $response->assertJson(['message' => 'Round marked as not completed']);

        // Verify in database
        $this->assertDatabaseHas('rounds', [
            'id' => $round->id,
            'status' => 'scheduled',
        ]);
    }

    public function test_completing_already_completed_round_is_idempotent(): void
    {
        // Create a round that's already completed
        $round = RoundFactory::new()->create([
            'season_id' => $this->season->id,
            'created_by_user_id' => $this->user->id,
            'platform_track_id' => null,
            'status' => 'completed',
        ]);

        // Mark the round as completed again
        $response = $this->putJson("http://app.virtualracingleagues.localhost/api/rounds/{$round->id}/complete");

        // Should still succeed without errors
        $response->assertOk();
        $response->assertJsonPath('data.status', 'completed');

        // Verify status hasn't changed
        $this->assertDatabaseHas('rounds', [
            'id' => $round->id,
            'status' => 'completed',
        ]);
    }

    public function test_uncompleting_already_scheduled_round_is_idempotent(): void
    {
        // Create a round that's already scheduled
        $round = RoundFactory::new()->create([
            'season_id' => $this->season->id,
            'created_by_user_id' => $this->user->id,
            'platform_track_id' => null,
            'status' => 'scheduled',
        ]);

        // Mark the round as not completed again
        $response = $this->putJson("http://app.virtualracingleagues.localhost/api/rounds/{$round->id}/uncomplete");

        // Should still succeed without errors
        $response->assertOk();
        $response->assertJsonPath('data.status', 'scheduled');

        // Verify status hasn't changed
        $this->assertDatabaseHas('rounds', [
            'id' => $round->id,
            'status' => 'scheduled',
        ]);
    }

    public function test_completing_nonexistent_round_returns_404(): void
    {
        $nonExistentId = 99999;

        $response = $this->putJson("http://app.virtualracingleagues.localhost/api/rounds/{$nonExistentId}/complete");

        $response->assertNotFound();
    }

    public function test_uncompleting_nonexistent_round_returns_404(): void
    {
        $nonExistentId = 99999;

        $response = $this->putJson("http://app.virtualracingleagues.localhost/api/rounds/{$nonExistentId}/uncomplete");

        $response->assertNotFound();
    }

    public function test_unauthenticated_user_cannot_complete_round(): void
    {
        // Create a round
        $round = RoundFactory::new()->create([
            'season_id' => $this->season->id,
            'created_by_user_id' => $this->user->id,
            'platform_track_id' => null,
        ]);

        // Logout the user
        auth('web')->logout();

        // Try to complete the round
        $response = $this->putJson("http://app.virtualracingleagues.localhost/api/rounds/{$round->id}/complete");

        $response->assertUnauthorized();
    }

    public function test_unauthenticated_user_cannot_uncomplete_round(): void
    {
        // Create a round
        $round = RoundFactory::new()->create([
            'season_id' => $this->season->id,
            'created_by_user_id' => $this->user->id,
            'platform_track_id' => null,
        ]);

        // Logout the user
        auth('web')->logout();

        // Try to uncomplete the round
        $response = $this->putJson("http://app.virtualracingleagues.localhost/api/rounds/{$round->id}/uncomplete");

        $response->assertUnauthorized();
    }

    public function test_can_create_round_with_points_system(): void
    {
        $pointsSystem = ['1' => 25, '2' => 18, '3' => 15, '4' => 12, '5' => 10];

        $response = $this->postJson("http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/rounds", [
            'round_number' => 1,
            'name' => 'Round 1',
            'points_system' => json_encode($pointsSystem),
            'round_points' => true,
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.round_number', 1);
        $response->assertJsonPath('data.round_points', true);

        $decodedPoints = json_decode($response->json('data.points_system'), true);
        $this->assertEquals($pointsSystem, $decodedPoints);
    }

    public function test_can_update_round_with_points_system(): void
    {
        $round = RoundFactory::new()->create([
            'season_id' => $this->season->id,
            'created_by_user_id' => $this->user->id,
            'platform_track_id' => null,
            'points_system' => null,
            'round_points' => false,
        ]);

        $pointsSystem = ['1' => 30, '2' => 25, '3' => 20];

        $response = $this->putJson("http://app.virtualracingleagues.localhost/api/rounds/{$round->id}", [
            'points_system' => json_encode($pointsSystem),
            'round_points' => true,
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.round_points', true);

        $decodedPoints = json_decode($response->json('data.points_system'), true);
        $this->assertEquals($pointsSystem, $decodedPoints);

        $this->assertDatabaseHas('rounds', [
            'id' => $round->id,
            'round_points' => true,
        ]);
    }

    public function test_can_clear_points_system_by_setting_to_null(): void
    {
        $pointsSystem = ['1' => 25, '2' => 18, '3' => 15];

        $round = RoundFactory::new()->create([
            'season_id' => $this->season->id,
            'created_by_user_id' => $this->user->id,
            'platform_track_id' => null,
            'points_system' => json_encode($pointsSystem),
            'round_points' => true,
        ]);

        $response = $this->putJson("http://app.virtualracingleagues.localhost/api/rounds/{$round->id}", [
            'points_system' => null,
            'round_points' => false,
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.points_system', null);
        $response->assertJsonPath('data.round_points', false);

        $this->assertDatabaseHas('rounds', [
            'id' => $round->id,
            'points_system' => null,
            'round_points' => false,
        ]);
    }

    public function test_points_system_validation_requires_valid_json(): void
    {
        $response = $this->postJson("http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/rounds", [
            'round_number' => 1,
            'name' => 'Round 1',
            'points_system' => 'invalid json string',
            'round_points' => true,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('points_system');
    }
}
