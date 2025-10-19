<?php

declare(strict_types=1);

namespace Tests\Feature\Http\Controllers\User;

use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaguePlatformsControllerTest extends TestCase
{
    use RefreshDatabase;

    private UserEloquent $user;
    private Platform $platform1;
    private Platform $platform2;
    private Platform $platform3;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = UserEloquent::factory()->create(['status' => 'active']);

        // Create platforms
        $this->platform1 = Platform::create([
            'name' => 'Gran Turismo 7',
            'slug' => 'gran-turismo-7',
            'description' => 'GT7 Platform',
            'logo_url' => 'https://example.com/gt7.png',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->platform2 = Platform::create([
            'name' => 'iRacing',
            'slug' => 'iracing',
            'description' => 'iRacing Platform',
            'logo_url' => 'https://example.com/iracing.png',
            'is_active' => true,
            'sort_order' => 2,
        ]);

        $this->platform3 = Platform::create([
            'name' => 'Assetto Corsa Competizione',
            'slug' => 'acc',
            'description' => 'ACC Platform',
            'logo_url' => 'https://example.com/acc.png',
            'is_active' => true,
            'sort_order' => 3,
        ]);
    }

    /**
     * Override to use app subdomain for all requests
     */
    public function getJson($uri, array $headers = [], $options = 0)
    {
        $url = 'http://app.virtualracingleagues.localhost' . $uri;
        return parent::getJson($url, $headers, $options);
    }

    /**
     * @test
     */
    public function it_returns_platforms_for_a_league(): void
    {
        $league = League::factory()->create([
            'owner_user_id' => $this->user->id,
            'platform_ids' => [$this->platform1->id, $this->platform2->id],
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson("/api/leagues/{$league->id}/platforms");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'name', 'slug', 'description', 'logo_url'],
                ],
            ])
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $this->platform1->id)
            ->assertJsonPath('data.0.name', 'Gran Turismo 7')
            ->assertJsonPath('data.0.slug', 'gran-turismo-7')
            ->assertJsonPath('data.1.id', $this->platform2->id)
            ->assertJsonPath('data.1.name', 'iRacing')
            ->assertJsonPath('data.1.slug', 'iracing');
    }

    /**
     * @test
     */
    public function it_returns_empty_array_when_league_has_no_platforms(): void
    {
        $league = League::factory()->create([
            'owner_user_id' => $this->user->id,
            'platform_ids' => [],
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson("/api/leagues/{$league->id}/platforms");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [],
            ]);
    }

    /**
     * @test
     */
    public function it_returns_only_active_platforms(): void
    {
        // Create inactive platform
        $inactivePlatform = Platform::create([
            'name' => 'Inactive Platform',
            'slug' => 'inactive',
            'is_active' => false,
            'sort_order' => 99,
        ]);

        $league = League::factory()->create([
            'owner_user_id' => $this->user->id,
            'platform_ids' => [$this->platform1->id, $inactivePlatform->id],
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson("/api/leagues/{$league->id}/platforms");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $this->platform1->id);
    }

    /**
     * @test
     */
    public function it_returns_platforms_in_correct_order(): void
    {
        $league = League::factory()->create([
            'owner_user_id' => $this->user->id,
            'platform_ids' => [$this->platform3->id, $this->platform1->id, $this->platform2->id],
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson("/api/leagues/{$league->id}/platforms");

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.id', $this->platform1->id) // sort_order 1
            ->assertJsonPath('data.1.id', $this->platform2->id) // sort_order 2
            ->assertJsonPath('data.2.id', $this->platform3->id); // sort_order 3
    }

    /**
     * @test
     */
    public function it_returns_404_when_league_not_found(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->getJson('/api/leagues/99999/platforms');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'League not found.',
            ]);
    }

    /**
     * @test
     */
    public function it_requires_authentication(): void
    {
        $league = League::factory()->create([
            'owner_user_id' => $this->user->id,
            'platform_ids' => [$this->platform1->id],
        ]);

        $response = $this->getJson("/api/leagues/{$league->id}/platforms");

        $response->assertStatus(401);
    }
}
