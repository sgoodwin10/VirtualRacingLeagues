<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

use InvalidArgumentException;

final readonly class RaceName
{
    private function __construct(private string $value)
    {
        $this->validate();
    }

    public static function from(string $value): self
    {
        return new self(trim($value));
    }

    private function validate(): void
    {
        if (mb_strlen($this->value) < 3) {
            throw new InvalidArgumentException('Race name must be at least 3 characters');
        }

        if (mb_strlen($this->value) > 100) {
            throw new InvalidArgumentException('Race name cannot exceed 100 characters');
        }
    }

    public function value(): string
    {
        return $this->value;
    }

    public function equals(?self $other): bool
    {
        if ($other === null) {
            return false;
        }
        return $this->value === $other->value;
    }
}
