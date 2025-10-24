<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

/**
 * SeasonStatus Enum.
 *
 * Represents the lifecycle status of a season.
 *
 * Status Flow:
 * setup → active → completed → archived
 */
enum SeasonStatus: string
{
    case SETUP = 'setup';         // Initial state, building structure
    case ACTIVE = 'active';       // Races happening
    case COMPLETED = 'completed'; // All races finished
    case ARCHIVED = 'archived';   // Historical record

    /**
     * Create from string value.
     */
    public static function fromString(string $value): self
    {
        return self::from($value);
    }

    /**
     * Check if status is setup.
     */
    public function isSetup(): bool
    {
        return $this === self::SETUP;
    }

    /**
     * Check if status is active.
     */
    public function isActive(): bool
    {
        return $this === self::ACTIVE;
    }

    /**
     * Check if status is completed.
     */
    public function isCompleted(): bool
    {
        return $this === self::COMPLETED;
    }

    /**
     * Check if status is archived.
     */
    public function isArchived(): bool
    {
        return $this === self::ARCHIVED;
    }

    /**
     * Get human-readable label.
     */
    public function label(): string
    {
        return match ($this) {
            self::SETUP => 'Setup',
            self::ACTIVE => 'Active',
            self::COMPLETED => 'Completed',
            self::ARCHIVED => 'Archived',
        };
    }
}
