<?php

declare(strict_types=1);

namespace Tests\Feature\Http\Controllers\User;

use App\Infrastructure\Persistence\Eloquent\Models\Driver;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class DriverControllerTest extends UserControllerTestCase
{
    use RefreshDatabase;

    private UserEloquent $user;
    private League $league;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = UserEloquent::factory()->create(['status' => 'active']);
        $this->league = League::factory()->create(['owner_user_id' => $this->user->id]);
    }

    public function test_can_list_drivers_in_league(): void
    {
        // Create drivers and add to league
        $driver1 = Driver::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'psn_id' => 'JohnDoe77',
        ]);
        $driver2 = Driver::factory()->create([
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'psn_id' => 'JaneSmith88',
        ]);

        DB::table('league_drivers')->insert([
            ['league_id' => $this->league->id, 'driver_id' => $driver1->id, 'driver_number' => 5, 'status' => 'active', 'added_to_league_at' => now(), 'updated_at' => now()],
            ['league_id' => $this->league->id, 'driver_id' => $driver2->id, 'driver_number' => 7, 'status' => 'active', 'added_to_league_at' => now(), 'updated_at' => now()],
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson("/api/leagues/{$this->league->id}/drivers");

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'driver_id',
                        'driver_number',
                        'status',
                        'driver' => [
                            'id',
                            'first_name',
                            'last_name',
                            'display_name',
                            'psn_id',
                        ],
                    ],
                ],
                'meta' => ['total', 'per_page', 'current_page', 'last_page'],
            ])
            ->assertJsonCount(2, 'data');
    }

    public function test_can_create_driver_and_add_to_league(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers", [
                'first_name' => 'Mike',
                'last_name' => 'Johnson',
                'psn_id' => 'MikeJ_Racing',
                'email' => 'mike@example.com',
                'driver_number' => 3,
                'status' => 'active',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'driver_id',
                    'driver_number',
                    'status',
                    'driver',
                ],
            ]);

        $this->assertDatabaseHas('drivers', [
            'first_name' => 'Mike',
            'last_name' => 'Johnson',
            'psn_id' => 'MikeJ_Racing',
        ]);

        $this->assertDatabaseHas('league_drivers', [
            'league_id' => $this->league->id,
            'driver_number' => 3,
            'status' => 'active',
        ]);
    }

    public function test_can_create_driver_with_only_name(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers", [
                'first_name' => 'John',
                'last_name' => 'Doe',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('drivers', [
            'first_name' => 'John',
            'last_name' => 'Doe',
        ]);
    }

    public function test_can_create_driver_with_only_platform_id(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers", [
                'psn_id' => 'SomeDriver',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('drivers', [
            'psn_id' => 'SomeDriver',
        ]);
    }

    public function test_cannot_create_driver_without_name_or_platform_id(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers", [
                'email' => 'test@example.com',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'At least one name field (first name, last name, or nickname) OR at least one platform identifier is required',
            ]);
    }

    public function test_cannot_add_duplicate_driver_to_league(): void
    {
        // Create and add a driver
        $driver = Driver::factory()->create(['psn_id' => 'ExistingDriver']);
        DB::table('league_drivers')->insert([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'status' => 'active',
            'added_to_league_at' => now(),
            'updated_at' => now(),
        ]);

        // Try to add another driver with same PSN ID to the same league
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers", [
                'first_name' => 'Different',
                'last_name' => 'Name',
                'psn_id' => 'ExistingDriver',
            ]);

        $response->assertStatus(422);
    }

    public function test_can_get_single_driver_in_league(): void
    {
        $driver = Driver::factory()->create([
            'first_name' => 'Test',
            'last_name' => 'Driver',
            'psn_id' => 'TestDriver123',
        ]);
        DB::table('league_drivers')->insert([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'driver_number' => 10,
            'status' => 'active',
            'added_to_league_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson("/api/leagues/{$this->league->id}/drivers/{$driver->id}");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'driver_id' => $driver->id,
                    'driver_number' => 10,
                    'status' => 'active',
                    'driver' => [
                        'first_name' => 'Test',
                        'last_name' => 'Driver',
                        'psn_id' => 'TestDriver123',
                    ],
                ],
            ]);
    }

    public function test_can_update_league_driver_settings(): void
    {
        $driver = Driver::factory()->create(['psn_id' => 'UpdateTest']);
        DB::table('league_drivers')->insert([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'driver_number' => 5,
            'status' => 'active',
            'league_notes' => 'Original notes',
            'added_to_league_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}/drivers/{$driver->id}", [
                'driver_number' => 99,
                'status' => 'inactive',
                'league_notes' => 'Updated notes',
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Driver updated successfully',
                'data' => [
                    'driver_number' => 99,
                    'status' => 'inactive',
                    'league_notes' => 'Updated notes',
                ],
            ]);

        $this->assertDatabaseHas('league_drivers', [
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'driver_number' => 99,
            'status' => 'inactive',
            'league_notes' => 'Updated notes',
        ]);
    }

    public function test_can_update_driver_and_league_settings(): void
    {
        $driver = Driver::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'nickname' => 'JD',
            'email' => 'john@example.com',
            'phone' => '+1234567890',
            'psn_id' => 'JohnDoe77',
            'iracing_id' => 'JohnDoe_iR',
        ]);
        DB::table('league_drivers')->insert([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'driver_number' => 5,
            'status' => 'active',
            'league_notes' => 'Original notes',
            'added_to_league_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}/drivers/{$driver->id}", [
                // Update global driver fields
                'first_name' => 'Jonathan',
                'last_name' => 'Doe-Smith',
                'nickname' => 'JDS',
                'email' => 'jonathan@example.com',
                'phone' => '+9876543210',
                'psn_id' => 'JonathanDoe77',
                'iracing_id' => 'JonathanDoe_iR',
                // Update league-specific fields
                'driver_number' => 99,
                'status' => 'inactive',
                'league_notes' => 'Updated notes',
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Driver updated successfully',
                'data' => [
                    'driver_number' => 99,
                    'status' => 'inactive',
                    'league_notes' => 'Updated notes',
                    'driver' => [
                        'first_name' => 'Jonathan',
                        'last_name' => 'Doe-Smith',
                        'nickname' => 'JDS',
                        'email' => 'jonathan@example.com',
                        'phone' => '+9876543210',
                        'psn_id' => 'JonathanDoe77',
                        'iracing_id' => 'JonathanDoe_iR',
                    ],
                ],
            ]);

        // Verify driver table was updated
        $this->assertDatabaseHas('drivers', [
            'id' => $driver->id,
            'first_name' => 'Jonathan',
            'last_name' => 'Doe-Smith',
            'nickname' => 'JDS',
            'email' => 'jonathan@example.com',
            'phone' => '+9876543210',
            'psn_id' => 'JonathanDoe77',
            'iracing_id' => 'JonathanDoe_iR',
        ]);

        // Verify league_drivers table was updated
        $this->assertDatabaseHas('league_drivers', [
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'driver_number' => 99,
            'status' => 'inactive',
            'league_notes' => 'Updated notes',
        ]);
    }

    public function test_can_update_driver_fields_only(): void
    {
        $driver = Driver::factory()->create([
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'psn_id' => 'JaneSmith88',
        ]);
        DB::table('league_drivers')->insert([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'driver_number' => 10,
            'status' => 'active',
            'added_to_league_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}/drivers/{$driver->id}", [
                // Only update driver fields
                'first_name' => 'Janet',
                'email' => 'janet@example.com',
                // Keep league settings the same
                'status' => 'active',
            ]);

        $response->assertOk();

        // Verify driver was updated
        $this->assertDatabaseHas('drivers', [
            'id' => $driver->id,
            'first_name' => 'Janet',
            'email' => 'janet@example.com',
        ]);

        // Verify league settings remain unchanged
        $this->assertDatabaseHas('league_drivers', [
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'driver_number' => 10,
            'status' => 'active',
        ]);
    }

    public function test_can_soft_delete_driver(): void
    {
        $driver = Driver::factory()->create(['psn_id' => 'DeleteTest']);
        DB::table('league_drivers')->insert([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'status' => 'active',
            'added_to_league_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->deleteJson("/api/leagues/{$this->league->id}/drivers/{$driver->id}");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Driver deleted successfully',
            ]);

        // Verify driver is soft-deleted
        $this->assertDatabaseHas('drivers', [
            'id' => $driver->id,
        ]);
        $driver->refresh();
        $this->assertNotNull($driver->deleted_at);

        // Verify league_drivers relationship is preserved
        $this->assertDatabaseHas('league_drivers', [
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
        ]);
    }

    public function test_can_restore_soft_deleted_driver(): void
    {
        $driver = Driver::factory()->create([
            'psn_id' => 'RestoreTest',
            'deleted_at' => now(),
        ]);
        DB::table('league_drivers')->insert([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'status' => 'active',
            'added_to_league_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers/{$driver->id}/restore");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Driver restored successfully',
            ]);

        // Verify driver is restored
        $driver->refresh();
        $this->assertNull($driver->deleted_at);

        // Verify league_drivers relationship still exists
        $this->assertDatabaseHas('league_drivers', [
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
        ]);
    }

    public function test_cannot_restore_active_driver(): void
    {
        $driver = Driver::factory()->create(['psn_id' => 'ActiveTest']);
        DB::table('league_drivers')->insert([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'status' => 'active',
            'added_to_league_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers/{$driver->id}/restore");

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_can_filter_drivers_by_deleted_status(): void
    {
        $activeDriver = Driver::factory()->create(['psn_id' => 'active_driver']);
        $deletedDriver = Driver::factory()->create(['psn_id' => 'deleted_driver', 'deleted_at' => now()]);

        foreach ([$activeDriver, $deletedDriver] as $driver) {
            DB::table('league_drivers')->insert([
                'league_id' => $this->league->id,
                'driver_id' => $driver->id,
                'status' => 'active',
                'added_to_league_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Test active filter (default)
        $response = $this->actingAs($this->user, 'web')
            ->getJson("/api/leagues/{$this->league->id}/drivers?deleted_status=active");

        $response->assertOk()
            ->assertJsonCount(1, 'data');

        // Test deleted filter
        $response = $this->actingAs($this->user, 'web')
            ->getJson("/api/leagues/{$this->league->id}/drivers?deleted_status=deleted");

        $response->assertOk()
            ->assertJsonCount(1, 'data');

        // Test all filter
        $response = $this->actingAs($this->user, 'web')
            ->getJson("/api/leagues/{$this->league->id}/drivers?deleted_status=all");

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_can_search_drivers_by_name(): void
    {
        $driver1 = Driver::factory()->create(['first_name' => 'John', 'last_name' => 'Smith', 'psn_id' => 'john']);
        $driver2 = Driver::factory()->create(['first_name' => 'Jane', 'last_name' => 'Doe', 'psn_id' => 'jane']);
        $driver3 = Driver::factory()->create(['first_name' => 'Bob', 'last_name' => 'Johnson', 'psn_id' => 'bob']);

        foreach ([$driver1, $driver2, $driver3] as $driver) {
            DB::table('league_drivers')->insert([
                'league_id' => $this->league->id,
                'driver_id' => $driver->id,
                'status' => 'active',
                'added_to_league_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $response = $this->actingAs($this->user, 'web')
            ->getJson("/api/leagues/{$this->league->id}/drivers?search=John");

        $response->assertOk()
            ->assertJsonCount(2, 'data'); // John Smith and Bob Johnson
    }

    public function test_can_filter_drivers_by_status(): void
    {
        $driver1 = Driver::factory()->create(['psn_id' => 'active1']);
        $driver2 = Driver::factory()->create(['psn_id' => 'inactive1']);

        DB::table('league_drivers')->insert([
            ['league_id' => $this->league->id, 'driver_id' => $driver1->id, 'status' => 'active', 'added_to_league_at' => now(), 'updated_at' => now()],
            ['league_id' => $this->league->id, 'driver_id' => $driver2->id, 'status' => 'inactive', 'added_to_league_at' => now(), 'updated_at' => now()],
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson("/api/leagues/{$this->league->id}/drivers?status=active");

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_can_import_drivers_from_csv(): void
    {
        $csvData = "FirstName,LastName,PSN_ID,DriverNumber\n"
            . "Alice,Brown,AliceBrown,11\n"
            . "Charlie,Davis,CharlieDavis,22\n"
            . "Eve,White,EveWhite,33";

        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers/import-csv", [
                'csv_data' => $csvData,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'success_count' => 3,
                    'errors' => [],
                ],
            ]);

        $this->assertDatabaseHas('drivers', ['first_name' => 'Alice', 'psn_id' => 'AliceBrown']);
        $this->assertDatabaseHas('drivers', ['first_name' => 'Charlie', 'psn_id' => 'CharlieDavis']);
        $this->assertDatabaseHas('drivers', ['first_name' => 'Eve', 'psn_id' => 'EveWhite']);
    }

    public function test_csv_import_reports_errors_for_invalid_rows(): void
    {
        // Add an existing driver to test duplicate detection
        $existingDriver = Driver::factory()->create(['psn_id' => 'ExistingPSN']);
        DB::table('league_drivers')->insert([
            'league_id' => $this->league->id,
            'driver_id' => $existingDriver->id,
            'status' => 'active',
            'added_to_league_at' => now(),
            'updated_at' => now(),
        ]);

        $csvData = "FirstName,LastName,PSN_ID\n"
            . "Valid,Driver,ValidPSN\n"
            . ",,\n" // Missing both name and platform ID - should error
            . "NoID,Driver,\n" // Missing platform ID but has name - should succeed
            . "Duplicate,Driver,ExistingPSN"; // Already in league

        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers/import-csv", [
                'csv_data' => $csvData,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.success_count', 2); // Valid + NoID should succeed

        // Verify there are errors with correct structure
        $errors = $response->json('data.errors');
        $this->assertNotEmpty($errors);
        $this->assertIsArray($errors);

        // Verify error structure: [{row: number, message: string}]
        foreach ($errors as $error) {
            $this->assertArrayHasKey('row', $error);
            $this->assertArrayHasKey('message', $error);
            $this->assertIsInt($error['row']);
            $this->assertIsString($error['message']);
        }

        // Verify at least one error mentions missing name AND platform ID
        $errorMessages = array_column($errors, 'message');
        $hasNameAndPlatformError = false;
        foreach ($errorMessages as $message) {
            if (str_contains($message, 'At least one name field OR at least one platform ID is required')) {
                $hasNameAndPlatformError = true;
                break;
            }
        }
        $this->assertTrue($hasNameAndPlatformError, 'Expected to find error about missing both name and platform ID');
    }

    public function test_csv_import_accepts_lowercase_column_names(): void
    {
        // Test with lowercase column names (nickname, psn_id, iracing_id)
        $csvData = "nickname,psn_id,iracing_id\n"
            . "btwong,btwong10,btwong\n"
            . "racer42,racer42psn,racer42ir";

        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers/import-csv", [
                'csv_data' => $csvData,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'success_count' => 2,
                    'errors' => [],
                ],
            ]);

        $this->assertDatabaseHas('drivers', ['nickname' => 'btwong', 'psn_id' => 'btwong10']);
        $this->assertDatabaseHas('drivers', ['nickname' => 'racer42', 'psn_id' => 'racer42psn']);
    }

    public function test_csv_import_accepts_mixed_case_column_names(): void
    {
        // Test with PascalCase and lowercase mixed
        $csvData = "Nickname,psn_id,iRacing_ID\n"
            . "speedster,speedster99,speed99";

        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers/import-csv", [
                'csv_data' => $csvData,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'success_count' => 1,
                    'errors' => [],
                ],
            ]);

        $this->assertDatabaseHas('drivers', ['nickname' => 'speedster', 'psn_id' => 'speedster99']);
    }

    public function test_automatically_generates_nickname_from_discord_id_when_no_nickname_provided(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers", [
                'first_name' => null,
                'last_name' => null,
                'nickname' => null,
                'psn_id' => 'PSNRacer123', // Required for league platform validation
                'discord_id' => 'DiscordRacer123',
                'driver_number' => 42,
                'status' => 'active',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'driver' => [
                        'nickname' => 'DiscordRacer123',
                        'display_name' => 'DiscordRacer123',
                    ],
                ],
            ]);

        $this->assertDatabaseHas('drivers', [
            'nickname' => 'DiscordRacer123',
            'discord_id' => 'DiscordRacer123',
            'first_name' => null,
            'last_name' => null,
        ]);
    }

    public function test_automatically_generates_nickname_from_discord_id_when_empty_nickname_provided(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers", [
                'first_name' => null,
                'last_name' => null,
                'nickname' => '',
                'psn_id' => 'PSNRacer456', // Required for league platform validation
                'discord_id' => 'DiscordRacer456',
                'driver_number' => 43,
                'status' => 'active',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'driver' => [
                        'nickname' => 'DiscordRacer456',
                    ],
                ],
            ]);

        $this->assertDatabaseHas('drivers', [
            'nickname' => 'DiscordRacer456',
            'discord_id' => 'DiscordRacer456',
        ]);
    }

    public function test_auto_generates_nickname_from_discord_id_even_with_first_name(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers", [
                'first_name' => 'John',
                'last_name' => null,
                'nickname' => null,
                'psn_id' => 'PSNRacer789', // Required for league platform validation
                'discord_id' => 'DiscordRacer789',
                'driver_number' => 44,
                'status' => 'active',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'driver' => [
                        'first_name' => 'John',
                        'nickname' => 'DiscordRacer789', // Auto-populated from Discord ID (highest priority)
                        'display_name' => 'DiscordRacer789',
                    ],
                ],
            ]);

        $this->assertDatabaseHas('drivers', [
            'first_name' => 'John',
            'nickname' => 'DiscordRacer789',
            'discord_id' => 'DiscordRacer789',
        ]);
    }

    public function test_uses_provided_nickname_over_discord_id(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers", [
                'first_name' => null,
                'last_name' => null,
                'nickname' => 'ProRacer',
                'psn_id' => 'PSNRacer999', // Required for league platform validation
                'discord_id' => 'DiscordRacer999',
                'driver_number' => 45,
                'status' => 'active',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'driver' => [
                        'nickname' => 'ProRacer',
                        'display_name' => 'ProRacer',
                    ],
                ],
            ]);

        $this->assertDatabaseHas('drivers', [
            'nickname' => 'ProRacer',
            'discord_id' => 'DiscordRacer999',
        ]);
    }

    public function test_auto_generates_nickname_from_psn_id_when_no_discord(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers", [
                'first_name' => 'John',
                'last_name' => null,
                'nickname' => null,
                'psn_id' => 'PSNRacer123',
                'iracing_id' => 'iRacingRacer456',
                'discord_id' => null,
                'driver_number' => 50,
                'status' => 'active',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'driver' => [
                        'first_name' => 'John',
                        'nickname' => 'PSNRacer123', // PSN ID has priority when no Discord ID
                        'display_name' => 'PSNRacer123',
                    ],
                ],
            ]);
    }

    public function test_auto_generates_nickname_from_iracing_id_when_no_discord_or_psn(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers", [
                'first_name' => 'John',
                'last_name' => null,
                'nickname' => null,
                'psn_id' => null,
                'iracing_id' => 'iRacingRacer789',
                'discord_id' => null,
                'driver_number' => 51,
                'status' => 'active',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'driver' => [
                        'first_name' => 'John',
                        'nickname' => 'iRacingRacer789', // iRacing ID when no Discord or PSN
                        'display_name' => 'iRacingRacer789',
                    ],
                ],
            ]);
    }

    public function test_auto_generates_nickname_from_iracing_customer_id_when_no_other_platform_ids(): void
    {
        $league = League::factory()->create([
            'owner_user_id' => $this->user->id,
            'platform_ids' => [2], // iRacing platform ID
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$league->id}/drivers", [
                'first_name' => 'John',
                'last_name' => null,
                'nickname' => null,
                'psn_id' => null,
                'iracing_id' => null,
                'iracing_customer_id' => 123456,
                'discord_id' => null,
                'driver_number' => 52,
                'status' => 'active',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'driver' => [
                        'first_name' => 'John',
                        'nickname' => '123456', // iRacing Customer ID as string
                        'display_name' => '123456',
                    ],
                ],
            ]);
    }

    public function test_auto_generates_nickname_from_first_name_when_no_platform_ids(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers", [
                'first_name' => 'Johnny',
                'last_name' => 'Doe',
                'nickname' => null,
                'psn_id' => 'PSNRacer321', // Required for league platform validation
                'iracing_id' => null,
                'iracing_customer_id' => null,
                'discord_id' => null,
                'driver_number' => 53,
                'status' => 'active',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'driver' => [
                        'first_name' => 'Johnny',
                        'nickname' => 'PSNRacer321', // PSN ID has priority over first name
                        'display_name' => 'Johnny Doe', // Display name uses full name when both first and last are present
                    ],
                ],
            ]);
    }

    public function test_csv_import_auto_generates_nickname_from_discord_id(): void
    {
        $csvData = "FirstName,LastName,Nickname,PSN_ID,iRacing_ID,Discord_ID,Email,Phone,DriverNumber\n";
        $csvData .= ",,,PSNAutoUser,,AutoDiscord123,autoimport@example.com,,15";

        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers/import-csv", [
                'csv_data' => $csvData,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'success_count' => 1,
                    'errors' => [],
                ],
            ]);

        $this->assertDatabaseHas('drivers', [
            'nickname' => 'AutoDiscord123',
            'discord_id' => 'AutoDiscord123',
            'first_name' => null,
            'last_name' => null,
        ]);
    }

    public function test_requires_authentication(): void
    {
        $response = $this->getJson("/api/leagues/{$this->league->id}/drivers");

        $response->assertUnauthorized();
    }

    public function test_cannot_list_drivers_from_another_users_league(): void
    {
        $otherUser = UserEloquent::factory()->create(['status' => 'active']);
        $otherLeague = League::factory()->create(['owner_user_id' => $otherUser->id]);

        $driver = Driver::factory()->create(['psn_id' => 'SomeDriver']);
        DB::table('league_drivers')->insert([
            'league_id' => $otherLeague->id,
            'driver_id' => $driver->id,
            'status' => 'active',
            'added_to_league_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson("/api/leagues/{$otherLeague->id}/drivers");

        $response->assertForbidden()
            ->assertJson([
                'success' => false,
                'message' => 'Unauthorized to access this league',
            ]);
    }

    public function test_cannot_add_driver_to_another_users_league(): void
    {
        $otherUser = UserEloquent::factory()->create(['status' => 'active']);
        $otherLeague = League::factory()->create(['owner_user_id' => $otherUser->id]);

        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$otherLeague->id}/drivers", [
                'first_name' => 'Mike',
                'last_name' => 'Johnson',
                'psn_id' => 'MikeJ_Racing',
                'driver_number' => 3,
                'status' => 'active',
            ]);

        $response->assertForbidden()
            ->assertJson([
                'success' => false,
                'message' => 'Unauthorized to access this league',
            ]);
    }

    public function test_cannot_view_driver_from_another_users_league(): void
    {
        $otherUser = UserEloquent::factory()->create(['status' => 'active']);
        $otherLeague = League::factory()->create(['owner_user_id' => $otherUser->id]);

        $driver = Driver::factory()->create(['psn_id' => 'SomeDriver']);
        DB::table('league_drivers')->insert([
            'league_id' => $otherLeague->id,
            'driver_id' => $driver->id,
            'status' => 'active',
            'added_to_league_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson("/api/leagues/{$otherLeague->id}/drivers/{$driver->id}");

        $response->assertForbidden()
            ->assertJson([
                'success' => false,
                'message' => 'Unauthorized to access this league',
            ]);
    }

    public function test_cannot_update_driver_in_another_users_league(): void
    {
        $otherUser = UserEloquent::factory()->create(['status' => 'active']);
        $otherLeague = League::factory()->create(['owner_user_id' => $otherUser->id]);

        $driver = Driver::factory()->create(['psn_id' => 'SomeDriver']);
        DB::table('league_drivers')->insert([
            'league_id' => $otherLeague->id,
            'driver_id' => $driver->id,
            'driver_number' => 5,
            'status' => 'active',
            'added_to_league_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$otherLeague->id}/drivers/{$driver->id}", [
                'driver_number' => 99,
                'status' => 'inactive',
            ]);

        $response->assertForbidden()
            ->assertJson([
                'success' => false,
                'message' => 'Unauthorized to access this league',
            ]);
    }

    public function test_cannot_delete_driver_from_another_users_league(): void
    {
        $otherUser = UserEloquent::factory()->create(['status' => 'active']);
        $otherLeague = League::factory()->create(['owner_user_id' => $otherUser->id]);

        $driver = Driver::factory()->create(['psn_id' => 'SomeDriver']);
        DB::table('league_drivers')->insert([
            'league_id' => $otherLeague->id,
            'driver_id' => $driver->id,
            'status' => 'active',
            'added_to_league_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->deleteJson("/api/leagues/{$otherLeague->id}/drivers/{$driver->id}");

        $response->assertForbidden()
            ->assertJson([
                'success' => false,
                'message' => 'Unauthorized to access this league',
            ]);
    }

    public function test_cannot_import_csv_to_another_users_league(): void
    {
        $otherUser = UserEloquent::factory()->create(['status' => 'active']);
        $otherLeague = League::factory()->create(['owner_user_id' => $otherUser->id]);

        $csvData = "FirstName,LastName,PSN_ID\nJohn,Doe,JohnDoe";

        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$otherLeague->id}/drivers/import-csv", [
                'csv_data' => $csvData,
            ]);

        $response->assertForbidden()
            ->assertJson([
                'success' => false,
                'message' => 'Unauthorized to access this league',
            ]);
    }

    /**
     * Test Fix #1: CSV values with SQL LIKE wildcards (% and _) are NOT escaped
     * for exact match queries, allowing proper duplicate detection.
     * Duplicates are now SKIPPED instead of reported as errors.
     */
    public function test_csv_import_handles_platform_ids_with_wildcards_correctly(): void
    {
        // Create a driver with a PSN ID containing wildcard characters
        $existingDriver = Driver::factory()->create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'psn_id' => 'Player_100%Win',  // Contains both _ and %
        ]);
        DB::table('league_drivers')->insert([
            'league_id' => $this->league->id,
            'driver_id' => $existingDriver->id,
            'status' => 'active',
            'added_to_league_at' => now(),
            'updated_at' => now(),
        ]);

        // Try to import the same driver - should be skipped as duplicate
        $csvData = "FirstName,LastName,PSN_ID\n"
            . "Test,User,Player_100%Win";

        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers/import-csv", [
                'csv_data' => $csvData,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.success_count', 0)
            ->assertJsonPath('data.skipped_count', 1);

        // Verify there are NO errors (duplicates are skipped, not errors)
        $errors = $response->json('data.errors');
        $this->assertEmpty($errors, 'Duplicates should be skipped silently, not reported as errors');
    }

    /**
     * Test Fix #1: Creating a driver with wildcards in platform ID should work correctly.
     */
    public function test_can_create_driver_with_wildcard_characters_in_platform_id(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers", [
                'first_name' => 'Wildcard',
                'last_name' => 'Racer',
                'psn_id' => 'Speed_50%Fast',  // Contains both _ and %
                'driver_number' => 99,
                'status' => 'active',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'driver' => [
                        'first_name' => 'Wildcard',
                        'last_name' => 'Racer',
                        'psn_id' => 'Speed_50%Fast',
                    ],
                ],
            ]);

        $this->assertDatabaseHas('drivers', [
            'first_name' => 'Wildcard',
            'last_name' => 'Racer',
            'psn_id' => 'Speed_50%Fast',
        ]);

        // Now try to create the same driver again - should fail with duplicate error
        $response2 = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers", [
                'first_name' => 'Different',
                'last_name' => 'Name',
                'psn_id' => 'Speed_50%Fast',  // Same PSN ID
                'driver_number' => 88,
                'status' => 'active',
            ]);

        $response2->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    /**
     * Test Fix #2: CSV import handles partial failures gracefully.
     * Valid rows are imported successfully, duplicates are skipped, invalid rows are reported as errors.
     * The import continues processing all rows even when some fail.
     */
    public function test_csv_import_handles_partial_failures(): void
    {
        // Create a driver that will be skipped as duplicate on the 3rd row
        $conflictingDriver = Driver::factory()->create(['psn_id' => 'ConflictPSN']);
        DB::table('league_drivers')->insert([
            'league_id' => $this->league->id,
            'driver_id' => $conflictingDriver->id,
            'status' => 'active',
            'added_to_league_at' => now(),
            'updated_at' => now(),
        ]);

        // Get initial driver count
        $initialDriverCount = Driver::count();
        $initialLeagueDriverCount = DB::table('league_drivers')->where('league_id', $this->league->id)->count();

        // CSV with 2 valid rows followed by a duplicate
        $csvData = "FirstName,LastName,PSN_ID\n"
            . "Valid1,Driver1,ValidPSN1\n"
            . "Valid2,Driver2,ValidPSN2\n"
            . "Conflict,Driver,ConflictPSN";  // This will be skipped - already exists

        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers/import-csv", [
                'csv_data' => $csvData,
            ]);

        // Should report 2 successes and 1 skipped (duplicate)
        $response->assertStatus(201)
            ->assertJsonPath('data.success_count', 2)
            ->assertJsonPath('data.skipped_count', 1);

        // The first 2 drivers should have been created, the 3rd skipped
        $this->assertEquals($initialDriverCount + 2, Driver::count(), 'Two new drivers should be created');
        $this->assertEquals(
            $initialLeagueDriverCount + 2,
            DB::table('league_drivers')->where('league_id', $this->league->id)->count(),
            'Two new league_drivers should be created'
        );

        // Verify the successful imports
        $this->assertDatabaseHas('drivers', ['psn_id' => 'ValidPSN1']);
        $this->assertDatabaseHas('drivers', ['psn_id' => 'ValidPSN2']);

        // Verify no errors were reported (duplicate was skipped, not an error)
        $errors = $response->json('data.errors');
        $this->assertEmpty($errors, 'Duplicates should be skipped, not reported as errors');
    }

    /**
     * Test that CSV import correctly skips duplicate drivers based on platform ID.
     * When importing drivers via CSV, if a driver already exists with a matching
     * platform ID for the current league, that driver should be skipped (not imported/duplicated).
     */
    public function test_csv_import_skips_duplicate_drivers(): void
    {
        // Create existing drivers in the league
        $existingDriver1 = Driver::factory()->create(['psn_id' => 'ExistingPSN1']);
        $existingDriver2 = Driver::factory()->create(['iracing_id' => 'ExistingIRacing2']);
        DB::table('league_drivers')->insert([
            [
                'league_id' => $this->league->id,
                'driver_id' => $existingDriver1->id,
                'status' => 'active',
                'added_to_league_at' => now(),
                'updated_at' => now(),
            ],
            [
                'league_id' => $this->league->id,
                'driver_id' => $existingDriver2->id,
                'status' => 'active',
                'added_to_league_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // CSV with mix of new drivers and duplicates
        $csvData = "FirstName,LastName,PSN_ID,iRacing_ID\n"
            . "New1,Driver1,NewPSN1,\n"              // New driver
            . "Existing,One,ExistingPSN1,\n"          // Duplicate - skip
            . "New2,Driver2,,NewIRacing2\n"          // New driver
            . "Existing,Two,,ExistingIRacing2\n"     // Duplicate - skip
            . "New3,Driver3,NewPSN3,";               // New driver

        $initialDriverCount = Driver::count();
        $initialLeagueDriverCount = DB::table('league_drivers')
            ->where('league_id', $this->league->id)
            ->count();

        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers/import-csv", [
                'csv_data' => $csvData,
            ]);

        // Should import 3 new drivers and skip 2 duplicates
        $response->assertStatus(201)
            ->assertJsonPath('data.success_count', 3)
            ->assertJsonPath('data.skipped_count', 2)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'success_count',
                    'skipped_count',
                    'errors',
                ],
            ]);

        // Verify message includes skipped count
        $message = $response->json('message');
        $this->assertStringContainsString('3 driver', $message);
        $this->assertStringContainsString('2 duplicate', $message);

        // Verify 3 new drivers were created
        $this->assertEquals($initialDriverCount + 3, Driver::count(), 'Three new drivers should be created');
        $this->assertEquals(
            $initialLeagueDriverCount + 3,
            DB::table('league_drivers')->where('league_id', $this->league->id)->count(),
            'Three new league_drivers should be created'
        );

        // Verify new drivers were created
        $this->assertDatabaseHas('drivers', ['psn_id' => 'NewPSN1']);
        $this->assertDatabaseHas('drivers', ['iracing_id' => 'NewIRacing2']);
        $this->assertDatabaseHas('drivers', ['psn_id' => 'NewPSN3']);

        // Verify no errors (duplicates are skipped silently)
        $errors = $response->json('data.errors');
        $this->assertEmpty($errors, 'No errors should be reported for duplicates');
    }

    /**
     * Test Fix #2: Verify CSV import with formula injection prevention still works.
     */
    public function test_csv_import_prevents_formula_injection(): void
    {
        // CSV with formula injection attempts (leading =, +, -, @)
        $csvData = "FirstName,LastName,PSN_ID\n"
            . "=cmd,+calc,Normal123\n"  // Leading = and + should be stripped
            . "-system,@admin,Valid456";  // Leading - and @ should be stripped

        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers/import-csv", [
                'csv_data' => $csvData,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.success_count', 2);

        // Verify dangerous characters were stripped
        $this->assertDatabaseHas('drivers', [
            'first_name' => 'cmd',      // = stripped
            'last_name' => 'calc',      // + stripped
            'psn_id' => 'Normal123',
        ]);
        $this->assertDatabaseHas('drivers', [
            'first_name' => 'system',   // - stripped
            'last_name' => 'admin',     // @ stripped
            'psn_id' => 'Valid456',
        ]);

        // Verify original values (with dangerous chars) were NOT stored
        $this->assertDatabaseMissing('drivers', ['first_name' => '=cmd']);
        $this->assertDatabaseMissing('drivers', ['last_name' => '+calc']);
        $this->assertDatabaseMissing('drivers', ['first_name' => '-system']);
        $this->assertDatabaseMissing('drivers', ['last_name' => '@admin']);
    }
}
