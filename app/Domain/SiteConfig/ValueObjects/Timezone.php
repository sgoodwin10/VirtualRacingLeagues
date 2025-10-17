<?php

declare(strict_types=1);

namespace App\Domain\SiteConfig\ValueObjects;

use App\Domain\SiteConfig\Exceptions\InvalidConfigurationException;
use DateTimeZone;

/**
 * Value Object representing a timezone.
 * Immutable and self-validating.
 */
final readonly class Timezone
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
        $validTimezones = DateTimeZone::listIdentifiers();

        if (! in_array($this->value, $validTimezones, true)) {
            throw InvalidConfigurationException::invalidTimezone($this->value);
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
