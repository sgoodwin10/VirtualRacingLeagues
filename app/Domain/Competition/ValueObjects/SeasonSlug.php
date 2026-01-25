<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

use App\Domain\Competition\Exceptions\InvalidSeasonSlugException;

/**
 * SeasonSlug Value Object.
 *
 * Represents a URL-friendly season slug.
 * Format: lowercase, hyphenated (e.g., "winter-2025")
 * Max length: 150 characters
 */
final readonly class SeasonSlug
{
    private function __construct(
        private string $value
    ) {
        $this->validate();
    }

    /**
     * Create from string value.
     */
    public static function from(string $value): self
    {
        return new self($value);
    }

    /**
     * Generate slug from season name.
     * Converts to lowercase, replaces spaces with hyphens.
     *
     * @param  string  $name  Season name to slugify
     */
    public static function generate(string $name): self
    {
        $slug = strtolower(trim($name));
        $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
        $slug = preg_replace('/[\s-]+/', '-', $slug);
        $slug = trim($slug, '-');

        return new self($slug);
    }

    /**
     * Alias for generate() to match CompetitionSlug pattern.
     *
     * @param  string  $name  Season name to slugify
     */
    public static function fromName(string $name): self
    {
        return self::generate($name);
    }

    /**
     * Validate the slug format.
     *
     * @throws InvalidSeasonSlugException
     */
    private function validate(): void
    {
        if (trim($this->value) === '') {
            throw InvalidSeasonSlugException::withValue($this->value);
        }

        if (mb_strlen($this->value) > 150) {
            throw InvalidSeasonSlugException::withValue($this->value);
        }

        // Slug must be lowercase alphanumeric with hyphens
        if (! preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $this->value)) {
            throw InvalidSeasonSlugException::withValue($this->value);
        }
    }

    /**
     * Get the slug value.
     */
    public function value(): string
    {
        return $this->value;
    }

    /**
     * Check equality with another SeasonSlug.
     */
    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    /**
     * Append a suffix to create a new slug (for conflict resolution).
     *
     * @param  int  $suffix  Numeric suffix (e.g., 1 for "winter-2025-01")
     */
    public function withSuffix(int $suffix): self
    {
        $formattedSuffix = str_pad((string) $suffix, 2, '0', STR_PAD_LEFT);

        return new self($this->value . '-' . $formattedSuffix);
    }

    /**
     * Convert to string.
     */
    public function __toString(): string
    {
        return $this->value;
    }
}
