<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Driver\ValueObjects;

use App\Domain\Driver\ValueObjects\Slug;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class SlugTest extends TestCase
{
    public function test_can_create_valid_slug(): void
    {
        $slug = Slug::from('john-doe');

        $this->assertEquals('john-doe', $slug->value());
        $this->assertEquals('john-doe', (string) $slug);
    }

    public function test_can_generate_slug_from_first_and_last_name(): void
    {
        $slug = Slug::generate('John', 'Doe', null);

        $this->assertEquals('john-doe', $slug->value());
    }

    public function test_can_generate_slug_from_nickname(): void
    {
        $slug = Slug::generate(null, null, 'TheRacer77');

        $this->assertEquals('theracer77', $slug->value());
    }

    public function test_can_generate_slug_from_first_name_only(): void
    {
        $slug = Slug::generate('John', null, null);

        $this->assertEquals('john', $slug->value());
    }

    public function test_can_generate_slug_from_last_name_only(): void
    {
        $slug = Slug::generate(null, 'Doe', null);

        $this->assertEquals('doe', $slug->value());
    }

    public function test_slug_removes_spaces(): void
    {
        $slug = Slug::generate('John Michael', 'Doe Smith', null);

        $this->assertEquals('john-michael-doe-smith', $slug->value());
    }

    public function test_slug_removes_special_characters(): void
    {
        $slug = Slug::generate('John@#$', 'Doe!%^', null);

        $this->assertEquals('john-doe', $slug->value());
    }

    public function test_slug_handles_unicode_characters(): void
    {
        $slug = Slug::generate('José', 'García', null);

        $this->assertEquals('josé-garcía', $slug->value());
    }

    public function test_slug_converts_to_lowercase(): void
    {
        $slug = Slug::generate('JOHN', 'DOE', null);

        $this->assertEquals('john-doe', $slug->value());
    }

    public function test_from_validates_without_sanitizing(): void
    {
        $slug = Slug::from('john-doe');

        $this->assertEquals('john-doe', $slug->value());
    }

    public function test_from_throws_exception_for_multiple_hyphens(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Slug cannot contain consecutive hyphens');

        Slug::from('john---doe');
    }

    public function test_from_throws_exception_for_leading_hyphens(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Slug cannot start or end with a hyphen');

        Slug::from('-john-doe');
    }

    public function test_from_throws_exception_for_trailing_hyphens(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Slug cannot start or end with a hyphen');

        Slug::from('john-doe-');
    }

    public function test_throws_exception_for_empty_slug(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Slug cannot be empty');

        Slug::from('');
    }

    public function test_throws_exception_for_whitespace_slug(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Slug cannot be empty');

        Slug::from('   ');
    }

    public function test_throws_exception_for_slug_too_long(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Slug cannot exceed 255 characters');

        Slug::from(str_repeat('a', 256));
    }

    public function test_throws_exception_for_invalid_slug_format(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Slug must contain only lowercase letters, numbers, and hyphens');

        Slug::from('John Doe'); // spaces not allowed
    }

    public function test_generates_random_slug_when_no_name_or_platform_id_provided(): void
    {
        // Slug::generate now auto-generates a random slug when no name components or platform ID exist
        $slug = Slug::generate(null, null, null);

        // Should start with "driver-" followed by random hex
        $this->assertStringStartsWith('driver-', $slug->value());
        $this->assertGreaterThan(7, mb_strlen($slug->value())); // "driver-" + at least 1 hex char
    }

    public function test_equals_returns_true_for_same_slug(): void
    {
        $slug1 = Slug::from('john-doe');
        $slug2 = Slug::from('john-doe');

        $this->assertTrue($slug1->equals($slug2));
    }

    public function test_equals_returns_false_for_different_slug(): void
    {
        $slug1 = Slug::from('john-doe');
        $slug2 = Slug::from('jane-doe');

        $this->assertFalse($slug1->equals($slug2));
    }

    public function test_slug_with_numbers(): void
    {
        $slug = Slug::generate('John', 'Doe', 'TheRacer77');

        $this->assertEquals('john-doe', $slug->value());
    }

    public function test_generate_handles_underscores(): void
    {
        $slug = Slug::generate('john_doe', null, null);

        $this->assertEquals('john-doe', $slug->value());
    }

    public function test_throws_exception_for_uppercase_letters(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Slug must contain only lowercase letters, numbers, and hyphens');

        Slug::from('John-Doe');
    }
}
