<?php

declare(strict_types=1);

namespace Tests\Feature\Http\Controllers\Admin;

use App\Infrastructure\Persistence\Eloquent\Models\Driver;
use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for Admin Driver Controller.
 * Tests the admin dashboard's global driver management functionality.
 */
final class DriverControllerTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();

        // Create and authenticate as admin
        $this->admin = Admin::factory()->create([
            'role' => 'super_admin',
        ]);
    }

    public function test_can_list_all_drivers(): void
    {
        Driver::factory()->count(5)->create();

        $response = $this->actingAs($this->admin, 'admin')
            ->getJson('/api/admin/drivers');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'first_name',
                    'last_name',
                    'nickname',
                    'display_name',
                    'slug',
                    'email',
                    'phone',
                    'psn_id',
                    'iracing_id',
                    'iracing_customer_id',
                    'discord_id',
                    'primary_platform_id',
                    'created_at',
                    'updated_at',
                    'deleted_at',
                ],
            ],
            'meta' => [
                'total',
                'per_page',
                'current_page',
                'last_page',
            ],
        ]);
        $response->assertJsonCount(5, 'data');
    }

    public function test_can_list_drivers_with_search(): void
    {
        // Use unique names to avoid conflicts with other tests
        $uniqueName = 'Xanderbert' . uniqid();
        Driver::factory()->create([
            'first_name' => $uniqueName,
            'last_name' => 'Zylophone',
            'nickname' => null,
        ]);
        Driver::factory()->create([
            'first_name' => 'Yolanda',
            'last_name' => 'Quisp',
            'nickname' => null,
        ]);

        $response = $this->actingAs($this->admin, 'admin')
            ->getJson('/api/admin/drivers?search=' . $uniqueName);

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.first_name', $uniqueName);
    }

    public function test_can_create_driver_with_valid_data(): void
    {
        $driverData = [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'nickname' => 'Johnny',
            'email' => 'john.doe@example.com',
            'phone' => '+1234567890',
            'psn_id' => 'john_doe_psn',
            'iracing_id' => null,
            'iracing_customer_id' => null,
            'discord_id' => null,
        ];

        $response = $this->actingAs($this->admin, 'admin')
            ->postJson('/api/admin/drivers', $driverData);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'first_name',
                'last_name',
                'nickname',
                'display_name',
                'slug',
                'email',
            ],
            'message',
        ]);

        $this->assertDatabaseHas('drivers', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'nickname' => 'Johnny',
            'email' => 'john.doe@example.com',
            'psn_id' => 'john_doe_psn',
        ]);
    }

    public function test_can_create_driver_with_only_name_fields(): void
    {
        $driverData = [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'nickname' => null,
            'email' => 'john.doe@example.com',
            'psn_id' => null,
            'iracing_id' => null,
            'iracing_customer_id' => null,
            'discord_id' => null,
        ];

        $response = $this->actingAs($this->admin, 'admin')
            ->postJson('/api/admin/drivers', $driverData);

        $response->assertStatus(201);
        $this->assertDatabaseHas('drivers', [
            'first_name' => 'John',
            'last_name' => 'Doe',
        ]);
    }

    public function test_can_create_driver_with_only_platform_id(): void
    {
        $driverData = [
            'first_name' => null,
            'last_name' => null,
            'nickname' => null,
            'email' => 'john.doe@example.com',
            'psn_id' => 'john_doe_psn',
            'iracing_id' => null,
            'iracing_customer_id' => null,
            'discord_id' => null,
        ];

        $response = $this->actingAs($this->admin, 'admin')
            ->postJson('/api/admin/drivers', $driverData);

        $response->assertStatus(201);
        $this->assertDatabaseHas('drivers', [
            'psn_id' => 'john_doe_psn',
        ]);
    }

    public function test_cannot_create_driver_without_name_or_platform_id(): void
    {
        $driverData = [
            'first_name' => null,
            'last_name' => null,
            'nickname' => null,
            'email' => 'john.doe@example.com',
            'psn_id' => null,
            'iracing_id' => null,
            'iracing_customer_id' => null,
            'discord_id' => null,
        ];

        $response = $this->actingAs($this->admin, 'admin')
            ->postJson('/api/admin/drivers', $driverData);

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'At least one name field (first name, last name, or nickname) OR at least one platform identifier is required');
    }

    public function test_cannot_create_driver_with_duplicate_platform_id(): void
    {
        Driver::factory()->create([
            'psn_id' => 'existing_psn_id',
        ]);

        $driverData = [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'psn_id' => 'existing_psn_id',
        ];

        $response = $this->actingAs($this->admin, 'admin')
            ->postJson('/api/admin/drivers', $driverData);

        $response->assertStatus(422);
        $expectedMessage = "A driver with platform ID 'existing_psn_id' already exists";
        $response->assertJsonPath('message', $expectedMessage);
    }

    public function test_can_show_driver(): void
    {
        $driver = Driver::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
        ]);

        $response = $this->actingAs($this->admin, 'admin')
            ->getJson("/api/admin/drivers/{$driver->id}");

        $response->assertStatus(200);
        $response->assertJsonPath('data.id', $driver->id);
        $response->assertJsonPath('data.first_name', 'John');
        $response->assertJsonPath('data.last_name', 'Doe');
        $response->assertJsonPath('data.email', 'john.doe@example.com');
    }

    public function test_returns_404_for_nonexistent_driver(): void
    {
        $response = $this->actingAs($this->admin, 'admin')
            ->getJson('/api/admin/drivers/99999');

        $response->assertStatus(404);
    }

    public function test_can_update_driver(): void
    {
        $driver = Driver::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
        ]);

        $updateData = [
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'jane.smith@example.com',
        ];

        $response = $this->actingAs($this->admin, 'admin')
            ->putJson("/api/admin/drivers/{$driver->id}", $updateData);

        $response->assertStatus(200);
        $response->assertJsonPath('data.first_name', 'Jane');
        $response->assertJsonPath('data.last_name', 'Smith');
        $response->assertJsonPath('data.email', 'jane.smith@example.com');

        $this->assertDatabaseHas('drivers', [
            'id' => $driver->id,
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'jane.smith@example.com',
        ]);
    }

    public function test_can_update_partial_driver_fields(): void
    {
        $driver = Driver::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'phone' => '+1234567890',
        ]);

        $updateData = [
            'email' => 'newemail@example.com',
        ];

        $response = $this->actingAs($this->admin, 'admin')
            ->putJson("/api/admin/drivers/{$driver->id}", $updateData);

        $response->assertStatus(200);
        $response->assertJsonPath('data.email', 'newemail@example.com');
        $response->assertJsonPath('data.first_name', 'John'); // Should remain unchanged
        $response->assertJsonPath('data.last_name', 'Doe'); // Should remain unchanged
    }

    public function test_can_delete_driver(): void
    {
        $driver = Driver::factory()->create();

        $response = $this->actingAs($this->admin, 'admin')
            ->deleteJson("/api/admin/drivers/{$driver->id}");

        $response->assertStatus(200);
        $response->assertJsonPath('message', 'Driver deleted successfully');

        $this->assertSoftDeleted('drivers', [
            'id' => $driver->id,
        ]);
    }

    public function test_requires_authentication(): void
    {
        $response = $this->getJson('/api/admin/drivers');

        $response->assertStatus(401);
    }

    public function test_requires_admin_authentication(): void
    {
        $user = \App\Models\User::factory()->create();

        $response = $this->actingAs($user, 'web')
            ->getJson('/api/admin/drivers');

        $response->assertStatus(401);
    }

    public function test_can_list_drivers_with_pagination(): void
    {
        Driver::factory()->count(25)->create();

        $response = $this->actingAs($this->admin, 'admin')
            ->getJson('/api/admin/drivers?page=1&per_page=10');

        $response->assertStatus(200);
        $response->assertJsonPath('meta.per_page', 10);
        $response->assertJsonPath('meta.current_page', 1);
        $response->assertJsonPath('meta.total', 25);
        $response->assertJsonPath('meta.last_page', 3);
        $response->assertJsonCount(10, 'data');
    }

    public function test_can_list_drivers_with_sorting(): void
    {
        Driver::factory()->create([
            'first_name' => 'Adam',
            'last_name' => 'Smith',
        ]);
        Driver::factory()->create([
            'first_name' => 'Zoe',
            'last_name' => 'Jones',
        ]);
        Driver::factory()->create([
            'first_name' => 'Bob',
            'last_name' => 'Williams',
        ]);

        $response = $this->actingAs($this->admin, 'admin')
            ->getJson('/api/admin/drivers?order_by=first_name&order_direction=asc');

        $response->assertStatus(200);
        $response->assertJsonPath('data.0.first_name', 'Adam');
        $response->assertJsonPath('data.1.first_name', 'Bob');
        $response->assertJsonPath('data.2.first_name', 'Zoe');
    }
}
