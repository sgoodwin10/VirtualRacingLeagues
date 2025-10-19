<?php

declare(strict_types=1);

namespace App\Domain\League\ValueObjects;

/**
 * Value Object representing a league slug.
 * Immutable and self-validating.
 */
final readonly class LeagueSlug
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

    public static function fromName(string $name): self
    {
        $slug = strtolower(trim($name));
        $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
        $slug = preg_replace('/[\s-]+/', '-', $slug);
        $slug = trim($slug, '-');

        return new self($slug);
    }

    private function validate(): void
    {
        $trimmed = trim($this->value);

        if ($trimmed === '') {
            throw new \InvalidArgumentException('League slug cannot be empty');
        }

        if (mb_strlen($trimmed) > 150) {
            throw new \InvalidArgumentException('League slug cannot exceed 150 characters');
        }

        // Slug should only contain lowercase letters, numbers, and hyphens
        if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $trimmed)) {
            throw new \InvalidArgumentException('League slug must contain only lowercase letters, numbers, and hyphens');
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
