<?php

declare(strict_types=1);

namespace App\Domain\SiteConfig\ValueObjects;

use App\Domain\SiteConfig\Exceptions\InvalidConfigurationException;

/**
 * Value Object representing a site name.
 * Immutable and self-validating.
 */
final readonly class SiteName
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

    private function validate(): void
    {
        $trimmed = trim($this->value);

        if ($trimmed === '') {
            throw InvalidConfigurationException::invalidSiteName('Site name cannot be empty');
        }

        if (mb_strlen($trimmed) > 255) {
            throw InvalidConfigurationException::invalidSiteName('Site name cannot exceed 255 characters');
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
