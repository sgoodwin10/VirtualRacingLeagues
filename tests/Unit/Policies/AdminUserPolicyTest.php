<?php

declare(strict_types=1);

namespace Tests\Unit\Policies;

use App\Models\Admin;
use App\Policies\AdminPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserPolicyTest extends TestCase
{
    use RefreshDatabase;

    private AdminPolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        // Resolve AdminPolicy from container to inject dependencies
        $this->policy = app(AdminPolicy::class);
    }

    // viewAny tests
    public function test_super_admin_can_view_any(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);

        $response = $this->policy->viewAny($superAdmin);

        $this->assertTrue($response->allowed());
    }

    public function test_admin_can_view_any(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);

        $response = $this->policy->viewAny($admin);

        $this->assertTrue($response->allowed());
    }

    public function test_moderator_cannot_view_any(): void
    {
        $moderator = Admin::factory()->create(['role' => 'moderator']);

        $response = $this->policy->viewAny($moderator);

        $this->assertTrue($response->denied());
        $this->assertEquals('Forbidden. Moderators do not have access to admin user management.', $response->message());
    }

    // view tests
    public function test_super_admin_can_view_any_admin(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);
        $targetAdmin = Admin::factory()->create(['role' => 'admin']);

        $response = $this->policy->view($superAdmin, $targetAdmin);

        $this->assertTrue($response->allowed());
    }

    public function test_admin_can_view_lower_role_admin(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);
        $moderator = Admin::factory()->create(['role' => 'moderator']);

        $response = $this->policy->view($admin, $moderator);

        $this->assertTrue($response->allowed());
    }

    public function test_admin_cannot_view_super_admin(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);

        $response = $this->policy->view($admin, $superAdmin);

        $this->assertTrue($response->denied());
        $this->assertEquals('Forbidden. You do not have permission to view this admin user.', $response->message());
    }

    public function test_moderator_cannot_view_any_admin(): void
    {
        $moderator = Admin::factory()->create(['role' => 'moderator']);
        $admin = Admin::factory()->create(['role' => 'admin']);

        $response = $this->policy->view($moderator, $admin);

        $this->assertTrue($response->denied());
        $this->assertEquals('Forbidden. Moderators do not have access to admin user management.', $response->message());
    }

    // create tests
    public function test_super_admin_can_create(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);

        $response = $this->policy->create($superAdmin);

        $this->assertTrue($response->allowed());
    }

    public function test_admin_can_create(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);

        $response = $this->policy->create($admin);

        $this->assertTrue($response->allowed());
    }

    public function test_moderator_cannot_create(): void
    {
        $moderator = Admin::factory()->create(['role' => 'moderator']);

        $response = $this->policy->create($moderator);

        $this->assertTrue($response->denied());
        $this->assertEquals('Forbidden. Moderators do not have permission to create admin users.', $response->message());
    }

    // update tests
    public function test_super_admin_can_update_any_admin(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);
        $targetAdmin = Admin::factory()->create(['role' => 'admin']);

        $response = $this->policy->update($superAdmin, $targetAdmin);

        $this->assertTrue($response->allowed());
    }

    public function test_admin_can_update_lower_role_admin(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);
        $moderator = Admin::factory()->create(['role' => 'moderator']);

        $response = $this->policy->update($admin, $moderator);

        $this->assertTrue($response->allowed());
    }

    public function test_admin_cannot_update_super_admin(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);

        $response = $this->policy->update($admin, $superAdmin);

        $this->assertTrue($response->denied());
        $this->assertEquals('Forbidden. You do not have permission to update this admin user.', $response->message());
    }

    public function test_moderator_cannot_update_any_admin(): void
    {
        $moderator = Admin::factory()->create(['role' => 'moderator']);
        $admin = Admin::factory()->create(['role' => 'admin']);

        $response = $this->policy->update($moderator, $admin);

        $this->assertTrue($response->denied());
        $this->assertEquals('Forbidden. Moderators do not have access to admin user management.', $response->message());
    }

    // delete tests
    public function test_super_admin_can_delete_other_admin(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);
        $targetAdmin = Admin::factory()->create(['role' => 'admin']);

        $response = $this->policy->delete($superAdmin, $targetAdmin);

        $this->assertTrue($response->allowed());
    }

    public function test_admin_can_delete_lower_role_admin(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);
        $moderator = Admin::factory()->create(['role' => 'moderator']);

        $response = $this->policy->delete($admin, $moderator);

        $this->assertTrue($response->allowed());
    }

    public function test_admin_cannot_delete_super_admin(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);

        $response = $this->policy->delete($admin, $superAdmin);

        $this->assertTrue($response->denied());
        $this->assertEquals('Forbidden. You do not have permission to delete this admin user.', $response->message());
    }

    public function test_cannot_delete_self(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);

        $response = $this->policy->delete($admin, $admin);

        $this->assertTrue($response->denied());
        $this->assertEquals('You cannot delete your own account.', $response->message());
    }

    public function test_moderator_cannot_delete_any_admin(): void
    {
        $moderator = Admin::factory()->create(['role' => 'moderator']);
        $admin = Admin::factory()->create(['role' => 'admin']);

        $response = $this->policy->delete($moderator, $admin);

        $this->assertTrue($response->denied());
        $this->assertEquals('Forbidden. Moderators do not have access to admin user management.', $response->message());
    }

    // restore tests
    public function test_super_admin_can_restore_any_admin(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);
        $targetAdmin = Admin::factory()->create(['role' => 'admin', 'status' => 'inactive']);

        $response = $this->policy->restore($superAdmin, $targetAdmin);

        $this->assertTrue($response->allowed());
    }

    public function test_admin_can_restore_lower_role_admin(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);
        $moderator = Admin::factory()->create(['role' => 'moderator', 'status' => 'inactive']);

        $response = $this->policy->restore($admin, $moderator);

        $this->assertTrue($response->allowed());
    }

    public function test_admin_cannot_restore_super_admin(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);
        $superAdmin = Admin::factory()->create(['role' => 'super_admin', 'status' => 'inactive']);

        $response = $this->policy->restore($admin, $superAdmin);

        $this->assertTrue($response->denied());
        $this->assertEquals('Forbidden. You do not have permission to restore this admin user.', $response->message());
    }

    public function test_moderator_cannot_restore_any_admin(): void
    {
        $moderator = Admin::factory()->create(['role' => 'moderator']);
        $admin = Admin::factory()->create(['role' => 'admin', 'status' => 'inactive']);

        $response = $this->policy->restore($moderator, $admin);

        $this->assertTrue($response->denied());
        $this->assertEquals('Forbidden. Moderators do not have access to admin user management.', $response->message());
    }

    // forceDelete tests
    public function test_super_admin_can_force_delete_other_admin(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);
        $targetAdmin = Admin::factory()->create(['role' => 'admin']);

        $response = $this->policy->forceDelete($superAdmin, $targetAdmin);

        $this->assertTrue($response->allowed());
    }

    public function test_admin_can_force_delete_lower_role_admin(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);
        $moderator = Admin::factory()->create(['role' => 'moderator']);

        $response = $this->policy->forceDelete($admin, $moderator);

        $this->assertTrue($response->allowed());
    }

    public function test_cannot_force_delete_self(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);

        $response = $this->policy->forceDelete($admin, $admin);

        $this->assertTrue($response->denied());
        $this->assertEquals('You cannot permanently delete your own account.', $response->message());
    }

    public function test_admin_cannot_force_delete_super_admin(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);

        $response = $this->policy->forceDelete($admin, $superAdmin);

        $this->assertTrue($response->denied());
        $this->assertEquals('Forbidden. You do not have permission to permanently delete this admin user.', $response->message());
    }
}
