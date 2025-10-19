<?php

declare(strict_types=1);

namespace App\Domain\League\ValueObjects;

use App\Domain\League\Exceptions\InvalidTaglineException;

/**
 * Value Object representing a league tagline.
 * Immutable and self-validating.
 */
final readonly class Tagline
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

    private function validate(): void
    {
        $trimmed = trim($this->value);

        if ($trimmed === '') {
            throw InvalidTaglineException::empty();
        }

        if (mb_strlen($trimmed) > 150) {
            throw InvalidTaglineException::tooLong($trimmed);
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

    public function toString(): string
    {
        return $this->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
