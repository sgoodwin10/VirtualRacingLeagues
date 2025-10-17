<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Shared;

use App\Domain\Shared\ValueObjects\FullName;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class FullNameTest extends TestCase
{
    public function test_can_create_valid_full_name(): void
    {
        $name = FullName::from('John', 'Doe');

        $this->assertSame('John', $name->firstName());
        $this->assertSame('Doe', $name->lastName());
        $this->assertSame('John Doe', $name->full());
        $this->assertSame('John Doe', (string) $name);
    }

    public function test_can_create_from_nullable_with_valid_names(): void
    {
        $name = FullName::fromNullable('Jane', 'Smith');

        $this->assertInstanceOf(FullName::class, $name);
        $this->assertSame('Jane', $name->firstName());
        $this->assertSame('Smith', $name->lastName());
    }

    public function test_from_nullable_returns_null_for_null_first_name(): void
    {
        $name = FullName::fromNullable(null, 'Doe');

        $this->assertNull($name);
    }

    public function test_from_nullable_returns_null_for_null_last_name(): void
    {
        $name = FullName::fromNullable('John', null);

        $this->assertNull($name);
    }

    public function test_from_nullable_returns_null_for_empty_first_name(): void
    {
        $name = FullName::fromNullable('', 'Doe');

        $this->assertNull($name);
    }

    public function test_from_nullable_returns_null_for_empty_last_name(): void
    {
        $name = FullName::fromNullable('John', '');

        $this->assertNull($name);
    }

    public function test_from_nullable_returns_null_for_whitespace_first_name(): void
    {
        $name = FullName::fromNullable('   ', 'Doe');

        $this->assertNull($name);
    }

    public function test_from_nullable_returns_null_for_whitespace_last_name(): void
    {
        $name = FullName::fromNullable('John', '   ');

        $this->assertNull($name);
    }

    public function test_throws_exception_for_empty_first_name(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('First name cannot be empty');

        FullName::from('', 'Doe');
    }

    public function test_throws_exception_for_whitespace_first_name(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('First name cannot be empty');

        FullName::from('   ', 'Doe');
    }

    public function test_throws_exception_for_empty_last_name(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Last name cannot be empty');

        FullName::from('John', '');
    }

    public function test_throws_exception_for_whitespace_last_name(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Last name cannot be empty');

        FullName::from('John', '   ');
    }

    public function test_throws_exception_for_first_name_too_long(): void
    {
        $longName = str_repeat('a', 101);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('First name cannot exceed 100 characters');

        FullName::from($longName, 'Doe');
    }

    public function test_throws_exception_for_last_name_too_long(): void
    {
        $longName = str_repeat('a', 101);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Last name cannot exceed 100 characters');

        FullName::from('John', $longName);
    }

    public function test_accepts_first_name_at_max_length(): void
    {
        $maxName = str_repeat('a', 100);

        $name = FullName::from($maxName, 'Doe');

        $this->assertSame($maxName, $name->firstName());
    }

    public function test_accepts_last_name_at_max_length(): void
    {
        $maxName = str_repeat('a', 100);

        $name = FullName::from('John', $maxName);

        $this->assertSame($maxName, $name->lastName());
    }

    public function test_throws_exception_for_first_name_with_numbers(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('First name contains invalid characters');

        FullName::from('John123', 'Doe');
    }

    public function test_throws_exception_for_last_name_with_numbers(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Last name contains invalid characters');

        FullName::from('John', 'Doe456');
    }

    public function test_throws_exception_for_first_name_with_special_characters(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('First name contains invalid characters');

        FullName::from('John@', 'Doe');
    }

    public function test_throws_exception_for_last_name_with_special_characters(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Last name contains invalid characters');

        FullName::from('John', 'Doe$');
    }

    public function test_accepts_hyphenated_first_name(): void
    {
        $name = FullName::from('Mary-Jane', 'Watson');

        $this->assertSame('Mary-Jane', $name->firstName());
    }

    public function test_accepts_hyphenated_last_name(): void
    {
        $name = FullName::from('John', 'Smith-Jones');

        $this->assertSame('Smith-Jones', $name->lastName());
    }

    public function test_accepts_apostrophe_in_first_name(): void
    {
        $name = FullName::from("D'Angelo", 'Russell');

        $this->assertSame("D'Angelo", $name->firstName());
    }

    public function test_accepts_apostrophe_in_last_name(): void
    {
        $name = FullName::from('John', "O'Connor");

        $this->assertSame("O'Connor", $name->lastName());
    }

    public function test_accepts_spaces_in_first_name(): void
    {
        $name = FullName::from('Mary Ann', 'Smith');

        $this->assertSame('Mary Ann', $name->firstName());
    }

    public function test_accepts_spaces_in_last_name(): void
    {
        $name = FullName::from('John', 'Van Der Berg');

        $this->assertSame('Van Der Berg', $name->lastName());
    }

    public function test_can_get_initials(): void
    {
        $name = FullName::from('John', 'Doe');

        $this->assertSame('JD', $name->initials());
    }

    public function test_initials_are_uppercase(): void
    {
        $name = FullName::from('john', 'doe');

        $this->assertSame('JD', $name->initials());
    }

    public function test_initials_work_with_multi_word_names(): void
    {
        $name = FullName::from('Mary Jane', 'Watson');

        $this->assertSame('MW', $name->initials());
    }

    public function test_equals_returns_true_for_same_name(): void
    {
        $name1 = FullName::from('John', 'Doe');
        $name2 = FullName::from('John', 'Doe');

        $this->assertTrue($name1->equals($name2));
    }

    public function test_equals_returns_false_for_different_first_names(): void
    {
        $name1 = FullName::from('John', 'Doe');
        $name2 = FullName::from('Jane', 'Doe');

        $this->assertFalse($name1->equals($name2));
    }

    public function test_equals_returns_false_for_different_last_names(): void
    {
        $name1 = FullName::from('John', 'Doe');
        $name2 = FullName::from('John', 'Smith');

        $this->assertFalse($name1->equals($name2));
    }

    public function test_equals_is_case_sensitive(): void
    {
        $name1 = FullName::from('John', 'Doe');
        $name2 = FullName::from('john', 'doe');

        $this->assertFalse($name1->equals($name2));
    }

    public function test_preserves_case(): void
    {
        $name = FullName::from('JOHN', 'DOE');

        $this->assertSame('JOHN', $name->firstName());
        $this->assertSame('DOE', $name->lastName());
    }

    public function test_full_name_preserves_case(): void
    {
        $name = FullName::from('JoHn', 'DoE');

        $this->assertSame('JoHn DoE', $name->full());
    }
}
