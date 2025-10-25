<?php

declare(strict_types=1);

namespace App\Domain\Division\ValueObjects;

use App\Domain\Division\Exceptions\InvalidDivisionDescriptionException;

/**
 * Division Description Value Object.
 * Validates that division description is between 10-500 characters when provided.
 * This value object is NULLABLE - divisions can have no description.
 */
final readonly class DivisionDescription
{
    private function __construct(
        private ?string $value
    ) {
        $this->validate();
    }

    public static function from(?string $value): self
    {
        return new self($value);
    }

    private function validate(): void
    {
        // Null is valid - description is optional
        if ($this->value === null) {
            return;
        }

        $trimmed = trim($this->value);

        // Empty string after trimming is treated as null
        if ($trimmed === '') {
            return;
        }

        if (mb_strlen($trimmed) < 10) {
            throw InvalidDivisionDescriptionException::tooShort($trimmed);
        }

        if (mb_strlen($trimmed) > 500) {
            throw InvalidDivisionDescriptionException::tooLong($trimmed);
        }
    }

    public function value(): ?string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    public function __toString(): string
    {
        return $this->value ?? '';
    }
}
