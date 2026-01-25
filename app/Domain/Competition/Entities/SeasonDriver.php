<?php

declare(strict_types=1);

namespace App\Domain\Competition\Entities;

use App\Domain\Competition\Events\SeasonDriverAdded;
use App\Domain\Competition\Events\SeasonDriverRemoved;
use App\Domain\Competition\Events\SeasonDriverStatusChanged;
use App\Domain\Competition\ValueObjects\SeasonDriverStatus;
use DateTimeImmutable;

/**
 * SeasonDriver Domain Entity.
 *
 * Represents the association between a season and a league driver.
 * This is NOT a driver entity - it's a pivot/assignment entity.
 *
 * Key Business Rules:
 * 1. References existing league drivers (league_drivers table)
 * 2. A driver can only be in a season once
 * 3. Driver can have season-specific status and notes
 * 4. Removing from season does NOT delete the league driver
 */
final class SeasonDriver
{
    /** @var array<object> */
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private int $seasonId,
        private int $leagueDriverId,
        private ?int $teamId,
        private SeasonDriverStatus $status,
        private ?string $notes,
        private DateTimeImmutable $addedAt,
        private DateTimeImmutable $updatedAt,
    ) {
    }

    /**
     * Create a new season-driver association.
     */
    public static function create(
        int $seasonId,
        int $leagueDriverId,
        ?int $teamId = null,
        ?SeasonDriverStatus $status = null,
        ?string $notes = null,
    ): self {
        $now = new DateTimeImmutable();

        return new self(
            id: null,
            seasonId: $seasonId,
            leagueDriverId: $leagueDriverId,
            teamId: $teamId,
            status: $status ?? SeasonDriverStatus::ACTIVE,
            notes: $notes,
            addedAt: $now,
            updatedAt: $now,
        );
    }

    /**
     * Reconstitute from persistence.
     */
    public static function reconstitute(
        int $id,
        int $seasonId,
        int $leagueDriverId,
        ?int $teamId,
        SeasonDriverStatus $status,
        ?string $notes,
        DateTimeImmutable $addedAt,
        DateTimeImmutable $updatedAt,
    ): self {
        return new self(
            id: $id,
            seasonId: $seasonId,
            leagueDriverId: $leagueDriverId,
            teamId: $teamId,
            status: $status,
            notes: $notes,
            addedAt: $addedAt,
            updatedAt: $updatedAt,
        );
    }

    /**
     * Record the SeasonDriverAdded event after ID has been set.
     * This must be called by the application service after save().
     */
    public function recordCreationEvent(int $driverId): void
    {
        if ($this->id === null) {
            throw new \LogicException('Cannot record creation event before entity has an ID');
        }

        $this->recordEvent(new SeasonDriverAdded(
            seasonDriverId: $this->id,
            seasonId: $this->seasonId,
            leagueDriverId: $this->leagueDriverId,
            driverId: $driverId,
            status: $this->status->value,
            occurredAt: $this->addedAt->format('Y-m-d H:i:s'),
        ));
    }

    /**
     * Record removal event.
     */
    public function recordRemovalEvent(): void
    {
        if ($this->id === null) {
            throw new \LogicException('Cannot record removal event before entity has an ID');
        }

        $this->recordEvent(new SeasonDriverRemoved(
            seasonDriverId: $this->id,
            seasonId: $this->seasonId,
            leagueDriverId: $this->leagueDriverId,
            occurredAt: (new DateTimeImmutable())->format('Y-m-d H:i:s'),
        ));
    }

    // Getters

    public function id(): ?int
    {
        return $this->id;
    }

    public function setId(int $id): void
    {
        $this->id = $id;
    }

    public function seasonId(): int
    {
        return $this->seasonId;
    }

    public function leagueDriverId(): int
    {
        return $this->leagueDriverId;
    }

    public function teamId(): ?int
    {
        return $this->teamId;
    }

    public function status(): SeasonDriverStatus
    {
        return $this->status;
    }

    public function notes(): ?string
    {
        return $this->notes;
    }

    public function addedAt(): DateTimeImmutable
    {
        return $this->addedAt;
    }

    public function updatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }

    // Business Logic Methods

    /**
     * Update driver status.
     */
    public function updateStatus(SeasonDriverStatus $newStatus): void
    {
        if ($this->status === $newStatus) {
            return;
        }

        $oldStatus = $this->status;
        $this->status = $newStatus;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new SeasonDriverStatusChanged(
            seasonDriverId: $this->id ?? 0,
            seasonId: $this->seasonId,
            oldStatus: $oldStatus->value,
            newStatus: $newStatus->value,
            occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
        ));
    }

    /**
     * Update driver notes.
     */
    public function updateNotes(?string $notes): void
    {
        if ($this->notes === $notes) {
            return;
        }

        $this->notes = $notes;
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Set driver as active.
     */
    public function activate(): void
    {
        $this->updateStatus(SeasonDriverStatus::ACTIVE);
    }

    /**
     * Mark driver as reserve.
     */
    public function markAsReserve(): void
    {
        $this->updateStatus(SeasonDriverStatus::RESERVE);
    }

    /**
     * Mark driver as withdrawn.
     */
    public function markAsWithdrawn(): void
    {
        $this->updateStatus(SeasonDriverStatus::WITHDRAWN);
    }

    // Status Checks

    public function isActive(): bool
    {
        return $this->status->isActive();
    }

    public function isReserve(): bool
    {
        return $this->status->isReserve();
    }

    public function isWithdrawn(): bool
    {
        return $this->status->isWithdrawn();
    }

    // Domain Events Management

    /**
     * Record a domain event.
     */
    private function recordEvent(object $event): void
    {
        $this->domainEvents[] = $event;
    }

    /**
     * Get recorded domain events and clear them.
     *
     * @return array<object>
     */
    public function releaseEvents(): array
    {
        $events = $this->domainEvents;
        $this->domainEvents = [];

        return $events;
    }

    /**
     * Clear all recorded events without returning them.
     */
    public function clearEvents(): void
    {
        $this->domainEvents = [];
    }

    /**
     * Check if entity has recorded events.
     */
    public function hasEvents(): bool
    {
        return ! empty($this->domainEvents);
    }
}
