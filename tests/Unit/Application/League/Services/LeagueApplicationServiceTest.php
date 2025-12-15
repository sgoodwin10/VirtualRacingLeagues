<?php

declare(strict_types=1);

namespace Tests\Unit\Application\League\Services;

use App\Application\League\Services\LeagueApplicationService;
use ReflectionClass;
use Tests\TestCase;

/**
 * Unit tests for LeagueApplicationService.
 */
final class LeagueApplicationServiceTest extends TestCase
{
    /**
     * Test milliseconds to time formatting.
     *
     * @dataProvider millisecondsToTimeProvider
     */
    public function test_format_milliseconds_to_time(
        ?int $milliseconds,
        ?string $expected
    ): void {
        // Create a mock service (we only need to test the private method)
        $service = $this->app->make(LeagueApplicationService::class);

        // Use reflection to access the private method
        $reflection = new ReflectionClass($service);
        $method = $reflection->getMethod('formatMillisecondsToTime');
        $method->setAccessible(true);

        $result = $method->invoke($service, $milliseconds);

        $this->assertSame($expected, $result);
    }

    /**
     * Data provider for milliseconds to time formatting tests.
     *
     * @return array<int, array{milliseconds: ?int, expected: ?string}>
     */
    public static function millisecondsToTimeProvider(): array
    {
        return [
            // Null and zero cases
            'null input' => [
                'milliseconds' => null,
                'expected' => null,
            ],
            'zero milliseconds' => [
                'milliseconds' => 0,
                'expected' => null,
            ],
            'negative milliseconds' => [
                'milliseconds' => -1000,
                'expected' => null,
            ],

            // Sub-minute times (SS.mmm format)
            '1 second' => [
                'milliseconds' => 1000,
                'expected' => '1.000',
            ],
            '25.123 seconds' => [
                'milliseconds' => 25123,
                'expected' => '25.123',
            ],
            '59.999 seconds' => [
                'milliseconds' => 59999,
                'expected' => '59.999',
            ],

            // Minute+ times (M:SS.mmm format)
            '1 minute exactly' => [
                'milliseconds' => 60000,
                'expected' => '1:00.000',
            ],
            '1:25.123' => [
                'milliseconds' => 85123,
                'expected' => '1:25.123',
            ],
            '2:05.456' => [
                'milliseconds' => 125456,
                'expected' => '2:05.456',
            ],
            '10:00.000' => [
                'milliseconds' => 600000,
                'expected' => '10:00.000',
            ],
            '59:59.999' => [
                'milliseconds' => 3599999,
                'expected' => '59:59.999',
            ],
        ];
    }

    /**
     * Test time difference formatting.
     *
     * @dataProvider timeDifferenceProvider
     */
    public function test_format_time_difference(int $milliseconds, string $expected): void
    {
        // Create a mock service
        $service = $this->app->make(LeagueApplicationService::class);

        // Use reflection to access the private method
        $reflection = new ReflectionClass($service);
        $method = $reflection->getMethod('formatTimeDifference');
        $method->setAccessible(true);

        $result = $method->invoke($service, $milliseconds);

        $this->assertSame($expected, $result);
    }

    /**
     * Data provider for time difference formatting tests.
     *
     * @return array<int, array{milliseconds: int, expected: string}>
     */
    public static function timeDifferenceProvider(): array
    {
        return [
            // Zero and negative cases
            'zero milliseconds' => [
                'milliseconds' => 0,
                'expected' => '+0.000',
            ],
            'negative milliseconds' => [
                'milliseconds' => -100,
                'expected' => '+0.000',
            ],

            // Sub-second differences (+S.mmm format)
            '345 milliseconds' => [
                'milliseconds' => 345,
                'expected' => '+0.345',
            ],
            '1 second 234 ms' => [
                'milliseconds' => 1234,
                'expected' => '+1.234',
            ],
            '59.999 seconds' => [
                'milliseconds' => 59999,
                'expected' => '+59.999',
            ],

            // Minute+ differences (+M:SS.mmm format)
            '1 minute exactly' => [
                'milliseconds' => 60000,
                'expected' => '+1:00.000',
            ],
            '1:23.456' => [
                'milliseconds' => 83456,
                'expected' => '+1:23.456',
            ],
            '2:05.123' => [
                'milliseconds' => 125123,
                'expected' => '+2:05.123',
            ],
            '10:00.001' => [
                'milliseconds' => 600001,
                'expected' => '+10:00.001',
            ],
        ];
    }
}
