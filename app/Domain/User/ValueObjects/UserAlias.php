<?php

declare(strict_types=1);

namespace App\Domain\User\ValueObjects;

use InvalidArgumentException;

/**
 * User Alias Value Object.
 * Represents an optional display name/alias for a user.
 */
final readonly class UserAlias
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

    public static function fromNullable(?string $value): ?self
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        return new self($value);
    }

    private function validate(): void
    {
        $trimmed = trim($this->value);

        if ($trimmed === '') {
            throw new InvalidArgumentException('User alias cannot be empty');
        }

        if (mb_strlen($trimmed) > 100) {
            throw new InvalidArgumentException('User alias cannot exceed 100 characters');
        }

        // Basic validation: alphanumeric, spaces, underscores, hyphens, dots
        if (!preg_match('/^[a-zA-Z0-9\s_.-]+$/', $trimmed)) {
            throw new InvalidArgumentException('User alias contains invalid characters');
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
