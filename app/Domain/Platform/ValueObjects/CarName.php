<?php

declare(strict_types=1);

namespace App\Domain\Platform\ValueObjects;

/**
 * Car Name Value Object.
 */
final readonly class CarName
{
    private function __construct(
        private string $value
    ) {
        $this->validate();
    }

    public static function from(string $value): self
    {
        return new self(trim($value));
    }

    public function value(): string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    private function validate(): void
    {
        if ($this->value === '') {
            throw new \InvalidArgumentException('Car name cannot be empty');
        }

        if (mb_strlen($this->value) > 255) {
            throw new \InvalidArgumentException(
                'Car name cannot exceed 255 characters, got: ' . mb_strlen($this->value)
            );
        }
    }
}
