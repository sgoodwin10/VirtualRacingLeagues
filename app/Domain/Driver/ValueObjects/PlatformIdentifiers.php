<?php

declare(strict_types=1);

namespace App\Domain\Driver\ValueObjects;

use InvalidArgumentException;

final readonly class PlatformIdentifiers
{
    private function __construct(
        private ?string $psnId,
        private ?string $iracingId,
        private ?int $iracingCustomerId,
        private ?string $discordId
    ) {
        $this->validate();
    }

    public static function from(
        ?string $psnId,
        ?string $iracingId,
        ?int $iracingCustomerId,
        ?string $discordId = null
    ): self {
        return new self($psnId, $iracingId, $iracingCustomerId, $discordId);
    }

    private function validate(): void
    {
        // Platform IDs are now optional - validation moved to application layer
        // to allow drivers with only name (no platform IDs)

        // Validate lengths if provided
        if ($this->psnId !== null && mb_strlen($this->psnId) > 255) {
            throw new InvalidArgumentException('PSN ID cannot exceed 255 characters');
        }

        if ($this->iracingId !== null && mb_strlen($this->iracingId) > 255) {
            throw new InvalidArgumentException('iRacing ID cannot exceed 255 characters');
        }

        if ($this->discordId !== null && mb_strlen($this->discordId) > 255) {
            throw new InvalidArgumentException('Discord ID cannot exceed 255 characters');
        }

        // Validate iRacing customer ID is positive
        if ($this->iracingCustomerId !== null && $this->iracingCustomerId <= 0) {
            throw new InvalidArgumentException('iRacing customer ID must be a positive integer');
        }
    }

    public function psnId(): ?string
    {
        return $this->psnId;
    }

    public function iracingId(): ?string
    {
        return $this->iracingId;
    }

    public function iracingCustomerId(): ?int
    {
        return $this->iracingCustomerId;
    }

    public function discordId(): ?string
    {
        return $this->discordId;
    }

    /**
     * Get the primary platform identifier for display purposes.
     * Returns null if no platform identifiers exist.
     */
    public function primaryIdentifier(): ?string
    {
        if ($this->psnId !== null && trim($this->psnId) !== '') {
            return 'PSN: ' . $this->psnId;
        }

        if ($this->iracingId !== null && trim($this->iracingId) !== '') {
            return 'iRacing: ' . $this->iracingId;
        }

        if ($this->iracingCustomerId !== null) {
            return 'iRacing Customer: ' . $this->iracingCustomerId;
        }

        if ($this->discordId !== null && trim($this->discordId) !== '') {
            return 'Discord: ' . $this->discordId;
        }

        // No platform identifiers exist
        return null;
    }

    /**
     * Check if this driver has any of the same platform IDs as another.
     */
    public function hasConflictWith(self $other): bool
    {
        if ($this->psnId !== null && $this->psnId === $other->psnId) {
            return true;
        }

        if ($this->iracingId !== null && $this->iracingId === $other->iracingId) {
            return true;
        }

        if ($this->iracingCustomerId !== null && $this->iracingCustomerId === $other->iracingCustomerId) {
            return true;
        }

        if ($this->discordId !== null && $this->discordId === $other->discordId) {
            return true;
        }

        return false;
    }

    public function equals(self $other): bool
    {
        return $this->psnId === $other->psnId
            && $this->iracingId === $other->iracingId
            && $this->iracingCustomerId === $other->iracingCustomerId
            && $this->discordId === $other->discordId;
    }
}
