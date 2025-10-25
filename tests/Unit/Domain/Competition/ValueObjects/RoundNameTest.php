<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Competition\ValueObjects;

use App\Domain\Competition\ValueObjects\RoundName;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for RoundName value object.
 */
final class RoundNameTest extends TestCase
{
    #[Test]
    public function it_creates_valid_round_name(): void
    {
        $name = RoundName::from('Round 5');

        $this->assertEquals('Round 5', $name->value());
    }

    #[Test]
    public function it_trims_whitespace(): void
    {
        $name = RoundName::from('  Round 5  ');

        $this->assertEquals('Round 5', $name->value());
    }

    #[Test]
    public function it_accepts_minimum_length_name(): void
    {
        $name = RoundName::from('ABC');

        $this->assertEquals('ABC', $name->value());
    }

    #[Test]
    public function it_throws_exception_for_name_too_short(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Round name must be at least 3 characters');

        RoundName::from('AB');
    }

    #[Test]
    public function it_throws_exception_for_name_too_long(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Round name cannot exceed 100 characters');

        RoundName::from(str_repeat('a', 101));
    }

    #[Test]
    public function it_checks_equality(): void
    {
        $name1 = RoundName::from('Round 5');
        $name2 = RoundName::from('Round 5');
        $name3 = RoundName::from('Round 6');

        $this->assertTrue($name1->equals($name2));
        $this->assertFalse($name1->equals($name3));
        $this->assertFalse($name1->equals(null));
    }
}
