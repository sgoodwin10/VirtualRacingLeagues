<?php

declare(strict_types=1);

namespace App\Domain\Platform\Entities;

use App\Domain\Platform\Events\CarBrandActivated;
use App\Domain\Platform\Events\CarBrandCreated;
use App\Domain\Platform\Events\CarBrandUpdated;
use App\Domain\Platform\ValueObjects\BrandName;
use DateTimeImmutable;

/**
 * CarBrand Domain Entity.
 * Represents a car manufacturer/brand.
 */
final class CarBrand
{
    /** @var array<object> */
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private BrandName $name,
        private string $slug,
        private ?string $logoUrl,
        private bool $isActive,
        private int $sortOrder,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt,
    ) {
    }

    /**
     * Create a new car brand.
     */
    public static function create(
        BrandName $name,
        string $slug,
        ?string $logoUrl = null,
        bool $isActive = true,
        int $sortOrder = 0,
    ): self {
        return new self(
            id: null,
            name: $name,
            slug: $slug,
            logoUrl: $logoUrl,
            isActive: $isActive,
            sortOrder: $sortOrder,
            createdAt: new DateTimeImmutable(),
            updatedAt: new DateTimeImmutable(),
        );
    }

    /**
     * Record the CarBrandCreated event after ID has been set by repository.
     */
    public function recordCreationEvent(): void
    {
        if ($this->id === null) {
            throw new \LogicException('Cannot record creation event before entity has an ID');
        }

        $this->recordEvent(new CarBrandCreated(
            brandId: $this->id,
            name: $this->name->value(),
            slug: $this->slug,
        ));
    }

    /**
     * Reconstitute car brand from persistence.
     */
    public static function reconstitute(
        int $id,
        BrandName $name,
        string $slug,
        ?string $logoUrl,
        bool $isActive,
        int $sortOrder,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
    ): self {
        return new self(
            id: $id,
            name: $name,
            slug: $slug,
            logoUrl: $logoUrl,
            isActive: $isActive,
            sortOrder: $sortOrder,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
        );
    }

    // Getters

    public function id(): ?int
    {
        return $this->id;
    }

    public function name(): BrandName
    {
        return $this->name;
    }

    public function slug(): string
    {
        return $this->slug;
    }

    public function logoUrl(): ?string
    {
        return $this->logoUrl;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function sortOrder(): int
    {
        return $this->sortOrder;
    }

    public function createdAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function updatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }

    /**
     * Exception: needed for persistence to set ID after creation.
     */
    public function setId(int $id): void
    {
        if ($this->id !== null) {
            throw new \LogicException('Cannot change ID of an already persisted car brand');
        }

        $this->id = $id;
    }

    // Business logic methods

    /**
     * Update brand details.
     */
    public function updateDetails(
        BrandName $name,
        ?string $logoUrl
    ): void {
        $changes = [];

        if (! $name->equals($this->name)) {
            $this->name = $name;
            $changes['name'] = $name->value();
        }

        if ($logoUrl !== $this->logoUrl) {
            $this->logoUrl = $logoUrl;
            $changes['logo_url'] = $logoUrl;
        }

        if (! empty($changes)) {
            if ($this->id === null) {
                throw new \LogicException('Cannot update details on unpersisted car brand');
            }

            $this->updatedAt = new DateTimeImmutable();
            $this->recordEvent(new CarBrandUpdated(
                brandId: $this->id,
                changes: $changes,
            ));
        }
    }

    /**
     * Activate the brand.
     */
    public function activate(): void
    {
        if ($this->isActive) {
            return;
        }

        if ($this->id === null) {
            throw new \LogicException('Cannot activate unpersisted car brand');
        }

        $this->isActive = true;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new CarBrandActivated(
            brandId: $this->id,
        ));
    }

    /**
     * Deactivate the brand.
     */
    public function deactivate(): void
    {
        if (! $this->isActive) {
            return;
        }

        $this->isActive = false;
        $this->updatedAt = new DateTimeImmutable();
    }

    // Domain events management

    private function recordEvent(object $event): void
    {
        $this->domainEvents[] = $event;
    }

    /**
     * @return array<object>
     */
    public function releaseEvents(): array
    {
        $events = $this->domainEvents;
        $this->domainEvents = [];

        return $events;
    }

    public function hasEvents(): bool
    {
        return ! empty($this->domainEvents);
    }
}
