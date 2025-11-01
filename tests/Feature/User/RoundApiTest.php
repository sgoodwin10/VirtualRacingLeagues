<?php

declare(strict_types=1);

namespace Tests\Feature\User;

use App\Infrastructure\Persistence\Eloquent\Models\Round;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Feature tests for Round API endpoints.
 */
final class RoundApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private int $seasonId;
    private int $platformTrackId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        // Create season directly
        $leagueId = DB::table('leagues')->insertGetId([
            'name' => 'Test League',
            'slug' => 'test-league',
            'timezone' => 'UTC',
            'logo_path' => 'test.png',
            'owner_user_id' => $this->user->id,
            'visibility' => 'public',
            'platform_ids' => json_encode([]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $platformId = DB::table('platforms')->insertGetId([
            'name' => 'Test Platform',
            'slug' => 'test-platform',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $competitionId = DB::table('competitions')->insertGetId([
            'league_id' => $leagueId,
            'name' => 'Test Competition',
            'slug' => 'test-competition',
            'platform_id' => $platformId,
            'created_by_user_id' => $this->user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->seasonId = DB::table('seasons')->insertGetId([
            'competition_id' => $competitionId,
            'name' => 'Test Season',
            'slug' => 'test-season',
            'created_by_user_id' => $this->user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create platform track directly
        $locationId = DB::table('platform_track_locations')->insertGetId([
            'platform_id' => $platformId,
            'name' => 'Test Location',
            'slug' => 'test-location',
            'country' => 'Test',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->platformTrackId = DB::table('platform_tracks')->insertGetId([
            'platform_id' => $platformId,
            'platform_track_location_id' => $locationId,
            'name' => 'Test Track',
            'slug' => 'test-track',
            'is_reverse' => false,
            'is_active' => true,
            'sort_order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    #[Test]
    public function authenticated_user_can_create_round(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson(
            "http://app.virtualracingleagues.localhost/api/seasons/{$this->seasonId}/rounds",
            [
                'round_number' => 5,
                'name' => 'Season Opener',
                'scheduled_at' => '2025-02-18 19:00:00',
                'platform_track_id' => $this->platformTrackId,
            ]
        );

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'round_number',
                'name',
                'slug',
                'scheduled_at',
                'timezone',
                'platform_track_id',
                'status',
                'status_label',
            ],
        ]);

        $this->assertDatabaseHas('rounds', [
            'season_id' => $this->seasonId,
            'round_number' => 5,
            'name' => 'Season Opener',
            'slug' => 'season-opener',
        ]);
    }

    #[Test]
    public function round_creation_requires_authentication(): void
    {
        $response = $this->postJson(
            "http://app.virtualracingleagues.localhost/api/seasons/{$this->seasonId}/rounds",
            [
                'round_number' => 5,
                'scheduled_at' => '2025-02-18 19:00:00',
                'platform_track_id' => $this->platformTrackId,
            ]
        );

        $response->assertStatus(401);
    }

    #[Test]
    public function round_creation_validates_required_fields(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson(
            "http://app.virtualracingleagues.localhost/api/seasons/{$this->seasonId}/rounds",
            []
        );

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['round_number']);
    }

    #[Test]
    public function round_creation_validates_round_number_range(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson("http://app.virtualracingleagues.localhost/api/seasons/{$this->seasonId}/rounds", [
            'round_number' => 100,
            'scheduled_at' => '2025-02-18 19:00:00',
            'platform_track_id' => $this->platformTrackId,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['round_number']);
    }

    #[Test]
    public function round_creation_validates_name_length(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson("http://app.virtualracingleagues.localhost/api/seasons/{$this->seasonId}/rounds", [
            'round_number' => 5,
            'name' => 'AB', // Too short
            'scheduled_at' => '2025-02-18 19:00:00',
            'platform_track_id' => $this->platformTrackId,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);
    }

    #[Test]
    public function authenticated_user_can_list_rounds_for_season(): void
    {
        $this->actingAs($this->user, 'web');

        Round::factory()->count(3)->create([
            'season_id' => $this->seasonId,
            'platform_track_id' => $this->platformTrackId,
            'created_by_user_id' => $this->user->id,
        ]);

        $response = $this->getJson("http://app.virtualracingleagues.localhost/api/seasons/{$this->seasonId}/rounds");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                '*' => [
                    'id',
                    'round_number',
                    'name',
                    'slug',
                    'status',
                ],
            ],
        ]);
        $response->assertJsonCount(3, 'data');
    }

    #[Test]
    public function authenticated_user_can_get_single_round(): void
    {
        $this->actingAs($this->user, 'web');

        $round = Round::factory()->create([
            'season_id' => $this->seasonId,
            'platform_track_id' => $this->platformTrackId,
            'created_by_user_id' => $this->user->id,
            'name' => 'Test Round',
        ]);

        $response = $this->getJson("http://app.virtualracingleagues.localhost/api/rounds/{$round->id}");

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'id' => $round->id,
            'name' => 'Test Round',
        ]);
    }

    #[Test]
    public function authenticated_user_can_update_round(): void
    {
        $this->actingAs($this->user, 'web');

        $round = Round::factory()->create([
            'season_id' => $this->seasonId,
            'platform_track_id' => $this->platformTrackId,
            'created_by_user_id' => $this->user->id,
            'name' => 'Original Name',
        ]);

        $response = $this->putJson("http://app.virtualracingleagues.localhost/api/rounds/{$round->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('rounds', [
            'id' => $round->id,
            'name' => 'Updated Name',
        ]);
    }

    #[Test]
    public function authenticated_user_can_delete_round(): void
    {
        $this->actingAs($this->user, 'web');

        $round = Round::factory()->create([
            'season_id' => $this->seasonId,
            'platform_track_id' => $this->platformTrackId,
            'created_by_user_id' => $this->user->id,
        ]);

        $response = $this->deleteJson("http://app.virtualracingleagues.localhost/api/rounds/{$round->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('rounds', ['id' => $round->id]);
    }

    #[Test]
    public function authenticated_user_can_get_next_round_number(): void
    {
        $this->actingAs($this->user, 'web');

        Round::factory()->create([
            'season_id' => $this->seasonId,
            'platform_track_id' => $this->platformTrackId,
            'round_number' => 5,
            'created_by_user_id' => $this->user->id,
        ]);

        $response = $this->getJson("http://app.virtualracingleagues.localhost/api/seasons/{$this->seasonId}/rounds/next-number");

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => ['next_round_number' => 6],
        ]);
    }

    #[Test]
    public function next_round_number_returns_1_for_empty_season(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->getJson("http://app.virtualracingleagues.localhost/api/seasons/{$this->seasonId}/rounds/next-number");

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => ['next_round_number' => 1],
        ]);
    }

    #[Test]
    public function round_slug_is_auto_generated_from_name(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson("http://app.virtualracingleagues.localhost/api/seasons/{$this->seasonId}/rounds", [
            'round_number' => 1,
            'name' => 'Monaco Grand Prix',
            'scheduled_at' => '2025-05-25 14:00:00',
            'platform_track_id' => $this->platformTrackId,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('rounds', [
            'name' => 'Monaco Grand Prix',
            'slug' => 'monaco-grand-prix',
        ]);
    }

    #[Test]
    public function round_slug_is_auto_generated_from_round_number_when_name_is_null(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson("http://app.virtualracingleagues.localhost/api/seasons/{$this->seasonId}/rounds", [
            'round_number' => 3,
            'scheduled_at' => '2025-05-25 14:00:00',
            'platform_track_id' => $this->platformTrackId,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('rounds', [
            'round_number' => 3,
            'slug' => 'round-3',
        ]);
    }

    #[Test]
    public function round_can_be_created_without_scheduled_at_and_platform_track_id(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson("http://app.virtualracingleagues.localhost/api/seasons/{$this->seasonId}/rounds", [
            'round_number' => 7,
            'name' => 'TBD Round',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('rounds', [
            'round_number' => 7,
            'name' => 'TBD Round',
            'scheduled_at' => null,
            'platform_track_id' => null,
        ]);
    }
}
