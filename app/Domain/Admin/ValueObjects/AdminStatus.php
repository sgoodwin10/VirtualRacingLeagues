<?php

declare(strict_types=1);

namespace App\Domain\Admin\ValueObjects;

enum AdminStatus: string
{
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';

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
}
