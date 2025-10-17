<?php

declare(strict_types=1);

namespace App\Domain\SiteConfig\Exceptions;

use Exception;

class InvalidConfigurationException extends Exception
{
    public static function invalidSiteName(string $reason): self
    {
        return new self("Invalid site name: {$reason}");
    }

    public static function invalidEmail(string $email, string $field): self
    {
        return new self("Invalid email address '{$email}' for field '{$field}'");
    }

    public static function invalidTimezone(string $timezone): self
    {
        return new self("Invalid timezone: {$timezone}");
    }

    public static function invalidTrackingId(string $value, string $type): self
    {
        return new self("Invalid {$type} tracking ID: {$value}");
    }

    public static function noActiveConfiguration(): self
    {
        return new self('No active site configuration found');
    }

    public static function multipleActiveConfigurations(): self
    {
        return new self('Multiple active site configurations found. Only one should be active.');
    }
}
