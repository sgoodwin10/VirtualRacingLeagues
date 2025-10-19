<?php

declare(strict_types=1);

namespace App\Domain\Driver\Entities;

use App\Domain\Driver\ValueObjects\DriverName;
use App\Domain\Driver\ValueObjects\PlatformIdentifiers;
use DateTimeImmutable;

final class Driver
{
    /** @var array<object> */
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private DriverName $name,
        private PlatformIdentifiers $platformIds,
        private ?string $email,
        private ?string $phone,
        private ?DateTimeImmutable $createdAt,
        private ?DateTimeImmutable $updatedAt,
        private ?DateTimeImmutable $deletedAt
    ) {}

    /**
     * Create a new driver (for new instances).
     */
    public static function create(
        DriverName $name,
        PlatformIdentifiers $platformIds,
        ?string $email = null,
        ?string $phone = null
    ): self {
        return new self(
            id: null,
            name: $name,
            platformIds: $platformIds,
            email: $email,
            phone: $phone,
            createdAt: new DateTimeImmutable,
            updatedAt: new DateTimeImmutable,
            deletedAt: null
        );
    }

    /**
     * Reconstitute from persistence.
     */
    public static function reconstitute(
        int $id,
        DriverName $name,
        PlatformIdentifiers $platformIds,
        ?string $email,
        ?string $phone,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
        ?DateTimeImmutable $deletedAt
    ): self {
        return new self(
            id: $id,
            name: $name,
            platformIds: $platformIds,
            email: $email,
            phone: $phone,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
            deletedAt: $deletedAt
        );
    }

    // Getters
    public function id(): ?int
    {
        return $this->id;
    }

    public function name(): DriverName
    {
        return $this->name;
    }

    public function platformIds(): PlatformIdentifiers
    {
        return $this->platformIds;
    }

    public function email(): ?string
    {
        return $this->email;
    }

    public function phone(): ?string
    {
        return $this->phone;
    }

    public function createdAt(): ?DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function updatedAt(): ?DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function deletedAt(): ?DateTimeImmutable
    {
        return $this->deletedAt;
    }

    // Exception: needed for persistence
    public function setId(int $id): void
    {
        $this->id = $id;
    }

    // Business logic methods
    public function updateProfile(
        DriverName $name,
        PlatformIdentifiers $platformIds,
        ?string $email,
        ?string $phone
    ): void {
        $this->name = $name;
        $this->platformIds = $platformIds;
        $this->email = $email;
        $this->phone = $phone;
        $this->updatedAt = new DateTimeImmutable;
    }

    public function updateName(DriverName $name): void
    {
        $this->name = $name;
        $this->updatedAt = new DateTimeImmutable;
    }

    public function updatePlatformIds(PlatformIdentifiers $platformIds): void
    {
        $this->platformIds = $platformIds;
        $this->updatedAt = new DateTimeImmutable;
    }

    public function updateEmail(?string $email): void
    {
        $this->email = $email;
        $this->updatedAt = new DateTimeImmutable;
    }

    public function updatePhone(?string $phone): void
    {
        $this->phone = $phone;
        $this->updatedAt = new DateTimeImmutable;
    }

    public function delete(): void
    {
        $this->deletedAt = new DateTimeImmutable;
        $this->updatedAt = new DateTimeImmutable;
    }

    public function isDeleted(): bool
    {
        return $this->deletedAt !== null;
    }

    /**
     * Check if this driver has any platform ID conflicts with another driver.
     */
    public function hasPlatformConflictWith(self $other): bool
    {
        return $this->platformIds->hasConflictWith($other->platformIds);
    }

    // Domain event management
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
