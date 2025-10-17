<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

/**
 * Test that admin user management operations are properly logged.
 */
class AdminUserActivityLoggingTest extends TestCase
{
    use RefreshDatabase;

    private Admin $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = Admin::factory()->create([
            'role' => 'super_admin',
            'email' => 'superadmin@example.com',
        ]);

        // Clear creation activities
        Activity::query()->delete();
    }

    public function test_creating_admin_user_logs_activity(): void
    {
        $response = $this->actingAs($this->superAdmin, 'admin')
            ->postJson('/api/admin/admins', [
                'first_name' => 'New',
                'last_name' => 'Admin',
                'email' => 'newadmin@example.com',
                'role' => 'admin',
            ]);

        $response->assertStatus(201);

        // Verify activities were logged (both automatic and manual)
        $activities = Activity::query()
            ->where('log_name', 'admin')
            ->get();

        $this->assertTrue($activities->count() >= 1, 'At least one activity should be logged');

        // Check for the manual activity log from the controller
        $manualActivity = $activities->first(function ($activity) {
            return str_contains($activity->description, 'Created admin user');
        });

        $this->assertNotNull($manualActivity, 'Manual activity log should exist');
        $this->assertEquals($this->superAdmin->id, $manualActivity->causer_id);
        $this->assertArrayHasKey('admin_email', $manualActivity->properties->toArray());
        $this->assertEquals('newadmin@example.com', $manualActivity->properties['admin_email']);
    }

    public function test_updating_admin_user_logs_activity(): void
    {
        $admin = Admin::factory()->create([
            'role' => 'admin',
            'first_name' => 'Original',
        ]);

        Activity::query()->delete();

        $response = $this->actingAs($this->superAdmin, 'admin')
            ->putJson("/api/admin/admins/{$admin->id}", [
                'first_name' => 'Updated',
                'last_name' => $admin->last_name,
                'email' => $admin->email,
                'role' => $admin->role,
            ]);

        $response->assertStatus(200);

        // Verify activities were logged
        $activities = Activity::query()
            ->where('log_name', 'admin')
            ->get();

        $this->assertTrue($activities->count() >= 1, 'At least one activity should be logged');

        // Check for the manual activity log from the controller
        $manualActivity = $activities->first(function ($activity) {
            return str_contains($activity->description, 'Updated admin user');
        });

        $this->assertNotNull($manualActivity, 'Manual activity log should exist');
        $this->assertEquals($this->superAdmin->id, $manualActivity->causer_id);
        $this->assertArrayHasKey('updated_fields', $manualActivity->properties->toArray());
        $this->assertArrayHasKey('original_values', $manualActivity->properties->toArray());
        $this->assertArrayHasKey('new_values', $manualActivity->properties->toArray());

        // Verify the changes are tracked
        $this->assertEquals('Original', $manualActivity->properties['original_values']['first_name']);
        $this->assertEquals('Updated', $manualActivity->properties['new_values']['first_name']);
    }

    public function test_deleting_admin_user_logs_activity(): void
    {
        $admin = Admin::factory()->create([
            'role' => 'admin',
        ]);

        Activity::query()->delete();

        $response = $this->actingAs($this->superAdmin, 'admin')
            ->deleteJson("/api/admin/admins/{$admin->id}");

        $response->assertStatus(200);

        // Verify activities were logged
        $activities = Activity::query()
            ->where('log_name', 'admin')
            ->get();

        $this->assertTrue($activities->count() >= 1, 'At least one activity should be logged');

        // Check for the manual activity log from the controller
        $manualActivity = $activities->first(function ($activity) {
            return str_contains($activity->description, 'Deleted admin user');
        });

        $this->assertNotNull($manualActivity, 'Manual activity log should exist');
        $this->assertEquals($this->superAdmin->id, $manualActivity->causer_id);
        $this->assertArrayHasKey('admin_email', $manualActivity->properties->toArray());
        $this->assertArrayHasKey('admin_role', $manualActivity->properties->toArray());
        $this->assertArrayHasKey('deleted_by', $manualActivity->properties->toArray());
        $this->assertEquals($this->superAdmin->name, $manualActivity->properties['deleted_by']);
    }

    public function test_activity_log_contains_admin_who_performed_action(): void
    {
        $response = $this->actingAs($this->superAdmin, 'admin')
            ->postJson('/api/admin/admins', [
                'first_name' => 'Test',
                'last_name' => 'User',
                'email' => 'test@example.com',
                'role' => 'admin',
            ]);

        $response->assertStatus(201);

        // Get the manual activity log from the controller
        $activities = Activity::query()
            ->where('causer_id', $this->superAdmin->id)
            ->get();

        $manualActivity = $activities->first(function ($activity) {
            return str_contains($activity->description, 'Created admin user');
        });

        $this->assertNotNull($manualActivity);
        $this->assertEquals(Admin::class, $manualActivity->causer_type);
        $this->assertEquals($this->superAdmin->id, $manualActivity->causer_id);
        $this->assertArrayHasKey('created_by', $manualActivity->properties->toArray());
        $this->assertEquals($this->superAdmin->name, $manualActivity->properties['created_by']);
    }

    public function test_activity_includes_subject_model(): void
    {
        $response = $this->actingAs($this->superAdmin, 'admin')
            ->postJson('/api/admin/admins', [
                'first_name' => 'Test',
                'last_name' => 'User',
                'email' => 'test@example.com',
                'role' => 'admin',
            ]);

        $response->assertStatus(201);
        $newAdminId = $response->json('data.id');

        $activity = Activity::query()
            ->where('causer_id', $this->superAdmin->id)
            ->first();

        $this->assertNotNull($activity);
        $this->assertEquals(Admin::class, $activity->subject_type);
        $this->assertEquals($newAdminId, $activity->subject_id);
    }
}
