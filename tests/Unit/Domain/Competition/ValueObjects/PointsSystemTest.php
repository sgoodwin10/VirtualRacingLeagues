<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Competition\ValueObjects;

use App\Domain\Competition\ValueObjects\PointsSystem;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class PointsSystemTest extends TestCase
{
    public function test_creates_custom_points_system(): void
    {
        $points = [1 => 10, 2 => 8, 3 => 6, 4 => 4, 5 => 2];
        $pointsSystem = PointsSystem::from($points);

        $this->assertSame($points, $pointsSystem->toArray());
    }

    public function test_creates_f1_standard_points_system(): void
    {
        $pointsSystem = PointsSystem::f1Standard();

        $expected = [
            1 => 25, 2 => 18, 3 => 15, 4 => 12, 5 => 10,
            6 => 8, 7 => 6, 8 => 4, 9 => 2, 10 => 1,
        ];

        $this->assertSame($expected, $pointsSystem->toArray());
    }

    public function test_get_points_for_position(): void
    {
        $pointsSystem = PointsSystem::f1Standard();

        $this->assertSame(25, $pointsSystem->getPointsForPosition(1));
        $this->assertSame(18, $pointsSystem->getPointsForPosition(2));
        $this->assertSame(1, $pointsSystem->getPointsForPosition(10));
    }

    public function test_get_points_for_non_points_position_returns_zero(): void
    {
        $pointsSystem = PointsSystem::f1Standard();

        $this->assertSame(0, $pointsSystem->getPointsForPosition(11));
        $this->assertSame(0, $pointsSystem->getPointsForPosition(20));
    }

    public function test_throws_exception_for_empty_points_system(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Points system cannot be empty');

        PointsSystem::from([]);
    }

    public function test_throws_exception_for_invalid_position(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Position must be positive integer');

        PointsSystem::from([0 => 10, 1 => 5]);
    }

    public function test_throws_exception_for_negative_position(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Position must be positive integer');

        PointsSystem::from([-1 => 10]);
    }

    public function test_throws_exception_for_negative_points(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Points must be non-negative integer');

        PointsSystem::from([1 => -5]);
    }

    public function test_allows_zero_points(): void
    {
        $pointsSystem = PointsSystem::from([1 => 10, 2 => 0]);

        $this->assertSame(0, $pointsSystem->getPointsForPosition(2));
    }
}
