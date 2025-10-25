<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Competition\ValueObjects;

use App\Domain\Competition\Exceptions\InvalidRoundNumberException;
use App\Domain\Competition\ValueObjects\RoundNumber;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for RoundNumber value object.
 */
final class RoundNumberTest extends TestCase
{
    #[Test]
    public function it_creates_valid_round_number(): void
    {
        $roundNumber = RoundNumber::from(5);

        $this->assertEquals(5, $roundNumber->value());
    }

    #[Test]
    public function it_accepts_minimum_round_number(): void
    {
        $roundNumber = RoundNumber::from(1);

        $this->assertEquals(1, $roundNumber->value());
    }

    #[Test]
    public function it_accepts_maximum_round_number(): void
    {
        $roundNumber = RoundNumber::from(99);

        $this->assertEquals(99, $roundNumber->value());
    }

    #[Test]
    public function it_throws_exception_for_round_number_below_minimum(): void
    {
        $this->expectException(InvalidRoundNumberException::class);
        $this->expectExceptionMessage('Round number must be between 1 and 99, got 0');

        RoundNumber::from(0);
    }

    #[Test]
    public function it_throws_exception_for_round_number_above_maximum(): void
    {
        $this->expectException(InvalidRoundNumberException::class);
        $this->expectExceptionMessage('Round number must be between 1 and 99, got 100');

        RoundNumber::from(100);
    }

    #[Test]
    public function it_checks_equality(): void
    {
        $roundNumber1 = RoundNumber::from(5);
        $roundNumber2 = RoundNumber::from(5);
        $roundNumber3 = RoundNumber::from(6);

        $this->assertTrue($roundNumber1->equals($roundNumber2));
        $this->assertFalse($roundNumber1->equals($roundNumber3));
    }
}
