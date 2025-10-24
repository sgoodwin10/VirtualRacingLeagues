<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

/**
 * SeasonDriverStatus Enum.
 *
 * Represents the status of a driver within a season.
 */
enum SeasonDriverStatus: string
{
    case ACTIVE = 'active';       // Actively competing
    case RESERVE = 'reserve';     // Reserve/backup driver
    case WITHDRAWN = 'withdrawn'; // Withdrawn from season

    /**
     * Create from string value.
     */
    public static function fromString(string $value): self
    {
        return self::from($value);
    }

    /**
     * Check if status is active.
     */
    public function isActive(): bool
    {
        return $this === self::ACTIVE;
    }

    /**
     * Check if status is reserve.
     */
    public function isReserve(): bool
    {
        return $this === self::RESERVE;
    }

    /**
     * Check if status is withdrawn.
     */
    public function isWithdrawn(): bool
    {
        return $this === self::WITHDRAWN;
    }

    /**
     * Get human-readable label.
     */
    public function label(): string
    {
        return match ($this) {
            self::ACTIVE => 'Active',
            self::RESERVE => 'Reserve',
            self::WITHDRAWN => 'Withdrawn',
        };
    }
}
