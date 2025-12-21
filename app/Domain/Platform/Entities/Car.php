<?php

declare(strict_types=1);

namespace App\Domain\Platform\Entities;

use App\Domain\Platform\Events\CarActivated;
use App\Domain\Platform\Events\CarCreated;
use App\Domain\Platform\Events\CarDeactivated;
use App\Domain\Platform\Events\CarUpdated;
use App\Domain\Platform\ValueObjects\CarGroup;
use App\Domain\Platform\ValueObjects\CarName;
use App\Domain\Platform\ValueObjects\CarYear;
use App\Domain\Platform\ValueObjects\ExternalId;
use DateTimeImmutable;

/**
 * Car Domain Entity.
 * Represents a car/vehicle within a specific platform.
 */
final class Car
{
    /** @var array<object> */
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private int $platformId,
        private int $carBrandId,
        private ExternalId $externalId,
        private CarName $name,
        private string $slug,
        private CarGroup $carGroup,
        private CarYear $year,
        private ?string $imageUrl,
        private bool $isActive,
        private int $sortOrder,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt,
    ) {
    }

    /**
     * Create a new car.
     */
    public static function create(
        int $platformId,
        int $carBrandId,
        ExternalId $externalId,
        CarName $name,
        string $slug,
        CarGroup $carGroup,
        CarYear $year,
        ?string $imageUrl = null,
        bool $isActive = true,
        int $sortOrder = 0,
    ): self {
        return new self(
            id: null,
            platformId: $platformId,
            carBrandId: $carBrandId,
            externalId: $externalId,
            name: $name,
            slug: $slug,
            carGroup: $carGroup,
            year: $year,
            imageUrl: $imageUrl,
            isActive: $isActive,
            sortOrder: $sortOrder,
            createdAt: new DateTimeImmutable(),
            updatedAt: new DateTimeImmutable(),
        );
    }

    /**
     * Record the CarCreated event after ID has been set by repository.
     */
    public function recordCreationEvent(): void
    {
        if ($this->id === null) {
            throw new \LogicException('Cannot record creation event before entity has an ID');
        }

        $this->recordEvent(new CarCreated(
            carId: $this->id,
            platformId: $this->platformId,
            externalId: $this->externalId->value(),
            name: $this->name->value(),
            slug: $this->slug,
        ));
    }

    /**
     * Reconstitute car from persistence.
     */
    public static function reconstitute(
        int $id,
        int $platformId,
        int $carBrandId,
        ExternalId $externalId,
        CarName $name,
        string $slug,
        CarGroup $carGroup,
        CarYear $year,
        ?string $imageUrl,
        bool $isActive,
        int $sortOrder,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
    ): self {
        return new self(
            id: $id,
            platformId: $platformId,
            carBrandId: $carBrandId,
            externalId: $externalId,
            name: $name,
            slug: $slug,
            carGroup: $carGroup,
            year: $year,
            imageUrl: $imageUrl,
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

    public function platformId(): int
    {
        return $this->platformId;
    }

    public function carBrandId(): int
    {
        return $this->carBrandId;
    }

    public function externalId(): ExternalId
    {
        return $this->externalId;
    }

    public function name(): CarName
    {
        return $this->name;
    }

    public function slug(): string
    {
        return $this->slug;
    }

    public function carGroup(): CarGroup
    {
        return $this->carGroup;
    }

    public function year(): CarYear
    {
        return $this->year;
    }

    public function imageUrl(): ?string
    {
        return $this->imageUrl;
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
            throw new \LogicException('Cannot change ID of an already persisted car');
        }

        $this->id = $id;
    }

    // Business logic methods

    /**
     * Update car details.
     */
    public function updateDetails(
        CarName $name,
        int $carBrandId,
        CarGroup $carGroup,
        CarYear $year,
        ?string $imageUrl
    ): void {
        $changes = [];

        if (!$name->equals($this->name)) {
            $this->name = $name;
            $changes['name'] = $name->value();
        }

        if ($carBrandId !== $this->carBrandId) {
            $this->carBrandId = $carBrandId;
            $changes['car_brand_id'] = $carBrandId;
        }

        if (!$carGroup->equals($this->carGroup)) {
            $this->carGroup = $carGroup;
            $changes['car_group'] = $carGroup->value();
        }

        if (!$year->equals($this->year)) {
            $this->year = $year;
            $changes['year'] = $year->value();
        }

        if ($imageUrl !== $this->imageUrl) {
            $this->imageUrl = $imageUrl;
            $changes['image_url'] = $imageUrl;
        }

        if (!empty($changes)) {
            if ($this->id === null) {
                throw new \LogicException('Cannot update details on unpersisted car');
            }

            $this->updatedAt = new DateTimeImmutable();
            $this->recordEvent(new CarUpdated(
                carId: $this->id,
                changes: $changes,
            ));
        }
    }

    /**
     * Activate the car.
     */
    public function activate(): void
    {
        if ($this->isActive) {
            return;
        }

        if ($this->id === null) {
            throw new \LogicException('Cannot activate unpersisted car');
        }

        $this->isActive = true;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new CarActivated(
            carId: $this->id,
            platformId: $this->platformId,
        ));
    }

    /**
     * Deactivate the car.
     */
    public function deactivate(): void
    {
        if (!$this->isActive) {
            return;
        }

        $this->isActive = false;
        $this->updatedAt = new DateTimeImmutable();

        if ($this->id === null) {
            throw new \LogicException('Cannot deactivate unpersisted car');
        }

        $this->recordEvent(new CarDeactivated(
            carId: $this->id,
            platformId: $this->platformId,
        ));
    }

    // Domain events management

    /**
     * @param object $event
     */
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
        return !empty($this->domainEvents);
    }
}
