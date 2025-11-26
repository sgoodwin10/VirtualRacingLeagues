<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

enum RaceResultStatus: string
{
    case PENDING = 'pending';
    case CONFIRMED = 'confirmed';

    public function isPending(): bool
    {
        return $this === self::PENDING;
    }

    public function isConfirmed(): bool
    {
        return $this === self::CONFIRMED;
    }
}
