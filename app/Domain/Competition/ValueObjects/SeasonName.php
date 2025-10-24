<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

use InvalidArgumentException;

/**
 * SeasonName Value Object.
 *
 * Represents a season name with validation.
 * Immutable value object ensuring season names are valid.
 */
final readonly class SeasonName
{
    private function __construct(
        private string $value
    ) {
        $this->validate();
    }

    /**
     * Create from string value.
     */
    public static function from(string $value): self
    {
        return new self(trim($value));
    }

    /**
     * Validate the season name.
     *
     * @throws InvalidArgumentException
     */
    private function validate(): void
    {
        if ($this->value === '') {
            throw new InvalidArgumentException('Season name cannot be empty');
        }

        if (mb_strlen($this->value) < 3) {
            throw new InvalidArgumentException('Season name must be at least 3 characters');
        }

        if (mb_strlen($this->value) > 100) {
            throw new InvalidArgumentException('Season name cannot exceed 100 characters');
        }
    }

    /**
     * Get the season name value.
     */
    public function value(): string
    {
        return $this->value;
    }

    /**
     * Check equality with another SeasonName.
     */
    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    /**
     * Convert to string.
     */
    public function __toString(): string
    {
        return $this->value;
    }
}
