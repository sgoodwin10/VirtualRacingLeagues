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
    private ?string $value;

    private function __construct(
        ?string $value
    ) {
        // Trim and convert empty strings to null
        $trimmed = $value !== null ? trim($value) : null;
        $this->value = ($trimmed === '' || $trimmed === null) ? null : $trimmed;
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

        // At this point, value is already trimmed and non-empty (handled in constructor)
        if (mb_strlen($this->value) < 10) {
            throw InvalidDivisionDescriptionException::tooShort($this->value);
        }

        if (mb_strlen($this->value) > 500) {
            throw InvalidDivisionDescriptionException::tooLong($this->value);
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
