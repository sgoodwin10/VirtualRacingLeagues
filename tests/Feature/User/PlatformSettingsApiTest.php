<?php

declare(strict_types=1);

namespace Tests\Feature\User;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class PlatformSettingsApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
    }

    public function test_can_get_gt7_race_settings(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('http://app.virtualracingleagues.localhost/api/platforms/1/race-settings');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'weather_conditions',
                    'tire_restrictions',
                    'fuel_usage',
                    'damage_model',
                    'assists_restrictions',
                ],
            ]);

        $data = $response->json('data');

        // Verify GT7 specific settings
        $this->assertIsArray($data['weather_conditions']);
        $this->assertNotEmpty($data['weather_conditions']);
        $this->assertArrayHasKey('value', $data['weather_conditions'][0]);
        $this->assertArrayHasKey('label', $data['weather_conditions'][0]);
    }

    public function test_can_get_acc_race_settings(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('http://app.virtualracingleagues.localhost/api/platforms/2/race-settings');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'weather_conditions',
                    'tire_restrictions',
                    'fuel_usage',
                    'damage_model',
                    'assists_restrictions',
                ],
            ]);
    }

    public function test_can_get_iracing_race_settings(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('http://app.virtualracingleagues.localhost/api/platforms/3/race-settings');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'weather_conditions',
                    'tire_restrictions',
                    'fuel_usage',
                    'damage_model',
                    'assists_restrictions',
                ],
            ]);
    }

    public function test_returns_gt7_for_unknown_platform(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('http://app.virtualracingleagues.localhost/api/platforms/999/race-settings');

        $response->assertStatus(200);

        // Should default to GT7
        $data = $response->json('data');
        $this->assertIsArray($data['weather_conditions']);
    }

    public function test_unauthenticated_user_cannot_access_platform_settings(): void
    {
        $response = $this->getJson('http://app.virtualracingleagues.localhost/api/platforms/1/race-settings');

        $response->assertStatus(401);
    }

    public function test_weather_conditions_have_correct_structure(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('http://app.virtualracingleagues.localhost/api/platforms/1/race-settings');

        $response->assertStatus(200);

        $weatherConditions = $response->json('data.weather_conditions');

        foreach ($weatherConditions as $condition) {
            $this->assertArrayHasKey('value', $condition);
            $this->assertArrayHasKey('label', $condition);
            $this->assertIsString($condition['value']);
            $this->assertIsString($condition['label']);
        }
    }
}
