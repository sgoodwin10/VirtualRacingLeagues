<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\League\ValueObjects;

use App\Domain\League\Exceptions\InvalidLeagueNameException;
use App\Domain\League\ValueObjects\LeagueName;
use PHPUnit\Framework\TestCase;

class LeagueNameTest extends TestCase
{
    /**
     * @test
     */
    public function it_creates_valid_league_name(): void
    {
        $name = LeagueName::from('F1 Racing League');

        $this->assertEquals('F1 Racing League', $name->value());
        $this->assertEquals('F1 Racing League', $name->toString());
        $this->assertEquals('F1 Racing League', (string) $name);
    }

    /**
     * @test
     */
    public function it_accepts_minimum_length_name(): void
    {
        $name = LeagueName::from('ABC');

        $this->assertEquals('ABC', $name->value());
    }

    /**
     * @test
     */
    public function it_accepts_maximum_length_name(): void
    {
        $longName = str_repeat('a', 100);
        $name = LeagueName::from($longName);

        $this->assertEquals($longName, $name->value());
        $this->assertEquals(100, mb_strlen($name->value()));
    }

    /**
     * @test
     */
    public function it_throws_exception_for_empty_name(): void
    {
        $this->expectException(InvalidLeagueNameException::class);
        $this->expectExceptionMessage('League name cannot be empty');

        LeagueName::from('');
    }

    /**
     * @test
     */
    public function it_throws_exception_for_whitespace_only_name(): void
    {
        $this->expectException(InvalidLeagueNameException::class);
        $this->expectExceptionMessage('League name cannot be empty');

        LeagueName::from('   ');
    }

    /**
     * @test
     */
    public function it_throws_exception_for_too_short_name(): void
    {
        $this->expectException(InvalidLeagueNameException::class);
        $this->expectExceptionMessage("League name 'AB' is too short. Minimum length is 3 characters");

        LeagueName::from('AB');
    }

    /**
     * @test
     */
    public function it_throws_exception_for_too_long_name(): void
    {
        $longName = str_repeat('a', 101);

        $this->expectException(InvalidLeagueNameException::class);
        $this->expectExceptionMessage('League name is too long. Maximum length is 100 characters');

        LeagueName::from($longName);
    }

    /**
     * @test
     */
    public function it_preserves_whitespace_in_valid_names(): void
    {
        $name = LeagueName::from('F1 Racing League');

        $this->assertEquals('F1 Racing League', $name->value());
    }

    /**
     * @test
     */
    public function it_allows_special_characters(): void
    {
        $name = LeagueName::from('F1 Racing League - 2025!');

        $this->assertEquals('F1 Racing League - 2025!', $name->value());
    }

    /**
     * @test
     */
    public function it_checks_equality_correctly(): void
    {
        $name1 = LeagueName::from('F1 Racing League');
        $name2 = LeagueName::from('F1 Racing League');
        $name3 = LeagueName::from('GT3 Racing League');

        $this->assertTrue($name1->equals($name2));
        $this->assertFalse($name1->equals($name3));
    }

    /**
     * @test
     */
    public function it_handles_unicode_characters(): void
    {
        $name = LeagueName::from('Formule 1 Français');

        $this->assertEquals('Formule 1 Français', $name->value());
    }

    /**
     * @test
     */
    public function it_validates_length_using_multibyte_string_functions(): void
    {
        // 100 unicode characters
        $unicodeName = str_repeat('é', 100);
        $name = LeagueName::from($unicodeName);

        $this->assertEquals(100, mb_strlen($name->value()));

        // 101 unicode characters - should throw
        $tooLongUnicodeName = str_repeat('é', 101);

        $this->expectException(InvalidLeagueNameException::class);
        LeagueName::from($tooLongUnicodeName);
    }
}
