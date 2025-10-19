<?php

declare(strict_types=1);

namespace App\Domain\League\ValueObjects;

use App\Domain\League\Exceptions\InvalidLeagueNameException;

/**
 * Value Object representing a league name.
 * Immutable and self-validating.
 */
final readonly class LeagueName
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

        if ($trimmed === '') {
            throw InvalidLeagueNameException::empty();
        }

        if (mb_strlen($trimmed) < 3) {
            throw InvalidLeagueNameException::tooShort($trimmed);
        }

        if (mb_strlen($trimmed) > 100) {
            throw InvalidLeagueNameException::tooLong($trimmed);
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

    public function toString(): string
    {
        return $this->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
