<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

/**
 * Round Status Enum.
 * Represents the current status of a round.
 */
enum RoundStatus: string
{
    case SCHEDULED = 'scheduled';
    case PRE_RACE = 'pre_race';
    case IN_PROGRESS = 'in_progress';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::SCHEDULED => 'Scheduled',
            self::PRE_RACE => 'Pre-Race',
            self::IN_PROGRESS => 'In Progress',
            self::COMPLETED => 'Completed',
            self::CANCELLED => 'Cancelled',
        };
    }

    public function isActive(): bool
    {
        return $this === self::IN_PROGRESS;
    }

    public function isCompleted(): bool
    {
        return $this === self::COMPLETED;
    }
}
