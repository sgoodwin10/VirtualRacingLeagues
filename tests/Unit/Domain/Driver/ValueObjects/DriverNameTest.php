<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Driver\ValueObjects;

use App\Domain\Driver\ValueObjects\DriverName;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class DriverNameTest extends TestCase
{
    public function test_can_create_with_first_and_last_name(): void
    {
        $name = DriverName::from('John', 'Doe', null);

        $this->assertEquals('John', $name->firstName());
        $this->assertEquals('Doe', $name->lastName());
        $this->assertNull($name->nickname());
        $this->assertEquals('John Doe', $name->displayName());
    }

    public function test_can_create_with_nickname_only(): void
    {
        $name = DriverName::from(null, null, 'JohnnyRacer');

        $this->assertNull($name->firstName());
        $this->assertNull($name->lastName());
        $this->assertEquals('JohnnyRacer', $name->nickname());
        $this->assertEquals('JohnnyRacer', $name->displayName());
    }

    public function test_can_create_with_first_name_only(): void
    {
        $name = DriverName::from('John', null, null);

        $this->assertEquals('John', $name->firstName());
        $this->assertNull($name->lastName());
        $this->assertEquals('John', $name->displayName());
    }

    public function test_throws_exception_if_all_names_are_null(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('At least one name field');

        DriverName::from(null, null, null);
    }

    public function test_throws_exception_if_all_names_are_empty_strings(): void
    {
        $this->expectException(InvalidArgumentException::class);

        DriverName::from('', '', '');
    }

    public function test_throws_exception_if_first_name_too_long(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('First name cannot exceed 100 characters');

        DriverName::from(str_repeat('a', 101), 'Doe', null);
    }

    public function test_display_name_prioritizes_full_name_over_nickname(): void
    {
        $name = DriverName::from('John', 'Doe', 'JohnnyRacer');

        $this->assertEquals('John Doe', $name->displayName());
    }

    public function test_equals_returns_true_for_same_values(): void
    {
        $name1 = DriverName::from('John', 'Doe', 'Johnny');
        $name2 = DriverName::from('John', 'Doe', 'Johnny');

        $this->assertTrue($name1->equals($name2));
    }

    public function test_equals_returns_false_for_different_values(): void
    {
        $name1 = DriverName::from('John', 'Doe', null);
        $name2 = DriverName::from('Jane', 'Doe', null);

        $this->assertFalse($name1->equals($name2));
    }

    public function test_to_string_returns_display_name(): void
    {
        $name = DriverName::from('John', 'Doe', null);

        $this->assertEquals('John Doe', (string) $name);
    }
}
