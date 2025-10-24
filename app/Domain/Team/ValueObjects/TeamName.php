<?php

declare(strict_types=1);

namespace App\Domain\Team\ValueObjects;

use App\Domain\Team\Exceptions\InvalidTeamNameException;

/**
 * Team Name Value Object.
 * Validates that team name is between 2-60 characters.
 */
final readonly class TeamName
{
    private function __construct(
        private string $value
    ) {
        $this->validate();
    }

    public static function from(string $value): self
    {
        return new self($value);
    }

    private function validate(): void
    {
        $trimmed = trim($this->value);

        if (mb_strlen($trimmed) < 2) {
            throw InvalidTeamNameException::tooShort($trimmed);
        }

        if (mb_strlen($trimmed) > 60) {
            throw InvalidTeamNameException::tooLong($trimmed);
        }
    }

    public function value(): string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
