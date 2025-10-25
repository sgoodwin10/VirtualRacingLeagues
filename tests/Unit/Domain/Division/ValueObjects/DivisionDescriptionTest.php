<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Division\ValueObjects;

use App\Domain\Division\Exceptions\InvalidDivisionDescriptionException;
use App\Domain\Division\ValueObjects\DivisionDescription;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class DivisionDescriptionTest extends TestCase
{
    #[Test]
    public function it_accepts_null_description(): void
    {
        $description = DivisionDescription::from(null);

        $this->assertNull($description->value());
        $this->assertEquals('', (string) $description);
    }

    #[Test]
    public function it_creates_valid_division_description(): void
    {
        $description = DivisionDescription::from('This is a valid description for the division');

        $this->assertEquals('This is a valid description for the division', $description->value());
        $this->assertEquals('This is a valid description for the division', (string) $description);
    }

    #[Test]
    public function it_accepts_minimum_length_description(): void
    {
        $description = DivisionDescription::from('1234567890');

        $this->assertEquals('1234567890', $description->value());
        $this->assertEquals(10, mb_strlen($description->value()));
    }

    #[Test]
    public function it_accepts_maximum_length_description(): void
    {
        $longDescription = str_repeat('a', 500);
        $description = DivisionDescription::from($longDescription);

        $this->assertEquals($longDescription, $description->value());
        $this->assertEquals(500, mb_strlen($description->value()));
    }

    #[Test]
    public function it_throws_exception_for_too_short_description(): void
    {
        $this->expectException(InvalidDivisionDescriptionException::class);
        $this->expectExceptionMessage('Division description must be at least 10 characters long when provided. Got 9 characters');

        DivisionDescription::from('123456789');
    }

    #[Test]
    public function it_throws_exception_for_too_long_description(): void
    {
        $longDescription = str_repeat('a', 501);

        $this->expectException(InvalidDivisionDescriptionException::class);
        $this->expectExceptionMessage('Division description must not exceed 500 characters. Got 501 characters');

        DivisionDescription::from($longDescription);
    }

    #[Test]
    public function it_checks_equality_correctly(): void
    {
        $desc1 = DivisionDescription::from('This is a description');
        $desc2 = DivisionDescription::from('This is a description');
        $desc3 = DivisionDescription::from('This is another description');
        $desc4 = DivisionDescription::from(null);
        $desc5 = DivisionDescription::from(null);

        $this->assertTrue($desc1->equals($desc2));
        $this->assertFalse($desc1->equals($desc3));
        $this->assertTrue($desc4->equals($desc5));
        $this->assertFalse($desc1->equals($desc4));
    }

    #[Test]
    public function it_handles_unicode_characters(): void
    {
        $description = DivisionDescription::from('Description avec des caractères français éàç');

        $this->assertEquals('Description avec des caractères français éàç', $description->value());
    }

    #[Test]
    public function it_validates_length_using_multibyte_string_functions(): void
    {
        // 500 unicode characters
        $unicodeDescription = str_repeat('é', 500);
        $description = DivisionDescription::from($unicodeDescription);

        $this->assertEquals(500, mb_strlen($description->value()));

        // 501 unicode characters - should throw
        $tooLongUnicodeDescription = str_repeat('é', 501);

        $this->expectException(InvalidDivisionDescriptionException::class);
        DivisionDescription::from($tooLongUnicodeDescription);
    }
}
