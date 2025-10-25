<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Division\ValueObjects;

use App\Domain\Division\Exceptions\InvalidDivisionNameException;
use App\Domain\Division\ValueObjects\DivisionName;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class DivisionNameTest extends TestCase
{
    #[Test]
    public function it_creates_valid_division_name(): void
    {
        $name = DivisionName::from('Pro Division');

        $this->assertEquals('Pro Division', $name->value());
        $this->assertEquals('Pro Division', (string) $name);
    }

    #[Test]
    public function it_accepts_minimum_length_name(): void
    {
        $name = DivisionName::from('AB');

        $this->assertEquals('AB', $name->value());
    }

    #[Test]
    public function it_accepts_maximum_length_name(): void
    {
        $longName = str_repeat('a', 60);
        $name = DivisionName::from($longName);

        $this->assertEquals($longName, $name->value());
        $this->assertEquals(60, mb_strlen($name->value()));
    }

    #[Test]
    public function it_throws_exception_for_too_short_name(): void
    {
        $this->expectException(InvalidDivisionNameException::class);
        $this->expectExceptionMessage('Division name must be at least 2 characters long. Got 1 characters: "A"');

        DivisionName::from('A');
    }

    #[Test]
    public function it_throws_exception_for_too_long_name(): void
    {
        $longName = str_repeat('a', 61);

        $this->expectException(InvalidDivisionNameException::class);
        $this->expectExceptionMessage('Division name must not exceed 60 characters. Got 61 characters');

        DivisionName::from($longName);
    }

    #[Test]
    public function it_preserves_whitespace_in_valid_names(): void
    {
        $name = DivisionName::from('Pro Division A');

        $this->assertEquals('Pro Division A', $name->value());
    }

    #[Test]
    public function it_allows_special_characters(): void
    {
        $name = DivisionName::from('Division A - 2025!');

        $this->assertEquals('Division A - 2025!', $name->value());
    }

    #[Test]
    public function it_checks_equality_correctly(): void
    {
        $name1 = DivisionName::from('Pro Division');
        $name2 = DivisionName::from('Pro Division');
        $name3 = DivisionName::from('Amateur Division');

        $this->assertTrue($name1->equals($name2));
        $this->assertFalse($name1->equals($name3));
    }

    #[Test]
    public function it_handles_unicode_characters(): void
    {
        $name = DivisionName::from('División Élite');

        $this->assertEquals('División Élite', $name->value());
    }

    #[Test]
    public function it_validates_length_using_multibyte_string_functions(): void
    {
        // 60 unicode characters
        $unicodeName = str_repeat('é', 60);
        $name = DivisionName::from($unicodeName);

        $this->assertEquals(60, mb_strlen($name->value()));

        // 61 unicode characters - should throw
        $tooLongUnicodeName = str_repeat('é', 61);

        $this->expectException(InvalidDivisionNameException::class);
        DivisionName::from($tooLongUnicodeName);
    }
}
