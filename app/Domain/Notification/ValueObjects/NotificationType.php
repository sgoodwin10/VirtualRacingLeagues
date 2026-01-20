<?php

declare(strict_types=1);

namespace App\Domain\Notification\ValueObjects;

enum NotificationType: string
{
    case Contact = 'contact';
    case Registration = 'registration';
    case EmailVerification = 'email_verification';
    case PasswordReset = 'password_reset';
    case System = 'system';

    public function label(): string
    {
        return match ($this) {
            self::Contact => 'Contact Form',
            self::Registration => 'User Registration',
            self::EmailVerification => 'Email Verification',
            self::PasswordReset => 'Password Reset',
            self::System => 'System Notification',
        };
    }
}
