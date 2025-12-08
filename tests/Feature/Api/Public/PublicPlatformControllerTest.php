<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Public;

use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicPlatformControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_active_platforms_only(): void
    {
        // Create active platforms
        $activePlatform1 = Platform::factory()->create([
            'name' => 'GT7',
            'slug' => 'gt7',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $activePlatform2 = Platform::factory()->create([
            'name' => 'iRacing',
            'slug' => 'iracing',
            'is_active' => true,
            'sort_order' => 2,
        ]);

        // Create inactive platform (should not be returned)
        Platform::factory()->create([
            'name' => 'Inactive Platform',
            'slug' => 'inactive-platform',
            'is_active' => false,
            'sort_order' => 3,
        ]);

        $response = $this->getJson('/api/public/platforms');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonCount(2, 'data');

        // Assert only active platforms are returned
        $data = $response->json('data');
        $platformIds = array_column($data, 'id');

        $this->assertContains($activePlatform1->id, $platformIds);
        $this->assertContains($activePlatform2->id, $platformIds);
    }

    public function test_index_returns_platforms_ordered_by_sort_order(): void
    {
        // Create platforms with different sort orders
        Platform::factory()->create([
            'name' => 'Platform C',
            'slug' => 'platform-c',
            'is_active' => true,
            'sort_order' => 3,
        ]);

        Platform::factory()->create([
            'name' => 'Platform A',
            'slug' => 'platform-a',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        Platform::factory()->create([
            'name' => 'Platform B',
            'slug' => 'platform-b',
            'is_active' => true,
            'sort_order' => 2,
        ]);

        $response = $this->getJson('/api/public/platforms');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.name', 'Platform A')
            ->assertJsonPath('data.1.name', 'Platform B')
            ->assertJsonPath('data.2.name', 'Platform C');
    }

    public function test_index_returns_only_required_fields(): void
    {
        Platform::factory()->create([
            'name' => 'GT7',
            'slug' => 'gt7',
            'description' => 'Gran Turismo 7',
            'logo_url' => 'https://example.com/logo.png',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $response = $this->getJson('/api/public/platforms');

        $response->assertStatus(200);

        $data = $response->json('data.0');

        // Assert required fields are present
        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('name', $data);
        $this->assertArrayHasKey('slug', $data);

        // Assert extra fields are not present (we only select id, name, slug)
        $this->assertArrayNotHasKey('description', $data);
        $this->assertArrayNotHasKey('logo_url', $data);
        $this->assertArrayNotHasKey('is_active', $data);
        $this->assertArrayNotHasKey('sort_order', $data);
        $this->assertArrayNotHasKey('created_at', $data);
        $this->assertArrayNotHasKey('updated_at', $data);
    }

    public function test_index_returns_empty_array_when_no_active_platforms(): void
    {
        // Create only inactive platforms
        Platform::factory()->count(3)->create([
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/public/platforms');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_index_does_not_require_authentication(): void
    {
        Platform::factory()->create([
            'is_active' => true,
        ]);

        // Make request without authentication
        $response = $this->getJson('/api/public/platforms');

        $response->assertStatus(200);
    }
}
