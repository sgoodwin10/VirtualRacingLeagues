<?php

declare(strict_types=1);

namespace App\Domain\Driver\ValueObjects;

use InvalidArgumentException;

final readonly class DiscordId
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
        // Discord ID is optional, but if provided must meet requirements
        if ($this->value === null || trim($this->value) === '') {
            return;
        }

        // Validate length (consistent with other platform IDs)
        if (mb_strlen($this->value) > 255) {
            throw new InvalidArgumentException('Discord ID cannot exceed 255 characters');
        }
    }

    public function value(): ?string
    {
        return $this->value;
    }

    public function isEmpty(): bool
    {
        return $this->value === null || trim($this->value) === '';
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
