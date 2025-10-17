<?php

declare(strict_types=1);

namespace App\Domain\User\ValueObjects;

enum UserStatus: string
{
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';
    case SUSPENDED = 'suspended';

    public function equals(self $other): bool
    {
        return $this === $other;
    }

    public function isActive(): bool
    {
        return $this === self::ACTIVE;
    }

    public function isInactive(): bool
    {
        return $this === self::INACTIVE;
    }

    public function isSuspended(): bool
    {
        return $this === self::SUSPENDED;
    }
}
