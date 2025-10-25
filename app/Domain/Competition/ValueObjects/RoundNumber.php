<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

use App\Domain\Competition\Exceptions\InvalidRoundNumberException;

/**
 * Round Number Value Object.
 * Validates that round number is between 1 and 99.
 */
final readonly class RoundNumber
{
    private function __construct(private int $value)
    {
        $this->validate();
    }

    public static function from(int $value): self
    {
        return new self($value);
    }

    private function validate(): void
    {
        if ($this->value < 1 || $this->value > 99) {
            throw InvalidRoundNumberException::outOfRange($this->value);
        }
    }

    public function value(): int
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }
}
