<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Shared;

use App\Domain\Shared\ValueObjects\EmailAddress;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class EmailAddressTest extends TestCase
{
    public function test_can_create_valid_email(): void
    {
        $email = EmailAddress::from('test@example.com');

        $this->assertSame('test@example.com', $email->value());
        $this->assertSame('test@example.com', (string) $email);
    }

    public function test_can_create_from_nullable_with_valid_email(): void
    {
        $email = EmailAddress::fromNullable('test@example.com');

        $this->assertInstanceOf(EmailAddress::class, $email);
        $this->assertSame('test@example.com', $email->value());
    }

    public function test_from_nullable_returns_null_for_null_input(): void
    {
        $email = EmailAddress::fromNullable(null);

        $this->assertNull($email);
    }

    public function test_from_nullable_returns_null_for_empty_string(): void
    {
        $email = EmailAddress::fromNullable('');

        $this->assertNull($email);
    }

    public function test_from_nullable_returns_null_for_whitespace(): void
    {
        $email = EmailAddress::fromNullable('   ');

        $this->assertNull($email);
    }

    public function test_trims_whitespace(): void
    {
        $email = EmailAddress::from('  test@example.com  ');

        $this->assertSame('  test@example.com  ', $email->value());
    }

    public function test_throws_exception_for_empty_email(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Email address cannot be empty');

        EmailAddress::from('');
    }

    public function test_throws_exception_for_whitespace_only(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Email address cannot be empty');

        EmailAddress::from('   ');
    }

    public function test_throws_exception_for_invalid_email_format(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid email address');

        EmailAddress::from('not-an-email');
    }

    public function test_throws_exception_for_email_without_domain(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid email address');

        EmailAddress::from('test@');
    }

    public function test_throws_exception_for_email_without_at_symbol(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid email address');

        EmailAddress::from('testexample.com');
    }

    public function test_throws_exception_for_email_too_long(): void
    {
        $longEmail = str_repeat('a', 245) . '@example.com'; // 257 characters

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Email address cannot exceed 255 characters');

        EmailAddress::from($longEmail);
    }

    public function test_accepts_email_with_long_local_part(): void
    {
        // RFC 5321 allows up to 64 chars for local part
        // Create a realistic long email that's still valid
        $localPart = str_repeat('a', 64);
        $longEmail = $localPart . '@example.com'; // 64 + 1 + 11 = 76 characters

        $email = EmailAddress::from($longEmail);

        $this->assertSame($longEmail, $email->value());
    }

    public function test_equals_returns_true_for_same_email(): void
    {
        $email1 = EmailAddress::from('test@example.com');
        $email2 = EmailAddress::from('test@example.com');

        $this->assertTrue($email1->equals($email2));
    }

    public function test_equals_returns_true_for_case_insensitive_match(): void
    {
        $email1 = EmailAddress::from('Test@Example.COM');
        $email2 = EmailAddress::from('test@example.com');

        $this->assertTrue($email1->equals($email2));
    }

    public function test_equals_returns_false_for_different_emails(): void
    {
        $email1 = EmailAddress::from('test1@example.com');
        $email2 = EmailAddress::from('test2@example.com');

        $this->assertFalse($email1->equals($email2));
    }

    public function test_can_extract_domain(): void
    {
        $email = EmailAddress::from('test@example.com');

        $this->assertSame('example.com', $email->domain());
    }

    public function test_can_extract_domain_with_subdomain(): void
    {
        $email = EmailAddress::from('test@mail.example.com');

        $this->assertSame('mail.example.com', $email->domain());
    }

    public function test_can_extract_local_part(): void
    {
        $email = EmailAddress::from('test@example.com');

        $this->assertSame('test', $email->localPart());
    }

    public function test_can_extract_local_part_with_plus(): void
    {
        $email = EmailAddress::from('test+tag@example.com');

        $this->assertSame('test+tag', $email->localPart());
    }

    public function test_accepts_plus_in_local_part(): void
    {
        $email = EmailAddress::from('user+tag@example.com');

        $this->assertSame('user+tag@example.com', $email->value());
    }

    public function test_accepts_dots_in_local_part(): void
    {
        $email = EmailAddress::from('first.last@example.com');

        $this->assertSame('first.last@example.com', $email->value());
    }

    public function test_accepts_hyphen_in_domain(): void
    {
        $email = EmailAddress::from('test@my-domain.com');

        $this->assertSame('test@my-domain.com', $email->value());
    }

    public function test_accepts_numbers_in_local_part(): void
    {
        $email = EmailAddress::from('user123@example.com');

        $this->assertSame('user123@example.com', $email->value());
    }
}
