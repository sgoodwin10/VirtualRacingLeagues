<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

use Illuminate\Support\Str;

/**
 * Value Object representing a competition slug.
 * Immutable and URL-safe.
 */
final readonly class CompetitionSlug
{
    private function __construct(
        private string $value
    ) {
    }

    public static function fromName(string $name): self
    {
        $slug = Str::slug($name);
        return new self($slug);
    }

    public static function from(string $value): self
    {
        return new self($value);
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
