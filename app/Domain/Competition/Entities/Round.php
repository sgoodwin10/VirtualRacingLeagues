<?php

declare(strict_types=1);

namespace App\Domain\Competition\Entities;

use App\Domain\Competition\ValueObjects\RoundName;
use App\Domain\Competition\ValueObjects\RoundNumber;
use App\Domain\Competition\ValueObjects\RoundSlug;
use App\Domain\Competition\ValueObjects\RoundStatus;
use App\Domain\Competition\Events\RoundCreated;
use App\Domain\Competition\Events\RoundUpdated;
use App\Domain\Competition\Events\RoundDeleted;
use App\Domain\Competition\Events\RoundStatusChanged;
use DateTimeImmutable;

/**
 * Round Domain Entity.
 * Represents a round within a season containing one or more races.
 */
final class Round
{
    /** @var array<object> */
    private array $events = [];

    private function __construct(
        private ?int $id,
        private int $seasonId,
        private RoundNumber $roundNumber,
        private ?RoundName $name,
        private RoundSlug $slug,
        private ?DateTimeImmutable $scheduledAt,
        private string $timezone,
        private ?int $platformTrackId,
        private ?string $trackLayout,
        private ?string $trackConditions,
        private ?string $technicalNotes,
        private ?string $streamUrl,
        private ?string $internalNotes,
        private ?int $fastestLap,
        private bool $fastestLapTop10,
        private RoundStatus $status,
        private int $createdByUserId,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt,
        private ?DateTimeImmutable $deletedAt = null,
    ) {
    }

    /**
     * Create a new round.
     */
    public static function create(
        int $seasonId,
        RoundNumber $roundNumber,
        ?RoundName $name,
        RoundSlug $slug,
        ?DateTimeImmutable $scheduledAt,
        string $timezone,
        ?int $platformTrackId,
        ?string $trackLayout,
        ?string $trackConditions,
        ?string $technicalNotes,
        ?string $streamUrl,
        ?string $internalNotes,
        ?int $fastestLap,
        bool $fastestLapTop10,
        int $createdByUserId,
    ): self {
        return new self(
            id: null,
            seasonId: $seasonId,
            roundNumber: $roundNumber,
            name: $name,
            slug: $slug,
            scheduledAt: $scheduledAt,
            timezone: $timezone,
            platformTrackId: $platformTrackId,
            trackLayout: $trackLayout,
            trackConditions: $trackConditions,
            technicalNotes: $technicalNotes,
            streamUrl: $streamUrl,
            internalNotes: $internalNotes,
            fastestLap: $fastestLap,
            fastestLapTop10: $fastestLapTop10,
            status: RoundStatus::SCHEDULED,
            createdByUserId: $createdByUserId,
            createdAt: new DateTimeImmutable(),
            updatedAt: new DateTimeImmutable(),
            deletedAt: null,
        );
    }

    /**
     * Reconstitute round from persistence.
     */
    public static function reconstitute(
        int $id,
        int $seasonId,
        RoundNumber $roundNumber,
        ?RoundName $name,
        RoundSlug $slug,
        ?DateTimeImmutable $scheduledAt,
        string $timezone,
        ?int $platformTrackId,
        ?string $trackLayout,
        ?string $trackConditions,
        ?string $technicalNotes,
        ?string $streamUrl,
        ?string $internalNotes,
        ?int $fastestLap,
        bool $fastestLapTop10,
        RoundStatus $status,
        int $createdByUserId,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
        ?DateTimeImmutable $deletedAt = null,
    ): self {
        return new self(
            id: $id,
            seasonId: $seasonId,
            roundNumber: $roundNumber,
            name: $name,
            slug: $slug,
            scheduledAt: $scheduledAt,
            timezone: $timezone,
            platformTrackId: $platformTrackId,
            trackLayout: $trackLayout,
            trackConditions: $trackConditions,
            technicalNotes: $technicalNotes,
            streamUrl: $streamUrl,
            internalNotes: $internalNotes,
            fastestLap: $fastestLap,
            fastestLapTop10: $fastestLapTop10,
            status: $status,
            createdByUserId: $createdByUserId,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
            deletedAt: $deletedAt,
        );
    }

