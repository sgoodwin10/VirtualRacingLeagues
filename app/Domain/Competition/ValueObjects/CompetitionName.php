<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

use App\Domain\Competition\Exceptions\InvalidCompetitionNameException;

/**
 * Value Object representing a competition name.
 * Immutable and self-validating.
 */
final readonly class CompetitionName
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

        if (mb_strlen($trimmed) < 3) {
            throw InvalidCompetitionNameException::tooShort($this->value);
        }

        if (mb_strlen($trimmed) > 100) {
            throw InvalidCompetitionNameException::tooLong($this->value);
        }

        if (!preg_match('/^[a-zA-Z0-9\s\-\']+$/', $trimmed)) {
            throw InvalidCompetitionNameException::invalidCharacters($this->value);
        }
    }

    public function value(): string
    {
        return trim($this->value);
    }

    public function equals(self $other): bool
    {
        return $this->value() === $other->value();
    }

    public function toString(): string
    {
        return $this->value();
    }

    public function __toString(): string
    {
        return $this->value();
    }
}
