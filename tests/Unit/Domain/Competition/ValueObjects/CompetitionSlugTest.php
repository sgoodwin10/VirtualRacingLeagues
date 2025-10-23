<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Competition\ValueObjects;

use App\Domain\Competition\ValueObjects\CompetitionSlug;
use PHPUnit\Framework\TestCase;

class CompetitionSlugTest extends TestCase
{
    public function test_generates_slug_from_name(): void
    {
        $slug = CompetitionSlug::fromName('GT3 Championship');

        $this->assertSame('gt3-championship', $slug->value());
    }

    public function test_converts_to_lowercase(): void
    {
        $slug = CompetitionSlug::fromName('GT3 CHAMPIONSHIP');

        $this->assertSame('gt3-championship', $slug->value());
    }

    public function test_replaces_spaces_with_hyphens(): void
    {
        $slug = CompetitionSlug::fromName('GT3 Pro Championship');

        $this->assertSame('gt3-pro-championship', $slug->value());
    }

    public function test_removes_special_characters(): void
    {
        $slug = CompetitionSlug::fromName('GT3 Championship @2024!');

        // Laravel's Str::slug converts @ to 'at' by default
        $this->assertSame('gt3-championship-at-2024', $slug->value());
    }

    public function test_handles_multiple_consecutive_spaces(): void
    {
        $slug = CompetitionSlug::fromName('GT3    Championship');

        $this->assertSame('gt3-championship', $slug->value());
    }

    public function test_creates_from_existing_slug(): void
    {
        $slug = CompetitionSlug::from('existing-slug');

        $this->assertSame('existing-slug', $slug->value());
    }

    public function test_equals_returns_true_for_same_value(): void
    {
        $slug1 = CompetitionSlug::from('gt3-championship');
        $slug2 = CompetitionSlug::from('gt3-championship');

        $this->assertTrue($slug1->equals($slug2));
    }

    public function test_equals_returns_false_for_different_value(): void
    {
        $slug1 = CompetitionSlug::from('gt3-championship');
        $slug2 = CompetitionSlug::from('gt4-championship');

        $this->assertFalse($slug1->equals($slug2));
    }

    public function test_to_string_returns_value(): void
    {
        $slug = CompetitionSlug::from('gt3-championship');

        $this->assertSame('gt3-championship', $slug->toString());
        $this->assertSame('gt3-championship', (string) $slug);
    }

    public function test_handles_apostrophes(): void
    {
        $slug = CompetitionSlug::fromName("Driver's Championship");

        $this->assertSame('drivers-championship', $slug->value());
    }
}
