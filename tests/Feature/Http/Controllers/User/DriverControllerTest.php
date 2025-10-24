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

    public function test_cannot_create_driver_without_name(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers", [
                'psn_id' => 'SomeDriver',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'At least one name field (first name, last name, or nickname) is required',
            ]);
    }

    public function test_cannot_create_driver_without_platform_id(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers", [
                'first_name' => 'John',
                'last_name' => 'Doe',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'At least one platform identifier is required',
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

    public function test_can_remove_driver_from_league(): void
    {
        $driver = Driver::factory()->create(['psn_id' => 'RemoveTest']);
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
                'message' => 'Driver removed from league successfully',
            ]);

        $this->assertDatabaseMissing('league_drivers', [
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
        ]);
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
            . ",,\n" // Missing name and platform ID
            . "NoID,Driver,\n" // Missing platform ID
            . "Duplicate,Driver,ExistingPSN"; // Already in league

        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->league->id}/drivers/import-csv", [
                'csv_data' => $csvData,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.success_count', 1);

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

        // Verify at least one error mentions missing name field
        $errorMessages = array_column($errors, 'message');
        $hasNameError = false;
        foreach ($errorMessages as $message) {
            if (str_contains($message, 'At least one name field is required')) {
                $hasNameError = true;
                break;
            }
        }
        $this->assertTrue($hasNameError, 'Expected to find error about missing name field');
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

    public function test_does_not_auto_generate_nickname_when_first_name_exists(): void
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
                        'nickname' => null,
                        'display_name' => 'John',
                    ],
                ],
            ]);

        $this->assertDatabaseHas('drivers', [
            'first_name' => 'John',
            'nickname' => null,
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
}
