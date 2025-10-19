<?php

declare(strict_types=1);

namespace Tests\Feature\Http\Controllers\User;

use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlatformControllerTest extends TestCase
{
    use RefreshDatabase;

    private UserEloquent $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = UserEloquent::factory()->create();
    }

    /**
     * @test
     */
    public function it_returns_active_platforms(): void
    {
        // Create active platforms
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

        // Create inactive platform (should not be returned)
        Platform::create([
            'name' => 'Inactive Platform',
            'slug' => 'inactive',
            'is_active' => false,
            'sort_order' => 3,
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson('/api/platforms');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'name', 'slug'],
                ],
            ])
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'iRacing')
            ->assertJsonPath('data.1.name', 'Assetto Corsa Competizione');
    }

    /**
     * @test
     */
    public function it_returns_platforms_ordered_by_sort_order(): void
    {
        Platform::create([
            'name' => 'Platform C',
            'slug' => 'platform-c',
            'is_active' => true,
            'sort_order' => 30,
        ]);

        Platform::create([
            'name' => 'Platform A',
            'slug' => 'platform-a',
            'is_active' => true,
            'sort_order' => 10,
        ]);

        Platform::create([
            'name' => 'Platform B',
            'slug' => 'platform-b',
            'is_active' => true,
            'sort_order' => 20,
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson('/api/platforms');

        $response->assertOk()
            ->assertJsonPath('data.0.name', 'Platform A')
            ->assertJsonPath('data.1.name', 'Platform B')
            ->assertJsonPath('data.2.name', 'Platform C');
    }

    /**
     * @test
     */
    public function it_returns_only_id_name_and_slug_fields(): void
    {
        Platform::create([
            'name' => 'iRacing',
            'slug' => 'iracing',
            'description' => 'The premier online racing simulation',
            'logo_url' => 'https://example.com/logo.png',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson('/api/platforms');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'slug'],
                ],
            ]);

        // Ensure description and logo_url are not returned
        $data = $response->json('data.0');
        $this->assertArrayNotHasKey('description', $data);
        $this->assertArrayNotHasKey('logo_url', $data);
        $this->assertArrayNotHasKey('is_active', $data);
        $this->assertArrayNotHasKey('sort_order', $data);
    }

    /**
     * @test
     */
    public function it_returns_empty_array_when_no_active_platforms_exist(): void
    {
        Platform::create([
            'name' => 'Inactive Platform',
            'slug' => 'inactive',
            'is_active' => false,
            'sort_order' => 1,
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson('/api/platforms');

        $response->assertOk()
            ->assertJsonCount(0, 'data');
    }

    // Note: Authentication is enforced by middleware in routes/subdomain.php
    // The /api/platforms route is protected by ['auth:web', 'user.authenticate'] middleware
}
