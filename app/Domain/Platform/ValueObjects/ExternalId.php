<?php

declare(strict_types=1);

namespace App\Domain\Platform\ValueObjects;

/**
 * External ID Value Object.
 * Represents an external identifier from third-party systems (e.g., KudosPrime).
 */
final readonly class ExternalId
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
            throw new \InvalidArgumentException('External ID cannot be empty');
        }

        if (mb_strlen($this->value) > 50) {
            throw new \InvalidArgumentException(
                'External ID cannot exceed 50 characters, got: ' . mb_strlen($this->value)
            );
        }
    }
}
