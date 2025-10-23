<?php

declare(strict_types=1);

namespace App\Domain\Competition\Entities;

use App\Domain\Competition\Events\CompetitionArchived;
use App\Domain\Competition\Events\CompetitionCreated;
use App\Domain\Competition\Events\CompetitionDeleted;
use App\Domain\Competition\Events\CompetitionUpdated;
use App\Domain\Competition\Exceptions\CompetitionAlreadyArchivedException;
use App\Domain\Competition\Exceptions\CompetitionIsArchivedException;
use App\Domain\Competition\ValueObjects\CompetitionName;
use App\Domain\Competition\ValueObjects\CompetitionSlug;
use App\Domain\Competition\ValueObjects\CompetitionStatus;

/**
 * Competition Domain Entity.
 * Rich domain model containing competition business logic and invariants.
 *
 * Key Business Rules:
 * 1. Platform ID is immutable after creation (no setter method)
 * 2. Cannot archive already archived competition
 * 3. Cannot update archived competition
 * 4. Cannot delete already deleted competition
 * 5. Updating name also updates slug
 * 6. Archive sets status and archived timestamp
 * 7. Delete sets deleted timestamp
 */
final class Competition
{
    /** @var array<object> */
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private int $leagueId,
        private CompetitionName $name,
        private CompetitionSlug $slug,
        private ?string $description,
        private int $platformId, // IMMUTABLE after creation
        private ?string $logoPath,
        private CompetitionStatus $status,
        private int $createdByUserId,
        private \DateTimeImmutable $createdAt,
        private \DateTimeImmutable $updatedAt,
        private ?\DateTimeImmutable $deletedAt,
        private ?\DateTimeImmutable $archivedAt,
    ) {
    }

    /**
     * Create a new competition.
     */
    public static function create(
        int $leagueId,
        CompetitionName $name,
        CompetitionSlug $slug,
        int $platformId,
        int $createdByUserId,
        ?string $description = null,
        ?string $logoPath = null,
    ): self {
        $now = new \DateTimeImmutable();

        return new self(
            id: null,
            leagueId: $leagueId,
            name: $name,
            slug: $slug,
            description: $description,
            platformId: $platformId,
            logoPath: $logoPath,
            status: CompetitionStatus::ACTIVE,
            createdByUserId: $createdByUserId,
            createdAt: $now,
            updatedAt: $now,
            deletedAt: null,
            archivedAt: null,
        );
    }

    /**
     * Reconstitute competition from persistence.
     */
    public static function reconstitute(
        int $id,
        int $leagueId,
        CompetitionName $name,
        CompetitionSlug $slug,
        int $platformId,
        CompetitionStatus $status,
        int $createdByUserId,
        ?string $description,
        ?string $logoPath,
        \DateTimeImmutable $createdAt,
        \DateTimeImmutable $updatedAt,
        ?\DateTimeImmutable $deletedAt,
        ?\DateTimeImmutable $archivedAt,
    ): self {
        return new self(
            id: $id,
            leagueId: $leagueId,
            name: $name,
            slug: $slug,
            description: $description,
            platformId: $platformId,
            logoPath: $logoPath,
            status: $status,
            createdByUserId: $createdByUserId,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
            deletedAt: $deletedAt,
            archivedAt: $archivedAt,
        );
    }

    /**
     * Record the CompetitionCreated event after ID has been set by repository.
     * This must be called by the application service after save().
     */
    public function recordCreationEvent(): void
    {
        if ($this->id === null) {
            throw new \LogicException('Cannot record creation event before entity has an ID');
        }

        $this->recordEvent(new CompetitionCreated(
            competitionId: $this->id,
            leagueId: $this->leagueId,
            name: $this->name->value(),
            platformId: $this->platformId,
            createdByUserId: $this->createdByUserId,
            occurredAt: $this->createdAt->format('Y-m-d H:i:s'),
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

    public function leagueId(): int
    {
        return $this->leagueId;
    }

    public function name(): CompetitionName
    {
        return $this->name;
    }

    public function slug(): CompetitionSlug
    {
        return $this->slug;
    }

    public function description(): ?string
    {
        return $this->description;
    }

    /**
     * Get platform ID.
     * Note: Platform is IMMUTABLE - there is no setPlatform() method.
     */
    public function platformId(): int
    {
        return $this->platformId;
    }

    public function logoPath(): ?string
    {
        return $this->logoPath;
    }

    public function status(): CompetitionStatus
    {
        return $this->status;
    }

    public function createdByUserId(): int
    {
        return $this->createdByUserId;
    }

    public function createdAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function updatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function deletedAt(): ?\DateTimeImmutable
    {
        return $this->deletedAt;
    }

    public function archivedAt(): ?\DateTimeImmutable
    {
        return $this->archivedAt;
    }

    // Business Logic Methods

    /**
     * Update competition details (name and description).
     * Updating the name also updates the slug.
     *
     * @throws CompetitionIsArchivedException if competition is archived
     */
    public function updateDetails(CompetitionName $name, ?string $description): void
    {
        if ($this->status->isArchived()) {
            throw new CompetitionIsArchivedException();
        }

        $changes = [];

        if (!$this->name->equals($name)) {
            $changes['name'] = [
                'old' => $this->name->value(),
                'new' => $name->value(),
            ];
            $this->name = $name;
        }

        if ($this->description !== $description) {
            $changes['description'] = [
                'old' => $this->description,
                'new' => $description,
            ];
            $this->description = $description;
        }

        if (!empty($changes)) {
            $this->updatedAt = new \DateTimeImmutable();
            $this->recordEvent(new CompetitionUpdated(
                competitionId: $this->id ?? 0,
                leagueId: $this->leagueId,
                changes: $changes,
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Update competition logo.
     *
     * @throws CompetitionIsArchivedException if competition is archived
     */
    public function updateLogo(?string $logoPath): void
    {
        if ($this->status->isArchived()) {
            throw new CompetitionIsArchivedException();
        }

        if ($this->logoPath !== $logoPath) {
            $changes = [
                'logo_path' => [
                    'old' => $this->logoPath,
                    'new' => $logoPath,
                ],
            ];

            $this->logoPath = $logoPath;
            $this->updatedAt = new \DateTimeImmutable();

            $this->recordEvent(new CompetitionUpdated(
                competitionId: $this->id ?? 0,
                leagueId: $this->leagueId,
                changes: $changes,
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Update competition slug.
     * This is typically called when the name changes.
     *
     * @throws CompetitionIsArchivedException if competition is archived
     */
    public function updateSlug(CompetitionSlug $slug): void
    {
        if ($this->status->isArchived()) {
            throw new CompetitionIsArchivedException();
        }

        if (!$this->slug->equals($slug)) {
            $this->slug = $slug;
            $this->updatedAt = new \DateTimeImmutable();
        }
    }

    /**
     * Archive the competition.
     *
     * @throws CompetitionAlreadyArchivedException if already archived
     */
    public function archive(): void
    {
        if ($this->status->isArchived()) {
            throw new CompetitionAlreadyArchivedException();
        }

        $this->status = CompetitionStatus::ARCHIVED;
        $this->archivedAt = new \DateTimeImmutable();
        $this->updatedAt = $this->archivedAt;

        $this->recordEvent(new CompetitionArchived(
            competitionId: $this->id ?? 0,
            leagueId: $this->leagueId,
            occurredAt: $this->archivedAt->format('Y-m-d H:i:s'),
        ));
    }

    /**
     * Restore the competition from archived status.
     */
    public function restore(): void
    {
        if ($this->status->isActive()) {
            return; // Already active, nothing to do
        }

        $this->status = CompetitionStatus::ACTIVE;
        $this->archivedAt = null;
        $this->updatedAt = new \DateTimeImmutable();

        $this->recordEvent(new CompetitionUpdated(
            competitionId: $this->id ?? 0,
            leagueId: $this->leagueId,
            changes: ['status' => ['old' => 'archived', 'new' => 'active']],
            occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
        ));
    }

    /**
     * Soft delete the competition.
     */
    public function delete(): void
    {
        if ($this->deletedAt !== null) {
            return; // Already deleted
        }

        $this->deletedAt = new \DateTimeImmutable();
        $this->updatedAt = $this->deletedAt;

        $this->recordEvent(new CompetitionDeleted(
            competitionId: $this->id ?? 0,
            leagueId: $this->leagueId,
            occurredAt: $this->deletedAt->format('Y-m-d H:i:s'),
        ));
    }

    // Status Checks

    public function isActive(): bool
    {
        return $this->status->isActive();
    }

    public function isArchived(): bool
    {
        return $this->status->isArchived();
    }

    public function isDeleted(): bool
    {
        return $this->deletedAt !== null;
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
        return !empty($this->domainEvents);
    }
}
