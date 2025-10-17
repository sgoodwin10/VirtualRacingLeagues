<?php

declare(strict_types=1);

namespace App\Domain\SiteConfig\ValueObjects;

use App\Domain\SiteConfig\Exceptions\InvalidConfigurationException;

/**
 * Value Object representing a tracking ID (GTM, GA, etc.).
 * Immutable and self-validating.
 */
final readonly class TrackingId
{
    private const GTM_PATTERN = '/^GTM-[A-Z0-9]+$/';
    private const GA_PATTERN = '/^G-[A-Z0-9]+$/';

    private function __construct(
        private ?string $value,
        private string $type
    ) {
        if ($this->value !== null) {
            $this->validate();
        }
    }

    public static function googleTagManager(?string $value): self
    {
        return new self($value, 'Google Tag Manager');
    }

    public static function googleAnalytics(?string $value): self
    {
        return new self($value, 'Google Analytics');
    }

    private function validate(): void
    {
        if ($this->value === null) {
            return;
        }

        $trimmed = trim($this->value);

        if ($trimmed === '') {
            return; // Null/empty is allowed
        }

        if (mb_strlen($trimmed) > 50) {
            throw InvalidConfigurationException::invalidTrackingId($trimmed, $this->type);
        }

        // Validate format based on type
        if ($this->type === 'Google Tag Manager' && ! preg_match(self::GTM_PATTERN, $trimmed)) {
            throw InvalidConfigurationException::invalidTrackingId($trimmed, $this->type);
        }

        if ($this->type === 'Google Analytics' && ! preg_match(self::GA_PATTERN, $trimmed)) {
            throw InvalidConfigurationException::invalidTrackingId($trimmed, $this->type);
        }
    }

    public function value(): ?string
    {
        return $this->value;
    }

    public function isEmpty(): bool
    {
        return $this->value === null || trim($this->value) === '';
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value && $this->type === $other->type;
    }

    public function __toString(): string
    {
        return $this->value ?? '';
    }
}
