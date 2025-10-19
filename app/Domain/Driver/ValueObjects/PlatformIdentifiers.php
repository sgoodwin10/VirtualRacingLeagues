<?php

declare(strict_types=1);

namespace App\Domain\Driver\ValueObjects;

use InvalidArgumentException;

final readonly class PlatformIdentifiers
{
    private function __construct(
        private ?string $psnId,
        private ?string $gt7Id,
        private ?string $iracingId,
        private ?int $iracingCustomerId
    ) {
        $this->validate();
    }

    public static function from(
        ?string $psnId,
        ?string $gt7Id,
        ?string $iracingId,
        ?int $iracingCustomerId
    ): self {
        return new self($psnId, $gt7Id, $iracingId, $iracingCustomerId);
    }

    private function validate(): void
    {
        // At least one platform ID is required
        $hasPsn = $this->psnId !== null && trim($this->psnId) !== '';
        $hasGt7 = $this->gt7Id !== null && trim($this->gt7Id) !== '';
        $hasIracing = $this->iracingId !== null && trim($this->iracingId) !== '';
        $hasIracingCustomer = $this->iracingCustomerId !== null;

        if (!$hasPsn && !$hasGt7 && !$hasIracing && !$hasIracingCustomer) {
            throw new InvalidArgumentException('At least one platform identifier is required');
        }

        // Validate lengths
        if ($this->psnId !== null && mb_strlen($this->psnId) > 255) {
            throw new InvalidArgumentException('PSN ID cannot exceed 255 characters');
        }

        if ($this->gt7Id !== null && mb_strlen($this->gt7Id) > 255) {
            throw new InvalidArgumentException('GT7 ID cannot exceed 255 characters');
        }

        if ($this->iracingId !== null && mb_strlen($this->iracingId) > 255) {
            throw new InvalidArgumentException('iRacing ID cannot exceed 255 characters');
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

    public function gt7Id(): ?string
    {
        return $this->gt7Id;
    }

    public function iracingId(): ?string
    {
        return $this->iracingId;
    }

    public function iracingCustomerId(): ?int
    {
        return $this->iracingCustomerId;
    }

    /**
     * Get the primary platform identifier for display purposes.
     */
    public function primaryIdentifier(): string
    {
        if ($this->psnId !== null && trim($this->psnId) !== '') {
            return 'PSN: ' . $this->psnId;
        }

        if ($this->gt7Id !== null && trim($this->gt7Id) !== '') {
            return 'GT7: ' . $this->gt7Id;
        }

        if ($this->iracingId !== null && trim($this->iracingId) !== '') {
            return 'iRacing: ' . $this->iracingId;
        }

        if ($this->iracingCustomerId !== null) {
            return 'iRacing Customer: ' . $this->iracingCustomerId;
        }

        // Should never reach here due to validation
        return '';
    }

    /**
     * Check if this driver has any of the same platform IDs as another.
     */
    public function hasConflictWith(self $other): bool
    {
        if ($this->psnId !== null && $this->psnId === $other->psnId) {
            return true;
        }

        if ($this->gt7Id !== null && $this->gt7Id === $other->gt7Id) {
            return true;
        }

        if ($this->iracingId !== null && $this->iracingId === $other->iracingId) {
            return true;
        }

        if ($this->iracingCustomerId !== null && $this->iracingCustomerId === $other->iracingCustomerId) {
            return true;
        }

        return false;
    }

    public function equals(self $other): bool
    {
        return $this->psnId === $other->psnId
            && $this->gt7Id === $other->gt7Id
            && $this->iracingId === $other->iracingId
            && $this->iracingCustomerId === $other->iracingCustomerId;
    }
}
