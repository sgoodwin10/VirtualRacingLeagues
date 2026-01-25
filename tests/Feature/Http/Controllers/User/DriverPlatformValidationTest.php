<?php

declare(strict_types=1);

namespace Tests\Feature\Http\Controllers\User;

use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Test driver platform validation against league platforms.
 */
final class DriverPlatformValidationTest extends UserControllerTestCase
{
    use RefreshDatabase;

    private UserEloquent $user;

    private Platform $gt7Platform;

    private Platform $iracingPlatform;

    private Platform $accPlatform;

    private League $gt7League;

    private League $iracingLeague;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = UserEloquent::factory()->create(['status' => 'active']);

        // Create platforms (matching seeder IDs)
        $this->gt7Platform = Platform::create([
            'id' => 1,
            'name' => 'Gran Turismo 7',
            'slug' => 'gran-turismo-7',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->iracingPlatform = Platform::create([
            'id' => 2,
            'name' => 'iRacing',
            'slug' => 'iracing',
            'is_active' => true,
            'sort_order' => 2,
        ]);

        $this->accPlatform = Platform::create([
            'id' => 3,
            'name' => 'Assetto Corsa Competizione',
            'slug' => 'acc',
            'is_active' => true,
            'sort_order' => 3,
        ]);

        // Create a GT7-only league
        $this->gt7League = League::factory()->create([
            'owner_user_id' => $this->user->id,
            'platform_ids' => [1], // GT7 only
        ]);

        // Create an iRacing-only league
        $this->iracingLeague = League::factory()->create([
            'owner_user_id' => $this->user->id,
            'platform_ids' => [2], // iRacing only
        ]);
    }

    /**
     * Override to use app subdomain for all requests
     */
    public function postJson($uri, array $data = [], array $headers = [], $options = 0)
    {
        $url = 'http://app.virtualracingleagues.localhost' . $uri;

        return parent::postJson($url, $data, $headers, $options);
    }

    public function test_can_add_driver_with_matching_platform(): void
    {
        // GT7 league should accept GT7 driver (using PSN ID)
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->gt7League->id}/drivers", [
                'first_name' => 'Test',
                'last_name' => 'Driver',
                'psn_id' => 'PSN_Player_123',
                'status' => 'active',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('drivers', [
            'first_name' => 'Test',
            'psn_id' => 'PSN_Player_123',
        ]);
    }

    public function test_can_add_driver_with_iracing_id(): void
    {
        // iRacing league should accept iRacing driver
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->iracingLeague->id}/drivers", [
                'first_name' => 'iRacing',
                'last_name' => 'Driver',
                'iracing_id' => 'iRacing_Player',
                'status' => 'active',
            ]);

        $response->assertStatus(201);
    }

    public function test_can_add_driver_with_iracing_customer_id(): void
    {
        // iRacing league should accept iRacing customer ID
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->iracingLeague->id}/drivers", [
                'first_name' => 'iRacing',
                'last_name' => 'Customer',
                'iracing_customer_id' => 123456,
                'status' => 'active',
            ]);

        $response->assertStatus(201);
    }

    public function test_cannot_add_driver_with_non_matching_platform(): void
    {
        // Create a league with a platform that has no mapped fields (ACC - platform 3)
        $accLeague = League::factory()->create([
            'owner_user_id' => $this->user->id,
            'platform_ids' => [3], // ACC only - has no mapped fields
        ]);

        // Try to add driver with only GT7/PSN IDs to ACC league
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$accLeague->id}/drivers", [
                'first_name' => 'Test',
                'last_name' => 'Driver',
                'psn_id' => 'PSN_Player_123', // PSN is mapped to GT7, not ACC
                'status' => 'active',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ])
            ->assertJsonFragment([
                'message' => "Driver must have at least one platform identifier that matches the league's platforms (Platform IDs: 3)",
            ]);
    }

    public function test_cannot_add_gt7_driver_to_iracing_league(): void
    {
        // iRacing league should reject GT7 driver (with PSN ID)
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->iracingLeague->id}/drivers", [
                'first_name' => 'GT7',
                'last_name' => 'Player',
                'psn_id' => 'PSN_Player',
                'status' => 'active',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ])
            ->assertJsonFragment([
                'message' => "Driver must have at least one platform identifier that matches the league's platforms (Platform IDs: 2)",
            ]);
    }

    public function test_cannot_add_iracing_driver_to_gt7_league(): void
    {
        // GT7 league should reject iRacing driver
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->gt7League->id}/drivers", [
                'first_name' => 'iRacing',
                'last_name' => 'Player',
                'iracing_id' => 'iRacing_Player',
                'status' => 'active',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_can_add_driver_with_multiple_platforms_when_one_matches(): void
    {
        // Driver has both PSN and iRacing IDs, GT7 league should accept
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->gt7League->id}/drivers", [
                'first_name' => 'Multi',
                'last_name' => 'Platform',
                'psn_id' => 'PSN_Player',
                'iracing_id' => 'iRacing_Player',
                'status' => 'active',
            ]);

        $response->assertStatus(201);
    }

    public function test_league_with_multiple_platforms_accepts_any_matching_driver(): void
    {
        // Create league with both GT7 and iRacing
        $multiPlatformLeague = League::factory()->create([
            'owner_user_id' => $this->user->id,
            'platform_ids' => [1, 2], // GT7 and iRacing
        ]);

        // Should accept GT7 driver (with PSN ID)
        $response1 = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$multiPlatformLeague->id}/drivers", [
                'first_name' => 'GT7',
                'last_name' => 'Driver',
                'psn_id' => 'PSN_Player_1',
                'status' => 'active',
            ]);
        $response1->assertStatus(201);

        // Should accept iRacing driver
        $response2 = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$multiPlatformLeague->id}/drivers", [
                'first_name' => 'iRacing',
                'last_name' => 'Driver',
                'iracing_customer_id' => 999999,
                'status' => 'active',
            ]);
        $response2->assertStatus(201);
    }

    public function test_email_and_phone_are_optional(): void
    {
        // Driver without email or phone should be accepted
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->gt7League->id}/drivers", [
                'first_name' => 'No',
                'last_name' => 'Contact',
                'psn_id' => 'PSN_NoContact',
                'status' => 'active',
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('drivers', [
            'first_name' => 'No',
            'email' => null,
            'phone' => null,
        ]);
    }

    public function test_driver_with_email_is_accepted(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->gt7League->id}/drivers", [
                'first_name' => 'With',
                'last_name' => 'Email',
                'psn_id' => 'PSN_WithEmail',
                'email' => 'driver@example.com',
                'status' => 'active',
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('drivers', [
            'email' => 'driver@example.com',
        ]);
    }

    public function test_driver_with_phone_is_accepted(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/leagues/{$this->gt7League->id}/drivers", [
                'first_name' => 'With',
                'last_name' => 'Phone',
                'psn_id' => 'PSN_WithPhone',
                'phone' => '+1234567890',
                'status' => 'active',
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('drivers', [
            'phone' => '+1234567890',
        ]);
    }
}
