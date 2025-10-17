<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\User;

use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\Shared\ValueObjects\FullName;
use App\Domain\User\Entities\User;
use App\Domain\User\Events\EmailVerificationRequested;
use App\Domain\User\Events\EmailVerified;
use App\Domain\User\Events\PasswordResetCompleted;
use App\Domain\User\Events\PasswordResetRequested;
use App\Domain\User\Exceptions\EmailAlreadyVerifiedException;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for User entity authentication methods.
 */
class UserEntityAuthTest extends TestCase
{
    public function test_can_mark_email_as_verified(): void
    {
        $user = User::create(
            fullName: FullName::from('John', 'Doe'),
            email: EmailAddress::from('john@example.com'),
            password: 'hashed-password'
        );

        $this->assertFalse($user->isEmailVerified());

        $user->markEmailAsVerified();

        $this->assertTrue($user->isEmailVerified());
        $this->assertNotNull($user->emailVerifiedAt());
    }

    public function test_marking_email_as_verified_records_event(): void
    {
        $user = User::create(
            fullName: FullName::from('John', 'Doe'),
            email: EmailAddress::from('john@example.com'),
            password: 'hashed-password'
        );

        $user->markEmailAsVerified();

        $events = $user->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(EmailVerified::class, $events[0]);
    }

    public function test_cannot_verify_already_verified_email(): void
    {
        $user = User::create(
            fullName: FullName::from('John', 'Doe'),
            email: EmailAddress::from('john@example.com'),
            password: 'hashed-password'
        );

        $user->markEmailAsVerified();

        $this->expectException(EmailAlreadyVerifiedException::class);
        $user->markEmailAsVerified();
    }

    public function test_can_request_email_verification(): void
    {
        $user = User::create(
            fullName: FullName::from('John', 'Doe'),
            email: EmailAddress::from('john@example.com'),
            password: 'hashed-password'
        );

        $user->requestEmailVerification();

        $events = $user->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(EmailVerificationRequested::class, $events[0]);
    }

    public function test_can_request_password_reset(): void
    {
        $user = User::create(
            fullName: FullName::from('John', 'Doe'),
            email: EmailAddress::from('john@example.com'),
            password: 'hashed-password'
        );

        $user->requestPasswordReset();

        $events = $user->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(PasswordResetRequested::class, $events[0]);
    }

    public function test_can_reset_password(): void
    {
        $user = User::create(
            fullName: FullName::from('John', 'Doe'),
            email: EmailAddress::from('john@example.com'),
            password: 'old-hashed-password'
        );

        $newPassword = 'new-hashed-password';
        $user->resetPassword($newPassword);

        $this->assertEquals($newPassword, $user->password());

        $events = $user->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(PasswordResetCompleted::class, $events[0]);
    }

    public function test_can_update_password(): void
    {
        $user = User::create(
            fullName: FullName::from('John', 'Doe'),
            email: EmailAddress::from('john@example.com'),
            password: 'old-hashed-password'
        );

        $newPassword = 'new-hashed-password';
        $user->updatePassword($newPassword);

        $this->assertEquals($newPassword, $user->password());
    }

    public function test_updating_profile_with_email_change_requires_reverification(): void
    {
        $user = User::create(
            fullName: FullName::from('John', 'Doe'),
            email: EmailAddress::from('john@example.com'),
            password: 'hashed-password'
        );

        // Verify email first
        $user->markEmailAsVerified();
        $user->releaseEvents(); // Clear events

        $this->assertTrue($user->isEmailVerified());

        // Update email
        $user->updateProfile(
            email: EmailAddress::from('newemail@example.com')
        );

        // Email should now be unverified
        $this->assertFalse($user->isEmailVerified());

        // Should have UserUpdated and EmailVerificationRequested events
        $events = $user->releaseEvents();
        $this->assertCount(2, $events);
        $this->assertInstanceOf(EmailVerificationRequested::class, $events[1]);
    }

    public function test_updating_profile_without_email_change_keeps_verification(): void
    {
        $user = User::create(
            fullName: FullName::from('John', 'Doe'),
            email: EmailAddress::from('john@example.com'),
            password: 'hashed-password'
        );

        // Verify email first
        $user->markEmailAsVerified();
        $user->releaseEvents(); // Clear events

        $this->assertTrue($user->isEmailVerified());

        // Update name only
        $user->updateProfile(
            fullName: FullName::from('Jane', 'Doe')
        );

        // Email should still be verified
        $this->assertTrue($user->isEmailVerified());
    }
}
