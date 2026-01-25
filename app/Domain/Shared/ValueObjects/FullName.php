<?php

declare(strict_types=1);

namespace App\Domain\Shared\ValueObjects;

use InvalidArgumentException;

/**
 * Shared Value Object representing a person's full name.
 * Immutable and self-validating.
 */
final readonly class FullName
{
    private function __construct(
        private string $firstName,
        private string $lastName
    ) {
        $this->validate();
    }

    public static function from(string $firstName, string $lastName): self
    {
        return new self($firstName, $lastName);
    }

    public static function fromNullable(?string $firstName, ?string $lastName): ?self
    {
        if ($firstName === null || trim($firstName) === '' || $lastName === null || trim($lastName) === '') {
            return null;
        }

        return new self($firstName, $lastName);
    }

    private function validate(): void
    {
        $trimmedFirst = trim($this->firstName);
        $trimmedLast = trim($this->lastName);

        if ($trimmedFirst === '') {
            throw new InvalidArgumentException('First name cannot be empty');
        }

        if ($trimmedLast === '') {
            throw new InvalidArgumentException('Last name cannot be empty');
        }

        if (mb_strlen($trimmedFirst) > 100) {
            throw new InvalidArgumentException('First name cannot exceed 100 characters');
        }

        if (mb_strlen($trimmedLast) > 100) {
            throw new InvalidArgumentException('Last name cannot exceed 100 characters');
        }

        // Basic validation: only letters, spaces, hyphens, apostrophes
        $pattern = "/^[a-zA-Z\s\-']+$/u";

        if (! preg_match($pattern, $trimmedFirst)) {
            throw new InvalidArgumentException('First name contains invalid characters');
        }

        if (! preg_match($pattern, $trimmedLast)) {
            throw new InvalidArgumentException('Last name contains invalid characters');
        }
    }

    public function firstName(): string
    {
        return $this->firstName;
    }

    public function lastName(): string
    {
        return $this->lastName;
    }

    public function full(): string
    {
        return "{$this->firstName} {$this->lastName}";
    }

    public function initials(): string
    {
        $first = mb_substr($this->firstName, 0, 1);
        $last = mb_substr($this->lastName, 0, 1);

        return strtoupper("{$first}{$last}");
    }

    public function equals(self $other): bool
    {
        return $this->firstName === $other->firstName
            && $this->lastName === $other->lastName;
    }

    public function __toString(): string
    {
        return $this->full();
    }
}
