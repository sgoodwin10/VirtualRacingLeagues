<?php

declare(strict_types=1);

namespace Tests\Feature\Http\Controllers\User;

use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class LeagueControllerTest extends UserControllerTestCase
{
    use RefreshDatabase;

    private UserEloquent $user;
    private UserEloquent $otherUser;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->user = UserEloquent::factory()->create(['status' => 'active']);
        $this->otherUser = UserEloquent::factory()->create(['status' => 'active']);

        // Create platforms for tests
        Platform::create([
            'name' => 'iRacing',
            'slug' => 'iracing',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        Platform::create([
            'name' => 'Assetto Corsa Competizione',
            'slug' => 'acc',
            'is_active' => true,
            'sort_order' => 2,
        ]);
    }

    /**
     * Override to use app subdomain for all requests
     */
    public function getJson($uri, array $headers = [], $options = 0)
    {
        // Set the base URL to the app subdomain
        $url = 'http://app.virtualracingleagues.localhost' . $uri;
        return parent::getJson($url, $headers, $options);
    }

    /**
     * Override to use app subdomain for all requests
     */
    public function postJson($uri, array $data = [], array $headers = [], $options = 0)
    {
        $url = 'http://app.virtualracingleagues.localhost' . $uri;
        return parent::postJson($url, $data, $headers, $options);
    }

    /**
     * Override to use app subdomain for all requests
     */
    public function deleteJson($uri, array $data = [], array $headers = [], $options = 0)
    {
        $url = 'http://app.virtualracingleagues.localhost' . $uri;
        return parent::deleteJson($url, $data, $headers, $options);
    }

    /**
     * Override to use app subdomain for all requests
     */
    public function putJson($uri, array $data = [], array $headers = [], $options = 0)
    {
        $url = 'http://app.virtualracingleagues.localhost' . $uri;
        return parent::putJson($url, $data, $headers, $options);
    }

    #[Test]
    public function it_creates_league_successfully(): void
    {
        if (!function_exists('imagejpeg')) {
            $this->markTestSkipped('GD extension not available');
        }

        $data = [
            'name' => 'F1 Racing League',
            'tagline' => 'The Premier F1 League',
            'description' => 'A competitive F1 racing league',
            'logo' => UploadedFile::fake()->image('logo.png', 500, 500),
            'header_image' => UploadedFile::fake()->image('header.jpg', 1920, 1080),
            'timezone' => 'Europe/London',
            'contact_email' => 'contact@league.com',
            'organizer_name' => 'John Doe',
            'platform_ids' => [1, 2],
            'discord_url' => 'https://discord.gg/league',
            'website_url' => 'https://league.example.com',
            'twitter_handle' => '@f1league',
            'instagram_handle' => '@f1league',
            'youtube_url' => 'https://youtube.com/@f1league',
            'twitch_url' => 'https://twitch.tv/f1league',
            'visibility' => 'public',
        ];

        $response = $this->actingAs($this->user, 'web')
            ->postJson('/api/leagues', $data);

        $response->assertCreated()
            ->assertJson([
                'success' => true,
                'message' => 'League created successfully',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'name',
                    'slug',
                    'tagline',
                    'description',
                    'logo_url',
                    'header_image_url',
                    'timezone',
                    'contact_email',
                    'organizer_name',
                    'platform_ids',
                    'platforms',
                    'discord_url',
                    'website_url',
                    'twitter_handle',
                    'instagram_handle',
                    'youtube_url',
                    'twitch_url',
                    'visibility',
                    'status',
                ],
            ])
            ->assertJsonPath('data.name', 'F1 Racing League')
            ->assertJsonPath('data.slug', 'f1-racing-league')
            ->assertJsonPath('data.tagline', 'The Premier F1 League')
            ->assertJsonPath('data.visibility', 'public')
            ->assertJsonPath('data.status', 'active');

        // Assert platforms are included
        $platforms = $response->json('data.platforms');
        $this->assertIsArray($platforms);
        $this->assertCount(2, $platforms);
        $this->assertArrayHasKey('id', $platforms[0]);
        $this->assertArrayHasKey('name', $platforms[0]);
        $this->assertArrayHasKey('slug', $platforms[0]);

        // Assert files were stored (URLs should contain /storage/)
        $logoUrl = $response->json('data.logo_url');
        $headerUrl = $response->json('data.header_image_url');
        $this->assertStringContainsString('/storage/', $logoUrl);
        $this->assertStringContainsString('/storage/', $headerUrl);

        // Assert database record
        $this->assertDatabaseHas('leagues', [
            'name' => 'F1 Racing League',
            'slug' => 'f1-racing-league',
            'owner_user_id' => $this->user->id,
            'visibility' => 'public',
            'status' => 'active',
        ]);
    }

    #[Test]
    public function it_creates_league_with_only_required_fields(): void
    {
        $data = [
            'name' => 'Minimal League',
            'logo' => UploadedFile::fake()->image('logo.png'),
            'platform_ids' => [1],
            'timezone' => 'UTC',
            'contact_email' => 'contact@minimal.com',
            'organizer_name' => 'Jane Doe',
            'visibility' => 'public',
        ];

        $response = $this->actingAs($this->user, 'web')
            ->postJson('/api/leagues', $data);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Minimal League')
            ->assertJsonPath('data.tagline', null)
            ->assertJsonPath('data.description', null)
            ->assertJsonPath('data.header_image_url', null);
    }

    #[Test]
    public function it_enforces_free_tier_limit_of_one_league(): void
    {
        if (!function_exists('imagejpeg')) {
            $this->markTestSkipped('GD extension not available');
        }

        // Create first league
        League::create([
            'name' => 'First League',
            'slug' => 'first-league',
            'logo_path' => 'leagues/logos/logo.png',
            'timezone' => 'UTC',
            'owner_user_id' => $this->user->id,
            'contact_email' => 'contact@first.com',
            'organizer_name' => 'John Doe',
            'visibility' => 'public',
            'status' => 'active',
        ]);

        // Attempt to create second league
        $data = [
            'name' => 'Second League',
            'logo' => UploadedFile::fake()->image('logo.png'),
            'timezone' => 'UTC',
            'contact_email' => 'contact@second.com',
            'organizer_name' => 'Jane Doe',
            'visibility' => 'public',
            'platform_ids' => [1, 2], // Include required platform_ids
        ];

        $response = $this->actingAs($this->user, 'web')
            ->postJson('/api/leagues', $data);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ])
            ->assertJsonFragment([
                'message' => 'Free tier users can create a maximum of 1 league. Please upgrade your account to create more leagues.',
            ]);
    }

    #[Test]
    public function it_validates_required_fields(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->postJson('/api/leagues', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'name',
                'logo',
                'platform_ids',
                'timezone',
                'contact_email',
                'organizer_name',
                'visibility',
            ]);
    }

    #[Test]
    public function it_validates_logo_file_type(): void
    {
        $data = [
            'name' => 'Test League',
            'logo' => UploadedFile::fake()->create('document.pdf', 100),
            'platform_ids' => [1],
            'timezone' => 'UTC',
            'contact_email' => 'contact@test.com',
            'organizer_name' => 'John Doe',
            'visibility' => 'public',
        ];

        $response = $this->actingAs($this->user, 'web')
            ->postJson('/api/leagues', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['logo']);
    }

    #[Test]
    public function it_validates_logo_file_size(): void
    {
        $data = [
            'name' => 'Test League',
            'logo' => UploadedFile::fake()->image('logo.png')->size(3000), // > 2MB (2048KB)
            'platform_ids' => [1],
            'timezone' => 'UTC',
            'contact_email' => 'contact@test.com',
            'organizer_name' => 'John Doe',
            'visibility' => 'public',
        ];

        $response = $this->actingAs($this->user, 'web')
            ->postJson('/api/leagues', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['logo']);
    }

    #[Test]
    public function it_validates_header_image_file_type(): void
    {
        $data = [
            'name' => 'Test League',
            'logo' => UploadedFile::fake()->image('logo.png'),
            'header_image' => UploadedFile::fake()->create('document.pdf', 100),
            'platform_ids' => [1],
            'timezone' => 'UTC',
            'contact_email' => 'contact@test.com',
            'organizer_name' => 'John Doe',
            'visibility' => 'public',
        ];

        $response = $this->actingAs($this->user, 'web')
            ->postJson('/api/leagues', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['header_image']);
    }

    #[Test]
    public function it_validates_platform_ids_exist(): void
    {
        $data = [
            'name' => 'Test League',
            'logo' => UploadedFile::fake()->image('logo.png'),
            'timezone' => 'UTC',
            'contact_email' => 'contact@test.com',
            'organizer_name' => 'John Doe',
            'platform_ids' => [999, 888], // Non-existent IDs
            'visibility' => 'public',
        ];

        $response = $this->actingAs($this->user, 'web')
            ->postJson('/api/leagues', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['platform_ids.0', 'platform_ids.1']);
    }

    #[Test]
    public function it_validates_email_format(): void
    {
        $data = [
            'name' => 'Test League',
            'logo' => UploadedFile::fake()->image('logo.png'),
            'platform_ids' => [1],
            'timezone' => 'UTC',
            'contact_email' => 'invalid-email',
            'organizer_name' => 'John Doe',
            'visibility' => 'public',
        ];

        $response = $this->actingAs($this->user, 'web')
            ->postJson('/api/leagues', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['contact_email']);
    }

    #[Test]
    public function it_generates_unique_slugs_for_duplicate_names(): void
    {
        // Create first league
        $data1 = [
            'name' => 'F1 Racing League',
            'logo' => UploadedFile::fake()->image('logo1.png'),
            'platform_ids' => [1],
            'timezone' => 'UTC',
            'contact_email' => 'contact1@test.com',
            'organizer_name' => 'John Doe',
            'visibility' => 'public',
        ];

        $response1 = $this->actingAs($this->user, 'web')
            ->postJson('/api/leagues', $data1);

        $response1->assertCreated()
            ->assertJsonPath('data.slug', 'f1-racing-league');

        // Delete first league to allow second league creation
        League::where('owner_user_id', $this->user->id)->delete();

        // Create second league with same name
        $data2 = [
            'name' => 'F1 Racing League',
            'logo' => UploadedFile::fake()->image('logo2.png'),
            'platform_ids' => [1],
            'timezone' => 'UTC',
            'contact_email' => 'contact2@test.com',
            'organizer_name' => 'Jane Doe',
            'visibility' => 'public',
        ];

        $response2 = $this->actingAs($this->user, 'web')
            ->postJson('/api/leagues', $data2);

        $response2->assertCreated()
            ->assertJsonPath('data.slug', 'f1-racing-league-01');
    }

    #[Test]
    public function it_returns_user_leagues(): void
    {
        // Create leagues for this user
        $league1 = League::create([
            'name' => 'User League 1',
            'slug' => 'user-league-1',
            'logo_path' => 'leagues/logos/logo1.png',
            'timezone' => 'UTC',
            'owner_user_id' => $this->user->id,
            'contact_email' => 'contact1@test.com',
            'organizer_name' => 'John Doe',
            'visibility' => 'public',
            'status' => 'active',
        ]);

        // Ensure second league is created after first (explicit timestamp)
        $this->travel(1)->seconds();

        $league2 = League::create([
            'name' => 'User League 2',
            'slug' => 'user-league-2',
            'logo_path' => 'leagues/logos/logo2.png',
            'timezone' => 'UTC',
            'owner_user_id' => $this->user->id,
            'contact_email' => 'contact2@test.com',
            'organizer_name' => 'John Doe',
            'visibility' => 'private',
            'status' => 'active',
        ]);

        // Create league for other user (should not be returned)
        League::create([
            'name' => 'Other User League',
            'slug' => 'other-user-league',
            'logo_path' => 'leagues/logos/logo3.png',
            'timezone' => 'UTC',
            'owner_user_id' => $this->otherUser->id,
            'contact_email' => 'contact3@test.com',
            'organizer_name' => 'Jane Doe',
            'visibility' => 'public',
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson('/api/leagues');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'User League 2') // Most recent first
            ->assertJsonPath('data.1.name', 'User League 1');
    }

    #[Test]
    public function it_returns_specific_league_by_id(): void
    {
        $league = League::create([
            'name' => 'Test League',
            'slug' => 'test-league',
            'logo_path' => 'leagues/logos/logo.png',
            'tagline' => 'Test tagline',
            'description' => 'Test description',
            'timezone' => 'UTC',
            'owner_user_id' => $this->user->id,
            'contact_email' => 'contact@test.com',
            'organizer_name' => 'John Doe',
            'platform_ids' => [1, 2],
            'visibility' => 'public',
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson("/api/leagues/{$league->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $league->id)
            ->assertJsonPath('data.name', 'Test League')
            ->assertJsonPath('data.slug', 'test-league')
            ->assertJsonPath('data.tagline', 'Test tagline')
            ->assertJsonStructure([
                'data' => [
                    'platforms',
                ],
            ]);
    }

    #[Test]
    public function it_returns_404_for_non_existent_league(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->getJson('/api/leagues/99999');

        $response->assertNotFound()
            ->assertJson([
                'success' => false,
                'message' => 'League not found.',
            ]);
    }

    #[Test]
    public function it_deletes_league_successfully(): void
    {
        $league = League::create([
            'name' => 'Test League',
            'slug' => 'test-league',
            'logo_path' => 'leagues/logos/logo.png',
            'timezone' => 'UTC',
            'owner_user_id' => $this->user->id,
            'contact_email' => 'contact@test.com',
            'organizer_name' => 'John Doe',
            'visibility' => 'public',
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->deleteJson("/api/leagues/{$league->id}");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'League deleted successfully',
            ]);

        $this->assertSoftDeleted('leagues', ['id' => $league->id]);
    }

    #[Test]
    public function it_prevents_deleting_another_users_league(): void
    {
        $league = League::create([
            'name' => 'Other User League',
            'slug' => 'other-user-league',
            'logo_path' => 'leagues/logos/logo.png',
            'timezone' => 'UTC',
            'owner_user_id' => $this->otherUser->id,
            'contact_email' => 'contact@test.com',
            'organizer_name' => 'Jane Doe',
            'visibility' => 'public',
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->deleteJson("/api/leagues/{$league->id}");

        $response->assertStatus(403); // Forbidden - unauthorized access

        $this->assertDatabaseHas('leagues', ['id' => $league->id, 'deleted_at' => null]);
    }

    #[Test]
    public function it_checks_slug_availability(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->postJson('/api/leagues/check-slug', ['name' => 'F1 Racing League']);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'available' => true,
                    'slug' => 'f1-racing-league',
                    'suggestion' => null,
                ],
            ]);
    }

    #[Test]
    public function it_suggests_alternative_slug_when_taken(): void
    {
        // Create league with slug
        League::create([
            'name' => 'F1 Racing League',
            'slug' => 'f1-racing-league',
            'logo_path' => 'leagues/logos/logo.png',
            'timezone' => 'UTC',
            'owner_user_id' => $this->user->id,
            'contact_email' => 'contact@test.com',
            'organizer_name' => 'John Doe',
            'visibility' => 'public',
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->postJson('/api/leagues/check-slug', ['name' => 'F1 Racing League']);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'available' => false,
                    'slug' => 'f1-racing-league',
                ],
            ]);

        $this->assertNotNull($response->json('data.suggestion'));
        $this->assertStringStartsWith('f1-racing-league-', $response->json('data.suggestion'));
    }

    #[Test]
    public function it_requires_name_for_slug_check(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->postJson('/api/leagues/check-slug', []);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Name is required',
            ]);
    }

    #[Test]
    public function it_requires_authentication_for_all_endpoints(): void
    {
        $endpoints = [
            ['method' => 'get', 'uri' => '/api/leagues'],
            ['method' => 'post', 'uri' => '/api/leagues'],
            ['method' => 'get', 'uri' => '/api/leagues/1'],
            ['method' => 'delete', 'uri' => '/api/leagues/1'],
            ['method' => 'post', 'uri' => '/api/leagues/check-slug'],
        ];

        foreach ($endpoints as $endpoint) {
            $response = $this->{$endpoint['method'] . 'Json'}($endpoint['uri']);
            $response->assertUnauthorized();
        }
    }
}
