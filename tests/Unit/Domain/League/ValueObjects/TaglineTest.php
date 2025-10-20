<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\League\ValueObjects;

use App\Domain\League\Exceptions\InvalidTaglineException;
use App\Domain\League\ValueObjects\Tagline;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class TaglineTest extends TestCase
{
    #[Test]
    public function it_creates_valid_tagline(): void
    {
        $tagline = Tagline::from('The Premier F1 Racing League');

        $this->assertEquals('The Premier F1 Racing League', $tagline->value());
        $this->assertEquals('The Premier F1 Racing League', $tagline->toString());
        $this->assertEquals('The Premier F1 Racing League', (string) $tagline);
    }

    #[Test]
    public function it_accepts_maximum_length_tagline(): void
    {
        $longTagline = str_repeat('a', 150);
        $tagline = Tagline::from($longTagline);

        $this->assertEquals($longTagline, $tagline->value());
        $this->assertEquals(150, mb_strlen($tagline->value()));
    }

    #[Test]
    public function it_throws_exception_for_empty_tagline(): void
    {
        $this->expectException(InvalidTaglineException::class);
        $this->expectExceptionMessage('Tagline cannot be empty');

        Tagline::from('');
    }

    #[Test]
    public function it_throws_exception_for_whitespace_only_tagline(): void
    {
        $this->expectException(InvalidTaglineException::class);
        $this->expectExceptionMessage('Tagline cannot be empty');

        Tagline::from('   ');
    }

    #[Test]
    public function it_throws_exception_for_too_long_tagline(): void
    {
        $longTagline = str_repeat('a', 151);

        $this->expectException(InvalidTaglineException::class);
        $this->expectExceptionMessage('Tagline is too long. Maximum length is 150 characters');

        Tagline::from($longTagline);
    }

    #[Test]
    public function it_creates_null_from_nullable_with_null_value(): void
    {
        $tagline = Tagline::fromNullable(null);

        $this->assertNull($tagline);
    }

    #[Test]
    public function it_creates_null_from_nullable_with_empty_string(): void
    {
        $tagline = Tagline::fromNullable('');

        $this->assertNull($tagline);
    }

    #[Test]
    public function it_creates_null_from_nullable_with_whitespace(): void
    {
        $tagline = Tagline::fromNullable('   ');

        $this->assertNull($tagline);
    }

    #[Test]
    public function it_creates_tagline_from_nullable_with_valid_string(): void
    {
        $tagline = Tagline::fromNullable('The Premier F1 Racing League');

        $this->assertInstanceOf(Tagline::class, $tagline);
        $this->assertEquals('The Premier F1 Racing League', $tagline->value());
    }

    #[Test]
    public function it_throws_exception_from_nullable_for_too_long_tagline(): void
    {
        $longTagline = str_repeat('a', 151);

        $this->expectException(InvalidTaglineException::class);
        $this->expectExceptionMessage('Tagline is too long. Maximum length is 150 characters');

        Tagline::fromNullable($longTagline);
    }

    #[Test]
    public function it_preserves_whitespace_in_valid_taglines(): void
    {
        $tagline = Tagline::from('The Premier    F1    Racing League');

        $this->assertEquals('The Premier    F1    Racing League', $tagline->value());
    }

    #[Test]
    public function it_allows_special_characters(): void
    {
        $tagline = Tagline::from('Where Champions Race! #1 League');

        $this->assertEquals('Where Champions Race! #1 League', $tagline->value());
    }

    #[Test]
    public function it_checks_equality_correctly(): void
    {
        $tagline1 = Tagline::from('The Premier F1 Racing League');
        $tagline2 = Tagline::from('The Premier F1 Racing League');
        $tagline3 = Tagline::from('GT3 Championship Series');

        $this->assertTrue($tagline1->equals($tagline2));
        $this->assertFalse($tagline1->equals($tagline3));
    }

    #[Test]
    public function it_handles_unicode_characters(): void
    {
        $tagline = Tagline::from('La meilleure ligue de Formule 1 française');

        $this->assertEquals('La meilleure ligue de Formule 1 française', $tagline->value());
    }

    #[Test]
    public function it_validates_length_using_multibyte_string_functions(): void
    {
        // 150 unicode characters
        $unicodeTagline = str_repeat('é', 150);
        $tagline = Tagline::from($unicodeTagline);

        $this->assertEquals(150, mb_strlen($tagline->value()));

        // 151 unicode characters - should throw
        $tooLongUnicodeTagline = str_repeat('é', 151);

        $this->expectException(InvalidTaglineException::class);
        Tagline::from($tooLongUnicodeTagline);
    }

    #[Test]
    public function it_accepts_single_character_tagline(): void
    {
        $tagline = Tagline::from('A');

        $this->assertEquals('A', $tagline->value());
    }

    #[Test]
    public function it_handles_newlines_and_tabs(): void
    {
        $tagline = Tagline::from("Line 1\nLine 2\tTabbed");

        $this->assertEquals("Line 1\nLine 2\tTabbed", $tagline->value());
    }
}
