<?php

declare(strict_types=1);

namespace Tests\Feature\Http\Controllers\User;

use App\Infrastructure\Persistence\Eloquent\Models\AdminEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SiteConfigModel;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;

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
        SiteConfigModel::factory()->create([
            'user_registration_enabled' => true,
            'discord_link' => 'https://discord.gg/example',
            'maintenance_mode' => false,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson('/api/site-config');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'user_registration_enabled',
                    'discord_url',
                    'maintenance_mode',
                    'is_admin',
                ],
            ]);
    }

    #[Test]
    public function it_returns_correct_config_values(): void
    {
        SiteConfigModel::factory()->create([
            'user_registration_enabled' => true,
            'discord_link' => 'https://discord.gg/example',
            'maintenance_mode' => false,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson('/api/site-config');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'user_registration_enabled' => true,
                    'discord_url' => 'https://discord.gg/example',
                    'maintenance_mode' => false,
                    'is_admin' => false,
                ],
            ]);
    }

    #[Test]
    public function it_returns_maintenance_mode_when_enabled(): void
    {
        SiteConfigModel::factory()->create([
            'user_registration_enabled' => true,
            'discord_link' => 'https://discord.gg/example',
            'maintenance_mode' => true,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson('/api/site-config');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'maintenance_mode' => true,
                    'is_admin' => false,
                ],
            ]);
    }

    #[Test]
    public function it_returns_is_admin_false_for_regular_users(): void
    {
        SiteConfigModel::factory()->create([
            'user_registration_enabled' => true,
            'discord_link' => 'https://discord.gg/example',
            'maintenance_mode' => true,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson('/api/site-config');

        $response->assertOk()
            ->assertJsonPath('data.is_admin', false);
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
