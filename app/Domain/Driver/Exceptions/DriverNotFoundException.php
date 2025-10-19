<?php

declare(strict_types=1);

namespace App\Domain\Driver\Exceptions;

use RuntimeException;

final class DriverNotFoundException extends RuntimeException
{
    public static function withId(int $id): self
    {
        return new self("Driver with ID {$id} not found");
    }

    public static function withPlatformId(string $platformType, string $platformId): self
    {
        return new self("Driver with {$platformType} ID '{$platformId}' not found");
    }
}
