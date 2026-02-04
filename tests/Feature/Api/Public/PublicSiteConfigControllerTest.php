<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Public;

use App\Infrastructure\Persistence\Eloquent\Models\SiteConfigModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicSiteConfigControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_public_site_config_successfully(): void
    {
        // Create an active site configuration
        SiteConfigModel::factory()->create([
            'user_registration_enabled' => true,
            'discord_link' => 'https://discord.gg/example',
            'maintenance_mode' => false,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/site-config');

        $response->assertStatus(200)
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

    public function test_returns_null_discord_url_when_not_set(): void
    {
        // Create an active site configuration without discord link
        SiteConfigModel::factory()->create([
            'user_registration_enabled' => true,
            'discord_link' => null,
            'maintenance_mode' => false,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/site-config');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user_registration_enabled' => true,
                    'discord_url' => null,
                    'maintenance_mode' => false,
                    'is_admin' => false,
                ],
            ]);
    }

    public function test_returns_false_when_registration_disabled(): void
    {
        // Create an active site configuration with registration disabled
        SiteConfigModel::factory()->create([
            'user_registration_enabled' => false,
            'discord_link' => 'https://discord.gg/example',
            'maintenance_mode' => false,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/site-config');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user_registration_enabled' => false,
                    'discord_url' => 'https://discord.gg/example',
                    'maintenance_mode' => false,
                    'is_admin' => false,
                ],
            ]);
    }

    public function test_does_not_expose_sensitive_configuration(): void
    {
        // Create an active site configuration with various fields
        SiteConfigModel::factory()->create([
            'user_registration_enabled' => true,
            'discord_link' => 'https://discord.gg/example',
            'maintenance_mode' => false,
            'google_analytics_id' => 'G-XXXXXXXXXX',
            'google_tag_manager_id' => 'GTM-XXXXXXX',
            'support_email' => 'support@example.com',
            'contact_email' => 'contact@example.com',
            'admin_email' => 'admin@example.com',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/site-config');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user_registration_enabled' => true,
                    'discord_url' => 'https://discord.gg/example',
                    'maintenance_mode' => false,
                    'is_admin' => false,
                ],
            ])
            // Ensure sensitive fields are NOT returned
            ->assertJsonMissing([
                'google_analytics_id' => 'G-XXXXXXXXXX',
            ])
            ->assertJsonMissing([
                'google_tag_manager_id' => 'GTM-XXXXXXX',
            ])
            ->assertJsonMissing([
                'support_email' => 'support@example.com',
            ])
            ->assertJsonMissing([
                'contact_email' => 'contact@example.com',
            ])
            ->assertJsonMissing([
                'admin_email' => 'admin@example.com',
            ]);

        // Verify only the expected keys are present
        $data = $response->json('data');
        $this->assertArrayHasKey('user_registration_enabled', $data);
        $this->assertArrayHasKey('discord_url', $data);
        $this->assertArrayHasKey('maintenance_mode', $data);
        $this->assertArrayHasKey('is_admin', $data);
        $this->assertCount(4, $data);
    }

    public function test_endpoint_is_publicly_accessible_without_authentication(): void
    {
        // Create an active site configuration
        SiteConfigModel::factory()->create([
            'user_registration_enabled' => true,
            'discord_link' => 'https://discord.gg/example',
            'maintenance_mode' => false,
            'is_active' => true,
        ]);

        // Make request without authentication
        $response = $this->getJson('/api/site-config');

        $response->assertStatus(200);
    }

    public function test_endpoint_is_rate_limited(): void
    {
        // Create an active site configuration
        SiteConfigModel::factory()->create([
            'user_registration_enabled' => true,
            'discord_link' => 'https://discord.gg/example',
            'maintenance_mode' => false,
            'is_active' => true,
        ]);

        // The route has throttle:60,1 middleware
        // Make 61 requests to test rate limiting
        for ($i = 0; $i < 61; $i++) {
            $response = $this->getJson('/api/site-config');

            if ($i < 60) {
                $response->assertStatus(200);
            } else {
                // The 61st request should be rate limited
                $response->assertStatus(429);
            }
        }
    }

    public function test_returns_true_when_maintenance_mode_enabled(): void
    {
        // Create an active site configuration with maintenance mode enabled
        SiteConfigModel::factory()->create([
            'user_registration_enabled' => true,
            'discord_link' => 'https://discord.gg/example',
            'maintenance_mode' => true,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/site-config');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user_registration_enabled' => true,
                    'discord_url' => 'https://discord.gg/example',
                    'maintenance_mode' => true,
                    'is_admin' => false,
                ],
            ]);
    }

    public function test_returns_is_admin_true_when_authenticated_as_admin(): void
    {
        // Create an active site configuration
        SiteConfigModel::factory()->create([
            'user_registration_enabled' => true,
            'discord_link' => 'https://discord.gg/example',
            'maintenance_mode' => true,
            'is_active' => true,
        ]);

        // Create and authenticate as an admin
        $admin = \App\Infrastructure\Persistence\Eloquent\Models\AdminEloquent::factory()->create();

        $response = $this->actingAs($admin, 'admin')->getJson('/api/site-config');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user_registration_enabled' => true,
                    'discord_url' => 'https://discord.gg/example',
                    'maintenance_mode' => true,
                    'is_admin' => true,
                ],
            ]);
    }

    public function test_returns_is_admin_false_when_authenticated_as_regular_user(): void
    {
        // Create an active site configuration
        SiteConfigModel::factory()->create([
            'user_registration_enabled' => true,
            'discord_link' => 'https://discord.gg/example',
            'maintenance_mode' => true,
            'is_active' => true,
        ]);

        // Create and authenticate as a regular user
        $user = \App\Infrastructure\Persistence\Eloquent\Models\UserEloquent::factory()->create();

        $response = $this->actingAs($user, 'web')->getJson('/api/site-config');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user_registration_enabled' => true,
                    'discord_url' => 'https://discord.gg/example',
                    'maintenance_mode' => true,
                    'is_admin' => false,
                ],
            ]);
    }
}
