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
    private string $value;

    private function __construct(string $value)
    {
        // Trim value BEFORE storing (PHP 8.1+ allows this in constructor before first read)
        $trimmedValue = trim($value);
        $this->value = $trimmedValue;
        $this->validate();
    }

    public static function from(string $value): self
    {
        return new self($value);
    }

    private function validate(): void
    {
        if (mb_strlen($this->value) < 2) {
            throw InvalidDivisionNameException::tooShort($this->value);
        }

        if (mb_strlen($this->value) > 60) {
            throw InvalidDivisionNameException::tooLong($this->value);
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
