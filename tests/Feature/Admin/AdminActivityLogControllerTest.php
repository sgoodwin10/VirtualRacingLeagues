<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Admin;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminActivityLogControllerTest extends TestCase
{
    use RefreshDatabase;

    private Admin $superAdmin;
    private Admin $regularAdmin;
    private ActivityLogService $activityLogService;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test admins
        $this->superAdmin = Admin::factory()->create([
            'role' => 'super_admin',
            'email' => 'superadmin@example.com',
        ]);

        $this->regularAdmin = Admin::factory()->create([
            'role' => 'admin',
            'email' => 'admin@example.com',
        ]);

        $this->activityLogService = new ActivityLogService();
    }

    public function test_can_get_all_activities(): void
    {
        // Create some activities
        $user = User::factory()->create();
        $this->activityLogService->logUserActivity($user, 'User logged in', $user);
        $this->activityLogService->logAdminActivity($this->superAdmin, 'Admin action', $user);

        $response = $this->actingAs($this->superAdmin, 'admin')
            ->getJson('/api/admin/activities');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'log_name',
                        'description',
                        'subject_type',
                        'subject_id',
                        'causer_type',
                        'causer_id',
                        'properties',
                        'created_at',
                    ],
                ],
            ]);
    }

    public function test_can_get_admin_activities_only(): void
    {
        // Create activities
        $user = User::factory()->create();
        $this->activityLogService->logUserActivity($user, 'User action', $user);
        $this->activityLogService->logAdminActivity($this->superAdmin, 'Admin action', $user);
        $this->activityLogService->logAdminActivity($this->regularAdmin, 'Another admin action', $user);

        $response = $this->actingAs($this->superAdmin, 'admin')
            ->getJson('/api/admin/activities/admins');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
            ]);

        $data = $response->json('data');
        $this->assertIsArray($data);

        // Verify all activities are from admin log
        foreach ($data as $activity) {
            $this->assertEquals('admin', $activity['log_name']);
        }
    }

    public function test_can_get_user_activities_only(): void
    {
        // Create activities
        $user = User::factory()->create();
        $this->activityLogService->logUserActivity($user, 'User action', $user);
        $this->activityLogService->logAdminActivity($this->superAdmin, 'Admin action', $user);

        $response = $this->actingAs($this->superAdmin, 'admin')
            ->getJson('/api/admin/activities/users');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
            ]);

        $data = $response->json('data');
        $this->assertIsArray($data);

        // Verify all activities are from user log
        foreach ($data as $activity) {
            $this->assertEquals('user', $activity['log_name']);
        }
    }

    public function test_can_get_activities_for_specific_admin(): void
    {
        $user = User::factory()->create();

        // Create activities for different admins
        $this->activityLogService->logAdminActivity($this->superAdmin, 'Super admin action', $user);
        $this->activityLogService->logAdminActivity($this->regularAdmin, 'Regular admin action', $user);

        $response = $this->actingAs($this->superAdmin, 'admin')
            ->getJson("/api/admin/activities/admin/{$this->regularAdmin->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
            ]);

        $data = $response->json('data');

        // Verify all activities are from the regular admin
        foreach ($data as $activity) {
            $this->assertEquals($this->regularAdmin->id, $activity['causer_id']);
            $this->assertEquals(Admin::class, $activity['causer_type']);
        }
    }

    public function test_can_get_activities_for_specific_user(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        // Create activities for different users
        $this->activityLogService->logUserActivity($user1, 'User 1 action', $user1);
        $this->activityLogService->logUserActivity($user2, 'User 2 action', $user2);

        $response = $this->actingAs($this->superAdmin, 'admin')
            ->getJson("/api/admin/activities/user/{$user1->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
            ]);

        $data = $response->json('data');

        // Verify all activities are from user1
        foreach ($data as $activity) {
            $this->assertEquals($user1->id, $activity['causer_id']);
            $this->assertEquals(User::class, $activity['causer_type']);
        }
    }

    public function test_can_get_single_activity_detail(): void
    {
        $user = User::factory()->create();
        $activity = $this->activityLogService->logAdminActivity(
            $this->superAdmin,
            'Test action',
            $user,
            ['test_property' => 'test_value']
        );

        $response = $this->actingAs($this->superAdmin, 'admin')
            ->getJson("/api/admin/activities/{$activity->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'log_name',
                    'description',
                    'properties',
                ],
            ])
            ->assertJson([
                'data' => [
                    'id' => $activity->id,
                    'description' => 'Test action',
                ],
            ]);
    }

    public function test_can_clean_old_logs(): void
    {
        // Create some old activities
        $user = User::factory()->create();
        $this->activityLogService->logUserActivity($user, 'Old activity', $user);

        $response = $this->actingAs($this->superAdmin, 'admin')
            ->postJson('/api/admin/activities/clean', [
                'days' => 365,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'deleted_count',
                ],
            ]);
    }

    public function test_activities_require_authentication(): void
    {
        $response = $this->getJson('/api/admin/activities');

        $response->assertStatus(401);
    }

    public function test_can_limit_activities(): void
    {
        $user = User::factory()->create();

        // Create multiple activities
        for ($i = 0; $i < 10; $i++) {
            $this->activityLogService->logUserActivity($user, "Activity {$i}", $user);
        }

        $response = $this->actingAs($this->superAdmin, 'admin')
            ->getJson('/api/admin/activities?limit=5');

        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(5, $data);
    }

    public function test_can_filter_activities_by_log_name(): void
    {
        $user = User::factory()->create();

        $this->activityLogService->logUserActivity($user, 'User action', $user);
        $this->activityLogService->logAdminActivity($this->superAdmin, 'Admin action', $user);

        $response = $this->actingAs($this->superAdmin, 'admin')
            ->getJson('/api/admin/activities?log_name=user');

        $response->assertStatus(200);

        $data = $response->json('data');

        // Verify all activities have the user log name
        foreach ($data as $activity) {
            $this->assertEquals('user', $activity['log_name']);
        }
    }
}
