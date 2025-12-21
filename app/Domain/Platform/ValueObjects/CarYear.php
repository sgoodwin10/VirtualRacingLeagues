<?php

declare(strict_types=1);

namespace App\Domain\Platform\ValueObjects;

/**
 * Car Year Value Object.
 * Validates year is within reasonable range.
 */
final readonly class CarYear
{
    private const MIN_YEAR = 1886; // First car invented
    private const MAX_YEAR = 2100; // Future-proof

    private function __construct(
        private ?int $value
    ) {
        if ($this->value !== null) {
            $this->validate();
        }
    }

    public static function from(?int $value): self
    {
        return new self($value);
    }

    public function value(): ?int
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    private function validate(): void
    {
        if ($this->value === null) {
            return;
        }

        if ($this->value < self::MIN_YEAR || $this->value > self::MAX_YEAR) {
            throw new \InvalidArgumentException(
                sprintf(
                    'Car year must be between %d and %d, got: %d',
                    self::MIN_YEAR,
                    self::MAX_YEAR,
                    $this->value
                )
            );
        }
    }
}
