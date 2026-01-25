<?php

declare(strict_types=1);

namespace App\Domain\Shared\ValueObjects;

use InvalidArgumentException;

/**
 * Shared Value Object representing an email address.
 * Immutable and self-validating.
 */
final readonly class EmailAddress
{
    private function __construct(
        private string $value,
        private ?string $fieldName = null
    ) {
        $this->validate();
    }

    public static function from(string $value, ?string $fieldName = null): self
    {
        return new self($value, $fieldName);
    }

    public static function fromNullable(?string $value, ?string $fieldName = null): ?self
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        return new self($value, $fieldName);
    }

    private function validate(): void
    {
        $trimmed = trim($this->value);

        if ($trimmed === '') {
            $fieldContext = $this->fieldName ? " for field '{$this->fieldName}'" : '';
            throw new InvalidArgumentException("Email address{$fieldContext} cannot be empty");
        }

        if (mb_strlen($trimmed) > 255) {
            $fieldContext = $this->fieldName ? " for field '{$this->fieldName}'" : '';
            throw new InvalidArgumentException("Email address{$fieldContext} cannot exceed 255 characters");
        }

        if (! filter_var($trimmed, FILTER_VALIDATE_EMAIL)) {
            $fieldContext = $this->fieldName ? " for field '{$this->fieldName}'" : '';
            throw new InvalidArgumentException("Invalid email address{$fieldContext}: {$trimmed}");
        }
    }

    public function value(): string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return strtolower($this->value) === strtolower($other->value);
    }

    public function domain(): string
    {
        $atPosition = strrchr($this->value, '@');

        return $atPosition !== false ? substr($atPosition, 1) : '';
    }

    public function localPart(): string
    {
        return strstr($this->value, '@', true) ?: '';
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
