<?php

declare(strict_types=1);

namespace App\Domain\Driver\ValueObjects;

use InvalidArgumentException;

final readonly class DriverName
{
    private function __construct(
        private ?string $firstName,
        private ?string $lastName,
        private ?string $nickname
    ) {
        $this->validate();
    }

    public static function from(?string $firstName, ?string $lastName, ?string $nickname): self
    {
        return new self($firstName, $lastName, $nickname);
    }

    private function validate(): void
    {
        // Name fields are now optional - validation moved to application layer
        // to allow drivers with only platform IDs (no name)

        // Validate lengths if provided
        if ($this->firstName !== null && mb_strlen($this->firstName) > 100) {
            throw new InvalidArgumentException('First name cannot exceed 100 characters');
        }

        if ($this->lastName !== null && mb_strlen($this->lastName) > 100) {
            throw new InvalidArgumentException('Last name cannot exceed 100 characters');
        }

        if ($this->nickname !== null && mb_strlen($this->nickname) > 100) {
            throw new InvalidArgumentException('Nickname cannot exceed 100 characters');
        }
    }

    public function firstName(): ?string
    {
        return $this->firstName;
    }

    public function lastName(): ?string
    {
        return $this->lastName;
    }

    public function nickname(): ?string
    {
        return $this->nickname;
    }

    /**
     * Get the full display name.
     * Priority: "FirstName LastName" > "Nickname" > "FirstName" or "LastName"
     */
    public function displayName(): string
    {
        $hasFirstName = $this->firstName !== null && trim($this->firstName) !== '';
        $hasLastName = $this->lastName !== null && trim($this->lastName) !== '';

        if ($hasFirstName && $hasLastName) {
            return trim($this->firstName . ' ' . $this->lastName);
        }

        if ($this->nickname !== null && trim($this->nickname) !== '') {
            return $this->nickname;
        }

        if ($hasFirstName) {
            return $this->firstName;
        }

        if ($hasLastName) {
            return $this->lastName;
        }

        // Should never reach here due to validation
        return '';
    }

    public function equals(self $other): bool
    {
        return $this->firstName === $other->firstName
            && $this->lastName === $other->lastName
            && $this->nickname === $other->nickname;
    }

    public function __toString(): string
    {
        return $this->displayName();
    }
}
