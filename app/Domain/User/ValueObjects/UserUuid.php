<?php

declare(strict_types=1);

namespace App\Domain\User\ValueObjects;

use InvalidArgumentException;

/**
 * User UUID Value Object.
 * Represents a unique identifier for a user.
 */
final readonly class UserUuid
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

    public static function generate(): self
    {
        return new self((string) \Illuminate\Support\Str::uuid());
    }

    private function validate(): void
    {
        $trimmed = trim($this->value);

        if ($trimmed === '') {
            throw new InvalidArgumentException('User UUID cannot be empty');
        }

        if (mb_strlen($trimmed) > 60) {
            throw new InvalidArgumentException('User UUID cannot exceed 60 characters');
        }

        // Validate UUID format (UUIDv3, v4, or v5)
        $pattern = '/^[0-9a-f]{8}-[0-9a-f]{4}-[345][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i';
        if (!preg_match($pattern, $trimmed)) {
            throw new InvalidArgumentException('User UUID must be a valid UUID format');
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
