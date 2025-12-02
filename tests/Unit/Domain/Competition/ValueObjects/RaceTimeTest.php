<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Competition\ValueObjects;

use App\Domain\Competition\Exceptions\InvalidRaceTimeException;
use App\Domain\Competition\ValueObjects\RaceTime;
use PHPUnit\Framework\TestCase;

final class RaceTimeTest extends TestCase
{
    public function test_creates_race_time_from_valid_string(): void
    {
        $raceTime = RaceTime::fromString('01:23:45.678');

        $this->assertSame('01:23:45.678', $raceTime->value());
    }

    public function test_creates_race_time_with_single_digit_milliseconds(): void
    {
        $raceTime = RaceTime::fromString('01:23:45.6');

        // Milliseconds are normalized to 3 digits
        $this->assertSame('01:23:45.600', $raceTime->value());
    }

    public function test_creates_race_time_with_two_digit_milliseconds(): void
    {
        $raceTime = RaceTime::fromString('01:23:45.67');

        // Milliseconds are normalized to 3 digits
        $this->assertSame('01:23:45.670', $raceTime->value());
    }

    public function test_strips_leading_plus_sign(): void
    {
        $raceTime = RaceTime::fromString('+01:23:45.678');

        $this->assertSame('01:23:45.678', $raceTime->value());
    }

    public function test_strips_leading_plus_sign_from_time_difference(): void
    {
        $raceTime = RaceTime::fromString('+00:00:05.123');

        $this->assertSame('00:00:05.123', $raceTime->value());
    }

    public function test_returns_null_for_null_input(): void
    {
        $raceTime = RaceTime::fromString(null);

        $this->assertNull($raceTime->value());
        $this->assertTrue($raceTime->isNull());
    }

    public function test_returns_null_for_empty_string(): void
    {
        $raceTime = RaceTime::fromString('');

        $this->assertNull($raceTime->value());
        $this->assertTrue($raceTime->isNull());
    }

    public function test_throws_exception_for_invalid_format_missing_milliseconds(): void
    {
        $this->expectException(InvalidRaceTimeException::class);

        RaceTime::fromString('01:23:45');
    }

    public function test_throws_exception_for_invalid_format_missing_seconds(): void
    {
        $this->expectException(InvalidRaceTimeException::class);

        RaceTime::fromString('01:23');
    }

    public function test_throws_exception_for_invalid_format_text(): void
    {
        $this->expectException(InvalidRaceTimeException::class);

        RaceTime::fromString('invalid');
    }

    public function test_converts_to_milliseconds(): void
    {
        $raceTime = RaceTime::fromString('01:23:45.678');

        // 1 hour + 23 minutes + 45 seconds + 678 milliseconds
        // = (1 * 3600000) + (23 * 60000) + (45 * 1000) + 678
        // = 3600000 + 1380000 + 45000 + 678
        // = 5025678
        $this->assertSame(5025678, $raceTime->toMilliseconds());
    }

    public function test_converts_to_milliseconds_with_plus_sign_stripped(): void
    {
        $raceTime = RaceTime::fromString('+00:00:05.123');

        // 5 seconds + 123 milliseconds = 5123
        $this->assertSame(5123, $raceTime->toMilliseconds());
    }

    public function test_creates_from_milliseconds(): void
    {
        $raceTime = RaceTime::fromMilliseconds(5025678);

        $this->assertSame('01:23:45.678', $raceTime->value());
    }

    public function test_add_combines_two_race_times(): void
    {
        $time1 = RaceTime::fromString('00:01:30.500');
        $time2 = RaceTime::fromString('00:00:05.250');

        $result = $time1->add($time2);

        $this->assertSame('00:01:35.750', $result->value());
    }

    public function test_equals_returns_true_for_same_value(): void
    {
        $time1 = RaceTime::fromString('01:23:45.678');
        $time2 = RaceTime::fromString('01:23:45.678');

        $this->assertTrue($time1->equals($time2));
    }

    public function test_equals_returns_true_when_plus_sign_stripped(): void
    {
        $time1 = RaceTime::fromString('+01:23:45.678');
        $time2 = RaceTime::fromString('01:23:45.678');

        $this->assertTrue($time1->equals($time2));
    }

    public function test_equals_returns_false_for_different_value(): void
    {
        $time1 = RaceTime::fromString('01:23:45.678');
        $time2 = RaceTime::fromString('01:23:45.679');

        $this->assertFalse($time1->equals($time2));
    }

    public function test_equals_returns_true_for_both_null(): void
    {
        $time1 = RaceTime::fromString(null);
        $time2 = RaceTime::fromString('');

        $this->assertTrue($time1->equals($time2));
    }
}
