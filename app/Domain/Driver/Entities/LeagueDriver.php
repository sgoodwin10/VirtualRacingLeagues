<?php

declare(strict_types=1);

namespace App\Domain\Driver\Entities;

use App\Domain\Driver\ValueObjects\DriverStatus;
use DateTimeImmutable;

final class LeagueDriver
{
    /** @var array<object> */
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private int $leagueId,
        private int $driverId,
        private ?int $driverNumber,
        private DriverStatus $status,
        private ?string $leagueNotes,
        private DateTimeImmutable $addedToLeagueAt,
        private DateTimeImmutable $updatedAt
    ) {
    }

    /**
     * Create a new league-driver association.
     */
    public static function create(
        int $leagueId,
        int $driverId,
        ?int $driverNumber = null,
        ?DriverStatus $status = null,
        ?string $leagueNotes = null
    ): self {
        return new self(
            id: null,
            leagueId: $leagueId,
            driverId: $driverId,
            driverNumber: $driverNumber,
            status: $status ?? DriverStatus::ACTIVE,
            leagueNotes: $leagueNotes,
            addedToLeagueAt: new DateTimeImmutable(),
            updatedAt: new DateTimeImmutable()
        );
    }

    /**
     * Reconstitute from persistence.
     */
    public static function reconstitute(
        int $id,
        int $leagueId,
        int $driverId,
        ?int $driverNumber,
        DriverStatus $status,
        ?string $leagueNotes,
        DateTimeImmutable $addedToLeagueAt,
        DateTimeImmutable $updatedAt
    ): self {
        return new self(
            id: $id,
            leagueId: $leagueId,
            driverId: $driverId,
            driverNumber: $driverNumber,
            status: $status,
            leagueNotes: $leagueNotes,
            addedToLeagueAt: $addedToLeagueAt,
            updatedAt: $updatedAt
        );
    }

    // Getters
    public function id(): ?int
    {
        return $this->id;
    }

    public function leagueId(): int
    {
        return $this->leagueId;
    }

    public function driverId(): int
    {
        return $this->driverId;
    }

    public function driverNumber(): ?int
    {
        return $this->driverNumber;
    }

    public function status(): DriverStatus
    {
        return $this->status;
    }

    public function leagueNotes(): ?string
    {
        return $this->leagueNotes;
    }

    public function addedToLeagueAt(): DateTimeImmutable
    {
        return $this->addedToLeagueAt;
    }

    public function updatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }

    // Exception: needed for persistence
    public function setId(int $id): void
    {
        $this->id = $id;
    }

    // Business logic methods
    public function updateLeagueSettings(
        ?int $driverNumber,
        DriverStatus $status,
        ?string $leagueNotes
    ): void {
        $this->driverNumber = $driverNumber;
        $this->status = $status;
        $this->leagueNotes = $leagueNotes;
        $this->updatedAt = new DateTimeImmutable();
    }

    public function activate(): void
    {
        $this->status = DriverStatus::ACTIVE;
        $this->updatedAt = new DateTimeImmutable();
    }

    public function deactivate(): void
    {
        $this->status = DriverStatus::INACTIVE;
        $this->updatedAt = new DateTimeImmutable();
    }

    public function ban(): void
    {
        $this->status = DriverStatus::BANNED;
        $this->updatedAt = new DateTimeImmutable();
    }

    public function isActive(): bool
    {
        return $this->status === DriverStatus::ACTIVE;
    }

    public function isBanned(): bool
    {
        return $this->status === DriverStatus::BANNED;
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
        return !empty($this->domainEvents);
    }
}
