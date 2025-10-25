<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Competition\ValueObjects;

use App\Domain\Competition\ValueObjects\RaceName;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class RaceNameTest extends TestCase
{
    public function test_creates_race_name_from_valid_string(): void
    {
        $raceName = RaceName::from('Monaco Grand Prix');

        $this->assertSame('Monaco Grand Prix', $raceName->value());
    }

    public function test_trims_whitespace(): void
    {
        $raceName = RaceName::from('  Spa 24H  ');

        $this->assertSame('Spa 24H', $raceName->value());
    }

    public function test_throws_exception_for_short_name(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Race name must be at least 3 characters');

        RaceName::from('AB');
    }

    public function test_throws_exception_for_long_name(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Race name cannot exceed 100 characters');

        RaceName::from(str_repeat('A', 101));
    }

    public function test_accepts_exactly_3_characters(): void
    {
        $raceName = RaceName::from('ABC');

        $this->assertSame('ABC', $raceName->value());
    }

    public function test_accepts_exactly_100_characters(): void
    {
        $name = str_repeat('A', 100);
        $raceName = RaceName::from($name);

        $this->assertSame($name, $raceName->value());
    }

    public function test_equals_returns_true_for_same_value(): void
    {
        $raceName1 = RaceName::from('Monaco GP');
        $raceName2 = RaceName::from('Monaco GP');

        $this->assertTrue($raceName1->equals($raceName2));
    }

    public function test_equals_returns_false_for_different_value(): void
    {
        $raceName1 = RaceName::from('Monaco GP');
        $raceName2 = RaceName::from('Spa GP');

        $this->assertFalse($raceName1->equals($raceName2));
    }

    public function test_equals_returns_false_for_null(): void
    {
        $raceName = RaceName::from('Monaco GP');

        $this->assertFalse($raceName->equals(null));
    }
}
