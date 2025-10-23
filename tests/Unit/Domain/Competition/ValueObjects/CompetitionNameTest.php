<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Competition\ValueObjects;

use App\Domain\Competition\Exceptions\InvalidCompetitionNameException;
use App\Domain\Competition\ValueObjects\CompetitionName;
use PHPUnit\Framework\TestCase;

class CompetitionNameTest extends TestCase
{
    public function test_creates_valid_competition_name(): void
    {
        $name = CompetitionName::from('GT3 Championship');

        $this->assertSame('GT3 Championship', $name->value());
    }

    public function test_trims_whitespace(): void
    {
        $name = CompetitionName::from('  GT3 Championship  ');

        $this->assertSame('GT3 Championship', $name->value());
    }

    public function test_throws_exception_for_name_too_short(): void
    {
        $this->expectException(InvalidCompetitionNameException::class);
        $this->expectExceptionMessage('too short');

        CompetitionName::from('GT');
    }

    public function test_throws_exception_for_name_too_long(): void
    {
        $this->expectException(InvalidCompetitionNameException::class);
        $this->expectExceptionMessage('too long');

        CompetitionName::from(str_repeat('a', 101));
    }

    public function test_throws_exception_for_invalid_characters(): void
    {
        $this->expectException(InvalidCompetitionNameException::class);
        $this->expectExceptionMessage('invalid characters');

        CompetitionName::from('GT3 Championship @#$');
    }

    public function test_allows_apostrophes(): void
    {
        $name = CompetitionName::from("Driver's Championship");

        $this->assertSame("Driver's Championship", $name->value());
    }

    public function test_allows_hyphens(): void
    {
        $name = CompetitionName::from('GT3-GT4 Championship');

        $this->assertSame('GT3-GT4 Championship', $name->value());
    }

    public function test_allows_numbers(): void
    {
        $name = CompetitionName::from('GT3 2024 Championship');

        $this->assertSame('GT3 2024 Championship', $name->value());
    }

    public function test_equals_returns_true_for_same_value(): void
    {
        $name1 = CompetitionName::from('GT3 Championship');
        $name2 = CompetitionName::from('GT3 Championship');

        $this->assertTrue($name1->equals($name2));
    }

    public function test_equals_returns_false_for_different_value(): void
    {
        $name1 = CompetitionName::from('GT3 Championship');
        $name2 = CompetitionName::from('GT4 Championship');

        $this->assertFalse($name1->equals($name2));
    }

    public function test_to_string_returns_value(): void
    {
        $name = CompetitionName::from('GT3 Championship');

        $this->assertSame('GT3 Championship', $name->toString());
        $this->assertSame('GT3 Championship', (string) $name);
    }
}
