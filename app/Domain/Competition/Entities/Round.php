<?php

declare(strict_types=1);

namespace App\Domain\Competition\Entities;

use App\Domain\Competition\Events\RoundCreated;
use App\Domain\Competition\Events\RoundDeleted;
use App\Domain\Competition\Events\RoundResultsCalculated;
use App\Domain\Competition\Events\RoundStatusChanged;
use App\Domain\Competition\Events\RoundTiebreakerApplied;
use App\Domain\Competition\Events\RoundUpdated;
use App\Domain\Competition\ValueObjects\PointsSystem;
use App\Domain\Competition\ValueObjects\RoundName;
use App\Domain\Competition\ValueObjects\RoundNumber;
use App\Domain\Competition\ValueObjects\RoundSlug;
use App\Domain\Competition\ValueObjects\RoundStatus;
use App\Domain\Competition\ValueObjects\TiebreakerInformation;
use DateTimeImmutable;

/**
 * Round Domain Entity.
 * Represents a round within a season containing one or more races.
 */
final class Round
{
    /** @var array<object> */
    private array $events = [];

    /**
     * @param  array<mixed>|null  $roundResults
     * @param  array<mixed>|null  $qualifyingResults
     * @param  array<mixed>|null  $raceTimeResults
     * @param  array<mixed>|null  $fastestLapResults
     * @param  array<mixed>|null  $teamChampionshipResults
     */
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
        private ?int $qualifyingPole,
        private bool $qualifyingPoleTop10,
        private ?PointsSystem $pointsSystem,
        private bool $roundPoints,
        private RoundStatus $status,
        private ?array $roundResults,
        private ?array $qualifyingResults,
        private ?array $raceTimeResults,
        private ?array $fastestLapResults,
        private ?array $teamChampionshipResults,
        private ?TiebreakerInformation $tiebreakerInformation,
        private ?int $createdByUserId,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt,
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
        ?int $qualifyingPole,
        bool $qualifyingPoleTop10,
        ?PointsSystem $pointsSystem,
        bool $roundPoints,
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
            qualifyingPole: $qualifyingPole,
            qualifyingPoleTop10: $qualifyingPoleTop10,
            pointsSystem: $pointsSystem,
            roundPoints: $roundPoints,
            status: RoundStatus::SCHEDULED,
            roundResults: null,
            qualifyingResults: null,
            raceTimeResults: null,
            fastestLapResults: null,
            teamChampionshipResults: null,
            tiebreakerInformation: null,
            createdByUserId: $createdByUserId,
            createdAt: new DateTimeImmutable(),
            updatedAt: new DateTimeImmutable(),
        );
    }

    /**
     * Reconstitute round from persistence.
     *
     * @param  array<mixed>|null  $roundResults
     * @param  array<mixed>|null  $qualifyingResults
     * @param  array<mixed>|null  $raceTimeResults
     * @param  array<mixed>|null  $fastestLapResults
     * @param  array<mixed>|null  $teamChampionshipResults
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
        ?int $qualifyingPole,
        bool $qualifyingPoleTop10,
        ?PointsSystem $pointsSystem,
        bool $roundPoints,
        RoundStatus $status,
        ?array $roundResults,
        ?array $qualifyingResults,
        ?array $raceTimeResults,
        ?array $fastestLapResults,
        ?array $teamChampionshipResults,
        ?TiebreakerInformation $tiebreakerInformation,
        ?int $createdByUserId,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
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
            qualifyingPole: $qualifyingPole,
            qualifyingPoleTop10: $qualifyingPoleTop10,
            pointsSystem: $pointsSystem,
            roundPoints: $roundPoints,
            status: $status,
            roundResults: $roundResults,
            qualifyingResults: $qualifyingResults,
            raceTimeResults: $raceTimeResults,
            fastestLapResults: $fastestLapResults,
            teamChampionshipResults: $teamChampionshipResults,
            tiebreakerInformation: $tiebreakerInformation,
            createdByUserId: $createdByUserId,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
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
        ?int $qualifyingPole,
        bool $qualifyingPoleTop10,
        ?PointsSystem $pointsSystem,
        bool $roundPoints,
    ): void {
        $hasChanges = false;

        if (! $this->roundNumber->equals($roundNumber)) {
            $this->roundNumber = $roundNumber;
            $hasChanges = true;
        }

        $nameChanged = ($this->name === null && $name !== null)
            || ($this->name !== null && $name === null)
            || ($this->name !== null && $name !== null && ! $this->name->equals($name));

        if ($nameChanged) {
            $this->name = $name;
            $hasChanges = true;
        }

        if (! $this->slug->equals($slug)) {
            $this->slug = $slug;
            $hasChanges = true;
        }

        if ($this->scheduledAt?->getTimestamp() !== $scheduledAt?->getTimestamp()) {
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

        if ($this->qualifyingPole !== $qualifyingPole) {
            $this->qualifyingPole = $qualifyingPole;
            $hasChanges = true;
        }

        if ($this->qualifyingPoleTop10 !== $qualifyingPoleTop10) {
            $this->qualifyingPoleTop10 = $qualifyingPoleTop10;
            $hasChanges = true;
        }

        // Compare points system (null-safe comparison)
        $pointsSystemChanged = false;
        if ($this->pointsSystem === null && $pointsSystem !== null) {
            $pointsSystemChanged = true;
        } elseif ($this->pointsSystem !== null && $pointsSystem === null) {
            $pointsSystemChanged = true;
        } elseif ($this->pointsSystem !== null && $pointsSystem !== null) {
            $pointsSystemChanged = $this->pointsSystem->toArray() !== $pointsSystem->toArray();
        }

        if ($pointsSystemChanged) {
            $this->pointsSystem = $pointsSystem;
            $hasChanges = true;
        }

        if ($this->roundPoints !== $roundPoints) {
            $this->roundPoints = $roundPoints;
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
     * Mark round as completed.
     */
    public function complete(): void
    {
        $this->changeStatus(RoundStatus::COMPLETED);
    }

    /**
     * Mark round as not completed (scheduled).
     */
    public function uncomplete(): void
    {
        $this->changeStatus(RoundStatus::SCHEDULED);
    }

    /**
     * Mark round for deletion and record domain event.
     * Note: The actual deletion (hard delete with cascade) is performed by the repository.
     * Rounds are ALWAYS hard deleted - soft deletes are not used.
     */
    public function delete(): void
    {
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
            occurredAt: (new DateTimeImmutable())->format('Y-m-d H:i:s'),
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

    public function qualifyingPole(): ?int
    {
        return $this->qualifyingPole;
    }

    public function qualifyingPoleTop10(): bool
    {
        return $this->qualifyingPoleTop10;
    }

    public function pointsSystem(): ?PointsSystem
    {
        return $this->pointsSystem;
    }

    public function roundPoints(): bool
    {
        return $this->roundPoints;
    }

    public function status(): RoundStatus
    {
        return $this->status;
    }

    /**
     * @return array<mixed>|null
     */
    public function roundResults(): ?array
    {
        return $this->roundResults;
    }

    /**
     * @return array<mixed>|null
     */
    public function qualifyingResults(): ?array
    {
        return $this->qualifyingResults;
    }

    /**
     * @return array<mixed>|null
     */
    public function raceTimeResults(): ?array
    {
        return $this->raceTimeResults;
    }

    /**
     * @return array<mixed>|null
     */
    public function fastestLapResults(): ?array
    {
        return $this->fastestLapResults;
    }

    /**
     * @return array<mixed>|null
     */
    public function teamChampionshipResults(): ?array
    {
        return $this->teamChampionshipResults;
    }

    public function createdByUserId(): ?int
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

    /**
     * Exception: needed for persistence to set ID after creation.
     */
    public function setId(int $id): void
    {
        $this->id = $id;
    }

    /**
     * Set round results after calculation.
     *
     * @param  array<mixed>  $results
     */
    public function setRoundResults(array $results): void
    {
        $this->roundResults = $results;
        $this->updatedAt = new DateTimeImmutable();

        // Record domain event
        $this->recordEvent(new RoundResultsCalculated(
            roundId: $this->id ?? 0,
            seasonId: $this->seasonId,
            occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
        ));
    }

    /**
     * Set cross-division results after calculation.
     *
     * @param  array<mixed>  $qualifyingResults
     * @param  array<mixed>  $raceTimeResults
     * @param  array<mixed>  $fastestLapResults
     */
    public function setCrossDivisionResults(
        array $qualifyingResults,
        array $raceTimeResults,
        array $fastestLapResults
    ): void {
        $this->qualifyingResults = $qualifyingResults;
        $this->raceTimeResults = $raceTimeResults;
        $this->fastestLapResults = $fastestLapResults;
        $this->updatedAt = new DateTimeImmutable();

        // Record domain event
        $this->recordEvent(new RoundResultsCalculated(
            roundId: $this->id ?? 0,
            seasonId: $this->seasonId,
            occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
        ));
    }

    /**
     * Set team championship results after calculation.
     *
     * @param  array<mixed>  $results
     */
    public function setTeamChampionshipResults(array $results): void
    {
        $this->teamChampionshipResults = $results;
        $this->updatedAt = new DateTimeImmutable();

        // Record domain event
        $this->recordEvent(new RoundResultsCalculated(
            roundId: $this->id ?? 0,
            seasonId: $this->seasonId,
            occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
        ));
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
        return ! empty($this->events);
    }

    /**
     * Get tiebreaker information.
     */
    public function tiebreakerInformation(): ?TiebreakerInformation
    {
        return $this->tiebreakerInformation;
    }

    /**
     * Set tiebreaker information after applying rules.
     */
    public function setTiebreakerInformation(TiebreakerInformation $information): void
    {
        $this->tiebreakerInformation = $information;
        $this->updatedAt = new DateTimeImmutable();

        // Record domain event
        $this->recordEvent(new RoundTiebreakerApplied(
            roundId: $this->id ?? 0,
            seasonId: $this->seasonId,
            resolutionsCount: count($information->resolutions()),
            hadUnresolvedTies: $information->hadUnresolvedTies(),
            occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
        ));
    }

    /**
     * Clear tiebreaker information.
     */
    public function clearTiebreakerInformation(): void
    {
        $this->tiebreakerInformation = null;
        $this->updatedAt = new DateTimeImmutable();
    }
}
