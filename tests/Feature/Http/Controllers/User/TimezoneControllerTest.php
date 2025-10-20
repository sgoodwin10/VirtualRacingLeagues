<?php

declare(strict_types=1);

namespace Tests\Feature\Http\Controllers\User;

use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TimezoneControllerTest extends UserControllerTestCase
{
    use RefreshDatabase;

    private UserEloquent $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = UserEloquent::factory()->create();
    }

    #[Test]
    public function it_returns_list_of_timezones(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->getJson('/api/timezones');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['value', 'label'],
                ],
            ]);
    }

    #[Test]
    public function it_returns_timezones_with_correct_structure(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->getJson('/api/timezones');

        $data = $response->json('data');

        $this->assertNotEmpty($data);
        $this->assertArrayHasKey('value', $data[0]);
        $this->assertArrayHasKey('label', $data[0]);
        $this->assertIsString($data[0]['value']);
        $this->assertIsString($data[0]['label']);
    }

    #[Test]
    public function it_includes_common_timezones(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->getJson('/api/timezones');

        $data = $response->json('data');
        $timezoneValues = array_column($data, 'value');

        // Check for common timezones
        $this->assertContains('UTC', $timezoneValues);
        $this->assertContains('America/New_York', $timezoneValues);
        $this->assertContains('Europe/London', $timezoneValues);
        $this->assertContains('Asia/Tokyo', $timezoneValues);
        $this->assertContains('Australia/Sydney', $timezoneValues);
    }

    #[Test]
    public function it_value_and_label_match(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->getJson('/api/timezones');

        $data = $response->json('data');

        foreach ($data as $timezone) {
            $this->assertEquals($timezone['value'], $timezone['label']);
        }
    }

    #[Test]
    public function it_returns_all_php_timezones(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->getJson('/api/timezones');

        $data = $response->json('data');
        $phpTimezones = \DateTimeZone::listIdentifiers();

        // Should return same count as PHP's timezone list
        $this->assertCount(count($phpTimezones), $data);
    }

    #[Test]
    public function it_returns_success_response_format(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->getJson('/api/timezones');

        $response->assertOk()
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'data',
            ]);
    }

    // Note: Authentication is enforced by middleware in routes/subdomain.php
    // The /api/timezones route is protected by ['auth:web', 'user.authenticate'] middleware
}
