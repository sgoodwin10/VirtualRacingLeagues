<?php

declare(strict_types=1);

namespace Tests\Feature\Http\Controllers\User;

use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SiteConfigControllerTest extends UserControllerTestCase
{
    use RefreshDatabase;

    private UserEloquent $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = UserEloquent::factory()->create([
            'status' => 'active',
        ]);
    }

    #[Test]
    public function it_returns_site_configuration(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->getJson('/api/site-config');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'site_name',
                    'site_url',
                    'timezone',
                    'locale',
                    'google_analytics_id',
                ],
            ]);
    }

    #[Test]
    public function it_returns_correct_config_values(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->getJson('/api/site-config');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'site_name' => config('app.name'),
                    'site_url' => config('app.url'),
                    'timezone' => config('app.timezone'),
                    'locale' => config('app.locale'),
                ],
            ]);
    }

    #[Test]
    public function it_returns_google_analytics_id_when_configured(): void
    {
        config(['services.google_analytics.tracking_id' => 'G-XXXXXXXXXX']);

        $response = $this->actingAs($this->user, 'web')
            ->getJson('/api/site-config');

        $response->assertOk()
            ->assertJsonPath('data.google_analytics_id', 'G-XXXXXXXXXX');
    }

    #[Test]
    public function it_returns_null_for_google_analytics_id_when_not_configured(): void
    {
        config(['services.google_analytics.tracking_id' => null]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson('/api/site-config');

        $response->assertOk()
            ->assertJsonPath('data.google_analytics_id', null);
    }

    #[Test]
    public function it_requires_authentication(): void
    {
        $response = $this->getJson('/api/site-config');

        $response->assertUnauthorized();
    }

    // Note: Authentication is enforced by middleware in routes/subdomain.php
    // The /api/site-config route is protected by ['auth:web', 'user.authenticate'] middleware
}
