<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Public;

use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicLeagueControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a user for league ownership
        /** @var User $user */
        $user = User::factory()->create();
        $this->user = $user;
    }

    public function test_index_returns_only_public_active_leagues(): void
    {
        // Create a platform
        $platform = Platform::factory()->create(['is_active' => true]);

        // Create public active league
        /** @var League $publicLeague */
        $publicLeague = League::factory()->create([
            'owner_user_id' => $this->user->id,
            'visibility' => 'public',
            'status' => 'active',
            'platform_ids' => [$platform->id],
        ]);

        // Create private league (should not be returned)
        League::factory()->create([
            'owner_user_id' => $this->user->id,
            'visibility' => 'private',
            'status' => 'active',
            'platform_ids' => [$platform->id],
        ]);

        // Create archived league (should not be returned)
        League::factory()->create([
            'owner_user_id' => $this->user->id,
            'visibility' => 'public',
            'status' => 'archived',
            'platform_ids' => [$platform->id],
        ]);

        $response = $this->getJson('/api/public/leagues');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonPath('data.data.0.id', $publicLeague->id)
            ->assertJsonPath('data.data.0.name', $publicLeague->name)
            ->assertJsonPath('data.data.0.slug', $publicLeague->slug)
            ->assertJsonCount(1, 'data.data');
    }

    public function test_index_excludes_private_leagues(): void
    {
        $platform = Platform::factory()->create(['is_active' => true]);

        // Create private league
        League::factory()->create([
            'owner_user_id' => $this->user->id,
            'visibility' => 'private',
            'status' => 'active',
            'platform_ids' => [$platform->id],
        ]);

        $response = $this->getJson('/api/public/leagues');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data.data');
    }

    public function test_index_excludes_inactive_leagues(): void
    {
        $platform = Platform::factory()->create(['is_active' => true]);

        // Create archived league (should not be returned)
        League::factory()->create([
            'owner_user_id' => $this->user->id,
            'visibility' => 'public',
            'status' => 'archived',
            'platform_ids' => [$platform->id],
        ]);

        $response = $this->getJson('/api/public/leagues');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data.data');
    }

    public function test_index_supports_search_filter(): void
    {
        $platform = Platform::factory()->create(['is_active' => true]);

        // Create leagues with different names
        League::factory()->create([
            'name' => 'GT7 Racing League',
            'owner_user_id' => $this->user->id,
            'visibility' => 'public',
            'status' => 'active',
            'platform_ids' => [$platform->id],
        ]);

        League::factory()->create([
            'name' => 'iRacing Championship',
            'owner_user_id' => $this->user->id,
            'visibility' => 'public',
            'status' => 'active',
            'platform_ids' => [$platform->id],
        ]);

        $response = $this->getJson('/api/public/leagues?search=GT7');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.name', 'GT7 Racing League');
    }

    public function test_index_supports_platform_filter(): void
    {
        // Create platforms
        $platform1 = Platform::factory()->create(['is_active' => true]);
        $platform2 = Platform::factory()->create(['is_active' => true]);

        // Create leagues with different platforms
        League::factory()->create([
            'owner_user_id' => $this->user->id,
            'visibility' => 'public',
            'status' => 'active',
            'platform_ids' => [$platform1->id],
        ]);

        League::factory()->create([
            'owner_user_id' => $this->user->id,
            'visibility' => 'public',
            'status' => 'active',
            'platform_ids' => [$platform2->id],
        ]);

        League::factory()->create([
            'owner_user_id' => $this->user->id,
            'visibility' => 'public',
            'status' => 'active',
            'platform_ids' => [$platform1->id, $platform2->id],
        ]);

        $response = $this->getJson("/api/public/leagues?platform_id={$platform1->id}");

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data.data');
    }

    public function test_index_supports_pagination(): void
    {
        $platform = Platform::factory()->create(['is_active' => true]);

        // Create 15 leagues
        League::factory()->count(15)->create([
            'owner_user_id' => $this->user->id,
            'visibility' => 'public',
            'status' => 'active',
            'platform_ids' => [$platform->id],
        ]);

        $response = $this->getJson('/api/public/leagues?per_page=10&page=1');

        $response->assertStatus(200)
            ->assertJsonCount(10, 'data.data')
            ->assertJsonPath('data.meta.total', 15)
            ->assertJsonPath('data.meta.per_page', 10)
            ->assertJsonPath('data.meta.current_page', 1)
            ->assertJsonPath('data.meta.last_page', 2);
    }

    public function test_index_validates_request_parameters(): void
    {
        // Invalid per_page (too large)
        $response = $this->getJson('/api/public/leagues?per_page=200');
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['per_page']);

        // Invalid page (negative)
        $response = $this->getJson('/api/public/leagues?page=0');
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['page']);

        // Invalid platform_id (non-existent)
        $response = $this->getJson('/api/public/leagues?platform_id=99999');
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['platform_id']);
    }

    public function test_index_does_not_expose_sensitive_fields(): void
    {
        $platform = Platform::factory()->create(['is_active' => true]);

        League::factory()->create([
            'owner_user_id' => $this->user->id,
            'visibility' => 'public',
            'status' => 'active',
            'platform_ids' => [$platform->id],
            'contact_email' => 'contact@league.com',
            'organizer_name' => 'John Doe',
        ]);

        $response = $this->getJson('/api/public/leagues');

        $response->assertStatus(200);

        // Assert that sensitive fields are NOT present
        $data = $response->json('data.data.0');
        $this->assertArrayNotHasKey('owner_user_id', $data);
        $this->assertArrayNotHasKey('owner', $data);
        $this->assertArrayNotHasKey('contact_email', $data);
        $this->assertArrayNotHasKey('organizer_name', $data);
        $this->assertArrayNotHasKey('status', $data);
        $this->assertArrayNotHasKey('visibility', $data);
        $this->assertArrayNotHasKey('timezone', $data);

        // Assert that public fields ARE present
        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('name', $data);
        $this->assertArrayHasKey('slug', $data);
        $this->assertArrayHasKey('platforms', $data);
        $this->assertArrayHasKey('competitions_count', $data);
        $this->assertArrayHasKey('drivers_count', $data);
    }

    public function test_index_includes_competitions_and_drivers_count(): void
    {
        $platform = Platform::factory()->create(['is_active' => true]);

        $league = League::factory()->create([
            'owner_user_id' => $this->user->id,
            'visibility' => 'public',
            'status' => 'active',
            'platform_ids' => [$platform->id],
        ]);

        $response = $this->getJson('/api/public/leagues');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'data' => [
                        '*' => [
                            'competitions_count',
                            'drivers_count',
                        ],
                    ],
                ],
            ]);
    }

    public function test_index_returns_empty_when_no_public_leagues(): void
    {
        $response = $this->getJson('/api/public/leagues');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data.data')
            ->assertJsonPath('data.meta.total', 0);
    }

    public function test_index_orders_by_name_alphabetically(): void
    {
        $platform = Platform::factory()->create(['is_active' => true]);

        League::factory()->create([
            'name' => 'Zebra Racing League',
            'owner_user_id' => $this->user->id,
            'visibility' => 'public',
            'status' => 'active',
            'platform_ids' => [$platform->id],
        ]);

        League::factory()->create([
            'name' => 'Alpha Racing League',
            'owner_user_id' => $this->user->id,
            'visibility' => 'public',
            'status' => 'active',
            'platform_ids' => [$platform->id],
        ]);

        League::factory()->create([
            'name' => 'Beta Racing League',
            'owner_user_id' => $this->user->id,
            'visibility' => 'public',
            'status' => 'active',
            'platform_ids' => [$platform->id],
        ]);

        $response = $this->getJson('/api/public/leagues');

        $response->assertStatus(200)
            ->assertJsonPath('data.data.0.name', 'Alpha Racing League')
            ->assertJsonPath('data.data.1.name', 'Beta Racing League')
            ->assertJsonPath('data.data.2.name', 'Zebra Racing League');
    }

    public function test_soft_deleted_leagues_not_in_public_index(): void
    {
        $platform = Platform::factory()->create(['is_active' => true]);

        // Create an active public league
        League::factory()->create([
            'name' => 'Active League',
            'owner_user_id' => $this->user->id,
            'visibility' => 'public',
            'status' => 'active',
            'platform_ids' => [$platform->id],
        ]);

        // Create a soft-deleted league
        /** @var League $deletedLeague */
        $deletedLeague = League::factory()->create([
            'name' => 'Deleted League',
            'owner_user_id' => $this->user->id,
            'visibility' => 'public',
            'status' => 'active',
            'platform_ids' => [$platform->id],
        ]);
        $deletedLeague->delete(); // Soft delete

        $response = $this->getJson('/api/public/leagues');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.name', 'Active League');

        // Verify the deleted league is not present in the results
        $data = $response->json('data.data');
        $leagueIds = array_column($data, 'id');
        $this->assertNotContains($deletedLeague->id, $leagueIds);
    }

    public function test_public_leagues_accessible_without_authentication(): void
    {
        $platform = Platform::factory()->create(['is_active' => true]);

        // Create public leagues
        League::factory()->count(3)->create([
            'owner_user_id' => $this->user->id,
            'visibility' => 'public',
            'status' => 'active',
            'platform_ids' => [$platform->id],
        ]);

        // Explicitly make request without authentication
        $response = $this->getJson('/api/public/leagues');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonCount(3, 'data.data');

        // Verify that no authentication headers are being sent
        $this->assertNull(auth('web')->user());
        $this->assertNull(auth('admin')->user());
    }
}
