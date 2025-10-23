<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

/**
 * Enum representing competition status.
 * Type-safe status values.
 */
enum CompetitionStatus: string
{
    case ACTIVE = 'active';
    case ARCHIVED = 'archived';

    public function isActive(): bool
    {
        return $this === self::ACTIVE;
    }

    public function isArchived(): bool
    {
        return $this === self::ARCHIVED;
    }

    public static function fromString(string $status): self
    {
        return match (strtolower($status)) {
            'active' => self::ACTIVE,
            'archived' => self::ARCHIVED,
            default => throw new \InvalidArgumentException("Invalid status: {$status}"),
        };
    }
}
