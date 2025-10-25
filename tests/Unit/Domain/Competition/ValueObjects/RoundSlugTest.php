<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Competition\ValueObjects;

use App\Domain\Competition\ValueObjects\RoundSlug;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for RoundSlug value object.
 */
final class RoundSlugTest extends TestCase
{
    #[Test]
    public function it_creates_slug_from_string(): void
    {
        $slug = RoundSlug::from('Season Opener');

        $this->assertEquals('season-opener', $slug->value());
    }

    #[Test]
    public function it_creates_slug_from_name(): void
    {
        $slug = RoundSlug::fromName('Round Five', 5);

        $this->assertEquals('round-five', $slug->value());
    }

    #[Test]
    public function it_creates_slug_from_round_number_when_name_is_null(): void
    {
        $slug = RoundSlug::fromName(null, 5);

        $this->assertEquals('round-5', $slug->value());
    }

    #[Test]
    public function it_creates_slug_from_round_number_when_name_is_empty(): void
    {
        $slug = RoundSlug::fromName('   ', 5);

        $this->assertEquals('round-5', $slug->value());
    }

    #[Test]
    public function it_converts_uppercase_to_lowercase(): void
    {
        $slug = RoundSlug::from('SEASON OPENER');

        $this->assertEquals('season-opener', $slug->value());
    }

    #[Test]
    public function it_replaces_spaces_with_hyphens(): void
    {
        $slug = RoundSlug::from('Round Five Opener');

        $this->assertEquals('round-five-opener', $slug->value());
    }

    #[Test]
    public function it_throws_exception_for_empty_slug(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Slug cannot be empty');

        RoundSlug::from('');
    }

    #[Test]
    public function it_checks_equality(): void
    {
        $slug1 = RoundSlug::from('round-5');
        $slug2 = RoundSlug::from('round-5');
        $slug3 = RoundSlug::from('round-6');

        $this->assertTrue($slug1->equals($slug2));
        $this->assertFalse($slug1->equals($slug3));
    }
}
