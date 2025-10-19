<?php

declare(strict_types=1);

namespace App\Domain\Driver\ValueObjects;

enum DriverStatus: string
{
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';
    case BANNED = 'banned';

    public function isActive(): bool
    {
        return $this === self::ACTIVE;
    }

    public function isBanned(): bool
    {
        return $this === self::BANNED;
    }

    public function isInactive(): bool
    {
        return $this === self::INACTIVE;
    }
}
