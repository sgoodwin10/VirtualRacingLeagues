<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\League\ValueObjects;

use App\Domain\League\ValueObjects\LeagueSlug;
use PHPUnit\Framework\TestCase;

class LeagueSlugTest extends TestCase
{
    /**
     * @test
     */
    public function it_creates_valid_slug_from_string(): void
    {
        $slug = LeagueSlug::from('f1-racing-league');

        $this->assertEquals('f1-racing-league', $slug->value());
        $this->assertEquals('f1-racing-league', $slug->toString());
        $this->assertEquals('f1-racing-league', (string) $slug);
    }

    /**
     * @test
     */
    public function it_generates_slug_from_name(): void
    {
        $slug = LeagueSlug::fromName('F1 Racing League');

        $this->assertEquals('f1-racing-league', $slug->value());
    }

    /**
     * @test
     */
    public function it_converts_uppercase_to_lowercase(): void
    {
        $slug = LeagueSlug::fromName('GT3 RACING LEAGUE');

        $this->assertEquals('gt3-racing-league', $slug->value());
    }

    /**
     * @test
     */
    public function it_replaces_spaces_with_hyphens(): void
    {
        $slug = LeagueSlug::fromName('Super Formula League');

        $this->assertEquals('super-formula-league', $slug->value());
    }

    /**
     * @test
     */
    public function it_removes_special_characters(): void
    {
        $slug = LeagueSlug::fromName('F1 Racing League - 2025!');

        $this->assertEquals('f1-racing-league-2025', $slug->value());
    }

    /**
     * @test
     */
    public function it_collapses_multiple_spaces_to_single_hyphen(): void
    {
        $slug = LeagueSlug::fromName('F1    Racing    League');

        $this->assertEquals('f1-racing-league', $slug->value());
    }

    /**
     * @test
     */
    public function it_collapses_multiple_hyphens_to_single_hyphen(): void
    {
        $slug = LeagueSlug::fromName('F1---Racing---League');

        $this->assertEquals('f1-racing-league', $slug->value());
    }

    /**
     * @test
     */
    public function it_trims_leading_and_trailing_hyphens(): void
    {
        $slug = LeagueSlug::fromName('-F1 Racing League-');

        $this->assertEquals('f1-racing-league', $slug->value());
    }

    /**
     * @test
     */
    public function it_handles_numbers_correctly(): void
    {
        $slug = LeagueSlug::fromName('Formula 1 2025');

        $this->assertEquals('formula-1-2025', $slug->value());
    }

    /**
     * @test
     */
    public function it_throws_exception_for_empty_slug(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('League slug cannot be empty');

        LeagueSlug::from('');
    }

    /**
     * @test
     */
    public function it_throws_exception_for_whitespace_only_slug(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('League slug cannot be empty');

        LeagueSlug::from('   ');
    }

    /**
     * @test
     */
    public function it_throws_exception_for_too_long_slug(): void
    {
        $longSlug = str_repeat('a', 151);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('League slug cannot exceed 150 characters');

        LeagueSlug::from($longSlug);
    }

    /**
     * @test
     */
    public function it_throws_exception_for_invalid_characters_in_slug(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('League slug must contain only lowercase letters, numbers, and hyphens');

        LeagueSlug::from('f1_racing_league');
    }

    /**
     * @test
     */
    public function it_throws_exception_for_uppercase_letters_in_slug(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('League slug must contain only lowercase letters, numbers, and hyphens');

        LeagueSlug::from('F1-Racing-League');
    }

    /**
     * @test
     */
    public function it_throws_exception_for_consecutive_hyphens(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('League slug must contain only lowercase letters, numbers, and hyphens');

        LeagueSlug::from('f1--racing--league');
    }

    /**
     * @test
     */
    public function it_throws_exception_for_leading_hyphen(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('League slug must contain only lowercase letters, numbers, and hyphens');

        LeagueSlug::from('-f1-racing-league');
    }

    /**
     * @test
     */
    public function it_throws_exception_for_trailing_hyphen(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('League slug must contain only lowercase letters, numbers, and hyphens');

        LeagueSlug::from('f1-racing-league-');
    }

    /**
     * @test
     */
    public function it_checks_equality_correctly(): void
    {
        $slug1 = LeagueSlug::from('f1-racing-league');
        $slug2 = LeagueSlug::from('f1-racing-league');
        $slug3 = LeagueSlug::from('gt3-racing-league');

        $this->assertTrue($slug1->equals($slug2));
        $this->assertFalse($slug1->equals($slug3));
    }

    /**
     * @test
     */
    public function it_generates_url_safe_slugs(): void
    {
        $testCases = [
            'F1 Racing League' => 'f1-racing-league',
            'GT3 @ Silverstone!' => 'gt3-silverstone',
            'Formula E 2025 - Season 11' => 'formula-e-2025-season-11',
            'iRacing Championship (Europe)' => 'iracing-championship-europe',
            'ACC: GT3 Series' => 'acc-gt3-series',
        ];

        foreach ($testCases as $input => $expected) {
            $slug = LeagueSlug::fromName($input);
            $this->assertEquals($expected, $slug->value(), "Failed for input: {$input}");
        }
    }

    /**
     * @test
     */
    public function it_throws_exception_when_generating_slug_exceeds_maximum_length(): void
    {
        $longName = str_repeat('a', 200);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('League slug cannot exceed 150 characters');

        LeagueSlug::fromName($longName);
    }
}
