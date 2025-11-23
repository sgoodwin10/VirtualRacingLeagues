<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

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
        $slug = strtolower(trim($name));
        $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
        $slug = preg_replace('/[\s-]+/', '-', $slug);
        $slug = trim($slug, '-');

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
