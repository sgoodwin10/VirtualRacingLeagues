<?php

declare(strict_types=1);

namespace App\Domain\Platform\ValueObjects;

/**
 * Brand Name Value Object.
 */
final readonly class BrandName
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
            throw new \InvalidArgumentException('Brand name cannot be empty');
        }

        if (mb_strlen($this->value) > 100) {
            throw new \InvalidArgumentException(
                'Brand name cannot exceed 100 characters, got: ' . mb_strlen($this->value)
            );
        }
    }
}