    /**
     * Update round details.
     */
    public function updateDetails(
        RoundNumber $roundNumber,
        ?RoundName $name,
        RoundSlug $slug,
        ?DateTimeImmutable $scheduledAt,
        ?int $platformTrackId,
        ?string $trackLayout,
        ?string $trackConditions,
        ?string $technicalNotes,
        ?string $streamUrl,
        ?string $internalNotes,
        ?int $fastestLap,
        bool $fastestLapTop10,
    ): void {
        $hasChanges = false;

        if (!$this->roundNumber->equals($roundNumber)) {
            $this->roundNumber = $roundNumber;
            $hasChanges = true;
        }

        if ($this->name?->equals($name) === false || ($this->name === null && $name !== null)) {
            $this->name = $name;
            $hasChanges = true;
        }

        if (!$this->slug->equals($slug)) {
            $this->slug = $slug;
            $hasChanges = true;
        }

        if ($this->scheduledAt != $scheduledAt) {
            $this->scheduledAt = $scheduledAt;
            $hasChanges = true;
        }

        if ($this->platformTrackId !== $platformTrackId) {
            $this->platformTrackId = $platformTrackId;
            $hasChanges = true;
        }

        if ($this->trackLayout !== $trackLayout) {
            $this->trackLayout = $trackLayout;
            $hasChanges = true;
        }

        if ($this->trackConditions !== $trackConditions) {
            $this->trackConditions = $trackConditions;
            $hasChanges = true;
        }

        if ($this->technicalNotes !== $technicalNotes) {
            $this->technicalNotes = $technicalNotes;
            $hasChanges = true;
        }

        if ($this->streamUrl !== $streamUrl) {
            $this->streamUrl = $streamUrl;
            $hasChanges = true;
        }

        if ($this->internalNotes !== $internalNotes) {
            $this->internalNotes = $internalNotes;
            $hasChanges = true;
        }

        if ($this->fastestLap !== $fastestLap) {
            $this->fastestLap = $fastestLap;
            $hasChanges = true;
        }

        if ($this->fastestLapTop10 !== $fastestLapTop10) {
            $this->fastestLapTop10 = $fastestLapTop10;
            $hasChanges = true;
        }

        if ($hasChanges) {
            $this->updatedAt = new DateTimeImmutable();
            $this->recordUpdatedEvent();
        }
    }

    /**
     * Change round status.
     */
    public function changeStatus(RoundStatus $newStatus): void
    {
        if ($this->status === $newStatus) {
            return;
        }

        $oldStatus = $this->status;
        $this->status = $newStatus;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new RoundStatusChanged(
            roundId: $this->id ?? 0,
            seasonId: $this->seasonId,
            oldStatus: $oldStatus->value,
            newStatus: $newStatus->value,
            occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
        ));
    }

    /**
     * Mark round for deletion.
     */
    public function delete(): void
    {
        $this->deletedAt = new DateTimeImmutable();
        $this->recordDeletedEvent();
    }

    /**
     * Record the RoundCreated event after ID has been set by repository.
     * This must be called by the application service after save().
     */
    public function recordCreationEvent(): void
    {
        $this->recordEvent(new RoundCreated(
            roundId: $this->id ?? 0,
            seasonId: $this->seasonId,
            roundNumber: $this->roundNumber->value(),
            name: $this->name?->value(),
            slug: $this->slug->value(),
            scheduledAt: $this->scheduledAt?->format('Y-m-d H:i:s'),
            platformTrackId: $this->platformTrackId,
            createdByUserId: $this->createdByUserId,
            occurredAt: $this->createdAt->format('Y-m-d H:i:s'),
        ));
    }

    /**
     * Record updated event.
     */
    private function recordUpdatedEvent(): void
    {
        $this->recordEvent(new RoundUpdated(
            roundId: $this->id ?? 0,
            seasonId: $this->seasonId,
            occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
        ));
    }

    /**
     * Record deleted event.
     */
    private function recordDeletedEvent(): void
    {
        $this->recordEvent(new RoundDeleted(
            roundId: $this->id ?? 0,
            seasonId: $this->seasonId,
            occurredAt: $this->deletedAt?->format('Y-m-d H:i:s') ?? (new DateTimeImmutable())->format('Y-m-d H:i:s'),
        ));
    }

    /**
     * Record a domain event.
     */
    private function recordEvent(object $event): void
    {
        $this->events[] = $event;
    }

    // Getters

    public function id(): ?int
    {
        return $this->id;
    }

    public function seasonId(): int
    {
        return $this->seasonId;
    }

    public function roundNumber(): RoundNumber
    {
        return $this->roundNumber;
    }

    public function name(): ?RoundName
    {
        return $this->name;
    }

    public function slug(): RoundSlug
    {
        return $this->slug;
    }

    public function scheduledAt(): ?DateTimeImmutable
    {
        return $this->scheduledAt;
    }

    public function timezone(): string
    {
        return $this->timezone;
    }

    public function platformTrackId(): ?int
    {
        return $this->platformTrackId;
    }

    public function trackLayout(): ?string
    {
        return $this->trackLayout;
    }

    public function trackConditions(): ?string
    {
        return $this->trackConditions;
    }

    public function technicalNotes(): ?string
    {
        return $this->technicalNotes;
    }

    public function streamUrl(): ?string
    {
        return $this->streamUrl;
    }

    public function internalNotes(): ?string
    {
        return $this->internalNotes;
    }

    public function fastestLap(): ?int
    {
        return $this->fastestLap;
    }

    public function fastestLapTop10(): bool
    {
        return $this->fastestLapTop10;
    }

    public function status(): RoundStatus
    {
        return $this->status;
    }

    public function createdByUserId(): int
    {
        return $this->createdByUserId;
    }

    public function createdAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function updatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function deletedAt(): ?DateTimeImmutable
    {
        return $this->deletedAt;
    }

    /**
     * Exception: needed for persistence to set ID after creation.
     */
    public function setId(int $id): void
    {
        $this->id = $id;
    }

    /**
     * Get recorded domain events.
     *
     * @return array<object>
     */
    public function releaseEvents(): array
    {
        $events = $this->events;
        $this->events = [];

        return $events;
    }

    /**
     * Check if entity has recorded events.
     */
    public function hasEvents(): bool
    {
        return !empty($this->events);
    }
}
