<?php

declare(strict_types=1);

namespace App\Domain\Platform\ValueObjects;

/**
 * Car Group Value Object.
 * Represents car categories like Gr.1, Gr.2, Gr.3, Gr.4, Gr.B, No Gr, Roadster.
 */
final readonly class CarGroup
{
    private function __construct(
        private ?string $value
    ) {
        $this->validate();
    }

    public static function from(?string $value): self
    {
        return new self($value !== null ? trim($value) : null);
    }

    public function value(): ?string
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

        if ($this->value === '') {
            throw new \InvalidArgumentException('Car group cannot be empty string');
        }

        if (mb_strlen($this->value) > 50) {
            throw new \InvalidArgumentException(
                'Car group cannot exceed 50 characters, got: ' . mb_strlen($this->value)
            );
        }
    }
}
