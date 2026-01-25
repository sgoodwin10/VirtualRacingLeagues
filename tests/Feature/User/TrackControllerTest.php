<?php

declare(strict_types=1);

namespace Tests\Feature\User;

use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Infrastructure\Persistence\Eloquent\Models\PlatformTrack;
use App\Infrastructure\Persistence\Eloquent\Models\PlatformTrackLocation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrackControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Platform $platform;

    private PlatformTrackLocation $location;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a test user
        $this->user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        // Create a platform
        $this->platform = Platform::factory()->create([
            'name' => 'Test Platform',
            'is_active' => true,
        ]);

        // Create a track location
        $this->location = PlatformTrackLocation::create([
            'platform_id' => $this->platform->id,
            'name' => 'Silverstone Circuit',
            'slug' => 'silverstone-circuit',
            'country' => 'United Kingdom',
            'is_active' => true,
            'sort_order' => 0,
        ]);
    }

    public function test_index_returns_tracks_grouped_by_location(): void
    {
        // Create some tracks at the same location
        PlatformTrack::factory()->create([
            'platform_id' => $this->platform->id,
            'platform_track_location_id' => $this->location->id,
            'name' => 'Grand Prix Circuit',
            'is_active' => true,
        ]);

        PlatformTrack::factory()->create([
            'platform_id' => $this->platform->id,
            'platform_track_location_id' => $this->location->id,
            'name' => 'National Circuit',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson("http://app.virtualracingleagues.localhost/api/tracks?platform_id={$this->platform->id}");

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'slug',
                        'country',
                        'is_active',
                        'sort_order',
                        'tracks' => [
                            '*' => [
                                'id',
                                'platform_id',
                                'platform_track_location_id',
                                'name',
                                'slug',
                                'is_reverse',
                                'image_path',
                                'length_meters',
                                'is_active',
                                'sort_order',
                                'created_at',
                                'updated_at',
                            ],
                        ],
                    ],
                ],
            ])
            ->assertJsonCount(1, 'data') // One location
            ->assertJsonCount(2, 'data.0.tracks'); // Two tracks at that location

        // Verify the location data
        $this->assertEquals('Silverstone Circuit', $response->json('data.0.name'));
        $this->assertEquals('United Kingdom', $response->json('data.0.country'));
    }

    public function test_index_filters_by_is_active(): void
    {
        // Create active and inactive tracks
        PlatformTrack::factory()->create([
            'platform_id' => $this->platform->id,
            'platform_track_location_id' => $this->location->id,
            'name' => 'Active Track',
            'is_active' => true,
        ]);

        PlatformTrack::factory()->create([
            'platform_id' => $this->platform->id,
            'platform_track_location_id' => $this->location->id,
            'name' => 'Inactive Track',
            'is_active' => false,
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson("http://app.virtualracingleagues.localhost/api/tracks?platform_id={$this->platform->id}&is_active=true");

        $response->assertOk()
            ->assertJsonCount(1, 'data') // One location
            ->assertJsonCount(1, 'data.0.tracks'); // One active track

        $this->assertEquals('Active Track', $response->json('data.0.tracks.0.name'));
    }

    public function test_index_searches_by_location_name(): void
    {
        // Create a second location
        $monzaLocation = PlatformTrackLocation::create([
            'platform_id' => $this->platform->id,
            'name' => 'Autodromo Nazionale di Monza',
            'slug' => 'monza',
            'country' => 'Italy',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        // Create tracks at Silverstone
        PlatformTrack::factory()->create([
            'platform_id' => $this->platform->id,
            'platform_track_location_id' => $this->location->id,
            'name' => 'Grand Prix Circuit',
            'is_active' => true,
        ]);

        // Create tracks at Monza
        PlatformTrack::factory()->create([
            'platform_id' => $this->platform->id,
            'platform_track_location_id' => $monzaLocation->id,
            'name' => 'GP Circuit',
            'is_active' => true,
        ]);

        // Search for Silverstone
        $response = $this->actingAs($this->user, 'web')
            ->getJson("http://app.virtualracingleagues.localhost/api/tracks?platform_id={$this->platform->id}&search=Silverstone");

        $response->assertOk()
            ->assertJsonCount(1, 'data');

        $this->assertEquals('Silverstone Circuit', $response->json('data.0.name'));
        $this->assertEquals('United Kingdom', $response->json('data.0.country'));
    }

    public function test_index_searches_by_track_name(): void
    {
        // Create a second location
        $lagoMaggioreLocation = PlatformTrackLocation::create([
            'platform_id' => $this->platform->id,
            'name' => 'Autodrome Lago Maggiore',
            'slug' => 'lago-maggiore',
            'country' => 'Italy',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        // Create tracks at Silverstone (no "West" in track names)
        PlatformTrack::factory()->create([
            'platform_id' => $this->platform->id,
            'platform_track_location_id' => $this->location->id,
            'name' => 'Grand Prix Circuit',
            'is_active' => true,
        ]);

        PlatformTrack::factory()->create([
            'platform_id' => $this->platform->id,
            'platform_track_location_id' => $this->location->id,
            'name' => 'National Circuit',
            'is_active' => true,
        ]);

        // Create tracks at Lago Maggiore with "West" in track names
        PlatformTrack::factory()->create([
            'platform_id' => $this->platform->id,
            'platform_track_location_id' => $lagoMaggioreLocation->id,
            'name' => 'West',
            'is_active' => true,
        ]);

        PlatformTrack::factory()->create([
            'platform_id' => $this->platform->id,
            'platform_track_location_id' => $lagoMaggioreLocation->id,
            'name' => 'West - Reverse',
            'is_active' => true,
        ]);

        // Search for "West" - should only return Lago Maggiore location
        $response = $this->actingAs($this->user, 'web')
            ->getJson("http://app.virtualracingleagues.localhost/api/tracks?platform_id={$this->platform->id}&search=West");

        $response->assertOk()
            ->assertJsonCount(1, 'data'); // Only one location

        // Verify it's the Lago Maggiore location
        $this->assertEquals('Autodrome Lago Maggiore', $response->json('data.0.name'));
        $this->assertEquals('Italy', $response->json('data.0.country'));

        // Verify it has 2 tracks with "West" in the name
        $this->assertCount(2, $response->json('data.0.tracks'));
        $trackNames = array_column($response->json('data.0.tracks'), 'name');
        $this->assertContains('West', $trackNames);
        $this->assertContains('West - Reverse', $trackNames);
    }

    public function test_index_searches_by_track_name_respects_is_active_filter(): void
    {
        // Create a location
        $location = PlatformTrackLocation::create([
            'platform_id' => $this->platform->id,
            'name' => 'Test Location',
            'slug' => 'test-location',
            'country' => 'Test Country',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        // Create active track with "Circuit" in name
        PlatformTrack::factory()->create([
            'platform_id' => $this->platform->id,
            'platform_track_location_id' => $location->id,
            'name' => 'Active Circuit',
            'is_active' => true,
        ]);

        // Create inactive track with "Circuit" in name
        PlatformTrack::factory()->create([
            'platform_id' => $this->platform->id,
            'platform_track_location_id' => $location->id,
            'name' => 'Inactive Circuit',
            'is_active' => false,
        ]);

        // Search for "Circuit" with is_active=true
        $response = $this->actingAs($this->user, 'web')
            ->getJson("http://app.virtualracingleagues.localhost/api/tracks?platform_id={$this->platform->id}&search=Circuit&is_active=true");

        $response->assertOk()
            ->assertJsonCount(1, 'data'); // One location

        // Verify only the active track is returned
        $this->assertCount(1, $response->json('data.0.tracks'));
        $this->assertEquals('Active Circuit', $response->json('data.0.tracks.0.name'));
    }

    public function test_index_filters_out_locations_with_no_tracks_for_platform(): void
    {
        // Create a second platform
        $otherPlatform = Platform::factory()->create([
            'name' => 'Other Platform',
            'slug' => 'other-platform-' . uniqid(),
            'is_active' => true,
        ]);

        // Create a second location
        $monzaLocation = PlatformTrackLocation::create([
            'platform_id' => $otherPlatform->id,
            'name' => 'Autodromo Nazionale di Monza',
            'slug' => 'monza',
            'country' => 'Italy',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        // Create tracks at Silverstone for the main platform
        PlatformTrack::factory()->create([
            'platform_id' => $this->platform->id,
            'platform_track_location_id' => $this->location->id,
            'name' => 'Grand Prix Circuit',
            'is_active' => true,
        ]);

        // Create tracks at Monza for the OTHER platform only
        PlatformTrack::factory()->create([
            'platform_id' => $otherPlatform->id,
            'platform_track_location_id' => $monzaLocation->id,
            'name' => 'GP Circuit',
            'is_active' => true,
        ]);

        // Query for the main platform - should only return Silverstone
        $response = $this->actingAs($this->user, 'web')
            ->getJson("http://app.virtualracingleagues.localhost/api/tracks?platform_id={$this->platform->id}");

        $response->assertOk()
            ->assertJsonCount(1, 'data'); // Only one location (Silverstone)

        $this->assertEquals('Silverstone Circuit', $response->json('data.0.name'));
    }

    public function test_index_requires_platform_id(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->getJson('http://app.virtualracingleagues.localhost/api/tracks');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['platform_id']);
    }

    public function test_show_returns_track(): void
    {
        $track = PlatformTrack::factory()->create([
            'platform_id' => $this->platform->id,
            'platform_track_location_id' => $this->location->id,
            'name' => 'Test Track',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson("http://app.virtualracingleagues.localhost/api/tracks/{$track->id}");

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'platform_id',
                    'platform_track_location_id',
                    'name',
                    'slug',
                    'is_reverse',
                    'image_path',
                    'length_meters',
                    'is_active',
                    'sort_order',
                    'created_at',
                    'updated_at',
                    'location' => [
                        'id',
                        'name',
                        'slug',
                        'country',
                        'is_active',
                        'sort_order',
                    ],
                ],
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $track->id,
                    'name' => 'Test Track',
                    'platform_id' => $this->platform->id,
                    'location' => [
                        'id' => $this->location->id,
                        'name' => 'Silverstone Circuit',
                        'country' => 'United Kingdom',
                    ],
                ],
            ]);
    }

    public function test_show_returns_404_for_nonexistent_track(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->getJson('http://app.virtualracingleagues.localhost/api/tracks/99999');

        $response->assertNotFound()
            ->assertJson([
                'success' => false,
                'message' => 'Track not found',
            ]);
    }

    public function test_endpoints_require_authentication(): void
    {
        $response = $this->getJson("http://app.virtualracingleagues.localhost/api/tracks?platform_id={$this->platform->id}");
        $response->assertUnauthorized();

        $response = $this->getJson('http://app.virtualracingleagues.localhost/api/tracks/1');
        $response->assertUnauthorized();
    }
}
