<?php

declare(strict_types=1);

namespace App\Domain\Division\ValueObjects;

use App\Domain\Division\Exceptions\InvalidDivisionNameException;

/**
 * Division Name Value Object.
 * Validates that division name is between 2-60 characters.
 */
final readonly class DivisionName
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
            throw InvalidDivisionNameException::tooShort($trimmed);
        }

        if (mb_strlen($trimmed) > 60) {
            throw InvalidDivisionNameException::tooLong($trimmed);
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
