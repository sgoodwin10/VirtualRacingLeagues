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
 * 4. Deletion is permanent (hard delete)
 * 5. Slug changes are handled via updateSlug() by the application service
 * 6. Archive sets status and archived timestamp
 * 7. Deletion is idempotent (can call delete() multiple times safely)
 */
final class Competition
{
    /** @var array<object> */
    private array $domainEvents = [];

    /** Tracks if entity has been marked for deletion to ensure idempotency */
    private bool $isDeleted = false;

    private function __construct(
        private ?int $id,
        private int $leagueId,
        private CompetitionName $name,
        private CompetitionSlug $slug,
        private ?string $description,
        private int $platformId, // IMMUTABLE after creation
        private ?string $logoPath,
        private ?string $competitionColour,
        private CompetitionStatus $status,
        private int $createdByUserId,
        private \DateTimeImmutable $createdAt,
        private \DateTimeImmutable $updatedAt,
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
        ?string $competitionColour = null,
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
            competitionColour: $competitionColour,
            status: CompetitionStatus::ACTIVE,
            createdByUserId: $createdByUserId,
            createdAt: $now,
            updatedAt: $now,
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
        ?string $competitionColour,
        \DateTimeImmutable $createdAt,
        \DateTimeImmutable $updatedAt,
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
            competitionColour: $competitionColour,
            status: $status,
            createdByUserId: $createdByUserId,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
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

    public function competitionColour(): ?string
    {
        return $this->competitionColour;
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

    public function archivedAt(): ?\DateTimeImmutable
    {
        return $this->archivedAt;
    }

    // Business Logic Methods

    /**
     * Update competition details (name and description).
     * Note: Slug changes should be handled separately via updateSlug() by the application service.
     *
     * @throws CompetitionIsArchivedException if competition is archived
     * @throws \LogicException if entity has no ID (not yet persisted)
     */
    public function updateDetails(CompetitionName $name, ?string $description): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw new CompetitionIsArchivedException();
        }

        $changes = [];

        if (! $this->name->equals($name)) {
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

        if (! empty($changes)) {
            $this->updatedAt = new \DateTimeImmutable();
            $this->recordEvent(new CompetitionUpdated(
                competitionId: $this->id,
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
     * @throws \LogicException if entity has no ID (not yet persisted)
     */
    public function updateLogo(?string $logoPath): void
    {
        $this->ensureHasId();

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
                competitionId: $this->id,
                leagueId: $this->leagueId,
                changes: $changes,
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Update competition colour.
     *
     * @throws CompetitionIsArchivedException if competition is archived
     * @throws \LogicException if entity has no ID (not yet persisted)
     */
    public function updateCompetitionColour(?string $competitionColour): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw new CompetitionIsArchivedException();
        }

        if ($this->competitionColour !== $competitionColour) {
            $changes = [
                'competition_colour' => [
                    'old' => $this->competitionColour,
                    'new' => $competitionColour,
                ],
            ];

            $this->competitionColour = $competitionColour;
            $this->updatedAt = new \DateTimeImmutable();

            $this->recordEvent(new CompetitionUpdated(
                competitionId: $this->id,
                leagueId: $this->leagueId,
                changes: $changes,
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Update competition slug manually.
     * This method is used by the application service to update slugs independently
     * (e.g., when manually setting a custom slug, not as part of a name change).
     *
     * @throws CompetitionIsArchivedException if competition is archived
     * @throws \LogicException if entity has no ID (not yet persisted)
     */
    public function updateSlug(CompetitionSlug $slug): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw new CompetitionIsArchivedException();
        }

        if (! $this->slug->equals($slug)) {
            $changes = [
                'slug' => [
                    'old' => $this->slug->value(),
                    'new' => $slug->value(),
                ],
            ];

            $this->slug = $slug;
            $this->updatedAt = new \DateTimeImmutable();

            $this->recordEvent(new CompetitionUpdated(
                competitionId: $this->id,
                leagueId: $this->leagueId,
                changes: $changes,
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Update slug silently (without recording event).
     * Used internally when slug change is part of another operation (e.g., name change).
     *
     * Note: This method intentionally updates the updatedAt timestamp even though it doesn't
     * record a separate domain event. The timestamp update ensures the entity modification
     * is tracked, while the silent behavior prevents duplicate events when the slug change
     * is already captured as part of a parent operation (e.g., updateDetails() already
     * records a CompetitionUpdated event that includes the slug change).
     *
     * @throws CompetitionIsArchivedException if competition is archived
     * @throws \LogicException if entity has no ID (not yet persisted)
     */
    public function updateSlugSilent(CompetitionSlug $slug): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw new CompetitionIsArchivedException();
        }

        if (! $this->slug->equals($slug)) {
            $this->slug = $slug;
            $this->updatedAt = new \DateTimeImmutable();
        }
    }

    /**
     * Archive the competition.
     *
     * @throws CompetitionAlreadyArchivedException if already archived
     * @throws \LogicException if entity has no ID (not yet persisted)
     */
    public function archive(): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw new CompetitionAlreadyArchivedException();
        }

        $this->status = CompetitionStatus::ARCHIVED;
        $this->archivedAt = new \DateTimeImmutable();
        $this->updatedAt = $this->archivedAt;

        $this->recordEvent(new CompetitionArchived(
            competitionId: $this->id,
            leagueId: $this->leagueId,
            occurredAt: $this->archivedAt->format('Y-m-d H:i:s'),
        ));
    }

    /**
     * Restore the competition from archived status.
     *
     * @throws \LogicException if entity has no ID (not yet persisted)
     */
    public function restore(): void
    {
        $this->ensureHasId();

        if ($this->status->isActive()) {
            return; // Already active, nothing to do
        }

        $this->status = CompetitionStatus::ACTIVE;
        $this->archivedAt = null;
        $this->updatedAt = new \DateTimeImmutable();

        $this->recordEvent(new CompetitionUpdated(
            competitionId: $this->id,
            leagueId: $this->leagueId,
            changes: ['status' => ['old' => CompetitionStatus::ARCHIVED->value, 'new' => CompetitionStatus::ACTIVE->value]],
            occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
        ));
    }

    /**
     * Mark competition for deletion (hard delete).
     * The actual deletion is handled by the repository.
     * This method is idempotent - calling it multiple times is safe.
     *
     * @throws \LogicException if entity has no ID (not yet persisted)
     */
    public function delete(): void
    {
        $this->ensureHasId();

        if ($this->isDeleted) {
            return; // Already marked for deletion, no-op
        }

        $this->isDeleted = true;
        $deletedAt = new \DateTimeImmutable();

        $this->recordEvent(new CompetitionDeleted(
            competitionId: $this->id,
            leagueId: $this->leagueId,
            occurredAt: $deletedAt->format('Y-m-d H:i:s'),
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

    // Domain Events Management

    /**
     * Ensure the entity has been persisted and has an ID.
     *
     * @throws \LogicException if entity has no ID
     *
     * @phpstan-assert !null $this->id
     */
    private function ensureHasId(): void
    {
        if ($this->id === null) {
            throw new \LogicException(
                'Cannot perform this operation on an unpersisted entity. ' .
                'The entity must be saved to the database first.'
            );
        }
    }

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
