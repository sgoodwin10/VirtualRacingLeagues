<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Infrastructure\Persistence\Eloquent\Models\SiteConfigModel;
use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SiteConfigControllerTest extends TestCase
{
    use RefreshDatabase;

    private Admin $superAdmin;

    private Admin $regularAdmin;

    private SiteConfigModel $config;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test admins
        $this->superAdmin = Admin::create([
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'super@example.com',
            'password' => 'password',
            'role' => 'super_admin',
            'status' => 'active',
        ]);

        $this->regularAdmin = Admin::create([
            'first_name' => 'Regular',
            'last_name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => 'password',
            'role' => 'admin',
            'status' => 'active',
        ]);

        // Create default site config
        $this->config = SiteConfigModel::create([
            'site_name' => 'Test Application',
            'timezone' => 'UTC',
            'maintenance_mode' => false,
            'user_registration_enabled' => true,
            'is_active' => true,
        ]);

        // Clear cache before each test
        Cache::flush();

        // Set up fake storage
        Storage::fake('public');
    }

    public function test_super_admin_can_view_site_config(): void
    {
        $response = $this->actingAs($this->superAdmin, 'admin')
            ->getJson('/api/admin/site-config');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'site_name' => 'Test Application',
                    'timezone' => 'UTC',
                    'maintenance_mode' => false,
                ],
            ]);
    }

    public function test_regular_admin_cannot_view_site_config(): void
    {
        $response = $this->actingAs($this->regularAdmin, 'admin')
            ->getJson('/api/admin/site-config');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Forbidden. Only super admins can access this resource.',
            ]);
    }

    public function test_unauthenticated_user_cannot_view_site_config(): void
    {
        $response = $this->getJson('/api/admin/site-config');

        $response->assertStatus(401);
    }

    public function test_super_admin_can_update_site_config(): void
    {
        $response = $this->actingAs($this->superAdmin, 'admin')
            ->putJson('/api/admin/site-config', [
                'site_name' => 'Updated Application',
                'timezone' => 'America/New_York',
                'maintenance_mode' => true,
                'user_registration_enabled' => false,
                'google_tag_manager_id' => 'GTM-ABC123',
                'google_analytics_id' => 'G-ABCD1234',
                'support_email' => 'support@example.com',
                'contact_email' => 'contact@example.com',
                'admin_email' => 'admin@example.com',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Site configuration updated successfully',
                'data' => [
                    'site_name' => 'Updated Application',
                    'timezone' => 'America/New_York',
                    'maintenance_mode' => true,
                ],
            ]);

        // Verify database was updated
        $this->assertDatabaseHas('site_configs', [
            'site_name' => 'Updated Application',
            'timezone' => 'America/New_York',
            'maintenance_mode' => true,
        ]);
    }

    public function test_regular_admin_cannot_update_site_config(): void
    {
        $response = $this->actingAs($this->regularAdmin, 'admin')
            ->putJson('/api/admin/site-config', [
                'site_name' => 'Should Not Work',
                'timezone' => 'UTC',
                'maintenance_mode' => false,
                'user_registration_enabled' => true,
            ]);

        $response->assertStatus(403);
    }

    public function test_validation_fails_for_invalid_site_name(): void
    {
        $response = $this->actingAs($this->superAdmin, 'admin')
            ->putJson('/api/admin/site-config', [
                'site_name' => '', // Invalid: empty
                'timezone' => 'UTC',
                'maintenance_mode' => false,
                'user_registration_enabled' => true,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['site_name']);
    }

    public function test_validation_fails_for_invalid_timezone(): void
    {
        $response = $this->actingAs($this->superAdmin, 'admin')
            ->putJson('/api/admin/site-config', [
                'site_name' => 'Test',
                'timezone' => 'Invalid/Timezone',
                'maintenance_mode' => false,
                'user_registration_enabled' => true,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['timezone']);
    }

    public function test_validation_fails_for_invalid_email(): void
    {
        $response = $this->actingAs($this->superAdmin, 'admin')
            ->putJson('/api/admin/site-config', [
                'site_name' => 'Test',
                'timezone' => 'UTC',
                'maintenance_mode' => false,
                'user_registration_enabled' => true,
                'support_email' => 'invalid-email',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['support_email']);
    }

    public function test_validation_fails_for_invalid_tracking_ids(): void
    {
        $response = $this->actingAs($this->superAdmin, 'admin')
            ->putJson('/api/admin/site-config', [
                'site_name' => 'Test',
                'timezone' => 'UTC',
                'maintenance_mode' => false,
                'user_registration_enabled' => true,
                'google_tag_manager_id' => 'INVALID',
                'google_analytics_id' => 'INVALID',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['google_tag_manager_id', 'google_analytics_id']);
    }

    public function test_can_upload_logo_file(): void
    {
        if (! function_exists('imagejpeg')) {
            $this->markTestSkipped('GD extension not available');
        }

        $file = UploadedFile::fake()->image('logo.png', 100, 100)->size(500);

        $response = $this->actingAs($this->superAdmin, 'admin')
            ->put('/api/admin/site-config', [
                'site_name' => 'Test',
                'timezone' => 'UTC',
                'maintenance_mode' => false,
                'user_registration_enabled' => true,
                'logo' => $file,
            ]);

        $response->assertStatus(200);

        // Verify file was stored
        $this->assertDatabaseHas('site_config_files', [
            'site_config_id' => $this->config->id,
            'file_type' => 'logo',
        ]);
    }

    public function test_validation_fails_for_invalid_file_type(): void
    {
        $file = UploadedFile::fake()->create('document.pdf', 100);

        $response = $this->actingAs($this->superAdmin, 'admin')
            ->put('/api/admin/site-config', [
                'site_name' => 'Test',
                'timezone' => 'UTC',
                'maintenance_mode' => false,
                'user_registration_enabled' => true,
                'logo' => $file,
            ]);

        // Laravel file uploads with PUT can return 302 or 422 depending on how request is parsed
        $this->assertContains($response->status(), [302, 422]);

        // Verify validation error exists in session if it's a redirect
        if ($response->status() === 302) {
            $this->assertNotEmpty(session('errors'));
        }
    }

    public function test_validation_fails_for_file_too_large(): void
    {
        if (! function_exists('imagejpeg')) {
            $this->markTestSkipped('GD extension not available');
        }

        $file = UploadedFile::fake()->image('logo.png')->size(3000); // 3MB - exceeds 2MB limit

        $response = $this->actingAs($this->superAdmin, 'admin')
            ->put('/api/admin/site-config', [
                'site_name' => 'Test',
                'timezone' => 'UTC',
                'maintenance_mode' => false,
                'user_registration_enabled' => true,
                'logo' => $file,
            ]);

        // Laravel file uploads with PUT can return 302 or 422 depending on how request is parsed
        $this->assertContains($response->status(), [302, 422]);

        // Verify validation error exists in session if it's a redirect
        if ($response->status() === 302) {
            $this->assertNotEmpty(session('errors'));
        }
    }

    public function test_cache_is_invalidated_after_update(): void
    {
        // First request to populate cache
        $this->actingAs($this->superAdmin, 'admin')
            ->getJson('/api/admin/site-config');

        $this->assertTrue(Cache::has('site_config:active'));

        // Update config
        $this->actingAs($this->superAdmin, 'admin')
            ->putJson('/api/admin/site-config', [
                'site_name' => 'Updated Name',
                'timezone' => 'UTC',
                'maintenance_mode' => false,
                'user_registration_enabled' => true,
            ]);

        // Cache should be cleared after update
        // Note: Cache is repopulated on next read, so we check the value changed
        $response = $this->actingAs($this->superAdmin, 'admin')
            ->getJson('/api/admin/site-config');

        $response->assertJson([
            'data' => [
                'site_name' => 'Updated Name',
            ],
        ]);
    }

    public function test_activity_is_logged_when_site_config_is_updated(): void
    {
        $this->actingAs($this->superAdmin, 'admin')
            ->putJson('/api/admin/site-config', [
                'site_name' => 'Activity Test',
                'timezone' => 'America/Los_Angeles',
                'maintenance_mode' => true,
                'user_registration_enabled' => false,
            ]);

        // Verify activity log was created
        $this->assertDatabaseHas('activity_log', [
            'log_name' => 'admin',
            'description' => 'Admin updated site configuration',
            'causer_type' => Admin::class,
            'causer_id' => $this->superAdmin->id,
        ]);

        // Verify the activity log contains the correct properties
        $activity = \Spatie\Activitylog\Models\Activity::where('description', 'Admin updated site configuration')
            ->latest()
            ->first();

        $this->assertNotNull($activity);
        $this->assertEquals('admin', $activity->log_name);
        $this->assertEquals($this->superAdmin->id, $activity->causer_id);
        $this->assertIsArray($activity->properties->toArray());
        $this->assertArrayHasKey('changes', $activity->properties);
        $this->assertArrayHasKey('admin_name', $activity->properties);
        $this->assertArrayHasKey('ip_address', $activity->properties);

        // Verify changes were logged correctly
        $changes = $activity->properties['changes'];
        $this->assertEquals('Activity Test', $changes['site_name']);
        $this->assertEquals('America/Los_Angeles', $changes['timezone']);
        $this->assertTrue($changes['maintenance_mode']);
        $this->assertFalse($changes['user_registration_enabled']);

        // Verify admin name is logged
        $this->assertEquals($this->superAdmin->name, $activity->properties['admin_name']);
    }

    public function test_activity_log_excludes_file_uploads(): void
    {
        $file = UploadedFile::fake()->image('logo.png', 100, 100)->size(500);

        $this->actingAs($this->superAdmin, 'admin')
            ->put('/api/admin/site-config', [
                'site_name' => 'File Upload Test',
                'timezone' => 'UTC',
                'maintenance_mode' => false,
                'user_registration_enabled' => true,
                'logo' => $file,
            ]);

        // Verify activity log was created
        $activity = \Spatie\Activitylog\Models\Activity::where('description', 'Admin updated site configuration')
            ->latest()
            ->first();

        $this->assertNotNull($activity);

        // Verify file upload fields are not included in the logged changes
        $changes = $activity->properties['changes'];
        $this->assertArrayNotHasKey('logo', $changes);
        $this->assertArrayNotHasKey('favicon', $changes);

        // Verify other fields are still logged
        $this->assertEquals('File Upload Test', $changes['site_name']);
    }
}
