<?php

declare(strict_types=1);

namespace App\Domain\Driver\ValueObjects;

use InvalidArgumentException;

final readonly class Slug
{
    private function __construct(
        private string $value
    ) {
        $this->validate();
    }

    /**
     * Create a slug from a string value.
     */
    public static function from(string $value): self
    {
        return new self($value);
    }

    /**
     * Generate a slug from driver name components.
     * Priority: "firstname-lastname" > "nickname" > "firstname" or "lastname"
     */
    public static function generate(
        ?string $firstName,
        ?string $lastName,
        ?string $nickname
    ): self {
        $hasFirstName = $firstName !== null && trim($firstName) !== '';
        $hasLastName = $lastName !== null && trim($lastName) !== '';

        $baseSlug = '';

        if ($hasFirstName && $hasLastName) {
            $baseSlug = $firstName . ' ' . $lastName;
        } elseif ($nickname !== null && trim($nickname) !== '') {
            $baseSlug = $nickname;
        } elseif ($hasFirstName) {
            $baseSlug = $firstName;
        } elseif ($hasLastName) {
            $baseSlug = $lastName;
        } else {
            throw new InvalidArgumentException('Cannot generate slug: no name components provided');
        }

        $slug = self::slugify($baseSlug);

        return new self($slug);
    }

    /**
     * Convert a string to a URL-friendly slug.
     */
    private static function slugify(string $value): string
    {
        // Convert to lowercase
        $slug = mb_strtolower($value, 'UTF-8');

        // Replace spaces and underscores with hyphens
        $slug = preg_replace('/[\s_]+/', '-', $slug);

        // Remove all characters that are not alphanumeric, hyphens, or Unicode letters
        $slug = preg_replace('/[^\p{L}\p{N}\-]/u', '', $slug);

        // Replace multiple consecutive hyphens with a single hyphen
        $slug = preg_replace('/-+/', '-', $slug);

        // Trim hyphens from the beginning and end
        $slug = trim($slug, '-');

        if ($slug === '') {
            throw new InvalidArgumentException('Generated slug is empty after sanitization');
        }

        return $slug;
    }

    private function validate(): void
    {
        if (trim($this->value) === '') {
            throw new InvalidArgumentException('Slug cannot be empty');
        }

        if (mb_strlen($this->value) > 255) {
            throw new InvalidArgumentException('Slug cannot exceed 255 characters');
        }

        // Validate slug format: lowercase alphanumeric and hyphens only
        if (!preg_match('/^[\p{Ll}\p{N}\-]+$/u', $this->value)) {
            throw new InvalidArgumentException('Slug must contain only lowercase letters, numbers, and hyphens');
        }

        // No leading or trailing hyphens
        if (str_starts_with($this->value, '-') || str_ends_with($this->value, '-')) {
            throw new InvalidArgumentException('Slug cannot start or end with a hyphen');
        }

        // No consecutive hyphens
        if (str_contains($this->value, '--')) {
            throw new InvalidArgumentException('Slug cannot contain consecutive hyphens');
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

    public function __toString(): string
    {
        return $this->value;
    }
}
