<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

/**
 * Race Status Enum.
 * Represents the current status of a race.
 */
enum RaceStatus: string
{
    case SCHEDULED = 'scheduled';
    case COMPLETED = 'completed';

    public function label(): string
    {
        return match ($this) {
            self::SCHEDULED => 'Scheduled',
            self::COMPLETED => 'Completed',
        };
    }

    public function isScheduled(): bool
    {
        return $this === self::SCHEDULED;
    }

    public function isCompleted(): bool
    {
        return $this === self::COMPLETED;
    }
}
