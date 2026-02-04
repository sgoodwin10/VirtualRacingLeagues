<?php

declare(strict_types=1);

namespace Tests\Feature\Http\Controllers\User;

use App\Infrastructure\Persistence\Eloquent\Models\Driver;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Foundation\Testing\RefreshDatabase;

final class DriverDiscordIdClearTest extends UserControllerTestCase
{
    use RefreshDatabase;

    private UserEloquent $user;

    private League $league;

    protected function setUp(): void
    {
        parent::setUp();

        // Create user
        $this->user = UserEloquent::factory()->create(['status' => 'active']);

        // Create league with Discord platform
        $platform = Platform::factory()->create(['name' => 'Discord']);
        $this->league = League::factory()->create([
            'owner_user_id' => $this->user->id,
            'platform_ids' => [$platform->id],
        ]);
    }

    public function test_can_clear_discord_id_by_sending_empty_string(): void
    {
        // Create a driver with discord_id
        $driver = Driver::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'discord_id' => 'john#1234',
        ]);

        // Add driver to league
        LeagueDriverEloquent::create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'driver_number' => 1,
            'status' => 'active',
        ]);

        // Verify discord_id exists
        $this->assertNotNull($driver->fresh()->discord_id);
        $this->assertEquals('john#1234', $driver->fresh()->discord_id);

        // Update driver with empty discord_id
        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}/drivers/{$driver->id}", [
                'first_name' => 'John',
                'last_name' => 'Doe',
                'discord_id' => '', // Empty string to clear
                'driver_number' => 1,
                'status' => 'active',
            ]);

        // Assert response is successful
        $response->assertOk();

        // Verify discord_id was cleared in database
        $driver->refresh();
        $this->assertNull($driver->discord_id, 'Discord ID should be null after clearing');
    }

    public function test_can_clear_discord_id_by_sending_null(): void
    {
        // Create a driver with discord_id
        $driver = Driver::factory()->create([
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'discord_id' => 'jane#5678',
        ]);

        // Add driver to league
        LeagueDriverEloquent::create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'driver_number' => 2,
            'status' => 'active',
        ]);

        // Verify discord_id exists
        $this->assertNotNull($driver->fresh()->discord_id);

        // Update driver with null discord_id
        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}/drivers/{$driver->id}", [
                'first_name' => 'Jane',
                'last_name' => 'Smith',
                'discord_id' => null, // Null to clear
                'driver_number' => 2,
                'status' => 'active',
            ]);

        // Assert response is successful
        $response->assertOk();

        // Verify discord_id was cleared in database
        $driver->refresh();
        $this->assertNull($driver->discord_id, 'Discord ID should be null after clearing');
    }

    public function test_preserves_discord_id_when_not_included_in_request(): void
    {
        // Create a driver with discord_id
        $driver = Driver::factory()->create([
            'first_name' => 'Bob',
            'last_name' => 'Johnson',
            'discord_id' => 'bob#9999',
        ]);

        // Add driver to league
        LeagueDriverEloquent::create([
            'league_id' => $this->league->id,
            'driver_id' => $driver->id,
            'driver_number' => 3,
            'status' => 'active',
        ]);

        // Update driver WITHOUT sending discord_id field
        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}/drivers/{$driver->id}", [
                'first_name' => 'Bob',
                'last_name' => 'Johnson',
                // discord_id NOT included
                'driver_number' => 3,
                'status' => 'active',
            ]);

        // Assert response is successful
        $response->assertOk();

        // Verify discord_id was preserved
        $driver->refresh();
        $this->assertNotNull($driver->discord_id);
        $this->assertEquals('bob#9999', $driver->discord_id, 'Discord ID should be preserved when not in request');
    }
}
