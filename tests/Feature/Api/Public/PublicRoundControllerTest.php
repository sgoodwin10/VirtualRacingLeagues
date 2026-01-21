<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Public;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\Division;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Infrastructure\Persistence\Eloquent\Models\PlatformTrack;
use App\Infrastructure\Persistence\Eloquent\Models\Race;
use App\Infrastructure\Persistence\Eloquent\Models\Round;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicRoundControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private League $league;
    private Platform $platform;
    private Competition $competition;
    private SeasonEloquent $season;

    protected function setUp(): void
    {
        parent::setUp();

        // Create user for league ownership
        /** @var User $user */
        $user = User::factory()->create();
        $this->user = $user;

        // Create platform
        $this->platform = Platform::factory()->create(['is_active' => true]);

        // Create public active league
        /** @var League $league */
        $league = League::factory()->create([
            'owner_user_id' => $this->user->id,
            'visibility' => 'public',
            'status' => 'active',
            'platform_ids' => [$this->platform->id],
        ]);
        $this->league = $league;

        // Create competition
        /** @var Competition $competition */
        $competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
            'status' => 'active',
        ]);
        $this->competition = $competition;

        // Create season
        /** @var SeasonEloquent $season */
        $season = SeasonEloquent::factory()->create([
            'competition_id' => $this->competition->id,
            'status' => 'active',
            'race_divisions_enabled' => false,
        ]);
        $this->season = $season;
    }

    public function test_results_returns_round_results_successfully(): void
    {
        $platformTrack = PlatformTrack::factory()->create([
            'platform_id' => $this->platform->id,
        ]);

        /** @var Round $round */
        $round = Round::factory()->create([
            'season_id' => $this->season->id,
            'round_number' => 1,
            'status' => 'completed',
            'platform_track_id' => $platformTrack->id,
        ]);

        Race::factory()->create([
            'round_id' => $round->id,
            'race_number' => 1,
            'name' => 'Race 1',
            'status' => 'completed',
        ]);

        $response = $this->getJson("/api/public/rounds/{$round->id}/results");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'data' => [
                    'round' => [
                        'id',
                        'round_number',
                        'name',
                        'status',
                        'round_results',
                        'qualifying_results',
                        'race_time_results',
                        'fastest_lap_results',
                    ],
                    'divisions',
                    'race_events',
                ],
            ])
            ->assertJsonPath('data.round.id', $round->id)
            ->assertJsonPath('data.round.round_number', 1);

        // Verify name is present (factory generates random name)
        $this->assertNotNull($response->json('data.round.name'));
    }

    public function test_results_returns_divisions_array_when_enabled(): void
    {
        // Update season to enable divisions
        $this->season->update(['race_divisions_enabled' => true]);

        $platformTrack = PlatformTrack::factory()->create([
            'platform_id' => $this->platform->id,
        ]);

        /** @var Round $round */
        $round = Round::factory()->create([
            'season_id' => $this->season->id,
            'round_number' => 1,
            'status' => 'completed',
            'platform_track_id' => $platformTrack->id,
        ]);

        $response = $this->getJson("/api/public/rounds/{$round->id}/results");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'divisions',
                    'round',
                    'race_events',
                ],
            ]);

        // Verify divisions is an array (may be empty if no divisions were created via proper entity layer)
        $data = $response->json('data');
        $this->assertArrayHasKey('divisions', $data);
        $this->assertIsArray($data['divisions']);
    }

    public function test_results_returns_404_for_nonexistent_round(): void
    {
        $nonExistentId = 99999;

        $response = $this->getJson("/api/public/rounds/{$nonExistentId}/results");

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Round not found',
            ]);
    }


    public function test_results_rejects_negative_round_id(): void
    {
        $response = $this->getJson('/api/public/rounds/0/results');

        // Zero is not a valid ID, but whereNumber allows it through route constraint
        // The validation in the request should catch this
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['roundId']);
    }

    public function test_results_returns_race_events_with_results(): void
    {
        $platformTrack = PlatformTrack::factory()->create([
            'platform_id' => $this->platform->id,
        ]);

        /** @var Round $round */
        $round = Round::factory()->create([
            'season_id' => $this->season->id,
            'round_number' => 1,
            'status' => 'completed',
            'platform_track_id' => $platformTrack->id,
        ]);

        Race::factory()->create([
            'round_id' => $round->id,
            'race_number' => 1,
            'name' => 'Sprint Race',
            'race_type' => 'sprint',
            'status' => 'completed',
        ]);

        Race::factory()->create([
            'round_id' => $round->id,
            'race_number' => 2,
            'name' => 'Feature Race',
            'race_type' => 'feature',
            'status' => 'completed',
        ]);

        $response = $this->getJson("/api/public/rounds/{$round->id}/results");

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data.race_events')
            ->assertJsonFragment(['name' => 'Sprint Race'])
            ->assertJsonFragment(['name' => 'Feature Race']);
    }

    public function test_results_endpoint_is_publicly_accessible(): void
    {
        $platformTrack = PlatformTrack::factory()->create([
            'platform_id' => $this->platform->id,
        ]);

        /** @var Round $round */
        $round = Round::factory()->create([
            'season_id' => $this->season->id,
            'round_number' => 1,
            'status' => 'completed',
            'platform_track_id' => $platformTrack->id,
        ]);

        // Make request without authentication
        $response = $this->getJson("/api/public/rounds/{$round->id}/results");

        // Should succeed without authentication
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    public function test_results_returns_cross_division_results_structure(): void
    {
        $platformTrack = PlatformTrack::factory()->create([
            'platform_id' => $this->platform->id,
        ]);

        /** @var Round $round */
        $round = Round::factory()->create([
            'season_id' => $this->season->id,
            'round_number' => 1,
            'status' => 'completed',
            'platform_track_id' => $platformTrack->id,
        ]);

        $response = $this->getJson("/api/public/rounds/{$round->id}/results");

        // Verify the structure includes cross-division result fields (even if null)
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'round' => [
                        'id',
                        'round_number',
                        'name',
                        'status',
                        'round_results',
                        'qualifying_results',
                        'race_time_results',
                        'fastest_lap_results',
                    ],
                ],
            ]);
    }
}
