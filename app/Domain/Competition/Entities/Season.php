<?php

declare(strict_types=1);

namespace App\Domain\Competition\Entities;

use App\Domain\Competition\Events\SeasonArchived;
use App\Domain\Competition\Events\SeasonCreated;
use App\Domain\Competition\Events\SeasonDeleted;
use App\Domain\Competition\Events\SeasonStatusChanged;
use App\Domain\Competition\Events\SeasonUpdated;
use App\Domain\Competition\Exceptions\SeasonIsArchivedException;
use App\Domain\Competition\ValueObjects\SeasonName;
use App\Domain\Competition\ValueObjects\SeasonSlug;
use App\Domain\Competition\ValueObjects\SeasonStatus;
use DateTimeImmutable;

/**
 * Season Domain Entity.
 *
 * Represents a time-bound championship period within a competition.
 * Aggregate root managing season lifecycle and settings.
 *
 * Key Business Rules:
 * 1. Season belongs to a competition (immutable relationship)
 * 2. Slug must be unique per competition
 * 3. Cannot modify archived seasons
 * 4. Logo inherits from competition if not specified
 * 5. Status transitions: setup → active → completed → archived
 * 6. Soft deletion cascades to season_drivers but preserves league drivers
 */
final class Season
{
    /** @var array<object> */
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private int $competitionId,
        private SeasonName $name,
        private SeasonSlug $slug,
        private ?string $carClass,
        private ?string $description,
        private ?string $technicalSpecs,
        private ?string $logoPath,
        private ?string $bannerPath,
        private bool $teamChampionshipEnabled,
        private bool $raceDivisionsEnabled,
        private bool $raceTimesRequired,
        private SeasonStatus $status,
        private int $createdByUserId,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt,
        private ?DateTimeImmutable $deletedAt,
    ) {
    }

    /**
     * Create a new season.
     */
    public static function create(
        int $competitionId,
        SeasonName $name,
        SeasonSlug $slug,
        int $createdByUserId,
        ?string $carClass = null,
        ?string $description = null,
        ?string $technicalSpecs = null,
        ?string $logoPath = null,
        ?string $bannerPath = null,
        bool $teamChampionshipEnabled = false,
        bool $raceDivisionsEnabled = false,
        bool $raceTimesRequired = true,
    ): self {
        $now = new DateTimeImmutable();

        return new self(
            id: null,
            competitionId: $competitionId,
            name: $name,
            slug: $slug,
            carClass: $carClass,
            description: $description,
            technicalSpecs: $technicalSpecs,
            logoPath: $logoPath,
            bannerPath: $bannerPath,
            teamChampionshipEnabled: $teamChampionshipEnabled,
            raceDivisionsEnabled: $raceDivisionsEnabled,
            raceTimesRequired: $raceTimesRequired,
            status: SeasonStatus::SETUP,
            createdByUserId: $createdByUserId,
            createdAt: $now,
            updatedAt: $now,
            deletedAt: null,
        );
    }

    /**
     * Reconstitute season from persistence.
     */
    public static function reconstitute(
        int $id,
        int $competitionId,
        SeasonName $name,
        SeasonSlug $slug,
        int $createdByUserId,
        SeasonStatus $status,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
        ?string $carClass = null,
        ?string $description = null,
        ?string $technicalSpecs = null,
        ?string $logoPath = null,
        ?string $bannerPath = null,
        bool $teamChampionshipEnabled = false,
        bool $raceDivisionsEnabled = false,
        bool $raceTimesRequired = true,
        ?DateTimeImmutable $deletedAt = null,
    ): self {
        return new self(
            id: $id,
            competitionId: $competitionId,
            name: $name,
            slug: $slug,
            carClass: $carClass,
            description: $description,
            technicalSpecs: $technicalSpecs,
            logoPath: $logoPath,
            bannerPath: $bannerPath,
            teamChampionshipEnabled: $teamChampionshipEnabled,
            raceDivisionsEnabled: $raceDivisionsEnabled,
            raceTimesRequired: $raceTimesRequired,
            status: $status,
            createdByUserId: $createdByUserId,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
            deletedAt: $deletedAt,
        );
    }

    /**
     * Record the SeasonCreated event after ID has been set by repository.
     * This must be called by the application service after save().
     */
    public function recordCreationEvent(int $leagueId): void
    {
        if ($this->id === null) {
            throw new \LogicException('Cannot record creation event before entity has an ID');
        }

        $this->recordEvent(new SeasonCreated(
            seasonId: $this->id,
            competitionId: $this->competitionId,
            leagueId: $leagueId,
            name: $this->name->value(),
            slug: $this->slug->value(),
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

    public function competitionId(): int
    {
        return $this->competitionId;
    }

    public function name(): SeasonName
    {
        return $this->name;
    }

    public function slug(): SeasonSlug
    {
        return $this->slug;
    }

    public function carClass(): ?string
    {
        return $this->carClass;
    }

    public function description(): ?string
    {
        return $this->description;
    }

    public function technicalSpecs(): ?string
    {
        return $this->technicalSpecs;
    }

    public function logoPath(): ?string
    {
        return $this->logoPath;
    }

    public function bannerPath(): ?string
    {
        return $this->bannerPath;
    }

    public function teamChampionshipEnabled(): bool
    {
        return $this->teamChampionshipEnabled;
    }

    public function raceDivisionsEnabled(): bool
    {
        return $this->raceDivisionsEnabled;
    }

    public function raceTimesRequired(): bool
    {
        return $this->raceTimesRequired;
    }

    public function status(): SeasonStatus
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

    // Business Logic Methods

    /**
     * Update season details.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function updateDetails(
        SeasonName $name,
        ?string $carClass,
        ?string $description,
        ?string $technicalSpecs,
    ): void {
        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id ?? 0);
        }

        $changes = [];

        if (!$this->name->equals($name)) {
            $changes['name'] = [
                'old' => $this->name->value(),
                'new' => $name->value(),
            ];
            $this->name = $name;
        }

        if ($this->carClass !== $carClass) {
            $changes['car_class'] = [
                'old' => $this->carClass,
                'new' => $carClass,
            ];
            $this->carClass = $carClass;
        }

        if ($this->description !== $description) {
            $changes['description'] = [
                'old' => $this->description,
                'new' => $description,
            ];
            $this->description = $description;
        }

        if ($this->technicalSpecs !== $technicalSpecs) {
            $changes['technical_specs'] = [
                'old' => $this->technicalSpecs,
                'new' => $technicalSpecs,
            ];
            $this->technicalSpecs = $technicalSpecs;
        }

        if (!empty($changes)) {
            $this->updatedAt = new DateTimeImmutable();
            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id ?? 0,
                competitionId: $this->competitionId,
                changes: $changes,
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Update season branding (logo and banner).
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function updateBranding(?string $logoPath, ?string $bannerPath): void
    {
        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id ?? 0);
        }

        $changes = [];

        if ($this->logoPath !== $logoPath) {
            $changes['logo_path'] = [
                'old' => $this->logoPath,
                'new' => $logoPath,
            ];
            $this->logoPath = $logoPath;
        }

        if ($this->bannerPath !== $bannerPath) {
            $changes['banner_path'] = [
                'old' => $this->bannerPath,
                'new' => $bannerPath,
            ];
            $this->bannerPath = $bannerPath;
        }

        if (!empty($changes)) {
            $this->updatedAt = new DateTimeImmutable();
            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id ?? 0,
                competitionId: $this->competitionId,
                changes: $changes,
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Update season slug.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function updateSlug(SeasonSlug $slug): void
    {
        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id ?? 0);
        }

        if (!$this->slug->equals($slug)) {
            $this->slug = $slug;
            $this->updatedAt = new DateTimeImmutable();
        }
    }

    /**
     * Enable team championship.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function enableTeamChampionship(): void
    {
        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id ?? 0);
        }

        if (!$this->teamChampionshipEnabled) {
            $this->teamChampionshipEnabled = true;
            $this->updatedAt = new DateTimeImmutable();

            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id ?? 0,
                competitionId: $this->competitionId,
                changes: ['team_championship_enabled' => ['old' => false, 'new' => true]],
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Disable team championship.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function disableTeamChampionship(): void
    {
        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id ?? 0);
        }

        if ($this->teamChampionshipEnabled) {
            $this->teamChampionshipEnabled = false;
            $this->updatedAt = new DateTimeImmutable();

            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id ?? 0,
                competitionId: $this->competitionId,
                changes: ['team_championship_enabled' => ['old' => true, 'new' => false]],
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Enable race divisions.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function enableRaceDivisions(): void
    {
        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id ?? 0);
        }

        if (!$this->raceDivisionsEnabled) {
            $this->raceDivisionsEnabled = true;
            $this->updatedAt = new DateTimeImmutable();

            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id ?? 0,
                competitionId: $this->competitionId,
                changes: ['race_divisions_enabled' => ['old' => false, 'new' => true]],
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Disable race divisions.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function disableRaceDivisions(): void
    {
        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id ?? 0);
        }

        if ($this->raceDivisionsEnabled) {
            $this->raceDivisionsEnabled = false;
            $this->updatedAt = new DateTimeImmutable();

            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id ?? 0,
                competitionId: $this->competitionId,
                changes: ['race_divisions_enabled' => ['old' => true, 'new' => false]],
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Enable race times requirement.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function enableRaceTimes(): void
    {
        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id ?? 0);
        }

        if (!$this->raceTimesRequired) {
            $this->raceTimesRequired = true;
            $this->updatedAt = new DateTimeImmutable();

            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id ?? 0,
                competitionId: $this->competitionId,
                changes: ['race_times_required' => ['old' => false, 'new' => true]],
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Disable race times requirement.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function disableRaceTimes(): void
    {
        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id ?? 0);
        }

        if ($this->raceTimesRequired) {
            $this->raceTimesRequired = false;
            $this->updatedAt = new DateTimeImmutable();

            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id ?? 0,
                competitionId: $this->competitionId,
                changes: ['race_times_required' => ['old' => true, 'new' => false]],
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Change season status.
     */
    public function changeStatus(SeasonStatus $newStatus): void
    {
        if ($this->status === $newStatus) {
            return;
        }

        $oldStatus = $this->status;
        $this->status = $newStatus;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new SeasonStatusChanged(
            seasonId: $this->id ?? 0,
            competitionId: $this->competitionId,
            oldStatus: $oldStatus->value,
            newStatus: $newStatus->value,
            occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
        ));
    }

    /**
     * Activate the season.
     */
    public function activate(): void
    {
        $this->changeStatus(SeasonStatus::ACTIVE);
    }

    /**
     * Complete the season.
     */
    public function complete(): void
    {
        $this->changeStatus(SeasonStatus::COMPLETED);
    }

    /**
     * Archive the season.
     */
    public function archive(): void
    {
        if ($this->status->isArchived()) {
            return; // Already archived
        }

        $this->status = SeasonStatus::ARCHIVED;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new SeasonArchived(
            seasonId: $this->id ?? 0,
            competitionId: $this->competitionId,
            occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
        ));
    }

    /**
     * Restore from archived status.
     * Restores to completed status.
     */
    public function restore(): void
    {
        if (!$this->status->isArchived()) {
            return; // Not archived
        }

        $this->changeStatus(SeasonStatus::COMPLETED);
    }

    /**
     * Soft delete the season.
     */
    public function delete(): void
    {
        if ($this->deletedAt !== null) {
            return; // Already deleted
        }

        $this->deletedAt = new DateTimeImmutable();
        $this->updatedAt = $this->deletedAt;

        $this->recordEvent(new SeasonDeleted(
            seasonId: $this->id ?? 0,
            competitionId: $this->competitionId,
            occurredAt: $this->deletedAt->format('Y-m-d H:i:s'),
        ));
    }

    // Status Checks

    public function isSetup(): bool
    {
        return $this->status->isSetup();
    }

    public function isActive(): bool
    {
        return $this->status->isActive();
    }

    public function isCompleted(): bool
    {
        return $this->status->isCompleted();
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
